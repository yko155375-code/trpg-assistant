import {
  attributeFields,
  characterColorOptions,
  getCurrentCharacter,
  normalizeCharacters,
  renderAddCharacterForm,
  statFields,
} from "./characters.js";
import { formatGold, goldUnitFields, normalizeGold } from "./assets.js";
import { renderDicePanel } from "./dice.js";
import { renderMonsterManager, renderMonsterOverview } from "./monsters.js";
import { renderPublicInfoEditor } from "./public-info.js";
import { renderDmShopManager } from "./shop.js";
import { sortStatusLabels, statusEffectGroups } from "./status-effects.js";

const dmPageContent = {
  overview: {
    title: "總覽",
    summary: "集中查看本場遊戲的主持狀態。這裡只建立管理骨架，細節功能留到後續階段。",
    sections: ["目前場景", "玩家摘要", "怪物摘要", "恐懼點", "希望池"],
  },
  players: {
    title: "玩家",
    summary: "管理玩家角色資料、狀態與資源的入口占位。",
    sections: ["玩家列表", "角色狀態", "玩家資源"],
  },
  monsters: {
    title: "怪物",
    summary: "管理怪物、敵方單位與遭遇資料的入口占位。",
    sections: ["怪物列表", "敵方狀態", "遭遇摘要"],
  },
  dice: {
    title: "骰子",
    summary: "DM 擲骰工具與幕後擲骰紀錄的入口占位。",
    sections: ["DM 擲骰", "擲骰紀錄", "快速公式"],
  },
  shop: {
    title: "商店",
    summary: "商店商品與價格管理的入口占位。",
    sections: ["商品管理", "價格設定", "購買紀錄"],
  },
  "public-info": {
    title: "公開資訊",
    summary: "管理玩家可見場景、公告與線索的入口占位。",
    sections: ["目前場景", "公開公告", "公開線索"],
  },
  audio: {
    title: "音樂",
    summary: "音樂頁 MVP 只保留骨架，後續階段再接入音樂控制。",
    sections: ["背景音樂", "即時音效", "播放狀態"],
  },
};

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderDmEffectSummary(entries, effectType, maxVisible = 2) {
  const normalized = sortStatusLabels(effectType, entries);
  if (!normalized.length) return "無";

  const visible = normalized.slice(0, maxVisible).map(escapeHtml).join("、");
  const hiddenCount = normalized.length - maxVisible;
  return hiddenCount > 0 ? `${visible} +${hiddenCount}` : visible;
}

function renderDmCompactStatControl(character, field, label, valueText) {
  return `
    <div class="compact-stat-control" data-character-id="${escapeHtml(character.id)}">
      <span>${label}</span>
      <button type="button" data-action="adjust-character-stat" data-character-id="${escapeHtml(character.id)}" data-stat-field="${field}" data-delta="-1" aria-label="${label}減少">−</button>
      <strong>${valueText}</strong>
      <button type="button" data-action="adjust-character-stat" data-character-id="${escapeHtml(character.id)}" data-stat-field="${field}" data-delta="1" aria-label="${label}增加">+</button>
    </div>
  `;
}

