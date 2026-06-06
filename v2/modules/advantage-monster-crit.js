import { rollFormula } from "./dice.js";
import { loadState, saveState } from "./storage.js";

const FORMULA_RESTORE_KEY = "trpg-v2-last-roll-formula";
const EDGE_MODES = new Set(["advantage", "disadvantage"]);

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function prependRolls(state, rolls) {
  return { ...state, rolls: [...rolls, ...(Array.isArray(state.rolls) ? state.rolls : [])].slice(0, 80) };
}

function getPendingMap(state) {
  const pending = state.ui?.monsterCriticalDamagePending;
  return pending && typeof pending === "object" ? pending : {};
}

function setPendingForMonster(state, monsterId, value) {
  const pending = { ...getPendingMap(state) };
  if (value) pending[monsterId] = true;
  else delete pending[monsterId];
  return { ...state, ui: { ...(state.ui || {}), monsterCriticalDamagePending: pending } };
}

function rollHasNatural20(roll) {
  return Boolean(
    roll?.ok &&
      Array.isArray(roll.terms) &&
      roll.terms.some((term) => term.type === "dice" && term.sides === 20 && Array.isArray(term.results) && term.results.includes(20)),
  );
}

function maxDiceDamage(roll) {
  return (Array.isArray(roll.terms) ? roll.terms : []).reduce((sum, term) => {
    if (term.type !== "dice" || term.sign < 0) return sum;
    return sum + term.count * term.sides;
  }, 0);
}

function normalDiceTotal(roll) {
  return Array.isArray(roll.dice) ? roll.dice.reduce((sum, value) => sum + value, 0) : 0;
}

function applyCriticalDamage(roll, isMonster = false) {
  const maxDamage = maxDiceDamage(roll);
  const normalTotal = normalDiceTotal(roll);
  const modifierTotal = toNumber(roll.modifier);
  if (!maxDamage) {
    return {
      ...roll,
      criticalDamage: !isMonster,
      monsterCriticalDamage: isMonster,
      isCriticalDamageRoll: true,
      criticalDamageSkipped: true,
      criticalDamageMessage: isMonster ? "怪物關鍵傷害未套用，因為公式沒有骰子。" : "關鍵傷害未套用，因為公式沒有骰子。",
    };
  }
  const totalDamage = maxDamage + normalTotal + modifierTotal;
  return {
    ...roll,
    criticalDamage: !isMonster,
    monsterCriticalDamage: isMonster,
    isCriticalDamageRoll: true,
    maxDiceDamage: maxDamage,
    normalRollTotal: normalTotal,
    modifierTotal,
    totalDamage,
    total: totalDamage,
    formula: isMonster ? `${roll.formula}（滿骰 ${maxDamage} + 正常 ${normalTotal} + 修正 ${modifierTotal}）` : roll.formula,
    note: isMonster ? "怪物關鍵傷害" : "關鍵成功傷害",
  };
}

function applyEdgeToRoll(roll, mode) {
  const edgeDie = rollD6();
  const baseTotal = roll.total;
  const delta = mode === "advantage" ? edgeDie : -edgeDie;
  return {
    ...roll,
    rollEdgeMode: mode,
    rollEdgeDie: edgeDie,
    baseTotal,
    total: baseTotal + delta,
    edgeBreakdown: { mode, die: edgeDie, baseTotal, finalTotal: baseTotal + delta },
    note: mode === "advantage" ? "優勢骰 +1d6" : "劣勢骰 -1d6",
  };
}

function makeRollRecord(result, actor) {
  return { id: makeId("roll"), actor, ...result, time: result.time || new Date().toISOString() };
}

function isDead(monster) {
  return Boolean(monster.isDead) || toNumber(monster.hp) <= 0;
}

function makeMonsterRoll(monster, action, round = null, state = null) {
  const formula = action === "attack" ? monster.attack : monster.damage;
  if (!String(formula || "").trim()) {
    return { ok: false, skipped: true, action, formula: "", error: action === "attack" ? "未設定攻擊公式" : "未設定傷害公式", monsterId: monster.id, monsterName: monster.name, round };
  }

  let result = { ...rollFormula(formula), action, monsterId: monster.id, monsterName: monster.name, round };
  if (!result.ok) return { ...result, error: action === "attack" ? `攻擊公式錯誤：${result.error}` : `傷害公式錯誤：${result.error}` };

  if (action === "attack" && rollHasNatural20(result)) result = { ...result, monsterNatural20: true, note: "怪物關鍵攻擊：自然 20" };
  if (action === "damage" && state?.ui?.monsterCriticalDamagePending?.[monster.id]) result = applyCriticalDamage(result, true);
  return result;
}

