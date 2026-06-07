import { createDefaultState } from "./modules/state.js";
import { loadState, saveState } from "./modules/storage.js";
import { setMode, getActivePages, getActivePageId, setActivePage } from "./modules/router.js";
import { renderPlayerView } from "./modules/player-view.js";
import { renderDmView } from "./modules/dm-view.js";
import { addCharacter, deleteCharacter, selectCharacter, updateCharacter, addAssetEntry, updateAssetEntry, deleteAssetEntry, adjustCharacterStat, toggleCharacterStatus, setCharacterGoldUnit } from "./modules/characters.js";
import { addShopItem, updateShopItem, deleteShopItem, purchaseShopItem } from "./modules/shop.js";
import { rollFormula, rollDuality, addRoll, clearRolls, appendFormulaToken } from "./modules/dice.js";
import { updatePublicInfo } from "./modules/public-info.js";
import { addMonster, updateMonster, deleteMonster, adjustMonsterValue, rollMonsterAction, advanceMonsterRound, resetMonsterRound, saveCurrentEncounter, loadEncounterTemplate, deleteEncounterTemplate } from "./modules/monsters.js";
import { logBuildInfo, renderBuildLabel } from "./modules/version.js";

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

function setFormulaDraftLocal(sourceState, actor, formula) {
  return {
    ...sourceState,
    ui: {
      ...(sourceState.ui || {}),
      rollFormulaDrafts: {
        ...(sourceState.ui?.rollFormulaDrafts || {}),
        [actor || "玩家"]: formula || ""
      }
    }
  };
}

function setRollEdgeModeLocal(sourceState, edgeMode) {
  const current = sourceState.ui?.rollEdgeMode || "";
  const nextMode = current === edgeMode ? "" : edgeMode;
  return {
    ...sourceState,
    ui: {
      ...(sourceState.ui || {}),
      rollEdgeMode: nextMode
    }
  };
}

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
    if (monsterId) updateState(updateMonster(state, monsterId, field, value));
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
    const actor = target.closest("[data-roll-form]")?.dataset.rollActor || target.dataset.rollFormula || "玩家";
    updateState(setFormulaDraftLocal(state, actor, target.value));
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
  if (target.matches("[data-monster-field]")) {
    updateState(updateMonster(state, target.dataset.monsterId, target.dataset.monsterField, target.value));
  }
  if (target.matches("[data-new-monster-field]")) {
    updateState({
      ...state,
      ui: {
        ...state.ui,
        monsterFormDraft: {
          ...(state.ui?.monsterFormDraft || {}),
          [target.dataset.newMonsterField]: target.value
        }
      }
    });
  }
});

