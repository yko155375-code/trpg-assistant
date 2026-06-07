import {
  addAssetEntry,
  addCharacter,
  addCharacterEffect,
  adjustCharacterAttribute,
  adjustCharacterGold,
  adjustCharacterMoney,
  adjustCharacterStat,
  deleteAssetEntry,
  deleteCharacter,
  deleteCharacterEffect,
  expandCharacter,
  selectCharacter,
  toggleCharacterEffect,
  updateAssetEntry,
  updateCharacterAttribute,
  updateCharacterField,
  updateCharacterGold,
  updateCharacterMoney,
  updateCharacterStat,
} from "./modules/characters.js";
import { addRoll, appendFormulaToken, clearRolls, rollDuality, rollFormula } from "./modules/dice.js";
import { renderDmPage } from "./modules/dm-view.js";
import {
  addMonster,
  adjustMonsterValue,
  advanceMonsterRound,
  deleteEncounter,
  deleteMonster,
  expandMonster,
  loadEncounter,
  resetMonsterRound,
  rollMonsterAction,
  saveCurrentEncounter,
  updateMonster,
} from "./modules/monsters.js";
import { renderPlayerPage } from "./modules/player-view.js";
import { updatePublicInfoField } from "./modules/public-info.js";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js";
import { addShopItem, deleteShopItem, purchaseShopItem, updateShopItem } from "./modules/shop.js";
import { createDefaultState } from "./modules/state.js";
import { loadState, saveState } from "./modules/storage.js";

const app = document.querySelector("#app");
const EDGE_MODES = new Set(["advantage", "disadvantage"]);
let state = saveState(loadState());
let isDmMenuOpen = false;

function updateState(nextState) {
  state = saveState(nextState);
  render();
}

