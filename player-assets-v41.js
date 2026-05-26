function applyPlayerAssetsV41() {
  ensurePlayerAssetsStylesV41();
  updateLabelsV41();
  ensurePlayerCharacterStripV41();
  syncPlayerDiceSourceV41();
  ensureCharacterAssetsV41();
}

function ensurePlayerAssetsStylesV41() {
  if (document.getElementById("player-assets-v41-style")) return;

  const style = document.createElement("style");
  style.id = "player-assets-v41-style";
  style.textContent = `
    body[data-mode="player"] .scene-title-input {
      display: none;
    }

    .current-character-select {
      width: 100%;
      min-height: 36px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(18, 20, 23, 0.92);
      color: var(--text);
      padding: 7px 9px;
      font: inherit;
      font-size: 0.86rem;
    }

    body[data-mode="dm"] .current-character-select {
      display: none;
    }

    body[data-mode="player"] #diceSourceField,
    body[data-mode="player"] #diceSourceCharacter {
      display: none !important;
    }

    .status-reference-toggle {
      min-height: 30px !important;
      padding: 0 8px !important;
      font-size: 0.68rem !important;
      right: 6px !important;
      border-radius: 7px 0 0 7px !important;
    }

    .status-reference-panel {
      width: min(260px, calc(100vw - 24px)) !important;
      padding: 8px !important;
    }

    .status-reference-panel h3 {
      font-size: 0.86rem !important;
    }

    .status-reference-item {
      padding: 6px !important;
      font-size: 0.72rem !important;
    }

    .asset-row {
      margin-top: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--line);
    }

    .asset-row__title {
      margin-bottom: 4px;
      color: var(--muted);
      font-size: 0.68rem;
      font-weight: 900;
    }

    .asset-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 4px;
    }

    .asset-control {
      display: grid;
      grid-template-columns: 24px minmax(0, 1fr) 24px;
      align-items: center;
      gap: 3px;
      min-width: 0;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(18, 20, 23, 0.48);
    }

    .asset-control button {
      min-height: 24px;
      width: 24px;
      padding: 0;
      border-radius: 6px;
      font-size: 0.72rem;
    }

    .asset-control strong {
      display: block;
      color: var(--gold);
      font-size: 0.86rem;
      line-height: 1;
      text-align: center;
    }

    .asset-control span {
      display: block;
      margin-top: 1px;
      color: var(--muted);
      font-size: 0.6rem;
      text-align: center;
    }
  `;
  document.head.appendChild(style);
}

function updateLabelsV41() {
  setTextV41('.tabbar__button[data-tab="dashboard"]', "隊伍");
  setTextV41("#dashboard .section-heading h2", "隊伍狀態");
  setTextV41("#dashboard .card-header h3", "隊伍列表");
  setTextV41("#characterForm button", "新增隊員");

  const nameInput = document.getElementById("characterName");
  if (nameInput) nameInput.placeholder = "新隊員名稱";

  const statusToggle = document.getElementById("statusReferenceToggle");
  if (statusToggle) statusToggle.textContent = "異常狀態";

  const statusTitle = document.querySelector("#statusReferencePanel h3");
  if (statusTitle) statusTitle.textContent = "異常狀態";

  const versionBadge = document.querySelector(".session-strip .status-pill");
  if (versionBadge) versionBadge.textContent = "v0.1.13 隊伍資產版";
}

function ensurePlayerCharacterStripV41() {
  const sceneWrap = document.querySelector(".session-strip > div");
  const sceneLabel = sceneWrap?.querySelector("span");
  const sceneInput = document.getElementById("sceneNameInput");
  if (!sceneWrap || !sceneLabel || !sceneInput) return;

  let select = document.getElementById("currentCharacterSelect");
  if (!select) {
    select = document.createElement("select");
    select.id = "currentCharacterSelect";
    select.className = "current-character-select";
    sceneInput.insertAdjacentElement("afterend", select);
    select.addEventListener("change", () => {
      state.playerCharacterId = select.value;
      persistPlayerAssetsStateV41();
      render();
    });
  }

  const previous = state.playerCharacterId;
  select.innerHTML = state.characters
    .map((character) => `<option value="${escapePlayerAssetsHtmlV41(character.id)}">${escapePlayerAssetsHtmlV41(character.name)}</option>`)
    .join("");

  if (!state.characters.some((character) => character.id === state.playerCharacterId)) {
    state.playerCharacterId = state.characters[0]?.id || "";
  }
  select.value = state.playerCharacterId || previous || "";

  if (state.mode === "player") {
    sceneLabel.textContent = "目前玩家角色";
  } else {
    sceneLabel.textContent = "目前場景";
  }
}