app.addEventListener("submit", (event) => {
  event.preventDefault();
  const form = event.target;
  const action = form.dataset.form;

  if (action === "add-character") {
    const data = new FormData(form);
    updateState(addCharacter(state, String(data.get("name") || "").trim(), String(data.get("color") || "auto")));
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

  if (action === "roll-formula" || form.matches("[data-roll-form]")) {
    const data = new FormData(form);
    const actor = form.dataset.rollActor || data.get("actor") || "玩家";
    const formula = data.get("formula") || form.querySelector("[data-roll-formula]")?.value || "";
    const result = rollFormula(formula);
    const stateWithDraft = setFormulaDraftLocal(state, actor, formula);

    if (!result.ok) {
      updateState({ ...stateWithDraft, ui: { ...stateWithDraft.ui, lastRollError: result.error } });
      return;
    }

    const nextState = addRoll(stateWithDraft, result, actor);
    updateState({
      ...nextState,
      ui: {
        ...nextState.ui,
        rollFormulaDrafts: {
          ...(nextState.ui.rollFormulaDrafts || {}),
          [actor]: formula
        },
        lastRollError: ""
      }
    });
    return;
  }

  if (action === "add-monster" || form.matches("[data-add-monster-form]")) {
    const data = new FormData(form);
    updateState(addMonster(state, {
      name: data.get("name") || form.querySelector('[data-new-monster-field="name"]')?.value,
      hp: data.get("hp") || form.querySelector('[data-new-monster-field="hp"]')?.value,
      maxHp: data.get("maxHp") || form.querySelector('[data-new-monster-field="maxHp"]')?.value,
      stress: data.get("stress") || form.querySelector('[data-new-monster-field="stress"]')?.value,
      maxStress: data.get("maxStress") || form.querySelector('[data-new-monster-field="maxStress"]')?.value,
      difficulty: data.get("difficulty") || form.querySelector('[data-new-monster-field="difficulty"]')?.value,
      attack: data.get("attack") || form.querySelector('[data-new-monster-field="attack"]')?.value,
      damage: data.get("damage") || form.querySelector('[data-new-monster-field="damage"]')?.value,
      tag: data.get("tag") || form.querySelector('[data-new-monster-field="tag"]')?.value,
      notes: data.get("notes") || form.querySelector('[data-new-monster-field="notes"]')?.value
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
  if (action === "buy-item") updateState(purchaseShopItem(state, button.dataset.itemId));
  if (action === "delete-shop-item") {
    if (confirm("確定刪除這個商品？")) updateState(deleteShopItem(state, button.dataset.itemId));
  }
  if (action === "clear-rolls") updateState(clearRolls(state));
  if (action === "roll-duality") {
    const actor = button.dataset.rollActor || button.dataset.actor || "玩家";
    const roll = rollDuality();
    updateState(addRoll(state, roll, actor));
  }
  if (action === "append-roll-token") {
    const actor = button.dataset.actor || button.closest(".dice-panel")?.querySelector("[data-roll-form]")?.dataset.rollActor || "玩家";
    const input = app.querySelector(`[data-roll-form][data-roll-actor="${actor}"] [data-roll-formula]`) || button.closest(".dice-panel")?.querySelector("[data-roll-formula]");
    const currentFormula = input?.value || state.ui.rollFormulaDrafts?.[actor] || "";
    const nextFormula = appendFormulaToken(currentFormula, button.dataset.rollToken || button.dataset.token || "");
    if (document.activeElement && document.activeElement !== document.body && button.contains(document.activeElement) === false) {
      document.activeElement.blur?.();
    }
    updateState(setFormulaDraftLocal(state, actor, nextFormula));
  }
  if (action === "set-roll-edge" || action === "toggle-roll-edge") {
    const actor = button.dataset.actor || button.closest(".dice-panel")?.querySelector("[data-roll-form]")?.dataset.rollActor || "玩家";
    const input = button.closest(".dice-panel")?.querySelector("[data-roll-formula]");
    const currentFormula = input?.value || state.ui.rollFormulaDrafts?.[actor] || "";
    const nextState = setFormulaDraftLocal(state, actor, currentFormula);
    updateState(setRollEdgeModeLocal(nextState, button.dataset.edge || button.dataset.rollEdgeMode));
  }
  if (action === "reset-v2") {
    if (confirm("確定重設 v2 測試資料？此動作會清除目前 v2 localStorage。")) {
      state = saveState(createDefaultState());
      render();
    }
  }
  if (action === "adjust-monster") updateState(adjustMonsterValue(state, button.dataset.monsterId, button.dataset.monsterField || button.dataset.field, Number(button.dataset.delta)));
  if (action === "roll-monster" || action === "roll-monster-attack" || action === "roll-monster-damage") {
    const kind = button.dataset.kind || (action === "roll-monster-damage" ? "damage" : "attack");
    updateState(rollMonsterAction(state, button.dataset.monsterId, kind));
  }
  if (action === "advance-round" || action === "next-monster-round") updateState(advanceMonsterRound(state));
  if (action === "reset-round" || action === "reset-monster-round") {
    if (confirm("確定重設回合？")) updateState(resetMonsterRound(state));
  }
  if (action === "toggle-monster-editor" || action === "expand-monster") {
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
  if (action === "load-encounter" || action === "load-encounter-replace") {
    if (confirm("載入此遭遇並清空目前怪物？")) updateState(loadEncounterTemplate(state, button.dataset.encounterId, "replace"));
  }
  if (action === "append-encounter" || action === "load-encounter-append") updateState(loadEncounterTemplate(state, button.dataset.encounterId, "append"));
  if (action === "delete-encounter") {
    if (confirm("確定刪除此遭遇模板？")) updateState(deleteEncounterTemplate(state, button.dataset.encounterId));
  }
});

window.addEventListener("beforeunload", () => saveState(state));

render();
