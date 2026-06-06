import { renderRollHistory, rollFormula } from "./dice.js";
import {
  advanceMonsterRound,
  deleteEncounter,
  loadEncounter,
  renderMonsterManager,
  saveCurrentEncounter,
} from "./monsters.js";
import { loadState, saveState } from "./storage.js";

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
  return {
    ...state,
    rolls: [...rolls, ...(Array.isArray(state.rolls) ? state.rolls : [])].slice(0, 80),
  };
}

function makeRollRecord(result, actor) {
  return {
    id: makeId("roll"),
    actor,
    ...result,
    time: result.time || new Date().toISOString(),
  };
}

function getPendingMap(state) {
  const pending = state.ui?.monsterCriticalDamagePending;
  return pending && typeof pending === "object" ? pending : {};
}

function setPendingForMonster(state, monsterId, value) {
  const pending = { ...getPendingMap(state) };
  if (value) pending[monsterId] = true;
  else delete pending[monsterId];
  return {
    ...state,
    ui: {
      ...(state.ui || {}),
      monsterCriticalDamagePending: pending,
    },
  };
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
      criticalDamageMessage: "沒有骰子可加入滿骰傷害。",
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
    edgeBreakdown: {
      mode,
      die: edgeDie,
      baseTotal,
      finalTotal: baseTotal + delta,
    },
    note: mode === "advantage" ? "優勢骰 +1d6" : "劣勢骰 -1d6",
  };
}

function isDead(monster) {
  return Boolean(monster.isDead) || toNumber(monster.hp) <= 0;
}

function makeMonsterRoll(monster, action, round = null, state = null) {
  const formula = action === "attack" ? monster.attack : monster.damage;
  if (!String(formula || "").trim()) {
    return {
      ok: false,
      skipped: true,
      action,
      formula: "",
      error: action === "attack" ? "未設定攻擊公式" : "未設定傷害公式",
      monsterId: monster.id,
      monsterName: monster.name,
      round,
    };
  }

  let result = {
    ...rollFormula(formula),
    action,
    monsterId: monster.id,
    monsterName: monster.name,
    round,
  };

  if (!result.ok) {
    return {
      ...result,
      error: action === "attack" ? `攻擊公式錯誤：${result.error}` : `傷害公式錯誤：${result.error}`,
    };
  }

  if (action === "attack" && rollHasNatural20(result)) {
    result = {
      ...result,
      monsterNatural20: true,
      note: "怪物關鍵攻擊：自然 20",
    };
  }

  if (action === "damage" && state?.ui?.monsterCriticalDamagePending?.[monster.id]) {
    result = applyCriticalDamage(result, true);
  }

  return result;
}

function rollMonsterWithoutReload(state, monsterId, action) {
  const monster = (Array.isArray(state.monsters) ? state.monsters : []).find((entry) => entry.id === monsterId);
  if (!monster) return state;

  let nextState = state;
  const result = makeMonsterRoll(monster, action, state.session?.round || 0, state);
  if (action === "attack" && result.monsterNatural20) {
    nextState = setPendingForMonster(nextState, monster.id, true);
  }
  if (action === "damage" && state.ui?.monsterCriticalDamagePending?.[monster.id]) {
    nextState = setPendingForMonster(nextState, monster.id, false);
  }

  const label = action === "attack" ? "攻擊" : "傷害";
  const record = makeRollRecord(
    {
      ...result,
      monsterRollType: `monster ${action} roll`,
    },
    `${monster.name} ${label}`,
  );

  return {
    ...prependRolls(nextState, [record]),
    session: {
      ...(nextState.session || {}),
      lastMonsterAction: record,
    },
  };
}

function advanceRoundWithoutReload(state) {
  const round = Math.max(0, Math.floor(toNumber(state.session?.round))) + 1;
  const monsters = Array.isArray(state.monsters) ? state.monsters : [];
  const activeMonsters = monsters.filter((monster) => !isDead(monster));
  const skippedDeadCount = monsters.length - activeMonsters.length;
  let nextState = state;

  const results = activeMonsters.map((monster) => {
    const attackRoll = makeMonsterRoll(monster, "attack", round, nextState);
    if (attackRoll.monsterNatural20) nextState = setPendingForMonster(nextState, monster.id, true);
    const damageRoll = makeMonsterRoll(monster, "damage", round, nextState);
    if (nextState.ui?.monsterCriticalDamagePending?.[monster.id]) {
      nextState = setPendingForMonster(nextState, monster.id, false);
    }
    return {
      id: makeId("monster-round"),
      monsterId: monster.id,
      monsterName: `${monster.name} #${monster.instanceNumber || ""}`.trim(),
      round,
      attackRoll,
      damageRoll,
      monsterNatural20: Boolean(attackRoll.monsterNatural20),
      time: new Date().toISOString(),
    };
  });

  const records = results.map((result) =>
    makeRollRecord(
      {
        ok: true,
        type: "monster-round",
        formula: `第 ${round} 回合`,
        total: result.attackRoll.ok ? result.attackRoll.total : "-",
        dice: [],
        terms: [],
        monsterId: result.monsterId,
        monsterName: result.monsterName,
        round,
        attackRoll: result.attackRoll,
        damageRoll: result.damageRoll,
        monsterNatural20: result.monsterNatural20,
        monsterRollType: "monster round roll",
      },
      `怪物回合：${result.monsterName}`,
    ),
  );

  return {
    ...prependRolls(nextState, records),
    session: {
      ...(nextState.session || {}),
      round,
      monsterRoundResults: results,
      skippedDeadMonsters: skippedDeadCount,
    },
  };
}

