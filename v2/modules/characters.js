import {
  assetLists,
  formatGold,
  goldToHandfuls,
  goldUnitFields,
  normalizeAssets,
  normalizeGold,
  normalizeGoldFromHandfuls,
} from "./assets.js";
import { getStatusDescription, sortStatusLabels, statusEffectGroups } from "./status-effects.js";

export const statFields = [
  { key: "hp", label: "HP" },
  { key: "maxHp", label: "最大 HP" },
  { key: "stress", label: "壓力" },
  { key: "maxStress", label: "最大壓力" },
  { key: "hope", label: "希望" },
  { key: "shield", label: "護盾" },
  { key: "maxShield", label: "最大護盾" },
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

export const characterColorOptions = [
  { key: "red", label: "紅", value: "#ef4444" },
  { key: "orange", label: "橙", value: "#f97316" },
  { key: "yellow", label: "黃", value: "#eab308" },
  { key: "green", label: "綠", value: "#22c55e" },
  { key: "cyan", label: "青", value: "#06b6d4" },
  { key: "blue", label: "藍", value: "#3b82f6" },
  { key: "purple", label: "紫", value: "#a855f7" },
  { key: "pink", label: "粉", value: "#ec4899" },
];

function makeId() {
  return `char-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(number, min, max = Infinity) {
  return Math.min(max, Math.max(min, number));
}

function normalizeTextList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
}

function getDefaultCharacterColor(index = 0) {
  return characterColorOptions[index % characterColorOptions.length].value;
}

function normalizeCharacterColor(value, index = 0) {
  return characterColorOptions.some((option) => option.value === value) ? value : getDefaultCharacterColor(index);
}

function normalizeStats(stats = {}) {
  const maxHp = clamp(toNumber(stats.maxHp, 6), 1);
  const maxStress = clamp(toNumber(stats.maxStress, 6), 1);
  const rawShield = clamp(toNumber(stats.shield), 0);
  const maxShield = clamp(toNumber(stats.maxShield, rawShield), 0);

  return {
    hp: clamp(toNumber(stats.hp), 0, maxHp),
    maxHp,
    stress: clamp(toNumber(stats.stress), 0, maxStress),
    maxStress,
    hope: clamp(toNumber(stats.hope), 0, 6),
    shield: clamp(rawShield, 0, maxShield),
    maxShield,
    evasion: clamp(toNumber(stats.evasion, 10), 0),
  };
}

function normalizeAttributes(attributes = {}) {
  return {
    agility: clamp(toNumber(attributes.agility), -5, 10),
    strength: clamp(toNumber(attributes.strength), -5, 10),
    finesse: clamp(toNumber(attributes.finesse), -5, 10),
    instinct: clamp(toNumber(attributes.instinct), -5, 10),
    presence: clamp(toNumber(attributes.presence), -5, 10),
    knowledge: clamp(toNumber(attributes.knowledge), -5, 10),
  };
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function createCharacter(name = "新角色", color, index = 0) {
  return normalizeCharacter(
    {
      id: makeId(),
      name,
      color: normalizeCharacterColor(color, index),
    },
    index,
  );
}

export function normalizeCharacter(character = {}, index = 0) {
  const id = character.id || makeId();

  return {
    id,
    name: character.name || "未命名角色",
    color: normalizeCharacterColor(character.color, index),
    notes: character.notes || "",
    stats: normalizeStats(character.stats),
    attributes: normalizeAttributes(character.attributes),
    assets: normalizeAssets(character.assets),
    conditions: Array.isArray(character.conditions) ? character.conditions : [],
    buffs: sortStatusLabels("buffs", normalizeTextList(character.buffs)),
    debuffs: sortStatusLabels("debuffs", normalizeTextList(character.debuffs)),
  };
}

export function normalizeCharacters(characters) {
  return Array.isArray(characters) ? characters.map((character, index) => normalizeCharacter(character, index)) : [];
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

export function addCharacter(state, name, color) {
  const characterCount = normalizeCharacters(state.characters).length;
  const nextCharacter = createCharacter(name || `角色 ${characterCount + 1}`, color, characterCount);
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
  const nextExpanded =
    state.ui.expandedCharacterId && characters.some((character) => character.id === state.ui.expandedCharacterId)
      ? state.ui.expandedCharacterId
      : null;

  return {
    ...state,
    characters,
    ui: {
      ...state.ui,
      currentCharacterId: nextCurrent ? nextCurrent.id : null,
      expandedCharacterId: nextExpanded,
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

export function expandCharacter(state, characterId) {
  const characters = normalizeCharacters(state.characters);
  const exists = characters.some((character) => character.id === characterId);

  return {
    ...state,
    ui: {
      ...state.ui,
      currentCharacterId: exists ? characterId : state.ui.currentCharacterId,
      expandedCharacterId: exists && state.ui.expandedCharacterId !== characterId ? characterId : null,
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
    [field]: field === "color" ? normalizeCharacterColor(value) : value,
  }));
}

export function updateCharacterStat(state, characterId, field, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    stats: normalizeStats({
      ...character.stats,
      [field]: toNumber(value),
    }),
  }));
}

export function updateCharacterAttribute(state, characterId, field, value) {
  return updateCharacter(state, characterId, (character) => ({
    ...character,
    attributes: normalizeAttributes({
      ...character.attributes,
      [field]: toNumber(value),
    }),
  }));
}

export function updateCharacterMoney(state, characterId, value) {
  const gold = normalizeGoldFromHandfuls(value);

  return updateCharacter(state, characterId, (character) => ({
    ...character,
    assets: {
      ...character.assets,
      money: goldToHandfuls(gold),
      gold,
    },
  }));
}

export function updateCharacterGold(state, characterId, field, value) {
  const normalizedField = goldUnitFields.some((unit) => unit.key === field) ? field : "handfuls";

  return updateCharacter(state, characterId, (character) => {
    const gold = normalizeGold({
      ...character.assets.gold,
      [normalizedField]: Math.max(0, toNumber(value)),
    });

    return {
      ...character,
      assets: {
        ...character.assets,
        money: goldToHandfuls(gold),
        gold,
      },
    };
  });
}

export function adjustCharacterStat(state, characterId, field, delta) {
  const character = normalizeCharacters(state.characters).find((entry) => entry.id === characterId);
  return updateCharacterStat(state, characterId, field, toNumber(character?.stats?.[field]) + toNumber(delta));
}

export function adjustCharacterAttribute(state, characterId, field, delta) {
  const character = normalizeCharacters(state.characters).find((entry) => entry.id === characterId);
  return updateCharacterAttribute(
    state,
    characterId,
    field,
    toNumber(character?.attributes?.[field]) + toNumber(delta),
  );
}

export function adjustCharacterMoney(state, characterId, delta) {
  const character = normalizeCharacters(state.characters).find((entry) => entry.id === characterId);
  return updateCharacterMoney(state, characterId, toNumber(character?.assets?.money) + toNumber(delta));
}

export function adjustCharacterGold(state, characterId, field, delta) {
  const character = normalizeCharacters(state.characters).find((entry) => entry.id === characterId);
  const currentGold = normalizeGold(character?.assets?.gold, character?.assets?.money);
  return updateCharacterGold(state, characterId, field, toNumber(currentGold[field]) + toNumber(delta));
}

export function addCharacterEffect(state, characterId, effectType, value) {
  const key = effectType === "debuffs" ? "debuffs" : "buffs";
  const text = String(value || "").trim();
  if (!text) return state;

  return updateCharacter(state, characterId, (character) => ({
    ...character,
    [key]: sortStatusLabels(key, [...normalizeTextList(character[key]), text]),
  }));
}

export function deleteCharacterEffect(state, characterId, effectType, index) {
  const key = effectType === "debuffs" ? "debuffs" : "buffs";

  return updateCharacter(state, characterId, (character) => ({
    ...character,
    [key]: sortStatusLabels(key, sortStatusLabels(key, character[key]).filter((_, itemIndex) => itemIndex !== index)),
  }));
}

export function toggleCharacterEffect(state, characterId, effectType, value) {
  const key = effectType === "debuffs" ? "debuffs" : "buffs";
  const text = String(value || "").trim();
  if (!text) return state;

  return updateCharacter(state, characterId, (character) => {
    const entries = normalizeTextList(character[key]);
    const isActive = entries.includes(text);

    return {
      ...character,
      [key]: sortStatusLabels(key, isActive ? entries.filter((entry) => entry !== text) : [...entries, text]),
    };
  });
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
      <label class="form-field compact-color-field">
        <span>顏色</span>
        <select data-new-character-color>
          <option value="">自動</option>
          ${characterColorOptions
            .map(
              (option) => `
                <option value="${option.value}">${option.label}</option>
              `,
            )
            .join("")}
        </select>
      </label>
      <button class="primary-button" type="submit">新增</button>
    </form>
  `;
}

function getExpandedCharacterId(state, characters) {
  const expandedId = state.ui.expandedCharacterId;
  return characters.some((character) => character.id === expandedId) ? expandedId : null;
}

function renderEffectSummary(entries, effectType, maxVisible = 2) {
  const normalized = sortStatusLabels(effectType, entries);
  if (!normalized.length) return "無";

  const visible = normalized.slice(0, maxVisible).map(escapeHtml).join("、");
  const hiddenCount = normalized.length - maxVisible;
  return hiddenCount > 0 ? `${visible} +${hiddenCount}` : visible;
}

function renderStepper({ characterId, type, field, label, value }) {
  return `
    <label class="number-stepper" data-number-stepper data-character-id="${escapeHtml(characterId)}" data-stepper-type="${type}" data-stepper-field="${field}">
      <span>${label}</span>
      <button type="button" data-action="adjust-character-${type}" data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" data-delta="-1" aria-label="${label}減一">−</button>
      <input data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" type="number" inputmode="numeric" value="${value}" />
      <button type="button" data-action="adjust-character-${type}" data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" data-delta="1" aria-label="${label}加一">+</button>
    </label>
  `;
}

function renderGoldStepper(character) {
  const gold = normalizeGold(character.assets.gold, character.assets.money);

  return `
    <div class="gold-stepper-group" aria-label="金錢">
      <strong class="gold-stepper-title">金錢 ${formatGold(gold)}</strong>
      <div class="gold-stepper-grid">
        ${goldUnitFields
          .map(
            (unit) => `
              <label class="number-stepper gold-stepper" data-number-stepper data-character-id="${escapeHtml(character.id)}" data-stepper-type="gold" data-stepper-field="${unit.key}">
                <span>${unit.label}</span>
                <button type="button" data-action="adjust-character-gold" data-character-id="${escapeHtml(character.id)}" data-gold-field="${unit.key}" data-delta="-1" aria-label="${unit.label}減一">−</button>
                <input data-character-id="${escapeHtml(character.id)}" data-gold-field="${unit.key}" type="number" inputmode="numeric" min="0" value="${gold[unit.key]}" />
                <button type="button" data-action="adjust-character-gold" data-character-id="${escapeHtml(character.id)}" data-gold-field="${unit.key}" data-delta="1" aria-label="${unit.label}加一">+</button>
              </label>
            `,
          )
          .join("")}
      </div>
    </div>
  `;
}

function renderCompactStatControl(character, field, label, valueText) {
  return `
    <div class="compact-stat-control" data-character-id="${escapeHtml(character.id)}">
      <span>${label}</span>
      <button type="button" data-action="adjust-character-stat" data-character-id="${escapeHtml(character.id)}" data-stat-field="${field}" data-delta="-1" aria-label="${label}減少">−</button>
      <strong>${valueText}</strong>
      <button type="button" data-action="adjust-character-stat" data-character-id="${escapeHtml(character.id)}" data-stat-field="${field}" data-delta="1" aria-label="${label}增加">+</button>
    </div>
  `;
}

function renderCompactAttributeBadges(character) {
  return `
    <div class="compact-attribute-grid" aria-label="六大屬性">
      ${attributeFields
        .map(
          (field) => `
            <span class="compact-attribute-badge">
              <b>${field.label}</b>
              <strong>${character.attributes[field.key]}</strong>
            </span>
          `,
        )
        .join("")}
    </div>
  `;
}

function renderCompactDebuffChips(character) {
  const entries = sortStatusLabels("debuffs", character.debuffs);
  const presets = statusEffectGroups.debuffs || [];

  return `
    <div class="compact-debuff-chips" aria-label="${escapeHtml(character.name)}負面狀態">
      ${presets
        .map((effect) => {
          const isActive = entries.includes(effect.label);
          return `
            <button
              class="compact-debuff-chip ${isActive ? "is-active" : ""}"
              type="button"
              data-action="toggle-character-effect"
              data-character-id="${escapeHtml(character.id)}"
              data-effect-type="debuffs"
              data-effect-label="${escapeHtml(effect.label)}"
              aria-pressed="${isActive}"
            >
              ${escapeHtml(effect.label)}
            </button>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderEffectEditor(character, effectType, label) {
  const entries = sortStatusLabels(effectType, character[effectType]);
  const presets = statusEffectGroups[effectType] || [];

  return `
    <section class="effect-editor">
      <h4>${label}</h4>
      <div class="effect-chip-row" aria-label="${label}快速選擇">
        ${presets
          .map((effect) => {
            const isActive = entries.includes(effect.label);
            return `
              <button
                class="effect-chip ${isActive ? "is-active" : ""}"
                type="button"
                data-action="toggle-character-effect"
                data-character-id="${escapeHtml(character.id)}"
                data-effect-type="${effectType}"
                data-effect-label="${escapeHtml(effect.label)}"
                aria-pressed="${isActive}"
              >
                ${escapeHtml(effect.label)}
              </button>
            `;
          })
          .join("")}
      </div>
      <form class="inline-form compact" data-add-character-effect-form data-character-id="${escapeHtml(character.id)}" data-effect-type="${effectType}">
        <input data-character-effect-input type="text" placeholder="新增${label}" autocomplete="off" />
        <button type="submit">新增</button>
      </form>
      ${
        entries.length
          ? `<ul class="effect-list">
              ${entries
                .map(
                  (entry, index) => `
                    <li>
                      <span>${escapeHtml(entry)}</span>
                      <button type="button" data-action="delete-character-effect" data-character-id="${escapeHtml(character.id)}" data-effect-type="${effectType}" data-effect-index="${index}">刪除</button>
                    </li>
                  `,
                )
                .join("")}
            </ul>`
          : `<p class="empty-hint">尚無${label}</p>`
      }
    </section>
  `;
}

function getStatusHolders(characters, effectType, label) {
  return characters
    .filter((character) => sortStatusLabels(effectType, character[effectType]).includes(label))
    .map((character) => ({ name: character.name, color: character.color }));
}

function getCustomStatusLabels(characters, effectType) {
  const presetLabels = new Set((statusEffectGroups[effectType] || []).map((effect) => effect.label));
  const customLabels = new Set();

  characters.forEach((character) => {
    sortStatusLabels(effectType, character[effectType]).forEach((label) => {
      if (!presetLabels.has(label)) customLabels.add(label);
    });
  });

  return [...customLabels].sort((left, right) => left.localeCompare(right, "zh-Hant"));
}

function renderStatusLookupItems(characters, effectType) {
  const presetItems = statusEffectGroups[effectType] || [];
  const customItems = getCustomStatusLabels(characters, effectType).map((label) => ({
    id: `custom-${label}`,
    label,
    description: "自訂狀態，尚未設定說明。",
  }));
  const items = [...presetItems, ...customItems];

  if (!items.length) return `<p class="team-status-empty">尚無狀態。</p>`;

  return items
    .map((effect) => {
      const holders = getStatusHolders(characters, effectType, effect.label);
      const holderText = holders.length
        ? holders
            .map(
              (holder) => `
                <span class="team-status-holder" style="--character-color: ${escapeHtml(holder.color)}">
                  <span class="team-status-holder-dot" aria-hidden="true"></span>
                  ${escapeHtml(holder.name)}
                </span>
              `,
            )
            .join("")
        : "無角色";
      return `
        <article class="team-status-effect-row">
          <div class="team-status-effect-main">
            <strong>${escapeHtml(effect.label)}</strong>
            <small>${escapeHtml(effect.description || "尚未設定說明。")}</small>
          </div>
          <span class="team-status-holders">${holderText}</span>
        </article>
      `;
    })
    .join("");
}

function renderStatusLookupSection(characters, effectType, title) {
  return `
    <section class="team-status-section">
      <h4>${title}</h4>
      <div class="team-status-effect-list">
        ${renderStatusLookupItems(characters, effectType)}
      </div>
    </section>
  `;
}

function renderTeamStatusDrawer(characters, isOpen) {
  return `
    <button class="team-status-float-button" type="button" data-action="toggle-team-status" aria-expanded="${Boolean(isOpen)}" aria-controls="team-status-drawer">
      狀態
    </button>
    <aside id="team-status-drawer" class="team-status-drawer ${isOpen ? "is-open" : ""}" aria-label="狀態效果查詢" aria-hidden="${isOpen ? "false" : "true"}">
      <div class="team-status-drawer-head">
        <h3>狀態效果</h3>
        <button type="button" data-action="toggle-team-status" aria-label="關閉狀態效果查詢">關閉</button>
      </div>
      <div class="team-status-list">
        ${renderStatusLookupSection(characters, "buffs", "增益")}
        ${renderStatusLookupSection(characters, "debuffs", "負面")}
      </div>
    </aside>
  `;
}

function renderTeamCharacterDetails(character, title = "角色詳細") {
  return `
    <section class="editor-panel team-detail-panel" data-character-id="${escapeHtml(character.id)}">
      <div class="editor-heading">
        <h3>${title}</h3>
        <button class="danger-button" type="button" data-action="delete-character" data-character-id="${escapeHtml(character.id)}">刪除角色</button>
      </div>
      <label class="form-field form-field-full">
        <span>角色名稱</span>
        <input data-character-id="${escapeHtml(character.id)}" data-character-field="name" type="text" value="${escapeHtml(character.name)}" />
      </label>
      <label class="form-field form-field-full character-color-editor">
        <span>角色顏色</span>
        <select data-character-id="${escapeHtml(character.id)}" data-character-field="color">
          ${characterColorOptions
            .map(
              (option) => `
                <option value="${option.value}" ${character.color === option.value ? "selected" : ""}>${option.label}</option>
              `,
            )
            .join("")}
        </select>
      </label>
      <div class="stepper-grid">
        ${statFields
          .map((field) =>
            renderStepper({
              characterId: character.id,
              type: "stat",
              field: field.key,
              label: field.label,
              value: character.stats[field.key],
            }),
          )
          .join("")}
        ${renderGoldStepper(character)}
      </div>
      <h4>六屬性</h4>
      <div class="stepper-grid attribute-stepper-grid">
        ${attributeFields
          .map((field) =>
            renderStepper({
              characterId: character.id,
              type: "attribute",
              field: field.key,
              label: field.label,
              value: character.attributes[field.key],
            }),
          )
          .join("")}
      </div>
      <div class="effect-grid">
        ${renderEffectEditor(character, "buffs", "增益")}
        ${renderEffectEditor(character, "debuffs", "負面")}
      </div>
      <label class="form-field form-field-full">
        <span>角色備註</span>
        <textarea data-character-id="${escapeHtml(character.id)}" data-character-field="notes" rows="4">${escapeHtml(character.notes)}</textarea>
      </label>
    </section>
  `;
}

export function renderTeamStatusPage(state) {
  const characters = normalizeCharacters(state.characters);
  const current = getCurrentCharacter({ ...state, characters });
  const expandedId = getExpandedCharacterId(state, characters);
  const expandedCharacter = characters.find((character) => character.id === expandedId);

  if (!characters.length) {
    return `
      ${renderAddCharacterForm()}
      <section class="empty-panel">
        <strong>尚未建立角色</strong>
        <p>新增角色後，隊伍頁會以緊湊卡片顯示每位角色的 HP、壓力、希望、閃避、金錢與狀態。</p>
      </section>
    `;
  }

  return `
    <div class="team-page-grid">
      <div class="team-main-column">
        <section class="team-roster" aria-label="隊伍角色摘要">
          ${characters
            .map(
              (character) => `
                <article class="team-summary-card ${character.id === current?.id ? "is-current" : ""} ${character.id === expandedId ? "is-expanded" : ""}" style="--character-color: ${escapeHtml(character.color)}">
                  <div class="team-summary-head">
                    <button class="team-summary-name-button" type="button" data-action="expand-character" data-character-id="${escapeHtml(character.id)}">
                      <span class="team-summary-name">
                        <span class="team-summary-color-dot" aria-hidden="true"></span>
                        ${escapeHtml(character.name)}
                      </span>
                      <small>閃避 ${character.stats.evasion} · 金錢 ${formatGold(character.assets.gold)}</small>
                    </button>
                    <button class="team-edit-button" type="button" data-action="expand-character" data-character-id="${escapeHtml(character.id)}" aria-label="編輯 ${escapeHtml(character.name)}">⋯</button>
                  </div>
                  <div class="compact-stat-grid" aria-label="${escapeHtml(character.name)}主要數值">
                    ${renderCompactStatControl(character, "hp", "HP", `${character.stats.hp}/${character.stats.maxHp}`)}
                    ${renderCompactStatControl(character, "stress", "壓力", `${character.stats.stress}/${character.stats.maxStress}`)}
                    ${renderCompactStatControl(character, "hope", "希望", `${character.stats.hope}/6`)}
                    ${renderCompactStatControl(character, "shield", "護盾", `${character.stats.shield}/${character.stats.maxShield}`)}
                  </div>
                  ${renderCompactAttributeBadges(character)}
                  <div class="compact-effect-summary">
                    <span>增益：${renderEffectSummary(character.buffs, "buffs", 2)}</span>
                    <span>負面：${renderEffectSummary(character.debuffs, "debuffs", 2)}</span>
                  </div>
                  ${renderCompactDebuffChips(character)}
                </article>
              `,
            )
            .join("")}
        </section>
        ${expandedCharacter ? renderTeamCharacterDetails(expandedCharacter, "角色詳細編輯") : ""}
        <section class="team-add-panel">
          ${renderAddCharacterForm()}
        </section>
      </div>
      ${renderTeamStatusDrawer(characters, state.ui.isTeamStatusOpen)}
    </div>
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
      <label class="form-field form-field-full character-color-editor">
        <span>角色顏色</span>
        <select data-character-id="${escapeHtml(character.id)}" data-character-field="color">
          ${characterColorOptions
            .map(
              (option) => `
                <option value="${option.value}" ${character.color === option.value ? "selected" : ""}>${option.label}</option>
              `,
            )
            .join("")}
        </select>
      </label>
      <div class="stepper-grid">
        ${statFields
          .map(
            (field) =>
              renderStepper({
                characterId: character.id,
                type: "stat",
                field: field.key,
                label: field.label,
                value: character.stats[field.key],
              }),
          )
          .join("")}
      </div>
      <h4>六屬性</h4>
      <div class="stepper-grid attribute-stepper-grid">
        ${attributeFields
          .map(
            (field) =>
              renderStepper({
                characterId: character.id,
                type: "attribute",
                field: field.key,
                label: field.label,
                value: character.attributes[field.key],
              }),
          )
          .join("")}
      </div>
      <div class="effect-grid">
        ${renderEffectEditor(character, "buffs", "增益")}
        ${renderEffectEditor(character, "debuffs", "負面")}
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
      ${renderGoldStepper(character)}
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
