import {
  addAssetEntry,
  addCharacter,
  addCharacterEffect,
  adjustCharacterAttribute,
  adjustCharacterGold,
  adjustCharacterMoney,
  adjustCharacterStat,
  deleteAssetEntry,
  deleteCharacter,
  deleteCharacterEffect,
  expandCharacter,
  normalizeAvatarUrl,
  selectCharacter,
  toggleCharacterEffect,
  updateAssetEntry,
  updateCharacterAttribute,
  updateCharacterField,
  updateCharacterGold,
  updateCharacterMoney,
  updateCharacterStat,
} from "./modules/characters.js?v=player-background-wanted-posters";
import { addRoll, appendFormulaToken, clearRolls, rollDuality, rollFormula } from "./modules/dice.js?v=player-background-wanted-posters";
import { renderDmPage } from "./modules/dm-view.js?v=player-background-wanted-posters";
import {
  addMonster,
  adjustMonsterValue,
  advanceMonsterRound,
  deleteMonster,
  expandMonster,
  resetMonsterRound,
  rollMonsterAction,
  updateMonster,
} from "./modules/monsters.js?v=player-background-wanted-posters";
import { renderPlayerPage } from "./modules/player-view.js?v=player-background-wanted-posters";
import { updatePublicInfoField } from "./modules/public-info.js?v=player-background-wanted-posters";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js?v=player-background-wanted-posters";
import { addShopItem, deleteShopItem, purchaseShopItem, updateShopItem } from "./modules/shop.js?v=player-background-wanted-posters";
import { createDefaultState, normalizeEncounters, normalizeIntroImageUrl, normalizePlayerBackgroundImageUrl, normalizeState } from "./modules/state.js?v=player-background-wanted-posters";
import { saveState, STORAGE_KEY } from "./modules/storage.js?v=player-background-wanted-posters";

const app = document.querySelector("#app");
const EDGE_MODES = new Set(["advantage", "disadvantage"]);
const VERSION_LABEL = "player-background-wanted-posters";
const OPENING_VIDEO_URL = "./assets/intro/opening.mp4";
const isSafeMode = new URLSearchParams(window.location.search).get("safe") === "1";
let state = null;
let isDmMenuOpen = false;
let isOpeningVisible = !isSafeMode;
let pendingDeleteCharacterId = "";
let openingFallbackTimer = null;
let bootFailed = false;
let bootPhase = "start";
let bootRawState = null;
let bootBackupKey = "";

function logBoot(phase, details = {}) {
  console.info("[TRPG v2 boot]", { phase, safeMode: isSafeMode, storageKey: STORAGE_KEY, ...details });
}

function buildSafeModeUrl() {
  const url = new URL(window.location.href);
  url.search = "";
  url.searchParams.set("safe", "1");
  return url.href;
}

function backupRawState(rawValue) {
  if (typeof rawValue !== "string" || !rawValue) return "";
  const backupKey = `trpg-assistant-v2-corrupt-backup-${Date.now()}`;
  window.localStorage.setItem(backupKey, rawValue);
  return backupKey;
}

function currentRawState() {
  if (typeof bootRawState === "string") return bootRawState;
  try { return window.localStorage.getItem(STORAGE_KEY) || ""; } catch { return ""; }
}