function rollMonsterAction(state, monsterId, action) {
  const monster = (Array.isArray(state.monsters) ? state.monsters : []).find((entry) => entry.id === monsterId);
  if (!monster) return state;
  let nextState = state;
  const result = makeMonsterRoll(monster, action, state.session?.round || 0, state);
  if (action === "attack" && result.monsterNatural20) nextState = setPendingForMonster(nextState, monster.id, true);
  if (action === "damage" && state.ui?.monsterCriticalDamagePending?.[monster.id]) nextState = setPendingForMonster(nextState, monster.id, false);
  const label = action === "attack" ? "攻擊" : "傷害";
  const record = makeRollRecord({ ...result, monsterRollType: `monster ${action} roll` }, `${monster.name} ${label}`);
  return { ...prependRolls(nextState, [record]), session: { ...(nextState.session || {}), lastMonsterAction: record } };
}

function advanceMonsterRound(state) {
  const round = Math.max(0, Math.floor(toNumber(state.session?.round))) + 1;
  const monsters = Array.isArray(state.monsters) ? state.monsters : [];
  const activeMonsters = monsters.filter((monster) => !isDead(monster));
  const skippedDeadCount = monsters.length - activeMonsters.length;
  let nextState = state;
  const results = activeMonsters.map((monster) => {
    const attackRoll = makeMonsterRoll(monster, "attack", round, nextState);
    if (attackRoll.monsterNatural20) nextState = setPendingForMonster(nextState, monster.id, true);
    const damageRoll = makeMonsterRoll(monster, "damage", round, nextState);
    if (nextState.ui?.monsterCriticalDamagePending?.[monster.id]) nextState = setPendingForMonster(nextState, monster.id, false);
    return { id: makeId("monster-round"), monsterId: monster.id, monsterName: `${monster.name} #${monster.instanceNumber || ""}`.trim(), round, attackRoll, damageRoll, monsterNatural20: Boolean(attackRoll.monsterNatural20), time: new Date().toISOString() };
  });
  const records = results.map((result) => makeRollRecord({ ok: true, type: "monster-round", formula: `第 ${round} 回合`, total: result.attackRoll.ok ? result.attackRoll.total : "-", dice: [], terms: [], monsterId: result.monsterId, monsterName: result.monsterName, round, attackRoll: result.attackRoll, damageRoll: result.damageRoll, monsterNatural20: result.monsterNatural20, monsterRollType: "monster round roll" }, `怪物回合：${result.monsterName}`));
  return { ...prependRolls(nextState, records), session: { ...(nextState.session || {}), round, monsterRoundResults: results, skippedDeadMonsters: skippedDeadCount } };
}

function saveAndReload(state) {
  saveState(state);
  window.location.reload();
}

function ensureEdgeStyles() {
  if (document.querySelector("[data-advantage-monster-crit-styles]")) return;
  const style = document.createElement("style");
  style.dataset.advantageMonsterCritStyles = "true";
  style.textContent = `
    .roll-edge-controls{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.roll-edge-button{min-height:32px;padding:4px 10px;border-color:rgba(148,163,184,.32);opacity:.78}.roll-edge-button.is-active{border-color:#facc15;background:rgba(250,204,21,.16);color:#fde68a;opacity:1}.roll-edge-result-note{margin:6px 0;padding:7px 9px;border:1px solid rgba(96,165,250,.24);border-radius:10px;background:rgba(15,23,42,.72);color:#dbeafe;font-size:12px;line-height:1.45}
  `;
  document.head.append(style);
}

