import { loadState, saveState, STORAGE_KEY } from "./modules/storage.js";
import {
  addAssetEntry,
  addCharacterEffect,
  addCharacter,
  adjustCharacterAttribute,
  adjustCharacterMoney,
  adjustCharacterStat,
  deleteAssetEntry,
  deleteCharacter,
  deleteCharacterEffect,
  expandCharacter,
  selectCharacter,
  updateAssetEntry,
  updateCharacterAttribute,
  updateCharacterField,
  updateCharacterMoney,
  updateCharacterStat,
} from "./modules/characters.js";
import { addRoll, clearRolls, rollDuality, rollFormula } from "./modules/dice.js";
import { addMonster, adjustMonsterValue, deleteMonster, updateMonster } from "./modules/monsters.js";
import { updatePublicInfoField } from "./modules/public-info.js";
import { addShopItem, deleteShopItem, purchaseShopItem, updateShopItem } from "./modules/shop.js";
import { createDefaultState } from "./modules/state.js";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js";
import { renderDmPage } from "./modules/dm-view.js";
import { renderPlayerPage } from "./modules/player-view.js";

const app = document.querySelector("#app");
let state = saveState(loadState());
let isDmMenuOpen = false;

function updateState(nextState) {
  state = saveState(nextState);
  render();
}

function saveStateOnly(nextState) {
  state = saveState(nextState);
}

function renderModeButton(mode, label) {
  const isActive = state.ui.mode === mode;
  return `<button class="mode-button ${isActive ? "is-active" : ""}" type="button" data-mode="${mode}" aria-pressed="${isActive}">${label}</button>`;
}

function renderPageButton(page, className) {
  const activePageId = getActivePageId(state);
  const isActive = page.id === activePageId;
  return `<button class="${className} ${isActive ? "is-active" : ""}" type="button" data-page="${page.id}" aria-pressed="${isActive}">${page.label}</button>`;
}

function renderPanel() {
  const pages = getActivePages(state.ui.mode);
  const activePageId = getActivePageId(state);
  const page = pages.find((item) => item.id === activePageId) || pages[0];
  const modeLabel = state.ui.mode === "dm" ? "DM 端" : "玩家端";

  if (state.ui.mode === "player") {
    return renderPlayerPage(page.id, state);
  }

  return renderDmPage(page.id, state);
}

function renderDmMobileNav(pages) {
  const activePage = pages.find((page) => page.id === getActivePageId(state)) || pages[0];

  return `
    <div class="dm-mobile-nav">
      <button class="dm-menu-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}" aria-controls="dm-mobile-menu">
        <span aria-hidden="true">☰</span>
        <span>DM 選單</span>
      </button>
      <strong>${activePage.label}</strong>
    </div>
    <nav id="dm-mobile-menu" class="dm-mobile-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 手機選單">
      ${pages.map((page) => renderPageButton(page, "dm-mobile-menu-button")).join("")}
    </nav>
  `;
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const layoutClass = state.ui.mode === "dm" ? "layout is-dm" : "layout is-player";
  const isPlayerMode = state.ui.mode === "player";

  app.innerHTML = `
    <header class="app-header">
      <div class="brand-block">
        <p class="eyebrow">TRPG Assistant</p>
        <h1 class="app-title">v2 基礎架構</h1>
        <p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p>
      </div>
      <nav class="mode-switch" aria-label="模式切換">
        ${renderModeButton("player", "玩家")}
        ${renderModeButton("dm", "DM")}
      </nav>
    </header>

    <main class="${layoutClass}">
      ${
        isPlayerMode
          ? `<nav class="tab-list player-bottom-tabs" aria-label="玩家分頁">
              ${pages.map((page) => renderPageButton(page, "tab-button")).join("")}
            </nav>`
          : renderDmMobileNav(pages)
      }
      <nav class="sidebar-list" aria-label="DM 側邊欄">
        ${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}
      </nav>
      ${renderPanel()}
    </main>

    <p class="footer-note">TRPG Assistant v2 stage 5</p>
  `;
}

