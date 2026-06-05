const DEFAULT_VERSION_INFO = {
  version: "v2",
  label: "dm-kds-compact-monsters",
  commit: "9103f687a923cf3c0ee9d842842f9b8f4b3f7ffd",
  sourceCommit: "9103f687a923cf3c0ee9d842842f9b8f4b3f7ffd",
  versionCommit: "9103f687a923cf3c0ee9d842842f9b8f4b3f7ffd",
  updatedAt: "2026-06-06T00:00:00+08:00",
  note: "Add KDS-style DM tabs and denser monster board.",
};

const dmTabs = [
  ["overview", "總覽"],
  ["players", "玩家"],
  ["monsters", "怪物"],
  ["dice", "骰子"],
  ["shop", "商店"],
  ["public-info", "公開資訊"],
  ["audio", "音樂"],
];

function shortCommit(commit) {
  return commit ? String(commit).slice(0, 7) : "unknown";
}

function buildLabel(info) {
  return `${info.version} · ${info.label} · ${shortCommit(info.commit)}`;
}

function ensureBadgeStyle() {
  if (document.querySelector("[data-v2-version-style]")) return;

  const style = document.createElement("style");
  style.dataset.v2VersionStyle = "true";
  style.textContent = `
    .v2-version-badge {
      position: fixed;
      right: 8px;
      bottom: 6px;
      z-index: 18;
      padding: 2px 6px;
      border: 1px solid rgba(243, 234, 216, 0.08);
      border-radius: 999px;
      background: rgba(7, 17, 31, 0.72);
      color: rgba(243, 234, 216, 0.46);
      font-size: 10px;
      line-height: 1.4;
      pointer-events: none;
    }

    body:has(.player-bottom-tabs) .v2-version-badge {
      bottom: max(78px, calc(78px + env(safe-area-inset-bottom)));
    }

    .dm-kds-tabs {
      grid-column: 1 / -1;
      display: flex;
      gap: 5px;
      max-width: 100%;
      overflow-x: auto;
      padding: 2px 0 4px;
      scrollbar-width: thin;
    }

    .dm-kds-tab {
      flex: 0 0 auto;
      min-height: 30px;
      padding: 0 9px;
      border: 1px solid rgba(243, 234, 216, 0.12);
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.045);
      color: rgba(243, 234, 216, 0.78);
      font-size: 12px;
      font-weight: 800;
      white-space: nowrap;
      touch-action: manipulation;
    }

    .dm-kds-tab.is-active {
      border-color: rgba(199, 164, 93, 0.72);
      background: rgba(199, 164, 93, 0.18);
      color: #fff8e8;
    }

    @media (min-width: 760px) {
      .layout.is-dm .dm-kds-tabs {
        position: sticky;
        top: 8px;
        z-index: 12;
        margin-bottom: 2px;
        padding: 3px 0 5px;
        background: linear-gradient(180deg, rgba(7, 17, 31, 0.96), rgba(7, 17, 31, 0.72));
      }
    }
  `;
  document.head.appendChild(style);
}

function renderBadge(info) {
  ensureBadgeStyle();
  const badge = document.querySelector("[data-v2-version-badge]") || document.createElement("div");
  badge.className = "v2-version-badge";
  badge.dataset.v2VersionBadge = "true";
  badge.textContent = buildLabel(info);
  if (!badge.parentElement) document.body.appendChild(badge);
}

function syncDmKdsTabs() {
  const layout = document.querySelector("#app .layout.is-dm");
  if (!layout) return;

  const active = layout.querySelector(".sidebar-button.is-active, .dm-mobile-menu-button.is-active")?.dataset.page || "overview";
  let nav = layout.querySelector("[data-dm-kds-tabs]");
  if (!nav) {
    nav = document.createElement("nav");
    nav.className = "dm-kds-tabs";
    nav.dataset.dmKdsTabs = "true";
    nav.setAttribute("aria-label", "DM 快速切換");
    const sidebar = layout.querySelector(".sidebar-list");
    layout.insertBefore(nav, sidebar || layout.firstElementChild);
  }

  nav.innerHTML = dmTabs
    .map(
      ([id, label]) =>
        `<button class="dm-kds-tab ${id === active ? "is-active" : ""}" type="button" data-page="${id}" aria-pressed="${id === active}">${label}</button>`,
    )
    .join("");
}

async function loadVersionInfo() {
  let info = { ...DEFAULT_VERSION_INFO };

  try {
    const response = await fetch("./version.json", { cache: "no-store" });
    if (response.ok) {
      info = { ...info, ...(await response.json()) };
    }
  } catch {
    info = { ...DEFAULT_VERSION_INFO };
  }

  console.log(`TRPG Assistant v2 build: ${info.label} / ${shortCommit(info.commit)}`);
  renderBadge(info);
  syncDmKdsTabs();
}

const appRoot = document.querySelector("#app");
if (appRoot) {
  new MutationObserver(() => syncDmKdsTabs()).observe(appRoot, { childList: true, subtree: false });
  syncDmKdsTabs();
}

loadVersionInfo();
