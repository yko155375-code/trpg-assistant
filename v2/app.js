import { loadState, saveState, STORAGE_KEY } from "./modules/storage.js";
import { getActivePageId, getActivePages, setActivePage, setMode } from "./modules/router.js";
import { renderDmPage } from "./modules/dm-view.js";
import { renderPlayerPage } from "./modules/player-view.js";

const app = document.querySelector("#app");
let state = saveState(loadState());
let isDmMenuOpen = false;

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

  if (state.ui.mode === "player") {
    return renderPlayerPage(page.id, state);
  }

  return renderDmPage(page.id, state);
}

function renderDmMobileNav(pages) {
  const activePage = pages.find((page) => page.id === getActivePageId(state)) || pages[0];

  return `
    <div class="dm-mobile-nav">
      <button class="dm-menu-button" type="button" data-dm-menu-toggle aria-expanded="${isDmMenuOpen}" aria-controls="dm-mobile-menu">
        <span aria-hidden="true">☰</span>
        <span>DM 選單</span>
      </button>
      <strong>${activePage.label}</strong>
    </div>
    <nav id="dm-mobile-menu" class="dm-mobile-menu ${isDmMenuOpen ? "is-open" : ""}" aria-label="DM 手機選單">
      ${pages.map((page) => renderPageButton(page, "dm-mobile-menu-button")).join("")}
    </nav>
  `;
}

function render() {
  const pages = getActivePages(state.ui.mode);
  const layoutClass = state.ui.mode === "dm" ? "layout is-dm" : "layout is-player";
  const isPlayerMode = state.ui.mode === "player";

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
      ${
        isPlayerMode
          ? `<nav class="tab-list player-bottom-tabs" aria-label="玩家分頁">
              ${pages.map((page) => renderPageButton(page, "tab-button")).join("")}
            </nav>`
          : renderDmMobileNav(pages)
      }
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
  const dmMenuButton = event.target.closest("[data-dm-menu-toggle]");

  if (dmMenuButton) {
    isDmMenuOpen = !isDmMenuOpen;
    render();
    return;
  }

  if (modeButton) {
    isDmMenuOpen = false;
    updateState(setMode(state, modeButton.dataset.mode));
    return;
  }

  if (pageButton) {
    isDmMenuOpen = false;
    updateState(setActivePage(state, pageButton.dataset.page));
  }
});

render();
