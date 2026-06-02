import { normalizeState } from "./state.js";
import { STORAGE_KEY } from "./storage.js";
import { getStatusDescription, sortStatusLabels, statusEffectGroups } from "./status-effects.js";

const app = document.getElementById("app");

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function loadCurrentState() {
  try {
    return normalizeState(JSON.parse(window.localStorage.getItem(STORAGE_KEY) || "{}"));
  } catch {
    return normalizeState({});
  }
}

function getCharacterEffects(character, effectType) {
  return sortStatusLabels(effectType, character?.[effectType] || []);
}

function getStatusHolders(characters, effectType, label) {
  return characters
    .filter((character) => getCharacterEffects(character, effectType).includes(label))
    .map((character) => ({ name: character.name, color: character.color }));
}

function getCustomStatusLabels(characters, effectType) {
  const presetLabels = new Set((statusEffectGroups[effectType] || []).map((effect) => effect.label));
  const customLabels = new Set();

  characters.forEach((character) => {
    getCharacterEffects(character, effectType).forEach((label) => {
      if (!presetLabels.has(label)) customLabels.add(label);
    });
  });

  return [...customLabels].sort((left, right) => left.localeCompare(right, "zh-Hant"));
}

function renderStatusItems(characters, effectType) {
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
      const description = effect.description || getStatusDescription(effectType, effect.label) || "尚未設定說明。";

      return `
        <article class="team-status-effect-row">
          <div class="team-status-effect-main">
            <strong>${escapeHtml(effect.label)}</strong>
            <small>${escapeHtml(description)}</small>
          </div>
          <span class="team-status-holders">${holderText}</span>
        </article>
      `;
    })
    .join("");
}

function renderStatusSection(characters, effectType, title) {
  return `
    <section class="team-status-section">
      <h4>${title}</h4>
      <div class="team-status-effect-list">
        ${renderStatusItems(characters, effectType)}
      </div>
    </section>
  `;
}

function compactTeamStatusDrawer() {
  const drawer = document.getElementById("team-status-drawer");
  if (!drawer || drawer.dataset.lookupReady === "true") return;

  const state = loadCurrentState();
  const characters = Array.isArray(state.characters) ? state.characters : [];

  drawer.dataset.lookupReady = "true";
  drawer.setAttribute("aria-label", "狀態效果查詢");
  drawer.innerHTML = `
    <div class="team-status-drawer-head">
      <h3>狀態效果</h3>
      <button type="button" data-action="toggle-team-status" aria-label="關閉狀態效果查詢">關閉</button>
    </div>
    <div class="team-status-list">
      ${renderStatusSection(characters, "buffs", "增益")}
      ${renderStatusSection(characters, "debuffs", "負面")}
    </div>
  `;
}

if (app) {
  const observer = new MutationObserver(compactTeamStatusDrawer);
  observer.observe(app, { childList: true, subtree: true });
  compactTeamStatusDrawer();
}