app.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  const pageButton = event.target.closest("[data-page]");
  const dmMenuButton = event.target.closest("[data-dm-menu-toggle]");
  const actionButton = event.target.closest("[data-action]");

  if (dmMenuButton) {
    isDmMenuOpen = !isDmMenuOpen;
    render();
    return;
  }

  if (modeButton) {
    isDmMenuOpen = false;
    updateState(setMode(state, modeButton.dataset.mode));
    return;
  }

  if (pageButton) {
    isDmMenuOpen = false;
    updateState(setActivePage(state, pageButton.dataset.page));
  }

  if (!actionButton) return;

  if (actionButton.dataset.action === "delete-character") {
    updateState(deleteCharacter(state, actionButton.dataset.characterId));
    return;
  }

  if (actionButton.dataset.action === "expand-character") {
    updateState(expandCharacter(state, actionButton.dataset.characterId));
    return;
  }

  if (actionButton.dataset.action === "adjust-character-stat") {
    updateState(
      adjustCharacterStat(
        state,
        actionButton.dataset.characterId,
        actionButton.dataset.statField,
        Number(actionButton.dataset.delta),
      ),
    );
    return;
  }

  if (actionButton.dataset.action === "adjust-character-attribute") {
    updateState(
      adjustCharacterAttribute(
        state,
        actionButton.dataset.characterId,
        actionButton.dataset.attributeField,
        Number(actionButton.dataset.delta),
      ),
    );
    return;
  }

  if (actionButton.dataset.action === "adjust-character-money") {
    updateState(
      adjustCharacterMoney(state, actionButton.dataset.characterId, Number(actionButton.dataset.delta)),
    );
    return;
  }

  if (actionButton.dataset.action === "delete-character-effect") {
    updateState(
      deleteCharacterEffect(
        state,
        actionButton.dataset.characterId,
        actionButton.dataset.effectType,
        Number(actionButton.dataset.effectIndex),
      ),
    );
    return;
  }

  if (actionButton.dataset.action === "delete-asset-entry") {
    updateState(
      deleteAssetEntry(
        state,
        actionButton.dataset.characterId,
        actionButton.dataset.listKey,
        Number(actionButton.dataset.entryIndex),
      ),
    );
    return;
  }

  if (actionButton.dataset.action === "clear-rolls") {
    updateState(clearRolls(state));
    return;
  }

  if (actionButton.dataset.action === "roll-duality") {
    updateState(addRoll(state, rollDuality(), actionButton.dataset.rollActor || "玩家"));
    return;
  }

  if (actionButton.dataset.action === "delete-shop-item") {
    if (window.confirm("確定要刪除這個商品嗎？")) {
      updateState(deleteShopItem(state, actionButton.dataset.shopItemId));
    }
    return;
  }

  if (actionButton.dataset.action === "purchase-shop-item") {
    updateState(purchaseShopItem(state, actionButton.dataset.shopItemId));
    return;
  }

  if (actionButton.dataset.action === "delete-monster") {
    if (window.confirm("確定要刪除這隻怪物嗎？")) {
      updateState(deleteMonster(state, actionButton.dataset.monsterId));
    }
    return;
  }

  if (actionButton.dataset.action === "adjust-monster") {
    updateState(
      adjustMonsterValue(
        state,
        actionButton.dataset.monsterId,
        actionButton.dataset.monsterField,
        Number(actionButton.dataset.delta),
      ),
    );
    return;
  }

  if (actionButton.dataset.action === "reset-v2-state") {
    if (window.confirm("確定要重設 v2 測試資料嗎？") && window.confirm("再次確認：這會清空目前 v2 localStorage。")) {
      updateState(createDefaultState());
    }
  }
});