async function exportRawState(statusElement) {
  const raw = currentRawState();
  if (!raw) { statusElement.textContent = "目前沒有可備份的 v2 主資料。"; return; }
  try {
    await navigator.clipboard.writeText(raw);
    statusElement.textContent = "已將 v2 本機資料複製到剪貼簿。";
  } catch {
    const blob = new Blob([raw], { type: "application/json;charset=utf-8" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `trpg-assistant-v2-backup-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
    statusElement.textContent = "已下載 v2 本機資料備份。";
  }
}

function renderBootError(error, phase = bootPhase) {
  bootFailed = true;
  const errorObject = error instanceof Error ? error : new Error(String(error || "未知錯誤"));
  console.error("[TRPG v2 boot] failed", { phase, safeMode: isSafeMode, storageKey: STORAGE_KEY, backupKey: bootBackupKey, error: errorObject, stack: errorObject.stack });
  if (!app) return;
  app.innerHTML = `<section class="boot-guard-panel" role="alert"><p class="eyebrow">TRPG Assistant v2 啟動保護</p><h1>頁面沒有成功啟動</h1><dl class="boot-guard-details"><div><dt>錯誤階段</dt><dd>${escapeHtml(phase)}</dd></div><div><dt>錯誤訊息</dt><dd>${escapeHtml(errorObject.message)}</dd></div><div><dt>版本</dt><dd>${VERSION_LABEL}</dd></div><div><dt>主資料 key</dt><dd>${STORAGE_KEY}</dd></div>${bootBackupKey ? `<div><dt>備份 key</dt><dd>${escapeHtml(bootBackupKey)}</dd></div>` : ""}</dl><div class="boot-guard-actions"><button type="button" data-boot-action="safe">安全模式開啟</button><button type="button" data-boot-action="backup">備份目前本機資料</button><button class="danger-button" type="button" data-boot-action="clear">清除 v2 本機資料並重開</button></div><p class="boot-guard-status" data-boot-status>不會自動刪除任何資料。</p></section>`;
  const status = app.querySelector("[data-boot-status]");
  app.querySelector('[data-boot-action="safe"]')?.addEventListener("click", () => { window.location.href = buildSafeModeUrl(); });
  app.querySelector('[data-boot-action="backup"]')?.addEventListener("click", () => { exportRawState(status); });
  app.querySelector('[data-boot-action="clear"]')?.addEventListener("click", () => {
    try { window.localStorage.removeItem(STORAGE_KEY); }
    catch (clearError) { console.error("[TRPG v2 boot] clear storage failed", clearError); }
    finally { window.location.href = buildSafeModeUrl(); }
  });
}

function initializeState() {
  logBoot("start");
  if (isSafeMode) {
    bootPhase = "safeMode";
    state = normalizeState(createDefaultState());
    logBoot("normalizeState", { parsed: false, normalized: true, safeMode: true });
    return;
  }
  bootPhase = "loadState";
  bootRawState = window.localStorage.getItem(STORAGE_KEY);
  logBoot("loadState", { hasStoredState: Boolean(bootRawState) });
  let parsedState = createDefaultState();
  if (bootRawState) {
    bootPhase = "parseStorage";
    parsedState = JSON.parse(bootRawState);
    logBoot("parseStorage", { parsed: true });
  } else logBoot("parseStorage", { parsed: false, reason: "empty storage" });
  bootPhase = "normalizeState";
  state = normalizeState(parsedState);
  logBoot("normalizeState", { normalized: true });
  bootPhase = "saveState";
  state = saveState(state);
}

try { initializeState(); }
catch (error) {
  try { bootBackupKey = backupRawState(bootRawState); }
  catch (backupError) { console.error("[TRPG v2 boot] corrupt backup failed", backupError); }
  renderBootError(error, bootPhase);
}

function updateState(nextState) { state = isSafeMode ? normalizeState(nextState) : saveState(nextState); safeRender(); }
function saveStateOnly(nextState) { state = isSafeMode ? normalizeState(nextState) : saveState(nextState); }
function escapeHtml(value) { return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#039;"); }

function normalizeEncounterMonster(monster = {}) {
  const maxHp = Math.max(1, Number(monster.maxHp ?? monster.hp ?? 1) || 1);
  const hp = Math.min(maxHp, Math.max(0, Number(monster.hp ?? maxHp) || 0));
  const maxStress = Math.max(0, Number(monster.maxStress ?? monster.stress ?? 0) || 0);
  const stress = Math.min(maxStress, Math.max(0, Number(monster.stress ?? 0) || 0));
  return { name: String(monster.name || "未命名怪物").trim() || "未命名怪物", hp, maxHp, stress, maxStress, difficulty: Math.max(0, Number(monster.difficulty ?? 10) || 10), attack: String(monster.attack || monster.attackFormula || "").trim(), damage: String(monster.damage || monster.damageFormula || "").trim(), threshold: String(monster.threshold || "").trim(), notes: String(monster.notes || monster.note || "").trim(), tag: String(monster.tag || "").trim() };
}
function withEncounterMessage(nextState, message) { return { ...nextState, ui: { ...(nextState.ui || {}), encounterTemplateMessage: message } }; }
function saveCurrentEncounter(nextState, name) {
  const title = String(name || "").trim(); const monsters = Array.isArray(nextState.monsters) ? nextState.monsters : [];
  if (!title) return withEncounterMessage(nextState, "請先輸入遭遇名稱。");
  if (!monsters.length) return withEncounterMessage(nextState, "目前沒有怪物可儲存為遭遇。");
  const encounter = { id: `encounter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, name: title, monsters: monsters.map(normalizeEncounterMonster), createdAt: new Date().toISOString() };
  return withEncounterMessage({ ...nextState, encounters: [...normalizeEncounters(nextState.encounters), encounter] }, `已儲存遭遇：${title}`);
}
function loadEncounter(nextState, encounterId, mode = "replace") {
  const encounters = normalizeEncounters(nextState.encounters); const encounter = encounters.find((item) => item.id === encounterId);
  if (!encounter) return withEncounterMessage(nextState, "找不到遭遇模板。");
  let workingState = { ...nextState, encounters, monsters: mode === "append" ? [...(nextState.monsters || [])] : [], ui: { ...(nextState.ui || {}), expandedMonsterId: null } };
  encounter.monsters.forEach((monster) => { workingState = addMonster(workingState, { ...monster, hp: monster.hp ?? monster.maxHp ?? 1, stress: monster.stress ?? 0, isDead: false }); });
  return withEncounterMessage(workingState, mode === "append" ? `已追加遭遇：${encounter.name}` : `已載入遭遇：${encounter.name}`);
}
function deleteEncounter(nextState, encounterId) { return withEncounterMessage({ ...nextState, encounters: normalizeEncounters(nextState.encounters).filter((item) => item.id !== encounterId) }, "已刪除遭遇模板。"); }

function actorKeyFromElement(element) { const actor = element.closest("[data-roll-form]")?.dataset.rollActor || element.closest(".dice-panel")?.querySelector("[data-roll-form]")?.dataset.rollActor || "player"; return actor === "DM" ? "DM" : "player"; }
function setFormulaDraft(nextState, actor, formula) { return { ...nextState, ui: { ...(nextState.ui || {}), rollFormulaDrafts: { ...(nextState.ui?.rollFormulaDrafts || {}), [actor]: formula || "" } } }; }
function syncFormulaDraft(element, nextState = state) { const input = element.closest?.(".dice-panel")?.querySelector("[data-roll-formula]") || element.querySelector?.("[data-roll-formula]"); return input ? setFormulaDraft(nextState, actorKeyFromElement(input), input.value || "") : nextState; }
function enhanceDiceHtml(html, actor) {
  const key = actor === "DM" ? "DM" : "player"; const draft = escapeHtml(state.ui?.rollFormulaDrafts?.[key] || "");
  let output = html.replace(/<input data-roll-formula([^>]*)\/>/, `<input data-roll-formula$1 value="${draft}" />`);
  if (key === "player" && !output.includes("data-roll-edge-mode")) { const mode = state.ui?.rollEdgeMode || ""; const edge = `<div class="roll-edge-controls" data-roll-edge-controls><button class="roll-edge-button ${mode === "advantage" ? "is-active" : ""}" type="button" data-roll-edge-mode="advantage" aria-pressed="${mode === "advantage"}">優勢</button><button class="roll-edge-button ${mode === "disadvantage" ? "is-active" : ""}" type="button" data-roll-edge-mode="disadvantage" aria-pressed="${mode === "disadvantage"}">劣勢</button></div>`; output = output.replace("</form>", `</form>${edge}`); }
  return output;
}
function renderState() { return pendingDeleteCharacterId ? { ...state, ui: { ...state.ui, pendingDeleteCharacterId } } : state; }
function renderPanel() { const pages = getActivePages(state.ui.mode); const page = pages.find((item) => item.id === getActivePageId(state)) || pages[0]; const viewState = renderState(); if (state.ui.mode === "player") { const html = renderPlayerPage(page.id, viewState); return page.id === "dice" ? enhanceDiceHtml(html, "player") : html; } const html = renderDmPage(page.id, state); return page.id === "dice" ? enhanceDiceHtml(html, "DM") : html; }
function renderPageButton(page, className) { const active = page.id === getActivePageId(state); return `<button class="${className} ${active ? "is-active" : ""}" type="button" data-page="${page.id}" aria-pressed="${active}">${page.label}</button>`; }
function renderModeButton(mode, label) { const active = state.ui.mode === mode; return `<button class="mode-button ${active ? "is-active" : ""}" type="button" data-mode="${mode}" aria-pressed="${active}">${label}</button>`; }
function isRenderableAvatarUrl(value) { return typeof value === "string" && /^https?:\/\//i.test(value.trim()); }
function getCharacterInitial(name) { return Array.from(String(name || "?").trim() || "?")[0].toUpperCase(); }

function updateAvatarPreview(input) {
  const preview = input.closest("[data-avatar-preview-field]")?.querySelector("[data-avatar-preview]");
  if (!preview) return;
  const imageUrl = normalizeAvatarUrl(input.value);
  const hasImage = isRenderableAvatarUrl(imageUrl);
  const frame = preview.querySelector(".character-avatar-preview-frame");
  let image = preview.querySelector("[data-avatar-preview-img]");
  preview.classList.toggle("has-image", hasImage);
  if (hasImage && frame) {
    if (!image) {
      image = document.createElement("img");
      image.dataset.avatarPreviewImg = "";
      image.alt = "頭像預覽";
      frame.append(image);
    }
    image.hidden = false;
    image.src = imageUrl;
  } else if (image) {
    image.remove();
  }
  const message = preview.querySelector("[data-avatar-preview-message]");
  if (message) message.textContent = hasImage ? "頭像預覽" : "尚未設定頭像";
}
function renderCurrentCharacterBar() {
  const characters = Array.isArray(state.characters) ? state.characters : [];
  const current = characters.find((character) => character.id === state.ui?.selectedCharacterId) || characters[0] || null;
  if (!current) return `<section class="player-current-character-bar is-empty" aria-label="目前角色"><div><strong>尚無目前角色</strong><small>請先新增角色</small></div></section>`;
  const avatarUrl = isRenderableAvatarUrl(current.avatarUrl) ? current.avatarUrl.trim() : "";
  return `<section class="player-current-character-bar" aria-label="目前角色"><div class="player-current-character-avatar ${avatarUrl ? "has-image" : ""}" aria-label="${escapeHtml(current.name)}頭像"><span aria-hidden="true">${escapeHtml(getCharacterInitial(current.name))}</span>${avatarUrl ? `<img data-character-avatar src="${escapeHtml(avatarUrl)}" alt="${escapeHtml(current.name)}頭像" />` : ""}</div><div class="player-current-character-main"><label class="player-current-character-select"><span>目前角色</span><select data-character-select aria-label="切換目前角色">${characters.map((character) => `<option value="${escapeHtml(character.id)}" ${character.id === current.id ? "selected" : ""}>${escapeHtml(character.name)}</option>`).join("")}</select></label><div class="player-current-character-stats" aria-label="${escapeHtml(current.name)}目前狀態"><span><b>HP</b> ${current.stats.hp}/${current.stats.maxHp}</span><span><b>壓</b> ${current.stats.stress}/${current.stats.maxStress}</span><span><b>希</b> ${current.stats.hope}/6</span><span><b>盾</b> ${current.stats.shield}/${current.stats.maxShield}</span></div></div></section>`;
}
function renderOpeningEntry() {
  return `<section class="opening-entry-overlay"><video class="opening-entry-video" data-opening-video src="${OPENING_VIDEO_URL}" autoplay muted playsinline preload="auto"></video></section>`;
}
function finishOpeningEntry(reason = "") {
  if (!isOpeningVisible) return;
  if (openingFallbackTimer) {
    window.clearTimeout(openingFallbackTimer);
    openingFallbackTimer = null;
  }
  if (reason) console.warn(`[TRPG v2 opening] ${reason}`);
  isOpeningVisible = false;
  isDmMenuOpen = false;
  pendingDeleteCharacterId = "";
  const playerState = setMode(syncFormulaDraft(app), "player");
  updateState({ ...playerState, ui: { ...(playerState.ui || {}), playerPage: "characters" } });
}
function bindOpeningVideo() {
  const video = app.querySelector("[data-opening-video]");
  if (!video || video.dataset.openingBound === "true") return;
  video.dataset.openingBound = "true";
  let failed = false;
  const clearFallback = () => {
    if (openingFallbackTimer) {
      window.clearTimeout(openingFallbackTimer);
      openingFallbackTimer = null;
    }
  };
  const failOpen = (reason) => {
    if (failed) return;
    failed = true;
    finishOpeningEntry(reason);
  };
  openingFallbackTimer = window.setTimeout(() => failOpen("opening video did not start within 3 seconds"), 3000);
  video.addEventListener("playing", clearFallback, { once: true });
  video.addEventListener("ended", () => finishOpeningEntry(), { once: true });
  video.addEventListener("error", () => failOpen("opening video failed to load"), { once: true });
  const playResult = video.play();
  if (playResult && typeof playResult.catch === "function") {
    playResult.catch(() => failOpen("opening video autoplay was blocked"));
  }
}
function renderDmMobileNav(pages) { const active = pages.find((page) => page.id === getActivePageId(state)) || pages[0]; return `<div class="dm-mobile-nav"><button class="dm-menu-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}"><span aria-hidden="true">☰</span><span>DM 選單</span></button><strong>${escapeHtml(active.label)}</strong></div><nav id="dm-mobile-menu" class="dm-mobile-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 手機選單">${pages.map((page) => renderPageButton(page, "dm-mobile-menu-button")).join("")}</nav>`; }
function render() {
  const pages = getActivePages(state.ui.mode); const isPlayer = state.ui.mode === "player";
  app.innerHTML = `${isSafeMode ? `<aside class="safe-mode-banner">安全模式：目前未讀取舊本機資料</aside>` : ""}<header class="app-header"><div class="brand-block"><p class="eyebrow">TRPG Assistant</p><h1 class="app-title">v2</h1><p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p></div><nav class="mode-switch" aria-label="模式切換">${renderModeButton("player", "玩家")}${renderModeButton("dm", "DM")}</nav></header><main class="layout ${isPlayer ? "is-player" : "is-dm"}">${isPlayer ? `<nav class="tab-list player-bottom-tabs" aria-label="玩家分頁">${pages.map((page) => renderPageButton(page, "tab-button")).join("")}</nav>` : renderDmMobileNav(pages)}<nav class="sidebar-list" aria-label="DM 分頁">${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}</nav>${isPlayer ? renderCurrentCharacterBar() : ""}${renderPanel()}</main>${isOpeningVisible ? renderOpeningEntry() : ""}`;
  if (isOpeningVisible) bindOpeningVideo();
}
function safeRender() {
  try { bootPhase = "render"; render(); window.__TRPG_V2_BOOT_OK__ = true; window.clearTimeout(window.__TRPG_V2_BOOT_TIMER__); logBoot("render", { rendered: true }); }
  catch (error) { try { if (!isSafeMode && !bootBackupKey) bootBackupKey = backupRawState(currentRawState()); } catch (backupError) { console.error("[TRPG v2 boot] render backup failed", backupError); } renderBootError(error, "render"); }
}
function blurNear(element) { const input = element.closest?.(".dice-panel")?.querySelector("[data-roll-formula]"); if (input && document.activeElement === input) input.blur(); }
function rollD6() { return Math.floor(Math.random() * 6) + 1; }
function cancelPendingDeleteCharacter() { const hadPending = Boolean(pendingDeleteCharacterId); pendingDeleteCharacterId = ""; return hadPending; }
function applyEdge(roll, mode) { if (!EDGE_MODES.has(mode)) return roll; const die = rollD6(); const baseTotal = Number(roll.total) || 0; const finalTotal = mode === "advantage" ? baseTotal + die : baseTotal - die; return { ...roll, rollEdgeMode: mode, rollEdgeDie: die, baseTotal, total: finalTotal, edgeBreakdown: { mode, die, baseTotal, finalTotal }, note: mode === "advantage" ? "優勢骰 +1d6" : "劣勢骰 -1d6" }; }

function inferMusicSourceType(url) { const value = String(url || "").trim().toLowerCase(); if (!value) return "unknown"; if (value.includes("youtube.com/") || value.includes("youtu.be/")) return "youtube"; if (/\.(mp3|ogg|wav)(\?|#|$)/i.test(value)) return "audio"; return "url"; }
function splitMusicTags(value) { return String(value || "").split(/[,\s]+/).map((entry) => entry.trim()).filter(Boolean); }
function withMusicMessage(nextState, message) { return { ...nextState, ui: { ...(nextState.ui || {}), musicMessage: message } }; }
function addMusicTrack(nextState, values) { const url = String(values.url || "").trim(); if (!url) return withMusicMessage(nextState, "請先輸入音樂 URL。"); const title = String(values.title || "").trim() || url || "未命名音樂"; const scene = String(values.scene || "").trim(); const track = { id: `music-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, title, url, sourceType: inferMusicSourceType(url), tags: splitMusicTags(scene), scene, notes: String(values.notes || "").trim(), createdAt: new Date().toISOString() }; return withMusicMessage({ ...nextState, audio: { ...(nextState.audio || {}), tracks: [...(Array.isArray(nextState.audio?.tracks) ? nextState.audio.tracks : []), track] } }, `已新增音樂：${title}`); }
function playMusicTrack(nextState, trackId) { const tracks = Array.isArray(nextState.audio?.tracks) ? nextState.audio.tracks : []; const track = tracks.find((item) => item.id === trackId); if (!track) return withMusicMessage(nextState, "找不到這首音樂。"); return withMusicMessage({ ...nextState, audio: { ...(nextState.audio || {}), tracks, currentTrackId: track.id, isPlaying: true } }, `正在播放：${track.title}`); }
function stopMusicTrack(nextState, trackId) { const shouldStop = !trackId || nextState.audio?.currentTrackId === trackId; return withMusicMessage({ ...nextState, audio: { ...(nextState.audio || {}), currentTrackId: shouldStop ? null : nextState.audio?.currentTrackId || null, isPlaying: shouldStop ? false : Boolean(nextState.audio?.isPlaying) } }, "已停止播放。"); }
function deleteMusicTrack(nextState, trackId) { const tracks = Array.isArray(nextState.audio?.tracks) ? nextState.audio.tracks : []; const nextTracks = tracks.filter((track) => track.id !== trackId); const isCurrent = nextState.audio?.currentTrackId === trackId; return withMusicMessage({ ...nextState, audio: { ...(nextState.audio || {}), tracks: nextTracks, currentTrackId: isCurrent ? null : nextState.audio?.currentTrackId || null, isPlaying: isCurrent ? false : Boolean(nextState.audio?.isPlaying) } }, "已刪除音樂。"); }

function getIntroImages(nextState) { return Array.isArray(nextState.introImages?.images) ? nextState.introImages.images : []; }
function withIntroImageMessage(nextState, message) { return { ...nextState, ui: { ...(nextState.ui || {}), introImageMessage: message } }; }
function addIntroImage(nextState, values) {
  const originalUrl = String(values.url || "").trim();
  if (!originalUrl) return withIntroImageMessage(nextState, "請先輸入圖片網址。");
  const title = String(values.title || "").trim() || "未命名開頭圖片";
  const image = {
    id: `intro-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    url: normalizeIntroImageUrl(originalUrl),
    originalUrl,
    notes: String(values.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };
  return withIntroImageMessage({ ...nextState, introImages: { ...(nextState.introImages || {}), images: [...getIntroImages(nextState), image] } }, `已新增開頭圖片：${title}`);
}
function deleteIntroImage(nextState, imageId) {
  const images = getIntroImages(nextState);
  return withIntroImageMessage({ ...nextState, introImages: { ...(nextState.introImages || {}), images: images.filter((image) => image.id !== imageId) } }, "已刪除開頭圖片。");
}

function getPlayerBackgroundImages(nextState) {
  return Array.isArray(nextState.playerBackgroundImages?.images) ? nextState.playerBackgroundImages.images : [];
}
function withPlayerBackgroundImageMessage(nextState, message) {
  return { ...nextState, ui: { ...(nextState.ui || {}), playerBackgroundImageMessage: message } };
}
function addPlayerBackgroundImage(nextState, values) {
  const originalUrl = String(values.url || "").trim();
  if (!originalUrl) return withPlayerBackgroundImageMessage(nextState, "請先輸入玩家背景圖片網址。");
  const title = String(values.title || "").trim() || "未命名玩家背景圖片";
  const image = {
    id: `player-background-image-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    url: normalizePlayerBackgroundImageUrl(originalUrl),
    originalUrl,
    notes: String(values.notes || "").trim(),
    createdAt: new Date().toISOString(),
  };
  return withPlayerBackgroundImageMessage(
    {
      ...nextState,
      playerBackgroundImages: {
        ...(nextState.playerBackgroundImages || {}),
        images: [...getPlayerBackgroundImages(nextState), image],
      },
    },
    `已新增玩家背景圖片：${title}`,
  );
}
function deletePlayerBackgroundImage(nextState, imageId) {
  const images = getPlayerBackgroundImages(nextState);
  return withPlayerBackgroundImageMessage(
    {
      ...nextState,
      playerBackgroundImages: {
        ...(nextState.playerBackgroundImages || {}),
        images: images.filter((image) => image.id !== imageId),
      },
    },
    "已刪除玩家背景圖片。",
  );
}

if (!bootFailed) {
try {
app.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  if (modeButton) { event.preventDefault(); isDmMenuOpen = false; pendingDeleteCharacterId = ""; updateState(setMode(syncFormulaDraft(app), modeButton.dataset.mode)); return; }
  const dmMenuButton = event.target.closest("[data-dm-menu-toggle]");
  if (dmMenuButton) { event.preventDefault(); isDmMenuOpen = !isDmMenuOpen; safeRender(); return; }
  const pageButton = event.target.closest("[data-page]");
  if (pageButton) { event.preventDefault(); isDmMenuOpen = false; pendingDeleteCharacterId = ""; updateState(setActivePage(syncFormulaDraft(app), pageButton.dataset.page)); return; }
  const edgeButton = event.target.closest("[data-roll-edge-mode]");
  if (edgeButton) { event.preventDefault(); blurNear(edgeButton); const synced = syncFormulaDraft(edgeButton); const selected = edgeButton.dataset.rollEdgeMode; const current = synced.ui?.rollEdgeMode; updateState({ ...synced, ui: { ...(synced.ui || {}), rollEdgeMode: current === selected ? "" : selected } }); return; }
  const actionButton = event.target.closest("[data-action]");
  if (!actionButton) { if (cancelPendingDeleteCharacter()) safeRender(); return; }
  event.preventDefault();
  if (pendingDeleteCharacterId && actionButton.dataset.action !== "delete-character") pendingDeleteCharacterId = "";
  if (actionButton.dataset.action === "append-roll-token") { const input = actionButton.closest(".dice-panel")?.querySelector("[data-roll-formula]"); if (!input) return; input.value = appendFormulaToken(input.value, actionButton.dataset.rollToken); blurNear(actionButton); saveStateOnly(setFormulaDraft(state, actorKeyFromElement(input), input.value)); return; }
  if (actionButton.dataset.action === "roll-duality") return updateState(addRoll(syncFormulaDraft(actionButton), rollDuality({}), actionButton.dataset.rollActor || "玩家"));
  if (actionButton.dataset.action === "clear-rolls") return updateState(clearRolls(syncFormulaDraft(actionButton)));
  if (actionButton.dataset.action === "toggle-team-status") return updateState({ ...state, ui: { ...state.ui, isTeamStatusOpen: !state.ui.isTeamStatusOpen } });
  if (actionButton.dataset.action === "delete-character") { const characterId = actionButton.dataset.characterId; if (pendingDeleteCharacterId === characterId) { pendingDeleteCharacterId = ""; return updateState(deleteCharacter(state, characterId)); } pendingDeleteCharacterId = characterId; safeRender(); return; }
  if (actionButton.dataset.action === "expand-character") { pendingDeleteCharacterId = ""; return updateState(expandCharacter(state, actionButton.dataset.characterId)); }
  if (actionButton.dataset.action === "adjust-character-stat") return updateState(adjustCharacterStat(state, actionButton.dataset.characterId, actionButton.dataset.statField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-attribute") return updateState(adjustCharacterAttribute(state, actionButton.dataset.characterId, actionButton.dataset.attributeField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-money") return updateState(adjustCharacterMoney(state, actionButton.dataset.characterId, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "adjust-character-gold") return updateState(adjustCharacterGold(state, actionButton.dataset.characterId, actionButton.dataset.goldField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "toggle-character-effect") return updateState(toggleCharacterEffect(state, actionButton.dataset.characterId, actionButton.dataset.effectType, actionButton.dataset.effectLabel));
  if (actionButton.dataset.action === "delete-character-effect") return updateState(deleteCharacterEffect(state, actionButton.dataset.characterId, actionButton.dataset.effectType, Number(actionButton.dataset.effectIndex)));
  if (actionButton.dataset.action === "delete-asset-entry") return updateState(deleteAssetEntry(state, actionButton.dataset.characterId, actionButton.dataset.listKey, Number(actionButton.dataset.entryIndex)));
  if (actionButton.dataset.action === "delete-shop-item" && confirm("確定要刪除這個商品？")) return updateState(deleteShopItem(state, actionButton.dataset.shopItemId));
  if (actionButton.dataset.action === "purchase-shop-item") return updateState(purchaseShopItem(state, actionButton.dataset.shopItemId));
  if (actionButton.dataset.action === "delete-monster" && confirm("確定要刪除這隻怪物？")) return updateState(deleteMonster(state, actionButton.dataset.monsterId));
  if (actionButton.dataset.action === "adjust-monster") return updateState(adjustMonsterValue(state, actionButton.dataset.monsterId, actionButton.dataset.monsterField, Number(actionButton.dataset.delta)));
  if (actionButton.dataset.action === "expand-monster") return updateState(expandMonster(state, actionButton.dataset.monsterId));
  if (actionButton.dataset.action === "roll-monster-attack") return updateState(rollMonsterAction(state, actionButton.dataset.monsterId, "attack"));
  if (actionButton.dataset.action === "roll-monster-damage") return updateState(rollMonsterAction(state, actionButton.dataset.monsterId, "damage"));
  if (actionButton.dataset.action === "next-monster-round") return updateState(advanceMonsterRound(state));
  if (actionButton.dataset.action === "reset-monster-round" && confirm("確定要重設怪物回合？")) return updateState(resetMonsterRound(state));
  if (actionButton.dataset.action === "load-encounter-replace" && confirm("載入後會清空目前怪物，確定嗎？")) return updateState(loadEncounter(state, actionButton.dataset.encounterId, "replace"));
  if (actionButton.dataset.action === "load-encounter-append") return updateState(loadEncounter(state, actionButton.dataset.encounterId, "append"));
  if (actionButton.dataset.action === "add-player-background-image") {
    const form = actionButton.closest("[data-add-player-background-image-form]");
    return updateState(addPlayerBackgroundImage(state, {
      title: form?.querySelector("[data-new-player-background-title]")?.value || "",
      url: form?.querySelector("[data-new-player-background-url]")?.value || "",
      notes: form?.querySelector("[data-new-player-background-notes]")?.value || "",
    }));
  }
  if (actionButton.dataset.action === "delete-player-background-image") return updateState(deletePlayerBackgroundImage(state, actionButton.dataset.playerBackgroundImageId));
  if (actionButton.dataset.action === "delete-intro-image") return updateState(deleteIntroImage(state, actionButton.dataset.introImageId));
  if (actionButton.dataset.action === "play-music-track") return updateState(playMusicTrack(state, actionButton.dataset.trackId));
  if (actionButton.dataset.action === "stop-music-track") return updateState(stopMusicTrack(state, actionButton.dataset.trackId));
  if (actionButton.dataset.action === "delete-music-track" && confirm("確定刪除這首音樂？")) return updateState(deleteMusicTrack(state, actionButton.dataset.trackId));
  if (actionButton.dataset.action === "delete-encounter" && confirm("確定要刪除這個遭遇模板？")) return updateState(deleteEncounter(state, actionButton.dataset.encounterId));
  if (actionButton.dataset.action === "reset-v2-state" && confirm("確定要重設 v2 測試資料？")) return updateState(createDefaultState());
});

app.addEventListener("change", (event) => {
  const characterSelect = event.target.closest("[data-character-select]"); if (characterSelect) { pendingDeleteCharacterId = ""; return updateState(selectCharacter(state, characterSelect.value)); }
  const shopItemField = event.target.closest("[data-shop-item-field]"); if (shopItemField) return updateState(updateShopItem(state, shopItemField.dataset.shopItemId, shopItemField.dataset.shopItemField, shopItemField.value));
  const characterId = event.target.dataset.characterId; if (!characterId) return;
  if (event.target.dataset.characterField) return updateState(updateCharacterField(state, characterId, event.target.dataset.characterField, event.target.value));
  if (event.target.dataset.statField) return updateState(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
  if (event.target.dataset.attributeField) return updateState(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
  if (event.target.dataset.goldField) return updateState(updateCharacterGold(state, characterId, event.target.dataset.goldField, event.target.value));
  if (event.target.matches("[data-money-field]")) return updateState(updateCharacterMoney(state, characterId, event.target.value));
});

app.addEventListener("input", (event) => {
  if (event.target.matches("[data-avatar-url-input]")) updateAvatarPreview(event.target);
  if (event.target.matches("[data-roll-formula]")) return saveStateOnly(setFormulaDraft(state, actorKeyFromElement(event.target), event.target.value));
  const characterId = event.target.dataset.characterId;
  if (characterId) {
    if (event.target.dataset.characterField) return saveStateOnly(updateCharacterField(state, characterId, event.target.dataset.characterField, event.target.value));
    if (event.target.dataset.statField) return saveStateOnly(updateCharacterStat(state, characterId, event.target.dataset.statField, event.target.value));
    if (event.target.dataset.attributeField) return saveStateOnly(updateCharacterAttribute(state, characterId, event.target.dataset.attributeField, event.target.value));
    if (event.target.dataset.goldField) return saveStateOnly(updateCharacterGold(state, characterId, event.target.dataset.goldField, event.target.value));
    if (event.target.matches("[data-money-field]")) return saveStateOnly(updateCharacterMoney(state, characterId, event.target.value));
  }
  const assetEntryField = event.target.closest("[data-asset-entry-field]"); if (assetEntryField) return saveStateOnly(updateAssetEntry(state, assetEntryField.dataset.characterId, assetEntryField.dataset.listKey, Number(assetEntryField.dataset.entryIndex), assetEntryField.value));
  const publicInfoField = event.target.dataset.publicInfoField; if (publicInfoField) return saveStateOnly(updatePublicInfoField(state, publicInfoField, event.target.value));
  const shopItemField = event.target.closest("[data-shop-item-field]"); if (shopItemField) return saveStateOnly(updateShopItem(state, shopItemField.dataset.shopItemId, shopItemField.dataset.shopItemField, event.target.value));
  const monsterField = event.target.closest("[data-monster-field]"); if (monsterField) return saveStateOnly(updateMonster(state, monsterField.dataset.monsterId, monsterField.dataset.monsterField, event.target.value));
});

app.addEventListener("error", (event) => {
  const openingImage = event.target.closest?.("[data-opening-image]");
  if (openingImage) {
    openingImage.hidden = true;
    openingImage.closest(".opening-entry-thumb")?.classList.add("is-broken");
    return;
  }
  const introImage = event.target.closest?.("[data-intro-image-img]");
  if (introImage) {
    introImage.hidden = true;
    const preview = introImage.closest("[data-intro-image-preview]");
    preview?.classList.add("is-broken");
    const message = preview?.querySelector("[data-intro-image-message]");
    if (message) message.textContent = "無法載入圖片";
    return;
  }
  const playerBackgroundImage = event.target.closest?.("[data-player-background-img]");
  if (playerBackgroundImage) {
    playerBackgroundImage.hidden = true;
    const preview = playerBackgroundImage.closest("[data-player-background-preview]");
    preview?.classList.add("is-broken");
    const message = preview?.querySelector("[data-player-background-message]");
    if (message) message.textContent = "圖片無法載入";
    return;
  }
  const playerBackgroundPoster = event.target.closest?.("[data-player-background-poster-img]");
  if (playerBackgroundPoster) {
    playerBackgroundPoster.closest(".player-background-poster")?.remove();
    return;
  }
  const previewImage = event.target.closest?.("[data-avatar-preview-img]");
  if (previewImage) {
    previewImage.hidden = true;
    const preview = previewImage.closest("[data-avatar-preview]");
    preview?.classList.remove("has-image");
    const message = preview?.querySelector("[data-avatar-preview-message]");
    if (message) message.textContent = "無法載入頭像";
    return;
  }
  const avatar = event.target.closest?.("[data-character-avatar]");
  if (!avatar) return;
  avatar.hidden = true;
  avatar.closest(".player-current-character-avatar")?.classList.remove("has-image");
}, true);

app.addEventListener("submit", (event) => {
  const rollForm = event.target.closest("[data-roll-form]");
  if (rollForm) {
    event.preventDefault();
    const input = rollForm.querySelector("[data-roll-formula]"); const formula = input?.value || ""; const message = rollForm.parentElement.querySelector("[data-roll-message]"); const actor = rollForm.dataset.rollActor || "玩家"; const key = actorKeyFromElement(rollForm); const synced = setFormulaDraft(state, key, formula); const result = rollFormula(formula);
    if (!result.ok) { saveStateOnly(synced); if (message) message.textContent = result.error; return; }
    if (message) message.textContent = "";
    const mode = EDGE_MODES.has(synced.ui?.rollEdgeMode) ? synced.ui.rollEdgeMode : ""; const roll = mode ? applyEdge(result, mode) : result; const nextState = mode ? { ...synced, ui: { ...synced.ui, rollEdgeMode: "" } } : synced;
    return updateState(addRoll(nextState, roll, actor));
  }
  const addCharacterForm = event.target.closest("[data-add-character-form]"); if (addCharacterForm) { event.preventDefault(); return updateState(addCharacter(state, addCharacterForm.querySelector("[data-new-character-name]")?.value.trim() || "", addCharacterForm.querySelector("[data-new-character-color]")?.value, addCharacterForm.querySelector("[data-new-character-avatar]")?.value || "")); }
  const addCharacterEffectForm = event.target.closest("[data-add-character-effect-form]"); if (addCharacterEffectForm) { event.preventDefault(); return updateState(addCharacterEffect(state, addCharacterEffectForm.dataset.characterId, addCharacterEffectForm.dataset.effectType, addCharacterEffectForm.querySelector("[data-character-effect-input]")?.value || "")); }
  const addAssetForm = event.target.closest("[data-add-asset-form]"); if (addAssetForm) { event.preventDefault(); return updateState(addAssetEntry(state, addAssetForm.dataset.characterId, addAssetForm.dataset.listKey, addAssetForm.querySelector("[data-asset-entry-input]")?.value || "")); }
  const addShopItemForm = event.target.closest("[data-add-shop-item-form]"); if (addShopItemForm) { event.preventDefault(); return updateState(addShopItem(state, { name: addShopItemForm.querySelector("[data-new-shop-name]")?.value.trim() || "", type: addShopItemForm.querySelector("[data-new-shop-type]")?.value || "", price: addShopItemForm.querySelector("[data-new-shop-price]")?.value || 0, stock: addShopItemForm.querySelector("[data-new-shop-stock]")?.value || 0, description: addShopItemForm.querySelector("[data-new-shop-description]")?.value || "" })); }
  const addMonsterForm = event.target.closest("[data-add-monster-form]"); if (addMonsterForm) { event.preventDefault(); const values = Object.fromEntries(Array.from(addMonsterForm.querySelectorAll("[data-new-monster-field]")).map((input) => [input.dataset.newMonsterField, input.value])); return updateState(addMonster(state, values)); }
  const saveEncounterForm = event.target.closest("[data-save-encounter-form]"); if (saveEncounterForm) { event.preventDefault(); return updateState(saveCurrentEncounter(state, saveEncounterForm.querySelector("[data-encounter-name]")?.value || "")); }
  const addPlayerBackgroundImageForm = event.target.closest("[data-add-player-background-image-form]"); if (addPlayerBackgroundImageForm) { event.preventDefault(); return updateState(addPlayerBackgroundImage(state, { title: addPlayerBackgroundImageForm.querySelector("[data-new-player-background-title]")?.value || "", url: addPlayerBackgroundImageForm.querySelector("[data-new-player-background-url]")?.value || "", notes: addPlayerBackgroundImageForm.querySelector("[data-new-player-background-notes]")?.value || "" })); }
  const addIntroImageForm = event.target.closest("[data-add-intro-image-form]"); if (addIntroImageForm) { event.preventDefault(); return updateState(addIntroImage(state, { title: addIntroImageForm.querySelector("[data-new-intro-image-title]")?.value || "", url: addIntroImageForm.querySelector("[data-new-intro-image-url]")?.value || "", notes: addIntroImageForm.querySelector("[data-new-intro-image-notes]")?.value || "" })); }
  const addMusicForm = event.target.closest("[data-add-music-form]"); if (addMusicForm) { event.preventDefault(); return updateState(addMusicTrack(state, { title: addMusicForm.querySelector("[data-new-music-title]")?.value || "", url: addMusicForm.querySelector("[data-new-music-url]")?.value || "", scene: addMusicForm.querySelector("[data-new-music-scene]")?.value || "", notes: addMusicForm.querySelector("[data-new-music-notes]")?.value || "" })); }
});

app.addEventListener("wheel", (event) => {
  const stepper = event.target.closest("[data-number-stepper]"); if (!stepper) return; event.preventDefault(); const delta = event.deltaY < 0 ? 1 : -1; const { characterId, stepperType, stepperField } = stepper.dataset;
  if (stepperType === "stat") return updateState(adjustCharacterStat(state, characterId, stepperField, delta));
  if (stepperType === "attribute") return updateState(adjustCharacterAttribute(state, characterId, stepperField, delta));
  if (stepperType === "money") return updateState(adjustCharacterMoney(state, characterId, delta));
  if (stepperType === "gold") return updateState(adjustCharacterGold(state, characterId, stepperField, delta));
}, { passive: false });

safeRender();
} catch (error) {
  try { if (!isSafeMode && !bootBackupKey) bootBackupKey = backupRawState(currentRawState()); }
  catch (backupError) { console.error("[TRPG v2 boot] event binding backup failed", backupError); }
  renderBootError(error, "eventBinding");
}
}
