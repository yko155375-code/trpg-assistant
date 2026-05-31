import { loadState, saveState, STORAGE_KEY } from "./modules/storage.js";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js";

const app = document.querySelector("#app");
let state = saveState(loadState());

function updateState(nextState) {
  state = saveState(nextState);
  render();
}

function renderModeButton(mode, label) {
  const isActive = state.ui.mode === mode;
  return `<button class="mode-button ${isActive ? "is-active" : ""}" type="button" data-mode="${mode}" aria-pressed="${isActive}">${label}</button>`;
}

function renderPageButton(page, className) {
  const activePageId = getActivePageId(state);
  const isActive = page.id === activePageId;
  return `<button class="${className} ${isActive ? "is-active" : ""}" type="button" data-page="${page.id}" aria-pressed="${isActive}">${page.label}</button>`;
}

function renderPanel() {
  const pages = getActivePages(state.ui.mode);
  const activePageId = getActivePageId(state);
  const page = pages.find((item) => item.id === activePageId) || pages[0];
  const modeLabel = state.ui.mode === "dm" ? "DM 端" : "玩家端";

  return `
    <section class="page-panel" aria-labelledby="active-page-title">
      <p class="eyebrow">${modeLabel} · v2 第一階段骨架</p>
      <h2 id="active-page-title">${page.label}</h2>
      <p class="placeholder">此頁目前是空白骨架。後續階段會依規格補上 ${page.label} 功能。</p>
      <div class="state-card" aria-label="目前狀態">
        <span><strong>目前模式：</strong>${state.ui.mode === "dm" ? "DM" : "玩家"}</span>
        <span><strong>目前頁面：</strong>${page.label}</span>
        <span><strong>localStorage key：</strong>${STORAGE_KEY}</span>
        <span><strong>最後更新：</strong>${state.meta.updatedAt}</span>
      </div>
    </section>
  `;
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const layoutClass = state.ui.mode === "dm" ? "layout is-dm" : "layout is-player";

  app.innerHTML = `
    <header class="app-header">
      <div class="brand-block">
        <p class="eyebrow">TRPG Assistant</p>
        <h1 class="app-title">v2 基礎架構</h1>
        <p class="app-subtitle">HTML / CSS / 原生 JS / ES Modules / localStorage</p>
      </div>
      <nav class="mode-switch" aria-label="模式切換">
        ${renderModeButton("player", "玩家")}
        ${renderModeButton("dm", "DM")}
      </nav>
    </header>

    <main class="${layoutClass}">
      <nav class="tab-list" aria-label="${state.ui.mode === "dm" ? "DM 分頁" : "玩家分頁"}">
        ${pages.map((page) => renderPageButton(page, "tab-button")).join("")}
      </nav>
      <nav class="sidebar-list" aria-label="DM 側邊欄">
        ${pages.map((page) => renderPageButton(page, "sidebar-button")).join("")}
      </nav>
      ${renderPanel()}
    </main>

    <p class="footer-note">TRPG Assistant v2 stage 1</p>
  `;
}

app.addEventListener("click", (event) => {
  const modeButton = event.target.closest("[data-mode]");
  const pageButton = event.target.closest("[data-page]");

  if (modeButton) {
    updateState(setMode(state, modeButton.dataset.mode));
    return;
  }

  if (pageButton) {
    updateState(setActivePage(state, pageButton.dataset.page));
  }
});

render();
