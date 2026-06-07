import { loadState, saveState, resetState } from "./modules/storage.js";
import { setMode, getActivePages, getActivePageId, setActivePage } from "./modules/router.js";
import { renderPlayerView } from "./modules/player-view.js";
import { renderDmView } from "./modules/dm-view.js";
import { addCharacter, deleteCharacter, selectCharacter, updateCharacter, addAssetEntry, updateAssetEntry, deleteAssetEntry, adjustCharacterStat, toggleCharacterStatus, setCharacterGoldUnit } from "./modules/characters.js";
import { addShopItem, updateShopItem, deleteShopItem, purchaseShopItem } from "./modules/shop.js";
import { rollFormula, rollDuality, clearRolls, appendFormulaToken, setFormulaDraft, setRollEdgeMode, setCriticalDamagePending } from "./modules/dice.js";
import { updatePublicInfo } from "./modules/public-info.js";
import { addMonster, updateMonster, deleteMonster, adjustMonsterValue, rollMonsterAction, advanceMonsterRound, resetMonsterRound, saveCurrentEncounter, loadEncounterTemplate, deleteEncounterTemplate } from "./modules/monsters.js";
import { VERSION_LABEL, logBuildInfo, renderBuildLabel } from "./modules/version.js";

const app = document.querySelector("#app");
const loadedState = loadState();
let state = saveState({
  ...loadedState,
  ui: {
    ...(loadedState.ui || {}),
    mode: "player"
  }
});
let isDmMenuOpen = false;
logBuildInfo();

function updateState(nextState) {
  state = saveState(nextState);
  render();
}

function renderModeButton(mode, label) {
  const active = state.ui.mode === mode;
  return `<button class="mode-button ${active ? "is-active" : ""}" type="button" data-mode="${mode}">${label}</button>`;
}

function renderPageButton(page, className = "tab-button") {
  const active = getActivePageId(state) === page.id;
  return `<button class="${className} ${active ? "is-active" : ""}" type="button" data-page="${page.id}">${page.label}</button>`;
}

function renderPlayerDmEntry() {
  return `<button class="player-dm-rune-entry" type="button" data-mode="dm" aria-label="進入 DM 介面" title="">ᚱ</button>`;
}

function renderDmRuneNav(pages) {
  const active = pages.find((page) => page.id === getActivePageId(state)) || pages[0];
  return `
    <div class="dm-rune-nav" data-dm-rune-nav>
      <button class="dm-rune-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}" aria-label="開啟 DM 選單">✦</button>
      <strong class="dm-rune-current">${active.label}</strong>
      <nav class="dm-rune-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 頁面切換">
        <button class="dm-rune-adventurer-button" type="button" data-mode="player" aria-label="返回玩家介面">🧭 冒險者</button>
        ${pages.map((page) => renderPageButton(page, "dm-rune-menu-button")).join("")}
      </nav>
    </div>
  `;
}

function renderPanel() {
  return state.ui.mode === "dm" ? renderDmView(state) : renderPlayerView(state);
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const player = state.ui.mode === "player";
  const primaryNavigation = player
    ? `${renderPlayerDmEntry()}<nav class="tab-list player-bottom-tabs">${pages.map((page) => renderPageButton(page, "tab-button")).join("")}</nav>`
    : renderDmRuneNav(pages);

  app.innerHTML = `
    <header class="app-header">
      <div class="brand-block">
        <p class="eyebrow">TRPG Assistant</p>
        <h1 class="app-title">v2 基礎架構</h1>
        <p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p>
      </div>
    </header>
    <main class="layout ${player ? "is-player" : "is-dm"}">
      ${primaryNavigation}
      <nav class="sidebar-list">${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}</nav>
      ${renderPanel()}
    </main>
    <p class="footer-note" data-version-label>${renderBuildLabel()}</p>
  `;
}