function saveAndRenderDice(state, panel) {
  saveState(state);
  const history = panel?.querySelector(".roll-history, .empty-panel");
  if (history) history.outerHTML = renderRollHistory(state);
  updateEdgeButtons(panel, state.ui?.rollEdgeMode || "");
  renderEdgeNote(state, panel);
}

function saveAndRenderMonsters(state) {
  saveState(state);
  const panel = document.querySelector(".monster-panel");
  if (panel) panel.outerHTML = renderMonsterManager(state);
}

function updateEdgeButtons(panel, mode) {
  if (!panel) return;
  panel.querySelectorAll("[data-roll-edge-mode]").forEach((button) => {
    const active = button.dataset.rollEdgeMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function renderEdgeNote(state, panel) {
  document.querySelectorAll("[data-roll-edge-result-note]").forEach((node) => node.remove());
  const latestRoll = Array.isArray(state.rolls) ? state.rolls[0] : null;
  if (!latestRoll?.edgeBreakdown || !panel) return;
  const modeLabel = latestRoll.edgeBreakdown.mode === "advantage" ? "優勢骰" : "劣勢骰";
  const sign = latestRoll.edgeBreakdown.mode === "advantage" ? "+" : "-";
  const note = document.createElement("p");
  note.className = "roll-edge-result-note";
  note.dataset.rollEdgeResultNote = "true";
  note.textContent = `公式：${latestRoll.formula}，原結果：${latestRoll.edgeBreakdown.baseTotal}，${modeLabel}：${sign}${latestRoll.edgeBreakdown.die}，最終：${latestRoll.edgeBreakdown.finalTotal}`;
  panel.insertAdjacentElement("afterbegin", note);
}

function handleEdgeButton(event) {
  const button = event.target.closest("[data-roll-edge-mode]");
  if (!button) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();

  const selected = button.dataset.rollEdgeMode;
  const state = loadState();
  const nextMode = state.ui?.rollEdgeMode === selected ? "" : selected;
  const nextState = { ...state, ui: { ...(state.ui || {}), rollEdgeMode: nextMode } };
  saveState(nextState);
  updateEdgeButtons(button.closest(".dice-panel"), nextMode);
  return true;
}

function handleEdgeSubmit(event) {
  const form = event.target.closest("[data-roll-form]");
  if (!form) return false;
  const state = loadState();
  const mode = state.ui?.rollEdgeMode;
  if (!EDGE_MODES.has(mode)) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();

  const input = form.querySelector("[data-roll-formula]");
  const message = form.parentElement.querySelector("[data-roll-message]");
  const formula = input?.value || "";
  const result = rollFormula(formula);
  if (!result.ok) {
    if (message) message.textContent = result.error;
    return true;
  }

  if (message) message.textContent = "";
  const criticalPending = Boolean(state.ui?.isCriticalDamageRoll);
  const criticalRoll = criticalPending ? applyCriticalDamage(result, false) : result;
  const edgeRoll = applyEdgeToRoll(criticalRoll, mode);
  const nextState = {
    ...state,
    ui: {
      ...(state.ui || {}),
      isCriticalDamageRoll: false,
      rollEdgeMode: "",
    },
  };
  saveAndRenderDice(prependRolls(nextState, [makeRollRecord(edgeRoll, form.dataset.rollActor || "玩家")]), form.closest(".dice-panel"));
  return true;
}

function handleMonsterAction(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return false;
  const action = button.dataset.action;
  if (!["roll-monster-attack", "roll-monster-damage", "next-monster-round"].includes(action)) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();

  const state = loadState();
  if (action === "next-monster-round") {
    saveAndRenderMonsters(advanceRoundWithoutReload(state));
    return true;
  }

  saveAndRenderMonsters(rollMonsterWithoutReload(state, button.dataset.monsterId, action === "roll-monster-attack" ? "attack" : "damage"));
  return true;
}

function handleEncounterSubmit(event) {
  const form = event.target.closest("[data-save-encounter-form]");
  if (!form) return false;
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
  const input = form.querySelector("[data-encounter-name]");
  saveAndRenderMonsters(saveCurrentEncounter(loadState(), input?.value || ""));
  return true;
}

function handleEncounterClick(event) {
  const button = event.target.closest("[data-action]");
  if (!button) return false;
  const action = button.dataset.action;
  if (!["load-encounter-replace", "load-encounter-append", "delete-encounter"].includes(action)) return false;

  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();

  const state = loadState();
  const encounterId = button.dataset.encounterId;
  if (action === "load-encounter-replace") {
    if (window.confirm("載入此遭遇會清空目前怪物，確定嗎？")) {
      saveAndRenderMonsters(loadEncounter(state, encounterId, "replace"));
    }
    return true;
  }
  if (action === "load-encounter-append") {
    saveAndRenderMonsters(loadEncounter(state, encounterId, "append"));
    return true;
  }
  if (window.confirm("確定刪除此遭遇模板？目前怪物不會被刪除。")) {
    saveAndRenderMonsters(deleteEncounter(state, encounterId));
  }
  return true;
}

document.addEventListener(
  "click",
  (event) => {
    if (handleEdgeButton(event)) return;
    if (handleMonsterAction(event)) return;
    handleEncounterClick(event);
  },
  true,
);

document.addEventListener(
  "submit",
  (event) => {
    if (handleEdgeSubmit(event)) return;
    handleEncounterSubmit(event);
  },
  true,
);
