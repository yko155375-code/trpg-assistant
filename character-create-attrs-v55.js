const CHARACTER_CREATE_ATTRS_V55 = [
  ["agility", "敏捷"],
  ["strength", "力量"],
  ["finesse", "靈巧"],
  ["presence", "風度"],
  ["knowledge", "知識"],
  ["instinct", "本能"],
];

function applyCharacterCreateAttrsV55() {
  ensureCharacterCreateAttrsStylesV55();
  normalizeCharacterCreateAttrsV55();
  ensureCharacterCreateAttrFieldsV55();
  simplifyCharacterAttributeRowsV55();
  patchCharacterCreateSubmitV55();
  patchCharacterCreateVersionV55();
}

function ensureCharacterCreateAttrsStylesV55() {
  if (document.getElementById("character-create-attrs-v55-style")) return;
  const style = document.createElement("style");
  style.id = "character-create-attrs-v55-style";
  style.textContent = `
    .character-attr-create-v55 {
      grid-column: 1 / -1;
      display: grid;
      grid-template-columns: repeat(6, minmax(0, 1fr));
      gap: 6px;
      padding-top: 6px;
      border-top: 1px solid var(--line);
    }

    .character-attr-create-v55 label {
      display: grid;
      gap: 3px;
      min-width: 0;
      color: var(--muted);
      font-size: .62rem;
      font-weight: 900;
    }

    .character-attr-create-v55 input {
      min-width: 0;
      min-height: 34px;
      text-align: center;
      font-weight: 900;
    }

    .attribute-row-v44 {
      grid-template-columns: repeat(6, minmax(0, 1fr)) !important;
      gap: 4px !important;
    }

    .attribute-row-v44 .resource-stepper-v51 {
      display: block !important;
    }

    .attribute-row-v44 .resource-stepper-v51 button {
      display: none !important;
    }

    .attribute-row-v44 .resource-stepper-v51 input,
    .attribute-row-v44 .attribute-cell-v44 input {
      pointer-events: none;
      min-height: 26px !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      color: var(--gold) !important;
      font-size: .86rem !important;
      font-weight: 900 !important;
      text-align: center !important;
    }

    body[data-mode="player"] .stat-control {
      min-width: 0;
    }

    body[data-mode="player"] .stat-grid,
    body[data-mode="player"] .asset-grid {
      gap: 8px !important;
    }

    body[data-mode="player"] .stat-control__row,
    body[data-mode="player"] .asset-control {
      width: 100%;
      min-width: 0;
      min-height: 42px;
      grid-template-columns: 40px minmax(48px, 1fr) 40px !important;
      gap: 8px !important;
      touch-action: manipulation;
    }

    body[data-mode="player"] .stat-control__row button,
    body[data-mode="player"] .asset-control button {
      width: 40px !important;
      min-width: 40px !important;
      min-height: 40px !important;
      touch-action: manipulation;
    }

    @media (max-width: 640px) {
      .character-attr-create-v55 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      body[data-mode="player"] main,
      body[data-mode="player"] .monitor-card,
      body[data-mode="player"] .tool-card {
        min-width: 0;
      }

      body[data-mode="player"] .stat-grid,
      body[data-mode="player"] .asset-grid {
        grid-template-columns: 1fr !important;
        gap: 10px !important;
      }

      body[data-mode="player"] .stat-control__row,
      body[data-mode="player"] .asset-control {
        min-height: 46px;
        grid-template-columns: 42px minmax(52px, 1fr) 42px !important;
      }

      body[data-mode="player"] .stat-control__row button,
      body[data-mode="player"] .asset-control button {
        width: 42px !important;
        min-width: 42px !important;
        min-height: 42px !important;
      }

      .attribute-row-v44 {
        grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function normalizeCharacterCreateAttrsV55() {
  if (!Array.isArray(state.characters)) return;
  let changed = false;
  state.characters = state.characters.map((character) => {
    const attributes = { ...(character.attributes || {}) };
    CHARACTER_CREATE_ATTRS_V55.forEach(([key]) => {
      if (!Number.isFinite(Number(attributes[key]))) {
        attributes[key] = 0;
        changed = true;
      } else {
        attributes[key] = Number(attributes[key]);
      }
    });
    return { ...character, attributes };
  });
  if (changed) persistCharacterCreateAttrsV55(false);
}

function ensureCharacterCreateAttrFieldsV55() {
  const form = document.getElementById("characterForm");
  if (!form || form.querySelector(".character-attr-create-v55")) return;

  const group = document.createElement("div");
  group.className = "character-attr-create-v55";
  group.innerHTML = CHARACTER_CREATE_ATTRS_V55.map(([key, label]) => `
    <label>
      <span>${label}</span>
      <input data-create-attr-v55="${key}" inputmode="numeric" value="0" />
    </label>
  `).join("");

  const submit = form.querySelector("button[type='submit'], button");
  if (submit) form.insertBefore(group, submit);
  else form.appendChild(group);
}

function simplifyCharacterAttributeRowsV55() {
  document.querySelectorAll(".attribute-row-v44 input[data-character-attr-id][data-character-attr-key]").forEach((input) => {
    input.readOnly = true;
    input.tabIndex = -1;
  });
}

function patchCharacterCreateSubmitV55() {
  const form = document.getElementById("characterForm");
  if (!form || form.dataset.createAttrsV55Bound === "true") return;
  form.dataset.createAttrsV55Bound = "true";
  form.addEventListener("submit", handleCharacterCreateSubmitV55, true);
}

function handleCharacterCreateSubmitV55(event) {
  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  const nameInput = document.getElementById("characterName");
  const evasionInput = document.getElementById("characterEvasion");
  const name = nameInput?.value.trim() || "";
  const evasion = clamp(Number(evasionInput?.value || 10), 1, 99);
  if (!name) return;

  const attributes = {};
  CHARACTER_CREATE_ATTRS_V55.forEach(([key]) => {
    const input = document.querySelector(`[data-create-attr-v55="${key}"]`);
    const value = Number(input?.value || 0);
    attributes[key] = Number.isFinite(value) ? value : 0;
  });

  const character = {
    id: makeId(),
    name,
    hopeDice: 0,
    stress: 0,
    armor: 0,
    maxArmor: 12,
    hp: 0,
    maxHp: 12,
    evasion,
    attributes,
  };

  state.characters.push(character);
  state.playerCharacterId = state.playerCharacterId || character.id;
  if (nameInput) nameInput.value = "";
  if (evasionInput) evasionInput.value = "";
  document.querySelectorAll("[data-create-attr-v55]").forEach((input) => {
    input.value = "0";
  });

  persistCharacterCreateAttrsV55(true);
}

function persistCharacterCreateAttrsV55(shouldRender) {
  if (typeof save === "function") save();
  else if (typeof saveState === "function") saveState();

  if (typeof saveCloudState === "function") {
    window.clearTimeout(window.characterCreateAttrsCloudSaveV55);
    window.characterCreateAttrsCloudSaveV55 = window.setTimeout(() => saveCloudState(), 40);
  }

  if (shouldRender && typeof render === "function") render();
}

function patchCharacterCreateVersionV55() {
  const footer = document.getElementById("versionFooterV52");
  const badge = footer?.querySelector(".status-pill");
  if (badge) badge.textContent = "版本 v0.1.42";
}

if (typeof render === "function" && !window.characterCreateAttrsRenderPatchedV55) {
  const originalRenderV55 = render;
  render = function renderWithCharacterCreateAttrsV55() {
    originalRenderV55();
    applyCharacterCreateAttrsV55();
  };
  window.characterCreateAttrsRenderPatchedV55 = true;
}

window.addEventListener("load", applyCharacterCreateAttrsV55);
window.setTimeout(applyCharacterCreateAttrsV55, 0);
window.setTimeout(applyCharacterCreateAttrsV55, 500);
applyCharacterCreateAttrsV55();