app.addEventListener("input", (event) => {
  const target = event.target;
  if (target.matches("[data-field]")) {
    const { characterId, field, scope, assetType, assetId, itemId, monsterId, publicField, encounterDraft } = target.dataset;
    const value = target.type === "number" ? Number(target.value) : target.value;

    if (characterId && scope === "stats") updateState(updateCharacter(state, characterId, { stats: { [field]: value } }));
    if (characterId && scope === "attributes") updateState(updateCharacter(state, characterId, { attributes: { [field]: value } }));
    if (characterId && scope === "assets") updateState(updateCharacter(state, characterId, { assets: { [field]: value } }));
    if (characterId && scope === "base") updateState(updateCharacter(state, characterId, { [field]: value }));
    if (characterId && assetType && assetId) updateState(updateAssetEntry(state, characterId, assetType, assetId, value));
    if (itemId) updateState(updateShopItem(state, itemId, { [field]: value }));
    if (monsterId) updateState(updateMonster(state, monsterId, { [field]: value }));
    if (publicField) updateState(updatePublicInfo(state, { [publicField]: value }));
    if (encounterDraft) {
      updateState({
        ...state,
        ui: {
          ...state.ui,
          encounterDraftName: value
        }
      });
    }
  }

  if (target.matches("[data-roll-formula]")) {
    const actor = target.dataset.rollFormula;
    updateState(setFormulaDraft(state, actor, target.value));
  }
});

