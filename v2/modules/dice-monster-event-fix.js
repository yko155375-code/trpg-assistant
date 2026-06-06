import { appendFormulaToken, renderRollHistory, rollFormula } from "./dice.js";
import {
  advanceMonsterRound,
  deleteEncounter,
  loadEncounter,
  renderMonsterManager,
  rollMonsterAction,
  saveCurrentEncounter,
} from "./monsters.js";
import { loadState, saveState } from "./storage.js";

const EDGE_MODES = new Set(["advantage", "disadvantage"]);
const MONSTER_AND_ENCOUNTER_ACTIONS = new Set([
  "roll-monster-attack",
  "roll-monster-damage",
  "next-monster-round",
  "reset-monster-round",
  "adjust-monster",
  "expand-monster",
  "delete-monster",
  "load-encounter-replace",
  "load-encounter-append",
  "delete-encounter",
]);

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function getFormulaInput(button) {
  return button.closest(".dice-panel")?.querySelector("[data-roll-formula]") || null;
}

function blurFormulaInput(input) {
  if (input && document.activeElement === input) {
    input.blur();
  }
}

function isQuickFormulaButton(target) {
  return target.closest?.('[data-action="append-roll-token"]') || null;
}

function isEdgeButton(target) {
  return target.closest?.("[data-roll-edge-mode]") || null;
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

function maxDiceDamage(roll) {
  return (Array.isArray(roll.terms) ? roll.terms : []).reduce((sum, term) => {
    if (term.type !== "dice" || term.sign < 0) return sum;
    return sum + term.count * term.sides;
  }, 0);
}

function normalDiceTotal(roll) {
  return Array.isArray(roll.dice) ? roll.dice.reduce((sum, value) => sum + value, 0) : 0;
}

function applyPlayerCriticalDamage(roll) {
  const maxDamage = maxDiceDamage(roll);
  const normalTotal = normalDiceTotal(roll);
  const modifierTotal = toNumber(roll.modifier);
  if (!maxDamage) {
    return {
      ...roll,
      criticalDamage: true,
      isCriticalDamageRoll: true,
      criticalDamageSkipped: true,
      criticalDamageMessage: "沒有骰子可加入滿骰傷害。",
    };
  }
  const totalDamage = maxDamage + normalTotal + modifierTotal;
  return {
    ...roll,
    criticalDamage: true,
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

function ensureEdgeStyles() {
  if (document.querySelector("[data-hard-no-reload-edge-style]")) return;
  const style = document.createElement("style");
  style.dataset.hardNoReloadEdgeStyle = "true";
  style.textContent = `
    .roll-edge-controls {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      margin: 6px 0;
    }
    .roll-edge-button {
      min-height: 32px;
      padding: 4px 10px;
      border-color: rgba(148, 163, 184, 0.32);
      opacity: 0.78;
      touch-action: manipulation;
    }
    .roll-edge-button.is-active {
      border-color: #facc15;
      background: rgba(250, 204, 21, 0.16);
      color: #fde68a;
      opacity: 1;
    }
    .roll-edge-result-note {
      margin: 6px 0;
      padding: 7px 9px;
      border: 1px solid rgba(96, 165, 250, 0.24);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.72);
      color: #dbeafe;
      font-size: 12px;
      line-height: 1.45;
    }
  `;
  document.head.append(style);
}

function updateEdgeButtons(panel, mode) {
  if (!panel) return;
  panel.querySelectorAll("[data-roll-edge-mode]").forEach((button) => {
    const active = button.dataset.rollEdgeMode === mode;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
}

function ensureDiceEdgeControls() {
  ensureEdgeStyles();
  const state = loadState();
  const mode = state.ui?.rollEdgeMode || "";
  document.querySelectorAll(".dice-panel").forEach((panel) => {
    const form = panel.querySelector("[data-roll-form]");
    if (!form || panel.querySelector("[data-roll-edge-controls]")) return;
    form.insertAdjacentHTML(
      "afterend",
      `<div class="roll-edge-controls" data-roll-edge-controls>
        <button class="roll-edge-button" type="button" data-roll-edge-mode="advantage" aria-pressed="false">優勢</button>
        <button class="roll-edge-button" type="button" data-roll-edge-mode="disadvantage" aria-pressed="false">劣勢</button>
      </div>`,
    );
    updateEdgeButtons(panel, mode);
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

function saveAndRenderDice(state, panel) {
  saveState(state);
  const history = panel?.querySelector(".roll-history, .empty-panel");
  if (history) history.outerHTML = renderRollHistory(state);
  ensureDiceEdgeControls();
  updateEdgeButtons(panel, state.ui?.rollEdgeMode || "");
  renderEdgeNote(state, panel);
}

function saveAndRenderMonsters(state) {
  saveState(state);
  const panel = document.querySelector(".monster-panel");
  if (panel) panel.outerHTML = renderMonsterManager(state);
}

function stopHard(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
  event.stopPropagation();
}

const edgeObserver = new MutationObserver(ensureDiceEdgeControls);
edgeObserver.observe(document.body, { childList: true, subtree: true });
ensureDiceEdgeControls();

document.addEventListener(
  "pointerdown",
  (event) => {
    const quickButton = isQuickFormulaButton(event.target);
    if (quickButton) {
      event.preventDefault();
      blurFormulaInput(getFormulaInput(quickButton));
      return;
    }

    const edgeButton = isEdgeButton(event.target);
    if (edgeButton) {
      blurFormulaInput(edgeButton.closest(".dice-panel")?.querySelector("[data-roll-formula]"));
      return;
    }

    const actionButton = event.target.closest?.("[data-action]");
    if (actionButton && MONSTER_AND_ENCOUNTER_ACTIONS.has(actionButton.dataset.action)) {
      event.preventDefault();
    }
  },
  true,
);

document.addEventListener(
  "click",
  (event) => {
    const quickButton = isQuickFormulaButton(event.target);
    if (quickButton) {
      stopHard(event);
      const input = getFormulaInput(quickButton);
      if (!input) return;
      input.value = appendFormulaToken(input.value, quickButton.dataset.rollToken);
      blurFormulaInput(input);
      return;
    }

    const edgeButton = isEdgeButton(event.target);
    if (edgeButton) {
      stopHard(event);
      const selected = edgeButton.dataset.rollEdgeMode;
      const state = loadState();
      const nextMode = state.ui?.rollEdgeMode === selected ? "" : selected;
      const nextState = { ...state, ui: { ...(state.ui || {}), rollEdgeMode: nextMode } };
      saveState(nextState);
      updateEdgeButtons(edgeButton.closest(".dice-panel"), nextMode);
      blurFormulaInput(edgeButton.closest(".dice-panel")?.querySelector("[data-roll-formula]"));
      return;
    }

    const actionButton = event.target.closest?.("[data-action]");
    if (!actionButton) return;
    const action = actionButton.dataset.action;

    if (["roll-monster-attack", "roll-monster-damage", "next-monster-round"].includes(action)) {
      stopHard(event);
      const state = loadState();
      if (action === "next-monster-round") {
        saveAndRenderMonsters(advanceMonsterRound(state));
        return;
      }
      saveAndRenderMonsters(rollMonsterAction(state, actionButton.dataset.monsterId, action === "roll-monster-attack" ? "attack" : "damage"));
      return;
    }

    if (["load-encounter-replace", "load-encounter-append", "delete-encounter"].includes(action)) {
      stopHard(event);
      const state = loadState();
      const encounterId = actionButton.dataset.encounterId;
      if (action === "load-encounter-replace") {
        if (window.confirm("載入此遭遇會清空目前怪物，確定嗎？")) {
          saveAndRenderMonsters(loadEncounter(state, encounterId, "replace"));
        }
        return;
      }
      if (action === "load-encounter-append") {
        saveAndRenderMonsters(loadEncounter(state, encounterId, "append"));
        return;
      }
      if (window.confirm("確定刪除此遭遇模板？目前怪物不會被刪除。")) {
        saveAndRenderMonsters(deleteEncounter(state, encounterId));
      }
    }
  },
  true,
);

document.addEventListener(
  "submit",
  (event) => {
    const rollForm = event.target.closest?.("[data-roll-form]");
    if (rollForm) {
      const state = loadState();
      const mode = state.ui?.rollEdgeMode;
      if (!EDGE_MODES.has(mode)) return;

      stopHard(event);
      const input = rollForm.querySelector("[data-roll-formula]");
      const message = rollForm.parentElement.querySelector("[data-roll-message]");
      const formula = input?.value || "";
      const result = rollFormula(formula);
      if (!result.ok) {
        if (message) message.textContent = result.error;
        return;
      }

      if (message) message.textContent = "";
      const criticalRoll = state.ui?.isCriticalDamageRoll ? applyPlayerCriticalDamage(result) : result;
      const edgeRoll = applyEdgeToRoll(criticalRoll, mode);
      const nextState = {
        ...state,
        ui: {
          ...(state.ui || {}),
          isCriticalDamageRoll: false,
          rollEdgeMode: "",
        },
      };
      saveAndRenderDice(prependRolls(nextState, [makeRollRecord(edgeRoll, rollForm.dataset.rollActor || "玩家")]), rollForm.closest(".dice-panel"));
      return;
    }

    const encounterForm = event.target.closest?.("[data-save-encounter-form]");
    if (!encounterForm) return;
    stopHard(event);
    const input = encounterForm.querySelector("[data-encounter-name]");
    saveAndRenderMonsters(saveCurrentEncounter(loadState(), input?.value || ""));
  },
  true,
);
