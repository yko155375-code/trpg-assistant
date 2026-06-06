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

function getRollActor(formOrPanel) {
  const form = formOrPanel?.matches?.("[data-roll-form]") ? formOrPanel : formOrPanel?.querySelector?.("[data-roll-form]");
  return form?.dataset.rollActor || "玩家";
}

function withFormulaDraft(state, actor, formula) {
  return {
    ...state,
    ui: {
      ...(state.ui || {}),
      rollFormulaDrafts: {
        ...(state.ui?.rollFormulaDrafts || {}),
        [actor || "玩家"]: formula || "",
      },
    },
  };
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
    .dice-panel .roll-edge-button.is-active,
    .dice-panel .roll-edge-button[aria-pressed="true"] {
      border-color: #facc15 !important;
      background: linear-gradient(180deg, rgba(250, 204, 21, 0.34), rgba(180, 83, 9, 0.26)) !important;
      color: #fff7c2 !important;
      box-shadow: 0 0 0 1px rgba(250, 204, 21, 0.36), 0 0 14px rgba(250, 204, 21, 0.28);
      opacity: 1 !important;
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

function restoreFormulaDraft(panel, state) {
  const form = panel?.querySelector?.("[data-roll-form]");
  const input = form?.querySelector?.("[data-roll-formula]");
  if (!form || !input || input.value) return;
  const actor = getRollActor(form);
  const draft = state.ui?.rollFormulaDrafts?.[actor];
  if (typeof draft === "string") input.value = draft;
}

function ensureDiceEdgeControls() {
  ensureEdgeStyles();
  const state = loadState();
  const mode = state.ui?.rollEdgeMode || "";
  document.querySelectorAll(".dice-panel").forEach((panel) => {
    const form = panel.querySelector("[data-roll-form]");
    if (!form) return;
    restoreFormulaDraft(panel, state);
    if (!form.dataset.rollEdgeEnabled || panel.querySelector("[data-roll-edge-controls]")) {
      updateEdgeButtons(panel, mode);
      return;
    }
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
      event.preventDefault();
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
      const panel = quickButton.closest(".dice-panel");
      const actor = getRollActor(panel);
      saveState(withFormulaDraft(loadState(), actor, input.value));
      blurFormulaInput(input);
      return;
    }

    const edgeButton = isEdgeButton(event.target);
    if (edgeButton) {
      stopHard(event);
      const panel = edgeButton.closest(".dice-panel");
      const input = panel?.querySelector("[data-roll-formula]");
      const actor = getRollActor(panel);
      const formula = input?.value || "";
      const selected = edgeButton.dataset.rollEdgeMode;
      const state = withFormulaDraft(loadState(), actor, formula);
      const nextMode = state.ui?.rollEdgeMode === selected ? "" : selected;
      const nextState = { ...state, ui: { ...(state.ui || {}), rollEdgeMode: nextMode } };
      saveState(nextState);
      if (input) input.value = formula;
      updateEdgeButtons(panel, nextMode);
      blurFormulaInput(input);
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
      const actor = getRollActor(rollForm);
      const formula = input?.value || "";
      const stateWithDraft = withFormulaDraft(state, actor, formula);
      const result = rollFormula(formula);
      if (!result.ok) {
        saveState(stateWithDraft);
        if (message) message.textContent = result.error;
        return;
      }

      if (message) message.textContent = "";
      const criticalRoll = stateWithDraft.ui?.isCriticalDamageRoll ? applyPlayerCriticalDamage(result) : result;
      const edgeRoll = applyEdgeToRoll(criticalRoll, mode);
      const nextState = {
        ...stateWithDraft,
        ui: {
          ...(stateWithDraft.ui || {}),
          isCriticalDamageRoll: false,
          rollEdgeMode: "",
        },
      };
      saveAndRenderDice(prependRolls(nextState, [makeRollRecord(edgeRoll, actor)]), rollForm.closest(".dice-panel"));
      if (input) input.value = formula;
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
