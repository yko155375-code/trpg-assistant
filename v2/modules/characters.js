import { assetLists, normalizeAssets } from "./assets.js";

export const statFields = [
  { key: "hp", label: "HP" },
  { key: "maxHp", label: "最大 HP" },
  { key: "stress", label: "壓力" },
  { key: "maxStress", label: "最大壓力" },
  { key: "hope", label: "希望" },
  { key: "evasion", label: "閃避" },
];

export const attributeFields = [
  { key: "agility", label: "敏捷" },
  { key: "strength", label: "力量" },
  { key: "finesse", label: "靈巧" },
  { key: "instinct", label: "本能" },
  { key: "presence", label: "風度" },
  { key: "knowledge", label: "知識" },
];

function makeId() {
  return `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createCharacter(name = "新角色") {
  return normalizeCharacter({
    id: makeId(),
    name,
  });
}

export function normalizeCharacter(character = {}) {
  const id = character.id || makeId();

  return {
    id,
    name: character.name || "未命名角色",
    notes: character.notes || "",
    stats: {
      hp: toNumber(character.stats?.hp),
      maxHp: toNumber(character.stats?.maxHp, 6),
      stress: toNumber(character.stats?.stress),
      maxStress: toNumber(character.stats?.maxStress, 6),
      hope: toNumber(character.stats?.hope),
      evasion: toNumber(character.stats?.evasion, 10),
    },
    attributes: {
      agility: toNumber(character.attributes?.agility),
      strength: toNumber(character.attributes?.strength),
      finesse: toNumber(character.attributes?.finesse),
      instinct: toNumber(character.attributes?.instinct),
      presence: toNumber(character.attributes?.presence),
      knowledge: toNumber(character.attributes?.knowledge),
    },
    assets: normalizeAssets(character.assets),
    conditions: Array.isArray(character.conditions) ? character.conditions : [],
  };
}

export function normalizeCharacters(characters) {
  return Array.isArray(characters) ? characters.map(normalizeCharacter) : [];
}

export function getCurrentCharacter(state) {
  const characters = normalizeCharacters(state.characters);
  return characters.find((character) => character.id === state.ui.currentCharacterId) || characters[0] || null;
}

export function ensureCurrentCharacterId(state) {
  const current = getCurrentCharacter(state);
  return {
    ...state,
    characters: normalizeCharacters(state.characters),
    ui: {
      ...state.ui,
      currentCharacterId: current ? current.id : null,
    },
  };
}

export function addCharacter(state, name) {
  const nextCharacter = createCharacter(name || `角色 ${state.characters.length + 1}`);
  return {
    ...state,
    characters: [...normalizeCharacters(state.characters), nextCharacter],
    ui: {
      ...state.ui,
      currentCharacterId: nextCharacter.id,
    },
  };
}

export function deleteCharacter(state, characterId) {
  const characters = normalizeCharacters(state.characters).filter((character) => character.id !== characterId);
  const nextCurrent = characters.find((character) => character.id === state.ui.currentCharacterId) || characters[0] || null;

  return {
    ...state,
    characters,
    ui: {
      ...state.ui,
      currentCharacterId: nextCurrent ? nextCurrent.id : null,
    },
  };
}

export function selectCharacter(state, characterId) {
  return {
    ...state,
    ui: {
      ...state.ui,
      currentCharacterId: characterId || null,
    },
  };
}

export function updateCharacter(state, characterId, updater) {
  return {
    ...state,
    characters: normalizeCharacters(state.characters).map((character) =>
      character.id === characterId ? normalizeCharacter(updater(character)) : character,
    ),
  };
}

export function updateCharacterField(state, characterId, field, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    [field]: value,
  }));
}

export function updateCharacterStat(state, characterId, field, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    stats: {
      ...character.stats,
      [field]: toNumber(value),
    },
  }));
}

export function updateCharacterAttribute(state, characterId, field, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    attributes: {
      ...character.attributes,
      [field]: toNumber(value),
    },
  }));
}

export function updateCharacterMoney(state, characterId, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    assets: {
      ...character.assets,
      money: Math.max(0, toNumber(value)),
    },
  }));
}

export function addAssetEntry(state, characterId, listKey, value) {
  const text = String(value || "").trim();
  if (!text) return state;

  return updateCharacter(state, characterId, (character) => ({
    ...character,
    assets: {
      ...character.assets,
      [listKey]: [...(character.assets[listKey] || []), text],
    },
  }));
}

export function deleteAssetEntry(state, characterId, listKey, index) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    assets: {
      ...character.assets,
      [listKey]: (character.assets[listKey] || []).filter((_, itemIndex) => itemIndex !== index),
    },
  }));
}

export function updateAssetEntry(state, characterId, listKey, index, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    assets: {
      ...character.assets,
      [listKey]: (character.assets[listKey] || []).map((entry, itemIndex) =>
        itemIndex === index ? value : entry,
      ),
    },
  }));
}

export function renderCharacterPicker(state, label = "目前角色") {
  const characters = normalizeCharacters(state.characters);
  const current = getCurrentCharacter({ ...state, characters });

  if (!characters.length) {
    return `<p class="empty-hint">目前沒有角色。請先新增角色。</p>`;
  }

  return `
    <label class="form-field form-field-full">
      <span>${label}</span>
      <select data-character-select>
        ${characters
          .map(
            (character) => `
              <option value="${escapeHtml(character.id)}" ${current?.id === character.id ? "selected" : ""}>
                ${escapeHtml(character.name)}
              </option>
            `,
          )
          .join("")}
      </select>
    </label>
  `;
}

export function renderAddCharacterForm() {
  return `
    <form class="inline-form" data-add-character-form>
      <label class="form-field">
        <span>新增角色</span>
        <input data-new-character-name type="text" placeholder="輸入角色名稱" autocomplete="off" />
      </label>
      <button class="primary-button" type="submit">新增</button>
    </form>
  `;
}

export function renderCharacterEditor(state, options = {}) {
  const { includeAssets = false, allowDelete = true, title = "角色狀態" } = options;
  const character = getCurrentCharacter(state);

  if (!character) {
    return `
      ${renderAddCharacterForm()}
      <section class="empty-panel">
        <strong>尚未建立角色</strong>
        <p>新增角色後，就能編輯 HP、壓力、希望、閃避、六屬性與備註。</p>
      </section>
    `;
  }

  return `
    ${renderAddCharacterForm()}
    ${renderCharacterPicker(state)}
    <section class="editor-panel" data-character-id="${escapeHtml(character.id)}">
      <div class="editor-heading">
        <h3>${title}</h3>
        ${
          allowDelete
            ? `<button class="danger-button" type="button" data-action="delete-character" data-character-id="${escapeHtml(character.id)}">刪除角色</button>`
            : ""
        }
      </div>
      <label class="form-field form-field-full">
        <span>角色名稱</span>
        <input data-character-id="${escapeHtml(character.id)}" data-character-field="name" type="text" value="${escapeHtml(character.name)}" />
      </label>
      <div class="form-grid">
        ${statFields
          .map(
            (field) => `
              <label class="form-field">
                <span>${field.label}</span>
                <input data-character-id="${escapeHtml(character.id)}" data-stat-field="${field.key}" type="number" inputmode="numeric" value="${character.stats[field.key]}" />
              </label>
            `,
          )
          .join("")}
      </div>
      <h4>六屬性</h4>
      <div class="form-grid">
        ${attributeFields
          .map(
            (field) => `
              <label class="form-field">
                <span>${field.label}</span>
                <input data-character-id="${escapeHtml(character.id)}" data-attribute-field="${field.key}" type="number" inputmode="numeric" value="${character.attributes[field.key]}" />
              </label>
            `,
          )
          .join("")}
      </div>
      <label class="form-field form-field-full">
        <span>角色備註</span>
        <textarea data-character-id="${escapeHtml(character.id)}" data-character-field="notes" rows="4">${escapeHtml(character.notes)}</textarea>
      </label>
      ${includeAssets ? renderAssetsEditor(state, { showPicker: false }) : ""}
    </section>
  `;
}

export function renderAssetsEditor(state, options = {}) {
  const { showPicker = true } = options;
  const character = getCurrentCharacter(state);

  if (!character) {
    return `
      ${showPicker ? renderAddCharacterForm() : ""}
      <section class="empty-panel">
        <strong>尚未選擇角色</strong>
        <p>新增或選擇角色後，就能編輯金錢、物品、裝備與消耗品。</p>
      </section>
    `;
  }

  return `
    ${showPicker ? renderCharacterPicker(state) : ""}
    <section class="editor-panel asset-panel" data-character-id="${escapeHtml(character.id)}">
      <div class="editor-heading">
        <h3>${escapeHtml(character.name)}的資產</h3>
      </div>
      <label class="form-field form-field-full">
        <span>金錢</span>
        <input data-character-id="${escapeHtml(character.id)}" data-money-field type="number" inputmode="numeric" value="${character.assets.money}" />
      </label>
      <div class="asset-list-grid">
        ${assetLists.map((list) => renderAssetList(character, list)).join("")}
      </div>
    </section>
  `;
}

function renderAssetList(character, list) {
  const entries = character.assets[list.key] || [];

  return `
    <section class="asset-list-card">
      <h4>${list.label}</h4>
      <form class="inline-form compact" data-add-asset-form data-character-id="${escapeHtml(character.id)}" data-list-key="${list.key}">
        <input data-asset-entry-input type="text" placeholder="新增${list.label}" autocomplete="off" />
        <button type="submit">新增</button>
      </form>
      ${
        entries.length
          ? `<ul class="asset-entry-list">
              ${entries
                .map(
                  (entry, index) => `
                    <li>
                      <input data-character-id="${escapeHtml(character.id)}" data-asset-entry-field data-list-key="${list.key}" data-entry-index="${index}" type="text" value="${escapeHtml(entry)}" />
                      <button type="button" data-action="delete-asset-entry" data-character-id="${escapeHtml(character.id)}" data-list-key="${list.key}" data-entry-index="${index}">刪除</button>
                    </li>
                  `,
                )
                .join("")}
            </ul>`
          : `<p class="empty-hint">尚無${list.label}</p>`
      }
    </section>
  `;
}
