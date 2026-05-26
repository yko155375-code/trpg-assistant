const CHARACTER_ATTRS_V44 = [
  ["agility", "\u654f\u6377"],
  ["strength", "\u529b\u91cf"],
  ["finesse", "\u9748\u5de7"],
  ["instinct", "\u672c\u80fd"],
  ["presence", "\u98a8\u5ea6"],
  ["knowledge", "\u77e5\u8b58"],
];

function applyCharacterAttributesV44() {
  normalizeCharacterAttributesV44();
  ensureCharacterAttributesStylesV44();
  syncPlayerDiceCharacterCardV44();
  ensureAttributeRowsV44();
  updateCharacterAttributesVersionV44();
}

function ensureCharacterAttributesStylesV44() {
  if (document.getElementById("character-attributes-v44-style")) return;

  const style = document.createElement("style");
  style.id = "character-attributes-v44-style";
  style.textContent = `
    body[data-mode="player"] #diceSourceCharacter {
      display: grid !important;
    }

    body[data-mode="player"] #diceSourceZone {
      display: block !important;
    }

    body[data-mode="player"] #diceSourceField {
      display: none !important;
    }

    .attribute-row-v44 {
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 4px;
      margin-top: 5px;
      padding-top: 5px;
      border-top: 1px solid var(--line);
    }

    .attribute-cell-v44 {
      min-width: 0;
      padding: 4px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(18, 20, 23, 0.46);
    }

    .attribute-cell-v44 span {
      display: block;
      margin-bottom: 2px;
      color: var(--muted);
      font-size: 0.58rem;
      font-weight: 900;
      text-align: center;
    }

    .attribute-cell-v44 input {
      width: 100%;
      min-height: 24px;
      border: 0;
      border-radius: 5px;
      background: rgba(255, 255, 255, 0.06);
      color: var(--text);
      font: inherit;
      font-size: 0.8rem;
      font-weight: 900;
      text-align: center;
    }

    @media (max-width: 720px) {
      .attribute-row-v44 {
        grid-template-columns: repeat(3, minmax(0, 1fr));
      }
    }
  `;
  document.head.appendChild(style);
}

function normalizeCharacterAttributesV44() {
  if (!Array.isArray(state.characters)) return;
  let changed = false;

  state.characters = state.characters.map((character) => {
    const attrs = character.attributes && typeof character.attributes === "object"
      ? { ...character.attributes }
      : {};

    CHARACTER_ATTRS_V44.forEach(([key]) => {
      if (!Number.isFinite(Number(attrs[key]))) {
        attrs[key] = 0;
        changed = true;
      } else {
        attrs[key] = Number(attrs[key]);
      }
    });

    return { ...character, attributes: attrs };
  });

  if (changed) persistCharacterAttributesV44(false);
}

function syncPlayerDiceCharacterCardV44() {
  const target = document.getElementById("diceSourceCharacter");
  if (!target || state.mode !== "player") return;

  const character = state.characters.find((item) => item.id === state.playerCharacterId) || state.characters[0];
  if (!character) {
    target.innerHTML = '<div class="dice-source-empty">\u5c1a\u672a\u5efa\u7acb\u968a\u54e1\u3002</div>';
    return;
  }

  const select = document.getElementById("diceSourceSelect");
  if (select) select.value = character.name;

  if (typeof characterTemplate === "function") {
    target.innerHTML = characterTemplate(character, "character");
  }
}

function ensureAttributeRowsV44() {
  document.querySelectorAll("#characterList .monitor-card, #playerCharacterCard .monitor-card, #diceSourceCharacter .monitor-card").forEach((card) => {
    const button = card.querySelector("[data-delete-character]");
    const characterId = button?.dataset.deleteCharacter;
    if (!characterId) return;

    const character = state.characters.find((item) => item.id === characterId);
    const statGrid = card.querySelector(".stat-grid");
    if (!character || !statGrid) return;

    let row = card.querySelector(".attribute-row-v44");
    if (!row) {
      row = document.createElement("div");
      row.className = "attribute-row-v44";
      statGrid.insertAdjacentElement("afterend", row);
    }

    row.innerHTML = CHARACTER_ATTRS_V44.map(([key, label]) => `
      <label class="attribute-cell-v44">
        <span>${label}</span>
        <input
          data-character-attr-id="${escapeCharacterAttributesHtmlV44(characterId)}"
          data-character-attr-key="${key}"
          inputmode="numeric"
          value="${escapeCharacterAttributesHtmlV44(character.attributes?.[key] ?? 0)}"
        />
      </label>
    `).join("");
  });

  bindAttributeInputsV44();
}

function bindAttributeInputsV44() {
  document.querySelectorAll("[data-character-attr-id][data-character-attr-key]").forEach((input) => {
    if (input.dataset.attrBoundV44 === "true") return;
    input.dataset.attrBoundV44 = "true";
    input.addEventListener("change", updateCharacterAttributeV44);
    input.addEventListener("blur", updateCharacterAttributeV44);
  });
}

function updateCharacterAttributeV44(event) {
  const input = event.currentTarget;
  const characterId = input.dataset.characterAttrId;
  const key = input.dataset.characterAttrKey;
  const value = Number(input.value || 0);
  const nextValue = Number.isFinite(value) ? value : 0;

  state.characters = state.characters.map((character) => {
    if (character.id !== characterId) return character;
    return {
      ...character,
      attributes: {
        ...(character.attributes || {}),
        [key]: nextValue,
      },
    };
  });

  persistCharacterAttributesV44(true);
}

function persistCharacterAttributesV44(shouldRender) {
  if (typeof save === "function") {
    save();
  } else if (typeof saveState === "function") {
    saveState();
  }

  if (typeof saveCloudState === "function") {
    window.clearTimeout(window.characterAttributesCloudSaveV44);
    window.characterAttributesCloudSaveV44 = window.setTimeout(() => saveCloudState(), 40);
  }

  if (shouldRender && typeof render === "function") render();
}

function updateCharacterAttributesVersionV44() {
  const version = document.querySelector(".session-strip .status-pill");
  if (version) version.textContent = "v0.1.15 \u5c6c\u6027\u7248";
}

function escapeCharacterAttributesHtmlV44(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function" && !window.characterAttributesRenderPatchedV44) {
  const originalRenderV44 = render;
  render = function renderWithCharacterAttributesV44() {
    originalRenderV44();
    applyCharacterAttributesV44();
  };
  window.characterAttributesRenderPatchedV44 = true;
}

window.addEventListener("load", applyCharacterAttributesV44);
applyCharacterAttributesV44();
