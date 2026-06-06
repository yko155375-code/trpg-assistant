import { loadState, saveState } from "./modules/storage.js";
import {
  addAssetEntry,
  addCharacterEffect,
  addCharacter,
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
import { addRoll, appendFormulaToken, applyDualityEffects, clearRolls, rollDuality, rollFormula } from "./modules/dice.js";
import { addMonster, adjustMonsterValue, advanceMonsterRound, deleteMonster, expandMonster, resetMonsterRound, rollMonsterAction, updateMonster } from "./modules/monsters.js";
import { updatePublicInfoField } from "./modules/public-info.js";
import { addShopItem, deleteShopItem, purchaseShopItem, updateShopItem } from "./modules/shop.js";
import { createDefaultState } from "./modules/state.js";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js";
import { renderDmPage } from "./modules/dm-view.js";
import { renderPlayerPage } from "./modules/player-view.js";

const app = document.querySelector("#app");
const DEFAULT_BUILD_INFO = { version: "v2", label: "version-check", commit: "unknown", updatedAt: "", note: "" };
const EDGE_MODES = new Set(["advantage", "disadvantage"]);
let state = saveState(loadState());
let isDmMenuOpen = false;
let buildInfo = { ...DEFAULT_BUILD_INFO };

function updateState(nextState) {
  state = saveState(nextState);
  render();
}

function saveStateOnly(nextState) {
  state = saveState(nextState);
}

function rollD6() {
  return Math.floor(Math.random() * 6) + 1;
}

function getRollActor(formOrPanel) {
  const form = formOrPanel?.matches?.("[data-roll-form]") ? formOrPanel : formOrPanel?.querySelector?.("[data-roll-form]");
  return form?.dataset.rollActor || "玩家";
}

function saveRollFormulaDraft(nextState, actor, formula) {
  return {
    ...nextState,
    ui: {
      ...(nextState.ui || {}),
      rollFormulaDrafts: {
        ...(nextState.ui?.rollFormulaDrafts || {}),
        [actor || "玩家"]: formula || "",
      },
    },
  };
}

function getFormulaFromButton(button) {
  const panel = button.closest(".dice-panel");
  const input = panel?.querySelector("[data-roll-formula]");
  return { panel, input, actor: getRollActor(panel), formula: input?.value || "" };
}

function applyRollEdge(roll, mode) {
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

function appendRollToken(button, event) {
  event?.preventDefault();
  const { input, actor } = getFormulaFromButton(button);
  if (!input) return;
  input.value = appendFormulaToken(input.value, button.dataset.rollToken);
  saveStateOnly(saveRollFormulaDraft(state, actor, input.value));
  if (document.activeElement === input) input.blur();
}

function toggleRollEdge(button) {
  const selected = button.dataset.rollEdgeMode;
  if (!EDGE_MODES.has(selected)) return;
  const { input, actor, formula } = getFormulaFromButton(button);
  const nextMode = state.ui?.rollEdgeMode === selected ? "" : selected;
  updateState({
    ...state,
    ui: {
      ...(state.ui || {}),
      rollEdgeMode: nextMode,
      rollFormulaDrafts: {
        ...(state.ui?.rollFormulaDrafts || {}),
        [actor]: formula,
      },
    },
  });
  if (input && document.activeElement === input) input.blur();
}

function renderModeButton(mode, label) {
  const active = state.ui.mode === mode;
  return `<button class="mode-button ${active ? "is-active" : ""}" type="button" data-mode="${mode}" aria-pressed="${active}">${label}</button>`;
}

function renderPageButton(page, className) {
  const active = page.id === getActivePageId(state);
  return `<button class="${className} ${active ? "is-active" : ""}" type="button" data-page="${page.id}" aria-pressed="${active}">${page.label}</button>`;
}

function shortCommit(commit) {
  return commit ? String(commit).slice(0, 7) : "unknown";
}

function renderBuildLabel() {
  return `${buildInfo.version} · ${buildInfo.label} · ${shortCommit(buildInfo.commit)}`;
}

async function loadBuildInfo() {
  try {
    const response = await fetch(`./version.json?ts=${Date.now()}`, { cache: "no-store" });
    if (response.ok) buildInfo = { ...DEFAULT_BUILD_INFO, ...(await response.json()) };
  } catch {}
  console.info(`TRPG Assistant v2 build: ${buildInfo.label} / ${shortCommit(buildInfo.commit)}`);
  render();
}

function renderPanel() {
  const pages = getActivePages(state.ui.mode);
  const page = pages.find((item) => item.id === getActivePageId(state)) || pages[0];
  return state.ui.mode === "player" ? renderPlayerPage(page.id, state) : renderDmPage(page.id, state);
}

function renderDmRuneNav(pages) {
  const active = pages.find((page) => page.id === getActivePageId(state)) || pages[0];
  return `
    <div class="dm-rune-nav" data-dm-rune-nav>
      <button class="dm-rune-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}" aria-label="開啟 DM 選單">✦</button>
      <strong class="dm-rune-current">${active.label}</strong>
      <nav class="dm-rune-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 頁面切換">
        ${pages.map((page) => renderPageButton(page, "dm-rune-menu-button")).join("")}
      </nav>
    </div>
  `;
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const player = state.ui.mode === "player";
  app.innerHTML = `<header class="app-header"><div class="brand-block"><p class="eyebrow">TRPG Assistant</p><h1 class="app-title">v2 基礎架構</h1><p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p></div><nav class="mode-switch">${renderModeButton("player", "玩家")}${renderModeButton("dm", "DM")}</nav></header><main class="layout ${player ? "is-player" : "is-dm"}">${player ? `<nav class="tab-list player-bottom-tabs">${pages.map((page) => renderPageButton(page, "tab-button")).join("")}</nav>` : renderDmRuneNav(pages)}<nav class="sidebar-list">${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}</nav>${renderPanel()}</main><p class="footer-note" data-version-label>${renderBuildLabel()}</p>`;
}

app.addEventListener("click", (event) => {
  const mode = event.target.closest("[data-mode]");
  const page = event.target.closest("[data-page]");
  const menu = event.target.closest("[data-dm-menu-toggle]");
  const button = event.target.closest("[data-action]");

  if (menu) {
    event.preventDefault();
    isDmMenuOpen = !isDmMenuOpen;
    render();
    return;
  }
  if (mode) {
    isDmMenuOpen = false;
    updateState(setMode(state, mode.dataset.mode));
    return;
  }
  if (page) {
    isDmMenuOpen = false;
    updateState(setActivePage(state, page.dataset.page));
  }
  if (!button) return;

  const action = button.dataset.action;
  if (action === "toggle-team-status") {
    updateState({ ...state, ui: { ...state.ui, isTeamStatusOpen: !state.ui.isTeamStatusOpen } });
    return;
  }

  if (action === "delete-character") {
    updateState(deleteCharacter(state, button.dataset.characterId));
    return;
  }
  if (action === "expand-character") {
    updateState(expandCharacter(state, button.dataset.characterId));
    return;
  }
  if (action === "adjust-character-stat") {
    updateState(adjustCharacterStat(state, button.dataset.characterId, button.dataset.statField, Number(button.dataset.delta)));
    return;
  }
  if (action === "adjust-character-attribute") {
    updateState(adjustCharacterAttribute(state, button.dataset.characterId, button.dataset.attributeField, Number(button.dataset.delta)));
    return;
  }
  if (action === "adjust-character-money") {
    updateState(adjustCharacterMoney(state, button.dataset.characterId, Number(button.dataset.delta)));
    return;
  }
  if (action === "adjust-character-gold") {
    updateState(adjustCharacterGold(state, button.dataset.characterId, button.dataset.goldField, Number(button.dataset.delta)));
    return;
  }
  if (action === "delete-character-effect") {
    updateState(deleteCharacterEffect(state, button.dataset.characterId, button.dataset.effectType, Number(button.dataset.effectIndex)));
    return;
  }
  if (action === "toggle-character-effect") {
    updateState(toggleCharacterEffect(state, button.dataset.characterId, button.dataset.effectType, button.dataset.effectLabel));
    return;
  }
  if (action === "delete-asset-entry") {
    updateState(deleteAssetEntry(state, button.dataset.characterId, button.dataset.listKey, Number(button.dataset.entryIndex)));
    return;
  }
  if (action === "clear-rolls") {
    updateState(clearRolls(state));
    return;
  }
  if (action === "append-roll-token") {
    appendRollToken(button, event);
    return;
  }
  if (action === "toggle-roll-edge") {
    event.preventDefault();
    toggleRollEdge(button);
    return;
  }
  if (action === "roll-duality") {
    const target = button.closest(".dice-panel")?.querySelector("[data-duality-target]")?.value;
    const applied = applyDualityEffects(state, rollDuality({ target }));
    updateState(addRoll(applied.state, applied.roll, button.dataset.rollActor || "玩家"));
    return;
  }
  if (action === "delete-shop-item") {
    if (confirm("確定要刪除這個商品嗎？")) updateState(deleteShopItem(state, button.dataset.shopItemId));
    return;
  }
  if (action === "purchase-shop-item") {
    updateState(purchaseShopItem(state, button.dataset.shopItemId));
    return;
  }
  if (action === "delete-monster") {
    if (confirm("確定要刪除這隻怪物嗎？")) updateState(deleteMonster(state, button.dataset.monsterId));
    return;
  }
  if (action === "adjust-monster") {
    updateState(adjustMonsterValue(state, button.dataset.monsterId, button.dataset.monsterField, Number(button.dataset.delta)));
    return;
  }
  if (action === "expand-monster") {
    updateState(expandMonster(state, button.dataset.monsterId));
    return;
  }
  if (action === "roll-monster-attack") {
    updateState(rollMonsterAction(state, button.dataset.monsterId, "attack"));
    return;
  }
  if (action === "roll-monster-damage") {
    updateState(rollMonsterAction(state, button.dataset.monsterId, "damage"));
    return;
  }
  if (action === "next-monster-round") {
    updateState(advanceMonsterRound(state));
    return;
  }
  if (action === "reset-monster-round") {
    if (confirm("確定要重設怪物回合？") && confirm("再次確認：回合將回到 0。")) updateState(resetMonsterRound(state));
    return;
  }
  if (action === "reset-v2-state" && confirm("確定要重設 v2 測試資料嗎？") && confirm("再次確認：這會清空目前 v2 localStorage。")) {
    updateState(createDefaultState());
  }
});

app.addEventListener("change", (event) => {
  const selector = event.target.closest("[data-character-select]");
  if (selector) updateState(selectCharacter(state, selector.value));
  const shop = event.target.closest("[data-shop-item-field]");
  if (shop) updateState(updateShopItem(state, shop.dataset.shopItemId, shop.dataset.shopItemField, shop.value));
  const id = event.target.dataset.characterId;
  if (!id) return;
  if (event.target.dataset.characterField) updateState(updateCharacterField(state, id, event.target.dataset.characterField, event.target.value));
  else if (event.target.dataset.statField) updateState(updateCharacterStat(state, id, event.target.dataset.statField, event.target.value));
  else if (event.target.dataset.attributeField) updateState(updateCharacterAttribute(state, id, event.target.dataset.attributeField, event.target.value));
  else if (event.target.dataset.goldField) updateState(updateCharacterGold(state, id, event.target.dataset.goldField, event.target.value));
  else if (event.target.matches("[data-money-field]")) updateState(updateCharacterMoney(state, id, event.target.value));
});

app.addEventListener("input", (event) => {
  const rollInput = event.target.closest?.("[data-roll-formula]");
  if (rollInput) {
    const actor = getRollActor(rollInput.closest("[data-roll-form]"));
    return saveStateOnly(saveRollFormulaDraft(state, actor, rollInput.value));
  }

  const id = event.target.dataset.characterId;
  if (id) {
    if (event.target.dataset.characterField) return saveStateOnly(updateCharacterField(state, id, event.target.dataset.characterField, event.target.value));
    if (event.target.dataset.statField) return saveStateOnly(updateCharacterStat(state, id, event.target.dataset.statField, event.target.value));
    if (event.target.dataset.attributeField) return saveStateOnly(updateCharacterAttribute(state, id, event.target.dataset.attributeField, event.target.value));
    if (event.target.dataset.goldField) return saveStateOnly(updateCharacterGold(state, id, event.target.dataset.goldField, event.target.value));
    if (event.target.matches("[data-money-field]")) return saveStateOnly(updateCharacterMoney(state, id, event.target.value));
  }
  const asset = event.target.closest("[data-asset-entry-field]");
  if (asset) return saveStateOnly(updateAssetEntry(state, asset.dataset.characterId, asset.dataset.listKey, Number(asset.dataset.entryIndex), asset.value));
  const publicField = event.target.dataset.publicInfoField;
  if (publicField) return saveStateOnly(updatePublicInfoField(state, publicField, event.target.value));
  const shop = event.target.closest("[data-shop-item-field]");
  if (shop) return saveStateOnly(updateShopItem(state, shop.dataset.shopItemId, shop.dataset.shopItemField, shop.value));
  const monster = event.target.closest("[data-monster-field]");
  if (monster) saveStateOnly(updateMonster(state, monster.dataset.monsterId, monster.dataset.monsterField, monster.value));
});

app.addEventListener("submit", (event) => {
  const form = event.target;
  if (form.matches("[data-add-character-form]")) {
    event.preventDefault();
    updateState(addCharacter(state, form.querySelector("[data-new-character-name]").value.trim(), form.querySelector("[data-new-character-color]")?.value));
    return;
  }
  if (form.matches("[data-add-character-effect-form]")) {
    event.preventDefault();
    updateState(addCharacterEffect(state, form.dataset.characterId, form.dataset.effectType, form.querySelector("[data-character-effect-input]").value));
    return;
  }
  if (form.matches("[data-add-asset-form]")) {
    event.preventDefault();
    updateState(addAssetEntry(state, form.dataset.characterId, form.dataset.listKey, form.querySelector("[data-asset-entry-input]").value));
    return;
  }
  if (form.matches("[data-add-shop-item-form]")) {
    event.preventDefault();
    updateState(
      addShopItem(state, {
        name: form.querySelector("[data-new-shop-name]").value.trim(),
        type: form.querySelector("[data-new-shop-type]").value,
        price: form.querySelector("[data-new-shop-price]").value,
        stock: form.querySelector("[data-new-shop-stock]").value,
        description: form.querySelector("[data-new-shop-description]").value,
      }),
    );
    return;
  }
  if (form.matches("[data-add-monster-form]")) {
    event.preventDefault();
    const values = Object.fromEntries([...form.querySelectorAll("[data-new-monster-field]")].map((input) => [input.dataset.newMonsterField, input.value]));
    updateState(addMonster(state, values));
    return;
  }
  if (form.matches("[data-roll-form]")) {
    event.preventDefault();
    const input = form.querySelector("[data-roll-formula]");
    const actor = getRollActor(form);
    const formula = input.value;
    const stateWithDraft = saveRollFormulaDraft(state, actor, formula);
    const result = rollFormula(formula);
    const message = form.parentElement.querySelector("[data-roll-message]");
    if (!result.ok) {
      saveStateOnly(stateWithDraft);
      if (message) message.textContent = result.error;
      return;
    }
    if (message) message.textContent = "";
    const edgeMode = form.dataset.rollEdgeEnabled === "true" && EDGE_MODES.has(stateWithDraft.ui?.rollEdgeMode) ? stateWithDraft.ui.rollEdgeMode : "";
    const roll = edgeMode ? applyRollEdge(result, edgeMode) : result;
    const nextState = edgeMode ? { ...stateWithDraft, ui: { ...(stateWithDraft.ui || {}), rollEdgeMode: "" } } : stateWithDraft;
    updateState(addRoll(nextState, roll, actor));
  }
});

app.addEventListener(
  "wheel",
  (event) => {
    const stepper = event.target.closest("[data-number-stepper]");
    if (!stepper) return;
    event.preventDefault();
    const delta = event.deltaY < 0 ? 1 : -1;
    const { characterId, stepperType, stepperField } = stepper.dataset;
    if (stepperType === "stat") updateState(adjustCharacterStat(state, characterId, stepperField, delta));
    else if (stepperType === "attribute") updateState(adjustCharacterAttribute(state, characterId, stepperField, delta));
    else if (stepperType === "money") updateState(adjustCharacterMoney(state, characterId, delta));
    else if (stepperType === "gold") updateState(adjustCharacterGold(state, characterId, stepperField, delta));
  },
  { passive: false },
);

render();
loadBuildInfo();