function renderDmAttributeBadges(character) {
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

function renderDmDebuffChips(character) {
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

function renderDmStepper({ characterId, type, field, label, value }) {
  return `
    <label class="number-stepper" data-number-stepper data-character-id="${escapeHtml(characterId)}" data-stepper-type="${type}" data-stepper-field="${field}">
      <span>${label}</span>
      <button type="button" data-action="adjust-character-${type}" data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" data-delta="-1" aria-label="${label}減一">−</button>
      <input data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" type="number" inputmode="numeric" value="${value}" />
      <button type="button" data-action="adjust-character-${type}" data-character-id="${escapeHtml(characterId)}" data-${type}-field="${field}" data-delta="1" aria-label="${label}加一">+</button>
    </label>
  `;
}

function renderDmGoldStepper(character) {
  const gold = normalizeGold(character.assets.gold, character.assets.money);

  return `
    <div class="gold-stepper-group" aria-label="金幣">
      <strong class="gold-stepper-title">金幣 ${formatGold(gold)}</strong>
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

function renderDmEffectEditor(character, effectType, label) {
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

function renderDmCharacterDetails(character) {
  return `
    <section class="editor-panel team-detail-panel" data-character-id="${escapeHtml(character.id)}">
      <div class="editor-heading">
        <h3>DM 角色詳細編輯</h3>
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
            renderDmStepper({
              characterId: character.id,
              type: "stat",
              field: field.key,
              label: field.label,
              value: character.stats[field.key],
            }),
          )
          .join("")}
        ${renderDmGoldStepper(character)}
      </div>
      <h4>六屬性</h4>
      <div class="stepper-grid attribute-stepper-grid">
        ${attributeFields
          .map((field) =>
            renderDmStepper({
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
        ${renderDmEffectEditor(character, "buffs", "增益")}
        ${renderDmEffectEditor(character, "debuffs", "負面")}
      </div>
      <label class="form-field form-field-full">
        <span>角色備註</span>
        <textarea data-character-id="${escapeHtml(character.id)}" data-character-field="notes" rows="4">${escapeHtml(character.notes)}</textarea>
      </label>
    </section>
  `;
}

function renderDmCharacterManager(state) {
  const characters = normalizeCharacters(state.characters);
  const current = getCurrentCharacter({ ...state, characters });
  const expandedId = characters.some((character) => character.id === state.ui.expandedCharacterId)
    ? state.ui.expandedCharacterId
    : null;
  const expandedCharacter = characters.find((character) => character.id === expandedId);

  if (!characters.length) {
    return `
      <section class="empty-panel">
        <strong>尚未建立角色</strong>
        <p>新增角色後，DM 玩家頁會以緊湊卡片快速管理全隊 HP、壓力、希望、護盾與狀態。</p>
      </section>
      <section class="team-add-panel">
        ${renderAddCharacterForm()}
      </section>
    `;
  }

  return `
    <div class="team-page-grid dm-player-compact">
      <div class="team-main-column">
        <section class="team-roster" aria-label="DM 玩家精簡管理">
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
                      <small>閃避 ${character.stats.evasion} · 金幣 ${formatGold(character.assets.gold)}</small>
                    </button>
                    <button class="team-edit-button" type="button" data-action="expand-character" data-character-id="${escapeHtml(character.id)}" aria-label="編輯 ${escapeHtml(character.name)}">⋯</button>
                  </div>
                  <div class="compact-stat-grid" aria-label="${escapeHtml(character.name)}主要數值">
                    ${renderDmCompactStatControl(character, "hp", "HP", `${character.stats.hp}/${character.stats.maxHp}`)}
                    ${renderDmCompactStatControl(character, "stress", "壓力", `${character.stats.stress}/${character.stats.maxStress}`)}
                    ${renderDmCompactStatControl(character, "hope", "希望", `${character.stats.hope}/6`)}
                    ${renderDmCompactStatControl(character, "shield", "護盾", `${character.stats.shield}/${character.stats.maxShield}`)}
                  </div>
                  ${renderDmAttributeBadges(character)}
                  <div class="compact-effect-summary">
                    <span>增益：${renderDmEffectSummary(character.buffs, "buffs", 2)}</span>
                    <span>負面：${renderDmEffectSummary(character.debuffs, "debuffs", 2)}</span>
                  </div>
                  ${renderDmDebuffChips(character)}
                </article>
              `,
            )
            .join("")}
        </section>
        ${expandedCharacter ? renderDmCharacterDetails(expandedCharacter) : ""}
        <section class="team-add-panel">
          ${renderAddCharacterForm()}
        </section>
      </div>
    </div>
  `;
}

export function renderDmPage(pageId, state) {
  const page = dmPageContent[pageId] || dmPageContent.overview;
  const characterCount = Array.isArray(state.characters) ? state.characters.length : 0;
  const monsterCount = Array.isArray(state.monsters) ? state.monsters.length : 0;

  if (pageId === "overview") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 總覽</p>
          <h2 id="active-page-title">總覽</h2>
          <p class="placeholder">集中查看本場遊戲的主持狀態。</p>
        </div>
        <div class="dm-section-grid" aria-label="總覽管理區塊">
          <article class="dm-section-card">
            <span>目前場景</span>
            <small>${state.session.scene || "尚未設定"}</small>
          </article>
          <article class="dm-section-card">
            <span>玩家摘要</span>
            <small>玩家數：${characterCount}</small>
          </article>
          ${renderMonsterOverview(state)}
          <article class="dm-section-card">
            <span>恐懼點</span>
            <small>${state.session.fear}/12</small>
          </article>
          <article class="dm-section-card">
            <span>希望池</span>
            <small>${state.session.hopePool}</small>
          </article>
          <article class="dm-section-card">
            <span>測試資料</span>
            <small>重設後會清空 v2 localStorage 狀態。</small>
            <button class="danger-button" type="button" data-action="reset-v2-state">重設 v2 測試資料</button>
          </article>
        </div>
      </section>
    `;
  }

  if (pageId === "players") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 玩家管理</p>
          <h2 id="active-page-title">玩家</h2>
          <p class="placeholder">新增、選擇、編輯、刪除角色，並管理同一份角色狀態與資產。</p>
        </div>
        ${renderDmCharacterManager(state)}
      </section>
    `;
  }

  if (pageId === "dice") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 骰子</p>
          <h2 id="active-page-title">骰子</h2>
          <p class="placeholder">DM 擲骰與二元骰會寫入同一份擲骰紀錄。</p>
        </div>
        ${renderDicePanel(state, { actor: "DM", title: "DM 擲骰" })}
      </section>
    `;
  }

  if (pageId === "public-info") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 公開資訊</p>
          <h2 id="active-page-title">公開資訊</h2>
          <p class="placeholder">編輯玩家端可查看的場景、線索、任務目標與公告。</p>
        </div>
        ${renderPublicInfoEditor(state)}
      </section>
    `;
  }

  if (pageId === "shop") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 商店</p>
          <h2 id="active-page-title">商店</h2>
          <p class="placeholder">管理商品資料、庫存與購買紀錄。</p>
        </div>
        ${renderDmShopManager(state)}
      </section>
    `;
  }

  if (pageId === "monsters") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 怪物</p>
          <h2 id="active-page-title">怪物</h2>
          <p class="placeholder">新增、編輯、刪除怪物，並快速調整 HP 與壓力。</p>
        </div>
        ${renderMonsterManager(state)}
      </section>
    `;
  }

  return `
    <section class="dm-page-card" aria-labelledby="active-page-title">
      <div class="dm-page-heading">
        <p class="eyebrow">DM 端 · 管理骨架</p>
        <h2 id="active-page-title">${page.title}</h2>
        <p class="placeholder">${page.summary}</p>
      </div>
      <div class="dm-section-grid" aria-label="${page.title}管理區塊">
        ${page.sections
          .map(
            (section) => `
              <article class="dm-section-card">
                <span>${section}</span>
                <small>占位</small>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="state-card" aria-label="DM 端狀態">
        <span><strong>目前頁面：</strong>${page.title}</span>
        <span><strong>玩家數：</strong>${characterCount}</span>
        <span><strong>怪物數：</strong>${monsterCount}</span>
        <span><strong>恐懼點：</strong>${state.session.fear}/12</span>
        <span><strong>希望池：</strong>${state.session.hopePool}</span>
      </div>
    </section>
  `;
}
