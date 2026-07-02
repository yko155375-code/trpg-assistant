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

function normalizeUrl(value) {
  return String(value || "").trim();
}

function getAudioTracks(state) {
  return Array.isArray(state.audio?.tracks) ? state.audio.tracks : [];
}

function getAudioSourceType(url) {
  const value = normalizeUrl(url).toLowerCase();
  if (!value) return "unknown";
  if (value.includes("youtube.com/") || value.includes("youtu.be/")) return "youtube";
  if (/\.(mp3|ogg|wav)(\?|#|$)/i.test(value)) return "audio";
  return "url";
}

function getYoutubeEmbedUrl(url) {
  try {
    const parsed = new URL(url);
    let videoId = "";
    if (parsed.hostname.includes("youtu.be")) videoId = parsed.pathname.replace("/", "");
    else if (parsed.hostname.includes("youtube.com")) videoId = parsed.searchParams.get("v") || "";
    if (!videoId && parsed.pathname.includes("/embed/")) videoId = parsed.pathname.split("/embed/")[1] || "";
    return videoId ? `https://www.youtube.com/embed/${encodeURIComponent(videoId)}` : "";
  } catch {
    return "";
  }
}

function getIntroImages(state) {
  return Array.isArray(state.introImages?.images) ? state.introImages.images : [];
}

function getIntroImageSourceLabel(image) {
  const source = normalizeUrl(image.originalUrl || image.url).toLowerCase();
  if (source.includes("drive.google.com")) return "Google Drive";
  if (/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(source)) return "圖片 URL";
  return "URL";
}

function renderIntroImageCard(image) {
  const title = escapeHtml(image.title || "未命名開頭圖片");
  const sourceLabel = getIntroImageSourceLabel(image);
  const displayUrl = normalizeUrl(image.originalUrl || image.url);
  return `
    <article class="intro-image-card">
      <div class="intro-image-preview" data-intro-image-preview>
        <span data-intro-image-message>圖片預覽</span>
        <img data-intro-image-img src="${escapeHtml(image.url)}" alt="${title}" loading="lazy" />
      </div>
      <div class="intro-image-body">
        <div class="intro-image-title-row">
          <strong>${title}</strong>
          <span class="intro-image-source-badge">${escapeHtml(sourceLabel)}</span>
        </div>
        <span class="intro-image-url">${escapeHtml(displayUrl)}</span>
        ${image.notes ? `<p class="intro-image-notes">${escapeHtml(image.notes)}</p>` : ""}
      </div>
      <button class="danger-button intro-image-delete-button" type="button" data-action="delete-intro-image" data-intro-image-id="${escapeHtml(image.id)}">刪除</button>
    </article>
  `;
}

function renderDmIntroImagesManager(state) {
  const images = getIntroImages(state);
  return `
    <section class="intro-image-manager" aria-label="開頭圖片">
      <div class="intro-image-heading">
        <div>
          <p class="eyebrow">開場素材</p>
          <h3>開頭圖片</h3>
        </div>
        <p>可貼一般圖片網址或 Google Drive 分享連結。</p>
      </div>
      <form class="intro-image-add-form" data-add-intro-image-form>
        <label class="form-field">
          <span>圖片名稱</span>
          <input data-new-intro-image-title type="text" placeholder="飛散羊皮紙" autocomplete="off" />
        </label>
        <label class="form-field intro-image-url-field">
          <span>圖片網址</span>
          <input data-new-intro-image-url type="url" placeholder="圖片 URL 或 Google Drive 分享連結" autocomplete="off" />
        </label>
        <label class="form-field intro-image-notes-field">
          <span>備註</span>
          <input data-new-intro-image-notes type="text" placeholder="可留空" autocomplete="off" />
        </label>
        <button class="intro-image-add-button" type="submit">新增</button>
      </form>
      ${state.ui?.introImageMessage ? `<p class="intro-image-message">${escapeHtml(state.ui.introImageMessage)}</p>` : ""}
      <div class="intro-image-grid" aria-label="開頭圖片清單">
        ${
          images.length
            ? images.map(renderIntroImageCard).join("")
            : `<p class="empty-hint">尚未加入開頭圖片。</p>`
        }
      </div>
    </section>
  `;
}

function getPlayerBackgroundImages(state) {
  return Array.isArray(state.playerBackgroundImages?.images) ? state.playerBackgroundImages.images : [];
}

function getPlayerBackgroundImageSourceLabel(image) {
  const source = normalizeUrl(image.originalUrl || image.url).toLowerCase();
  if (source.includes("drive.google.com")) return "Google Drive";
  if (/\.(jpg|jpeg|png|webp|gif)(\?|#|$)/i.test(source)) return "圖片 URL";
  return "URL";
}

function renderPlayerBackgroundImageCard(image) {
  const title = escapeHtml(image.title || "未命名玩家背景圖片");
  const sourceLabel = getPlayerBackgroundImageSourceLabel(image);
  const displayUrl = normalizeUrl(image.originalUrl || image.url);
  return `
    <article class="player-background-card">
      <div class="player-background-preview" data-player-background-preview>
        <span data-player-background-message>圖片預覽</span>
        <img data-player-background-img src="${escapeHtml(image.url)}" alt="${title}" loading="lazy" />
      </div>
      <div class="player-background-body">
        <div class="player-background-title-row">
          <strong>${title}</strong>
          <span class="player-background-source-badge">${escapeHtml(sourceLabel)}</span>
        </div>
        <span class="player-background-url">${escapeHtml(displayUrl)}</span>
        ${image.notes ? `<p class="player-background-notes">${escapeHtml(image.notes)}</p>` : ""}
      </div>
      <button class="danger-button player-background-delete-button" type="button" data-action="delete-player-background-image" data-player-background-image-id="${escapeHtml(image.id)}">刪除</button>
    </article>
  `;
}

function renderDmPlayerBackgroundImagesManager(state) {
  const images = getPlayerBackgroundImages(state);
  return `
    <section class="player-background-manager" aria-label="玩家背景圖片">
      <div class="player-background-heading">
        <div>
          <p class="eyebrow">玩家背景</p>
          <h3>玩家背景圖片</h3>
        </div>
        <p>支援 Google Drive 圖片分享連結，會嘗試轉成較大的 thumbnail URL。</p>
      </div>
      <form class="player-background-add-form" data-add-player-background-image-form>
        <label class="form-field">
          <span>圖片名稱</span>
          <input data-new-player-background-title type="text" placeholder="懸賞單或任務名稱" autocomplete="off" />
        </label>
        <label class="form-field player-background-url-field">
          <span>圖片網址</span>
          <input data-new-player-background-url type="url" placeholder="圖片 URL 或 Google Drive 分享連結" autocomplete="off" />
        </label>
        <label class="form-field player-background-notes-field">
          <span>備註 optional</span>
          <input data-new-player-background-notes type="text" placeholder="簡短備註" autocomplete="off" />
        </label>
        <button class="player-background-add-button" type="button" data-action="add-player-background-image">新增</button>
      </form>
      ${state.ui?.playerBackgroundImageMessage ? `<p class="player-background-message">${escapeHtml(state.ui.playerBackgroundImageMessage)}</p>` : ""}
      <div class="player-background-grid" aria-label="玩家背景圖片清單">
        ${
          images.length
            ? images.map(renderPlayerBackgroundImageCard).join("")
            : `<p class="empty-hint">尚未新增玩家背景圖片。</p>`
        }
      </div>
    </section>
  `;
}

function renderMusicPlayer(track) {
  if (!track) {
    return `
      <section class="music-player-panel is-empty">
        <strong>尚未播放音樂</strong>
        <span>從下方清單選一首音樂開始播放。</span>
      </section>
    `;
  }

  const type = track.sourceType || getAudioSourceType(track.url);
  const url = normalizeUrl(track.url);
  const title = escapeHtml(track.title || "未命名音樂");

  if (type === "youtube") {
    const embedUrl = getYoutubeEmbedUrl(url);
    return `
      <section class="music-player-panel">
        <div class="music-player-heading">
          <strong>${title}</strong>
          <span>YouTube</span>
        </div>
        ${
          embedUrl
            ? `<iframe class="music-youtube-player" title="${title}" src="${escapeHtml(embedUrl)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`
            : `<p class="music-warning">此 YouTube 網址無法轉成可嵌入播放器。</p>`
        }
      </section>
    `;
  }

  if (type === "audio") {
    return `
      <section class="music-player-panel">
        <div class="music-player-heading">
          <strong>${title}</strong>
          <span>Audio URL</span>
        </div>
        <audio class="music-audio-player" controls src="${escapeHtml(url)}"></audio>
      </section>
    `;
  }

  return `
    <section class="music-player-panel">
      <div class="music-player-heading">
        <strong>${title}</strong>
        <span>URL</span>
      </div>
      <p class="music-warning">此網址可能無法直接播放，但已保存於清單。</p>
      <a class="music-external-link" href="${escapeHtml(url)}" target="_blank" rel="noreferrer">開啟原始連結</a>
    </section>
  `;
}

function renderMusicTrackRow(track, currentTrackId) {
  const type = track.sourceType || getAudioSourceType(track.url);
  const tag = track.scene || track.tags?.[0] || "未分類";
  const isCurrent = track.id === currentTrackId;

  return `
    <article class="music-track-row ${isCurrent ? "is-current" : ""}">
      <div class="music-track-main">
        <strong>${escapeHtml(track.title || "未命名音樂")}</strong>
        <span>${escapeHtml(track.url)}</span>
      </div>
      <span class="music-source-badge">${type === "youtube" ? "YouTube" : type === "audio" ? "Audio" : "URL"}</span>
      <span class="music-scene-chip">${escapeHtml(tag)}</span>
      <div class="music-track-actions">
        <button type="button" data-action="play-music-track" data-track-id="${escapeHtml(track.id)}">播放</button>
        <button type="button" data-action="stop-music-track" data-track-id="${escapeHtml(track.id)}">停止</button>
        <button class="danger-button" type="button" data-action="delete-music-track" data-track-id="${escapeHtml(track.id)}">刪除</button>
      </div>
    </article>
  `;
}

function renderDmAudioManager(state) {
  const tracks = getAudioTracks(state);
  const currentTrack = tracks.find((track) => track.id === state.audio?.currentTrackId && state.audio?.isPlaying);

  return `
    <div class="music-manager">
      <form class="music-add-form" data-add-music-form>
        <label class="form-field">
          <span>名稱</span>
          <input data-new-music-title type="text" placeholder="酒館夜曲" autocomplete="off" />
        </label>
        <label class="form-field music-url-field">
          <span>URL</span>
          <input data-new-music-url type="url" placeholder="YouTube 或 mp3 / ogg / wav URL" autocomplete="off" />
        </label>
        <label class="form-field">
          <span>場景 / 標籤</span>
          <input data-new-music-scene type="text" placeholder="酒館、戰鬥、探索" autocomplete="off" />
        </label>
        <label class="form-field music-notes-field">
          <span>備註</span>
          <input data-new-music-notes type="text" placeholder="可留空" autocomplete="off" />
        </label>
        <button class="music-add-button" type="submit">新增</button>
      </form>
      ${state.ui?.musicMessage ? `<p class="music-form-message">${escapeHtml(state.ui.musicMessage)}</p>` : ""}
      ${renderMusicPlayer(currentTrack)}
      <section class="music-track-list" aria-label="音樂清單">
        ${
          tracks.length
            ? tracks.map((track) => renderMusicTrackRow(track, state.audio?.currentTrackId)).join("")
            : `<p class="empty-hint">尚未加入音樂。貼上 YouTube 或音訊 URL 後即可保存。</p>`
        }
      </section>
    </div>
  `;
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

function renderDmPersistencePanel(state) {
  const status = state.ui?.persistenceStatus || {};
  const label = status.label || "尚未保存";
  const statusClass = status.status ? `is-${escapeHtml(status.status)}` : "is-idle";
  const lastSaved = status.lastSavedText || "尚無紀錄";
  const message = status.message || "每次修改會立即寫入目前瀏覽器的 localStorage。";

  return `
    <section class="dm-persistence-panel ${statusClass}" aria-label="資料保存狀態">
      <div class="dm-persistence-main">
        <p class="eyebrow">資料保存狀態</p>
        <strong>${escapeHtml(label)}</strong>
        <span>上次保存時間：${escapeHtml(lastSaved)}</span>
        <small>${escapeHtml(message)}</small>
      </div>
      <div class="dm-persistence-actions">
        <button type="button" data-action="export-v2-state">匯出 JSON</button>
        <label class="dm-persistence-import">
          <span>匯入 JSON</span>
          <input data-import-state-file type="file" accept="application/json,.json" />
        </label>
      </div>
      <ul class="dm-persistence-notes">
        <li>localhost 測試資料與正式 GitHub Pages 資料不共用。</li>
        <li>不同裝置 / 不同瀏覽器資料不共用。</li>
        <li>正式使用前建議定期匯出備份。</li>
      </ul>
    </section>
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
        ${renderDmPersistencePanel(state)}
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

  if (pageId === "audio") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 音樂</p>
          <h2 id="active-page-title">音樂</h2>
          <p class="placeholder">貼上 YouTube 或直接音訊 URL，建立跑團場景音樂清單。</p>
        </div>
        ${renderDmPlayerBackgroundImagesManager(state)}
        ${renderDmAudioManager(state)}
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