function syncPlayerDiceSourceV41() {
  const select = document.getElementById("diceSourceSelect");
  if (!select || state.mode !== "player") return;

  const character = state.characters.find((item) => item.id === state.playerCharacterId);
  if (!character) return;

  if (![...select.options].some((option) => option.value === character.name)) {
    const option = document.createElement("option");
    option.value = character.name;
    option.textContent = character.name;
    select.appendChild(option);
  }
  select.value = character.name;
}

function ensureCharacterAssetsV41() {
  document.querySelectorAll("#characterList .monitor-card, #playerCharacterCard .monitor-card, #diceSourceCharacter .monitor-card").forEach((card) => {
    const deleteButton = card.querySelector("[data-delete-character]");
    const characterId = deleteButton?.dataset.deleteCharacter;
    if (!characterId || card.querySelector(".asset-row")) return;

    const character = state.characters.find((item) => item.id === characterId);
    if (!character) return;

    const statusRow = card.querySelector(".status-row");
    if (!statusRow) return;

    statusRow.insertAdjacentHTML("afterend", assetRowTemplateV41(character));
  });
}

function assetRowTemplateV41(character) {
  const assets = normalizeAssetsV41(character);
  return `
    <div class="asset-row" data-asset-character="${escapePlayerAssetsHtmlV41(character.id)}">
      <div class="asset-row__title">玩家資產</div>
      <div class="asset-grid">
        ${assetControlV41(character.id, "hand", "把", assets.hand)}
        ${assetControlV41(character.id, "bag", "袋", assets.bag)}
        ${assetControlV41(character.id, "box", "箱", assets.box)}
      </div>
    </div>
  `;
}

function assetControlV41(characterId, unit, label, value) {
  return `
    <div class="asset-control">
      <button class="text-button" data-asset-unit="${unit}" data-asset-id="${escapePlayerAssetsHtmlV41(characterId)}" data-asset-step="-1" type="button">-</button>
      <div><strong>${value}</strong><span>${label}</span></div>
      <button class="text-button" data-asset-unit="${unit}" data-asset-id="${escapePlayerAssetsHtmlV41(characterId)}" data-asset-step="1" type="button">+</button>
    </div>
  `;
}

function normalizeAssetsV41(character) {
  const raw = character.assets && typeof character.assets === "object" ? character.assets : {};
  let total = Math.max(0, Number(raw.total ?? 0));

  if (!Number.isFinite(total) || total === 0) {
    total = Math.max(0, Number(raw.hand || 0))
      + Math.max(0, Number(raw.bag || 0)) * 10
      + Math.max(0, Number(raw.box || 0)) * 100;
  }

  const box = Math.floor(total / 100);
  const bag = Math.floor((total % 100) / 10);
  const hand = total % 10;
  return { total, box, bag, hand };
}

function updateCharacterAssetV41(characterId, unit, step) {
  const unitValue = unit === "box" ? 100 : unit === "bag" ? 10 : 1;
  state.characters = state.characters.map((character) => {
    if (character.id !== characterId) return character;
    const assets = normalizeAssetsV41(character);
    const total = Math.max(0, assets.total + unitValue * step);
    return { ...character, assets: { total } };
  });
  persistPlayerAssetsStateV41();
  render();
}

function bindPlayerAssetsEventsV41() {
  if (window.playerAssetsEventsV41Bound) return;
  window.playerAssetsEventsV41Bound = true;

  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-asset-id][data-asset-unit][data-asset-step]");
    if (!button) return;
    event.preventDefault();
    event.stopPropagation();
    updateCharacterAssetV41(button.dataset.assetId, button.dataset.assetUnit, Number(button.dataset.assetStep));
  }, true);
}

function patchDiceSourceForPlayerV41() {
  if (window.playerAssetsDicePatchV41Bound || typeof selectedDiceSource !== "function") return;
  window.playerAssetsDicePatchV41Bound = true;
  const originalSelectedDiceSource = selectedDiceSource;
  selectedDiceSource = function selectedDiceSourceWithPlayerCharacter() {
    if (state.mode === "player") {
      const character = state.characters.find((item) => item.id === state.playerCharacterId);
      return character?.name || "玩家";
    }
    return originalSelectedDiceSource();
  };
}

function setTextV41(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function persistPlayerAssetsStateV41() {
  if (typeof save === "function") return save();
  if (typeof saveState === "function") saveState();
}

function escapePlayerAssetsHtmlV41(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

bindPlayerAssetsEventsV41();
patchDiceSourceForPlayerV41();

if (typeof render === "function") {
  const originalPlayerAssetsRenderV41 = render;
  render = function renderWithPlayerAssetsV41() {
    originalPlayerAssetsRenderV41();
    applyPlayerAssetsV41();
  };
}

window.addEventListener("load", applyPlayerAssetsV41);
applyPlayerAssetsV41();