function saveStateOnly(nextState) {
  state = saveState(nextState);
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function actorKeyFromElement(element) {
  const actor = element.closest("[data-roll-form]")?.dataset.rollActor || element.closest(".dice-panel")?.querySelector("[data-roll-form]")?.dataset.rollActor || "player";
  return actor === "DM" ? "DM" : "player";
}

function setFormulaDraft(nextState, actor, formula) {
  return {
    ...nextState,
    ui: {
      ...(nextState.ui || {}),
      rollFormulaDrafts: {
        ...(nextState.ui?.rollFormulaDrafts || {}),
        [actor]: formula || "",
      },
    },
  };
}

function syncFormulaDraft(element, nextState = state) {
  const input = element.closest?.(".dice-panel")?.querySelector("[data-roll-formula]") || element.querySelector?.("[data-roll-formula]");
  return input ? setFormulaDraft(nextState, actorKeyFromElement(input), input.value || "") : nextState;
}

function enhanceDiceHtml(html, actor) {
  const key = actor === "DM" ? "DM" : "player";
  const draft = escapeHtml(state.ui?.rollFormulaDrafts?.[key] || "");
  let output = html.replace(/<input data-roll-formula([^>]*)\/>/, `<input data-roll-formula$1 value="${draft}" />`);
  if (key === "player" && !output.includes("data-roll-edge-mode")) {
    const mode = state.ui?.rollEdgeMode || "";
    const edge = `<div class="roll-edge-controls" data-roll-edge-controls><button class="roll-edge-button ${mode === "advantage" ? "is-active" : ""}" type="button" data-roll-edge-mode="advantage" aria-pressed="${mode === "advantage"}">優勢</button><button class="roll-edge-button ${mode === "disadvantage" ? "is-active" : ""}" type="button" data-roll-edge-mode="disadvantage" aria-pressed="${mode === "disadvantage"}">劣勢</button></div>`;
    output = output.replace("</form>", `</form>${edge}`);
  }
  return output;
}

function renderPanel() {
  const pages = getActivePages(state.ui.mode);
  const page = pages.find((item) => item.id === getActivePageId(state)) || pages[0];
  if (state.ui.mode === "player") {
    const html = renderPlayerPage(page.id, state);
    return page.id === "dice" ? enhanceDiceHtml(html, "player") : html;
  }
  const html = renderDmPage(page.id, state);
  return page.id === "dice" ? enhanceDiceHtml(html, "DM") : html;
}

function renderPageButton(page, className) {
  const active = page.id === getActivePageId(state);
  return `<button class="${className} ${active ? "is-active" : ""}" type="button" data-page="${page.id}" aria-pressed="${active}">${page.label}</button>`;
}

function renderModeButton(mode, label) {
  const active = state.ui.mode === mode;
  return `<button class="mode-button ${active ? "is-active" : ""}" type="button" data-mode="${mode}" aria-pressed="${active}">${label}</button>`;
}

function renderDmMobileNav(pages) {
  const active = pages.find((page) => page.id === getActivePageId(state)) || pages[0];
  return `<div class="dm-mobile-nav"><button class="dm-menu-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}"><span aria-hidden="true">☰</span><span>DM 選單</span></button><strong>${escapeHtml(active.label)}</strong></div><nav id="dm-mobile-menu" class="dm-mobile-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 手機選單">${pages.map((page) => renderPageButton(page, "dm-mobile-menu-button")).join("")}</nav>`;
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const isPlayer = state.ui.mode === "player";
  app.innerHTML = `<header class="app-header"><div class="brand-block"><p class="eyebrow">TRPG Assistant</p><h1 class="app-title">v2</h1><p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p></div><nav class="mode-switch" aria-label="模式切換">${renderModeButton("player", "玩家")}${renderModeButton("dm", "DM")}</nav></header><main class="layout ${isPlayer ? "is-player" : "is-dm"}">${isPlayer ? `<nav class="tab-list player-bottom-tabs" aria-label="玩家分頁">${pages.map((page) => renderPageButton(page, "tab-button")).join("")}</nav>` : renderDmMobileNav(pages)}<nav class="sidebar-list" aria-label="DM 分頁">${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}</nav>${renderPanel()}</main>`;
}

function blurNear(element) {
  const input = element.closest?.(".dice-panel")?.querySelector("[data-roll-formula]");
  if (input && document.activeElement === input) input.blur();
}

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function applyEdge(roll, mode) {
  if (!EDGE_MODES.has(mode)) return roll;
  const die = rollD6();
  const baseTotal = Number(roll.total) || 0;
  const finalTotal = mode === "advantage" ? baseTotal + die : baseTotal - die;
  return { ...roll, rollEdgeMode: mode, rollEdgeDie: die, baseTotal, total: finalTotal, edgeBreakdown: { mode, die, baseTotal, finalTotal }, note: mode === "advantage" ? "優勢骰 +1d6" : "劣勢骰 -1d6" };
}

app.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) {
    event.preventDefault();
    isDmMenuOpen = false;
    updateState(setMode(syncFormulaDraft(app), modeButton.dataset.mode));
    return;
  }

  const dmMenuButton = event.target.closest("[data-dm-menu-toggle]");
  if (dmMenuButton) {
    event.preventDefault();
    isDmMenuOpen = !isDmMenuOpen;
    render();
    return;
  }

  const pageButton = event.target.closest("[data-page]");
  if (pageButton) {
    event.preventDefault();
    isDmMenuOpen = false;
    updateState(setActivePage(syncFormulaDraft(app), pageButton.dataset.page));
    return;
  }

  const edgeButton = event.target.closest("[data-roll-edge-mode]");
  if (edgeButton) {
    event.preventDefault();
    blurNear(edgeButton);
    const synced = syncFormulaDraft(edgeButton);
    const selected = edgeButton.dataset.rollEdgeMode;
    const current = synced.ui?.rollEdgeMode;
    updateState({ ...synced, ui: { ...(synced.ui || {}), rollEdgeMode: current === selected ? "" : selected } });
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) return;
  event.preventDefault();

  if (actionButton.dataset.action === "append-roll-token") {
    const input = actionButton.closest(".dice-panel")?.querySelector("[data-roll-formula]");
    if (!input) return;
    input.value = appendFormulaToken(input.value, actionButton.dataset.rollToken);
    blurNear(actionButton);
    saveStateOnly(setFormulaDraft(state, actorKeyFromElement(input), input.value));
    return;
  }
  if (actionButton.dataset.action === "roll-duality") return updateState(addRoll(syncFormulaDraft(actionButton), rollDuality({}), actionButton.dataset.rollActor || "玩家"));
  if (actionButton.dataset.action === "clear-rolls") return updateState(clearRolls(syncFormulaDraft(actionButton)));
  if (actionButton.dataset.action === "toggle-team-status") return updateState({ ...state, ui: { ...state.ui, isTeamStatusOpen: !state.ui.isTeamStatusOpen } });
  if (actionButton.dataset.action === "delete-character") return updateState(deleteCharacter(state, actionButton.dataset.characterId));
  if (actionButton.dataset.action === "expand-character") return updateState(expandCharacter(state, actionButton.dataset.characterId));
  if (actionButton.dataset.action === "adjust-character-stat") return updateState(adjustCharacterStat(state, actionButton.dataset.characterId, actionButton.dataset.statField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-attribute") return updateState(adjustCharacterAttribute(state, actionButton.dataset.characterId, actionButton.dataset.attributeField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-money") return updateState(adjustCharacterMoney(state, actionButton.dataset.characterId, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-gold") return updateState(adjustCharacterGold(state, actionButton.dataset.characterId, actionButton.dataset.goldField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "toggle-character-effect") return updateState(toggleCharacterEffect(state, actionButton.dataset.characterId, actionButton.dataset.effectType, actionButton.dataset.effectLabel));
  if (actionButton.dataset.action === "delete-character-effect") return updateState(deleteCharacterEffect(state, actionButton.dataset.characterId, actionButton.dataset.effectType, Number(actionButton.dataset.effectIndex)));
  if (actionButton.dataset.action === "delete-asset-entry") return updateState(deleteAssetEntry(state, actionButton.dataset.characterId, actionButton.dataset.listKey, Number(actionButton.dataset.entryIndex)));
  if (actionButton.dataset.action === "delete-shop-item" && confirm("確定要刪除這個商品？")) return updateState(deleteShopItem(state, actionButton.dataset.shopItemId));
  if (actionButton.dataset.action === "purchase-shop-item") return updateState(purchaseShopItem(state, actionButton.dataset.shopItemId));
  if (actionButton.dataset.action === "delete-monster" && confirm("確定要刪除這隻怪物？")) return updateState(deleteMonster(state, actionButton.dataset.monsterId));
  if (actionButton.dataset.action === "adjust-monster") return updateState(adjustMonsterValue(state, actionButton.dataset.monsterId, actionButton.dataset.monsterField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "expand-monster") return updateState(expandMonster(state, actionButton.dataset.monsterId));
  if (actionButton.dataset.action === "roll-monster-attack") return updateState(rollMonsterAction(state, actionButton.dataset.monsterId, "attack"));
  if (actionButton.dataset.action === "roll-monster-damage") return updateState(rollMonsterAction(state, actionButton.dataset.monsterId, "damage"));
  if (actionButton.dataset.action === "next-monster-round") return updateState(advanceMonsterRound(state));
  if (actionButton.dataset.action === "reset-monster-round" && confirm("確定要重設怪物回合？")) return updateState(resetMonsterRound(state));
  if (actionButton.dataset.action === "load-encounter-replace" && confirm("載入後會清空目前怪物，確定嗎？")) return updateState(loadEncounter(state, actionButton.dataset.encounterId, "replace"));
  if (actionButton.dataset.action === "load-encounter-append") return updateState(loadEncounter(state, actionButton.dataset.encounterId, "append"));
  if (actionButton.dataset.action === "delete-encounter" && confirm("確定要刪除這個遭遇模板？")) return updateState(deleteEncounter(state, actionButton.dataset.encounterId));
  if (actionButton.dataset.action === "reset-v2-state" && confirm("確定要重設 v2 測試資料？")) return updateState(createDefaultState());
});

app.addEventListener("change", (event) => {
  const characterSelect = event.target.closest("[data-character-select]");
  if (characterSelect) return updateState(selectCharacter(state, characterSelect.value));
  const shopItemField = event.target.closest("[data-shop-item-field]");
  if (shopItemField) return updateState(updateShopItem(state, shopItemField.dataset.shopItemId, shopItemField.dataset.shopItemField, shopItemField.value));
  const characterId = event.target.dataset.characterId;
  if (!characterId) return;
  if (event.target.dataset.characterField) return updateState(updateCharacterField(state, characterId, event.target.dataset.characterField, event.target.value));
  if (event.target.dataset.statField) return updateState(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
  if (event.target.dataset.attributeField) return updateState(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
  if (event.target.dataset.goldField) return updateState(updateCharacterGold(state, characterId, event.target.dataset.goldField, event.target.value));
  if (event.target.matches("[data-money-field]")) return updateState(updateCharacterMoney(state, characterId, event.target.value));
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-roll-formula]")) return saveStateOnly(setFormulaDraft(state, actorKeyFromElement(event.target), event.target.value));
  const characterId = event.target.dataset.characterId;
  if (characterId) {
    if (event.target.dataset.characterField) return saveStateOnly(updateCharacterField(state, characterId, event.target.dataset.characterField, event.target.value));
    if (event.target.dataset.statField) return saveStateOnly(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
    if (event.target.dataset.attributeField) return saveStateOnly(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
    if (event.target.dataset.goldField) return saveStateOnly(updateCharacterGold(state, characterId, event.target.dataset.goldField, event.target.value));
    if (event.target.matches("[data-money-field]")) return saveStateOnly(updateCharacterMoney(state, characterId, event.target.value));
  }
  const assetEntryField = event.target.closest("[data-asset-entry-field]");
  if (assetEntryField) return saveStateOnly(updateAssetEntry(state, assetEntryField.dataset.characterId, assetEntryField.dataset.listKey, Number(assetEntryField.dataset.entryIndex), assetEntryField.value));
  const publicInfoField = event.target.dataset.publicInfoField;
  if (publicInfoField) return saveStateOnly(updatePublicInfoField(state, publicInfoField, event.target.value));
  const shopItemField = event.target.closest("[data-shop-item-field]");
  if (shopItemField) return saveStateOnly(updateShopItem(state, shopItemField.dataset.shopItemId, shopItemField.dataset.shopItemField, shopItemField.value));
  const monsterField = event.target.closest("[data-monster-field]");
  if (monsterField) return saveStateOnly(updateMonster(state, monsterField.dataset.monsterId, monsterField.dataset.monsterField, monsterField.value));
});

app.addEventListener("submit", (event) => {
  const rollForm = event.target.closest("[data-roll-form]");
  if (rollForm) {
    event.preventDefault();
    const input = rollForm.querySelector("[data-roll-formula]");
    const formula = input?.value || "";
    const message = rollForm.parentElement.querySelector("[data-roll-message]");
    const actor = rollForm.dataset.rollActor || "玩家";
    const key = actorKeyFromElement(rollForm);
    const synced = setFormulaDraft(state, key, formula);
    const result = rollFormula(formula);
    if (!result.ok) {
      saveStateOnly(synced);
      if (message) message.textContent = result.error;
      return;
    }
    if (message) message.textContent = "";
    const mode = EDGE_MODES.has(synced.ui?.rollEdgeMode) ? synced.ui.rollEdgeMode : "";
    const roll = mode ? applyEdge(result, mode) : result;
    const nextState = mode ? { ...synced, ui: { ...synced.ui, rollEdgeMode: "" } } : synced;
    return updateState(addRoll(nextState, roll, actor));
  }
  const addCharacterForm = event.target.closest("[data-add-character-form]");
  if (addCharacterForm) {
    event.preventDefault();
    return updateState(addCharacter(state, addCharacterForm.querySelector("[data-new-character-name]")?.value.trim() || "", addCharacterForm.querySelector("[data-new-character-color]")?.value));
  }
  const addCharacterEffectForm = event.target.closest("[data-add-character-effect-form]");
  if (addCharacterEffectForm) {
    event.preventDefault();
    return updateState(addCharacterEffect(state, addCharacterEffectForm.dataset.characterId, addCharacterEffectForm.dataset.effectType, addCharacterEffectForm.querySelector("[data-character-effect-input]")?.value || ""));
  }
  const addAssetForm = event.target.closest("[data-add-asset-form]");
  if (addAssetForm) {
    event.preventDefault();
    return updateState(addAssetEntry(state, addAssetForm.dataset.characterId, addAssetForm.dataset.listKey, addAssetForm.querySelector("[data-asset-entry-input]")?.value || ""));
  }
  const addShopItemForm = event.target.closest("[data-add-shop-item-form]");
  if (addShopItemForm) {
    event.preventDefault();
    return updateState(addShopItem(state, { name: addShopItemForm.querySelector("[data-new-shop-name]")?.value.trim() || "", type: addShopItemForm.querySelector("[data-new-shop-type]")?.value || "", price: addShopItemForm.querySelector("[data-new-shop-price]")?.value || 0, stock: addShopItemForm.querySelector("[data-new-shop-stock]")?.value || 0, description: addShopItemForm.querySelector("[data-new-shop-description]")?.value || "" }));
  }
  const addMonsterForm = event.target.closest("[data-add-monster-form]");
  if (addMonsterForm) {
    event.preventDefault();
    const values = Object.fromEntries(Array.from(addMonsterForm.querySelectorAll("[data-new-monster-field]")).map((input) => [input.dataset.newMonsterField, input.value]));
    return updateState(addMonster(state, values));
  }
  const saveEncounterForm = event.target.closest("[data-save-encounter-form]");
  if (saveEncounterForm) {
    event.preventDefault();
    return updateState(saveCurrentEncounter(state, saveEncounterForm.querySelector("[data-encounter-name]")?.value || ""));
  }
});

app.addEventListener("wheel", (event) => {
  const stepper = event.target.closest("[data-number-stepper]");
  if (!stepper) return;
  event.preventDefault();
  const delta = event.deltaY < 0 ? 1 : -1;
  const { characterId, stepperType, stepperField } = stepper.dataset;
  if (stepperType === "stat") return updateState(adjustCharacterStat(state, characterId, stepperField, delta));
  if (stepperType === "attribute") return updateState(adjustCharacterAttribute(state, characterId, stepperField, delta));
  if (stepperType === "money") return updateState(adjustCharacterMoney(state, characterId, delta));
  if (stepperType === "gold") return updateState(adjustCharacterGold(state, characterId, stepperField, delta));
}, { passive: false });

render();