function updateEdgeButtons(panel, mode) {
  panel?.querySelectorAll("[data-roll-edge-mode]").forEach((button) => {
    const active = button.dataset.rollEdgeMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function ensureDiceEdgeControls() {
  ensureEdgeStyles();
  const state = loadState();
  const mode = state.ui?.rollEdgeMode || "";
  const latestRoll = Array.isArray(state.rolls) ? state.rolls[0] : null;
  document.querySelectorAll(".dice-panel").forEach((panel) => {
    const form = panel.querySelector("[data-roll-form]");
    if (!form || panel.querySelector("[data-roll-edge-controls]")) return;
    form.insertAdjacentHTML("afterend", `<div class="roll-edge-controls" data-roll-edge-controls><button class="roll-edge-button" type="button" data-roll-edge-mode="advantage" aria-pressed="false">優勢</button><button class="roll-edge-button" type="button" data-roll-edge-mode="disadvantage" aria-pressed="false">劣勢</button></div>`);
    updateEdgeButtons(panel, mode);
  });
  if (latestRoll?.edgeBreakdown && !document.querySelector("[data-roll-edge-result-note]")) {
    const modeLabel = latestRoll.edgeBreakdown.mode === "advantage" ? "優勢骰" : "劣勢骰";
    const sign = latestRoll.edgeBreakdown.mode === "advantage" ? "+" : "-";
    const note = document.createElement("p");
    note.className = "roll-edge-result-note";
    note.dataset.rollEdgeResultNote = "true";
    note.textContent = `公式：${latestRoll.formula}｜原結果：${latestRoll.edgeBreakdown.baseTotal}｜${modeLabel}：${sign}${latestRoll.edgeBreakdown.die}｜最終：${latestRoll.edgeBreakdown.finalTotal}`;
    document.querySelector(".dice-panel")?.insertAdjacentElement("afterbegin", note);
  }
  const formula = window.sessionStorage.getItem(FORMULA_RESTORE_KEY);
  if (formula !== null) {
    document.querySelectorAll("[data-roll-formula]").forEach((input) => {
      if (!input.value) input.value = formula;
    });
    window.sessionStorage.removeItem(FORMULA_RESTORE_KEY);
  }
}

const observer = new MutationObserver(ensureDiceEdgeControls);
observer.observe(document.body, { childList: true, subtree: true });
ensureDiceEdgeControls();

document.addEventListener("click", (event) => {
  const edgeButton = event.target.closest("[data-roll-edge-mode]");
  if (edgeButton) {
    event.preventDefault();
    event.stopPropagation();
    const selected = edgeButton.dataset.rollEdgeMode;
    const state = loadState();
    const current = state.ui?.rollEdgeMode;
    const nextMode = current === selected ? "" : selected;
    saveState({ ...state, ui: { ...(state.ui || {}), rollEdgeMode: nextMode } });
    updateEdgeButtons(edgeButton.closest(".dice-panel"), nextMode);
    return;
  }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  const action = actionButton.dataset.action;
  if (!["roll-monster-attack", "roll-monster-damage", "next-monster-round"].includes(action)) return;
  event.preventDefault();
  event.stopPropagation();
  const state = loadState();
  if (action === "next-monster-round") saveAndReload(advanceMonsterRound(state));
  else saveAndReload(rollMonsterAction(state, actionButton.dataset.monsterId, action === "roll-monster-attack" ? "attack" : "damage"));
}, true);

document.addEventListener("submit", (event) => {
  const form = event.target.closest("[data-roll-form]");
  if (!form) return;
  const state = loadState();
  const mode = state.ui?.rollEdgeMode;
  if (!EDGE_MODES.has(mode)) return;
  event.preventDefault();
  event.stopPropagation();
  const input = form.querySelector("[data-roll-formula]");
  const message = form.parentElement.querySelector("[data-roll-message]");
  const formula = input?.value || "";
  const result = rollFormula(formula);
  if (!result.ok) {
    if (message) message.textContent = result.error;
    return;
  }
  if (message) message.textContent = "";
  window.sessionStorage.setItem(FORMULA_RESTORE_KEY, formula);
  const criticalPending = Boolean(state.ui?.isCriticalDamageRoll);
  const criticalRoll = criticalPending ? applyCriticalDamage(result, false) : result;
  const edgeRoll = applyEdgeToRoll(criticalRoll, mode);
  const nextState = { ...state, ui: { ...(state.ui || {}), isCriticalDamageRoll: false, rollEdgeMode: "" } };
  saveAndReload(prependRolls(nextState, [makeRollRecord(edgeRoll, form.dataset.rollActor || "玩家")]));
}, true);