app.addEventListener("change", (event) => {
  const target = event.target;
  if (target.matches("[data-select-character]")) updateState(selectCharacter(state, target.value));
  if (target.matches("[data-add-character-color]")) return;
  if (target.matches("[data-color-field]")) {
    updateState(updateCharacter(state, target.dataset.colorField, { color: target.value }));
  }
  if (target.matches("[data-gold-unit]")) {
    const { characterId, unit } = target.dataset;
    updateState(setCharacterGoldUnit(state, characterId, unit, target.value));
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const action = form.dataset.form;

  if (action === "add-character") {
    const name = new FormData(form).get("name");
    const color = new FormData(form).get("color");
    updateState(addCharacter(state, String(name || "").trim(), String(color || "auto")));
    form.reset();
    return;
  }

  if (action === "add-asset") {
    const data = new FormData(form);
    updateState(addAssetEntry(state, data.get("characterId"), data.get("type"), data.get("name")));
    form.reset();
    return;
  }

  if (action === "add-shop-item") {
    const data = new FormData(form);
    updateState(addShopItem(state, {
      name: data.get("name"),
      type: data.get("type"),
      price: data.get("price"),
      stock: data.get("stock"),
      description: data.get("description")
    }));
    form.reset();
    return;
  }

  if (action === "roll-formula") {
    const data = new FormData(form);
    const actor = data.get("actor");
    const formula = data.get("formula");
    const result = rollFormula(formula, {
      actor,
      criticalDamagePending: actor === "玩家" ? state.ui.criticalDamagePending : false,
      edgeMode: actor === "玩家" ? state.ui.rollEdgeMode : null
    });

    if (!result.ok) {
      updateState({ ...state, ui: { ...state.ui, lastRollError: result.error }, rolls: state.rolls });
      return;
    }

    updateState({
      ...setCriticalDamagePending(setFormulaDraft(state, actor, formula), false),
      rolls: [result.roll, ...state.rolls].slice(0, 80),
      ui: {
        ...state.ui,
        rollFormulaDrafts: {
          ...(state.ui.rollFormulaDrafts || {}),
          [actor]: formula
        },
        rollEdgeMode: null,
        criticalDamagePending: false,
        lastRollError: ""
      }
    });
    return;
  }

  if (action === "add-monster") {
    const data = new FormData(form);
    updateState(addMonster(state, {
      name: data.get("name"),
      hp: data.get("hp"),
      maxHp: data.get("maxHp"),
      stress: data.get("stress"),
      maxStress: data.get("maxStress"),
      difficulty: data.get("difficulty"),
      attack: data.get("attack"),
      damage: data.get("damage"),
      tag: data.get("tag"),
      notes: data.get("notes")
    }));
    return;
  }
});

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
    event.preventDefault();
    isDmMenuOpen = false;
    updateState(setMode(state, mode.dataset.mode));
    return;
  }

  if (page) {
    event.preventDefault();
    isDmMenuOpen = false;
    updateState(setActivePage(state, page.dataset.page));
    return;
  }

  if (!button) return;
  event.preventDefault();
  const action = button.dataset.action;

  if (action === "select-character") updateState(selectCharacter(state, button.dataset.characterId));
  if (action === "delete-character") updateState(deleteCharacter(state, button.dataset.characterId));
  if (action === "toggle-character-editor") {
    const current = state.ui.expandedCharacterId;
    updateState({ ...state, ui: { ...state.ui, expandedCharacterId: current === button.dataset.characterId ? null : button.dataset.characterId } });
  }
  if (action === "adjust-character-stat") {
    updateState(adjustCharacterStat(state, button.dataset.characterId, button.dataset.stat, Number(button.dataset.delta)));
  }
  if (action === "toggle-status") {
    updateState(toggleCharacterStatus(state, button.dataset.characterId, button.dataset.statusType, button.dataset.statusName));
  }
  if (action === "toggle-team-status") {
    updateState({ ...state, ui: { ...state.ui, teamStatusOpen: !state.ui.teamStatusOpen } });
  }
  if (action === "delete-asset") updateState(deleteAssetEntry(state, button.dataset.characterId, button.dataset.assetType, button.dataset.assetId));
  if (action === "buy-item") {
    updateState(purchaseShopItem(state, button.dataset.itemId));
  }
  if (action === "delete-shop-item") {
    if (confirm("確定刪除這個商品？")) updateState(deleteShopItem(state, button.dataset.itemId));
  }
  if (action === "clear-rolls") updateState(clearRolls(state));
  if (action === "roll-duality") {
    const result = rollDuality(state, button.dataset.actor || "玩家");
    updateState(result.state);
  }
  if (action === "append-roll-token") {
    const actor = button.dataset.actor;
    const input = app.querySelector(`[data-roll-formula="${actor}"]`);
    const currentFormula = input?.value || state.ui.rollFormulaDrafts?.[actor] || "";
    const nextFormula = appendFormulaToken(currentFormula, button.dataset.token);
    if (document.activeElement && document.activeElement !== document.body && button.contains(document.activeElement) === false) {
      document.activeElement.blur?.();
    }
    updateState(setFormulaDraft(state, actor, nextFormula));
  }
  if (action === "set-roll-edge") {
    const actor = button.dataset.actor;
    const input = app.querySelector(`[data-roll-formula="${actor}"]`);
    const currentFormula = input?.value || state.ui.rollFormulaDrafts?.[actor] || "";
    const nextState = setFormulaDraft(state, actor, currentFormula);
    updateState(setRollEdgeMode(nextState, button.dataset.edge));
  }
  if (action === "reset-v2") {
    if (confirm("確定重設 v2 測試資料？此動作會清除目前 v2 localStorage。")) {
      state = saveState(resetState());
      render();
    }
  }
  if (action === "adjust-monster") updateState(adjustMonsterValue(state, button.dataset.monsterId, button.dataset.field, Number(button.dataset.delta)));
  if (action === "roll-monster") updateState(rollMonsterAction(state, button.dataset.monsterId, button.dataset.kind));
  if (action === "advance-round") updateState(advanceMonsterRound(state));
  if (action === "reset-round") {
    if (confirm("確定重設回合？")) updateState(resetMonsterRound(state));
  }
  if (action === "toggle-monster-editor") {
    const current = state.ui.expandedMonsterId;
    updateState({ ...state, ui: { ...state.ui, expandedMonsterId: current === button.dataset.monsterId ? null : button.dataset.monsterId } });
  }
  if (action === "delete-monster") {
    if (confirm("確定刪除這隻怪物？")) updateState(deleteMonster(state, button.dataset.monsterId));
  }
  if (action === "save-encounter") {
    const name = state.ui.encounterDraftName || "";
    updateState(saveCurrentEncounter(state, name));
  }
  if (action === "load-encounter") {
    if (confirm("載入此遭遇並清空目前怪物？")) updateState(loadEncounterTemplate(state, button.dataset.encounterId, "replace"));
  }
  if (action === "append-encounter") updateState(loadEncounterTemplate(state, button.dataset.encounterId, "append"));
  if (action === "delete-encounter") {
    if (confirm("確定刪除此遭遇模板？")) updateState(deleteEncounterTemplate(state, button.dataset.encounterId));
  }
});

window.addEventListener("beforeunload", () => saveState(state));

render();