app.addEventListener("change", (event) => {
  const characterSelect = event.target.closest("[data-character-select]");

  if (characterSelect) {
    updateState(selectCharacter(state, characterSelect.value));
  }

  const shopItemField = event.target.closest("[data-shop-item-field]");

  if (shopItemField) {
    updateState(
      updateShopItem(
        state,
        shopItemField.dataset.shopItemId,
        shopItemField.dataset.shopItemField,
        shopItemField.value,
      ),
    );
  }

  const characterId = event.target.dataset.characterId;
  if (!characterId) return;

  if (event.target.dataset.statField) {
    updateState(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
    return;
  }

  if (event.target.dataset.attributeField) {
    updateState(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
    return;
  }

  if (event.target.matches("[data-money-field]")) {
    updateState(updateCharacterMoney(state, characterId, event.target.value));
  }
});

app.addEventListener("input", (event) => {
  const characterId = event.target.dataset.characterId;
  if (!characterId) return;

  if (event.target.dataset.characterField) {
    saveStateOnly(updateCharacterField(state, characterId, event.target.dataset.characterField, event.target.value));
    return;
  }

  if (event.target.dataset.statField) {
    saveStateOnly(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
    return;
  }

  if (event.target.dataset.attributeField) {
    saveStateOnly(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
    return;
  }

  if (event.target.matches("[data-money-field]")) {
    saveStateOnly(updateCharacterMoney(state, characterId, event.target.value));
  }
});

app.addEventListener("input", (event) => {
  const assetEntryField = event.target.closest("[data-asset-entry-field]");
  if (!assetEntryField) return;

  saveStateOnly(
    updateAssetEntry(
      state,
      assetEntryField.dataset.characterId,
      assetEntryField.dataset.listKey,
      Number(assetEntryField.dataset.entryIndex),
      assetEntryField.value,
    ),
  );
});

app.addEventListener("input", (event) => {
  const publicInfoField = event.target.dataset.publicInfoField;
  if (!publicInfoField) return;

  saveStateOnly(updatePublicInfoField(state, publicInfoField, event.target.value));
});

app.addEventListener("input", (event) => {
  const shopItemField = event.target.closest("[data-shop-item-field]");
  if (!shopItemField) return;

  saveStateOnly(
    updateShopItem(
      state,
      shopItemField.dataset.shopItemId,
      shopItemField.dataset.shopItemField,
      shopItemField.value,
    ),
  );
});

app.addEventListener("input", (event) => {
  const monsterField = event.target.closest("[data-monster-field]");
  if (!monsterField) return;

  saveStateOnly(
    updateMonster(
      state,
      monsterField.dataset.monsterId,
      monsterField.dataset.monsterField,
      monsterField.value,
    ),
  );
});

app.addEventListener("submit", (event) => {
  const addCharacterForm = event.target.closest("[data-add-character-form]");
  const addCharacterEffectForm = event.target.closest("[data-add-character-effect-form]");
  const addAssetForm = event.target.closest("[data-add-asset-form]");
  const addShopItemForm = event.target.closest("[data-add-shop-item-form]");
  const addMonsterForm = event.target.closest("[data-add-monster-form]");

  if (addCharacterForm) {
    event.preventDefault();
    const input = addCharacterForm.querySelector("[data-new-character-name]");
    updateState(addCharacter(state, input.value.trim()));
    return;
  }

  if (addCharacterEffectForm) {
    event.preventDefault();
    const input = addCharacterEffectForm.querySelector("[data-character-effect-input]");
    updateState(
      addCharacterEffect(
        state,
        addCharacterEffectForm.dataset.characterId,
        addCharacterEffectForm.dataset.effectType,
        input.value,
      ),
    );
    return;
  }

  if (addAssetForm) {
    event.preventDefault();
    const input = addAssetForm.querySelector("[data-asset-entry-input]");
    updateState(addAssetEntry(state, addAssetForm.dataset.characterId, addAssetForm.dataset.listKey, input.value));
    return;
  }

  if (addShopItemForm) {
    event.preventDefault();
    updateState(
      addShopItem(state, {
        name: addShopItemForm.querySelector("[data-new-shop-name]").value.trim(),
        type: addShopItemForm.querySelector("[data-new-shop-type]").value,
        price: addShopItemForm.querySelector("[data-new-shop-price]").value,
        stock: addShopItemForm.querySelector("[data-new-shop-stock]").value,
        description: addShopItemForm.querySelector("[data-new-shop-description]").value,
      }),
    );
    return;
  }

  if (addMonsterForm) {
    event.preventDefault();
    const values = Object.fromEntries(
      Array.from(addMonsterForm.querySelectorAll("[data-new-monster-field]")).map((input) => [
        input.dataset.newMonsterField,
        input.value,
      ]),
    );
    updateState(addMonster(state, values));
    return;
  }

  const rollForm = event.target.closest("[data-roll-form]");
  if (rollForm) {
    event.preventDefault();
    const input = rollForm.querySelector("[data-roll-formula]");
    const message = rollForm.parentElement.querySelector("[data-roll-message]");
    const result = rollFormula(input.value);

    if (!result.ok) {
      if (message) message.textContent = result.error;
      return;
    }

    if (message) message.textContent = "";
    updateState(addRoll(state, result, rollForm.dataset.rollActor || "玩家"));
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

    if (stepperType === "stat") {
      updateState(adjustCharacterStat(state, characterId, stepperField, delta));
      return;
    }

    if (stepperType === "attribute") {
      updateState(adjustCharacterAttribute(state, characterId, stepperField, delta));
      return;
    }

    if (stepperType === "money") {
      updateState(adjustCharacterMoney(state, characterId, delta));
    }
  },
  { passive: false },
);

render();
