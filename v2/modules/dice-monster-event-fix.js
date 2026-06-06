import { appendFormulaToken } from "./dice.js";

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
      event.preventDefault();
      event.stopImmediatePropagation();
      event.stopPropagation();
      const input = getFormulaInput(quickButton);
      if (!input) return;
      input.value = appendFormulaToken(input.value, quickButton.dataset.rollToken);
      blurFormulaInput(input);
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
