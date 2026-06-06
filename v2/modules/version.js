const DEFAULT_VERSION_INFO = {
  version: "v2",
  label: "advantage-active-style-fix",
  commit: "b1383f1e3e66a9c339ba96d3c8bca191e2efc5b7",
  sourceCommit: "b1383f1e3e66a9c339ba96d3c8bca191e2efc5b7",
  versionCommit: "b1383f1e3e66a9c339ba96d3c8bca191e2efc5b7",
  updatedAt: "2026-06-07T00:00:00+08:00",
  note: "Strengthen visible active state for player advantage and disadvantage dice controls.",
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
      color: #f3ead8;
    }
  `;
  document.head.appendChild(style);
}

function renderBadge(info) {
  ensureBadgeStyle();
  const existing = document.querySelector("[data-v2-version-badge]");
  const badge = existing || document.createElement("div");
  badge.dataset.v2VersionBadge = "true";
  badge.className = "v2-version-badge";
  badge.textContent = buildLabel(info);
  if (!existing) document.body.appendChild(badge);
  console.log(`TRPG Assistant v2 build: ${info.label} / ${info.commit}`);
}

async function getVersionInfo() {
  try {
    const response = await fetch("./version.json", { cache: "no-store" });
    if (!response.ok) throw new Error(`version fetch failed: ${response.status}`);
    return { ...DEFAULT_VERSION_INFO, ...(await response.json()) };
  } catch (error) {
    console.warn("TRPG Assistant v2 version fallback:", error);
    return DEFAULT_VERSION_INFO;
  }
}

function injectDmTabs() {
  const shell = document.querySelector(".dm-shell");
  const content = document.querySelector(".dm-content");
  if (!shell || !content || content.querySelector("[data-dm-kds-tabs]")) return;

  const current = document.querySelector(".dm-sidebar button.is-active")?.dataset.dmPage || "overview";
  const tabs = document.createElement("div");
  tabs.className = "dm-kds-tabs";
  tabs.dataset.dmKdsTabs = "true";
  tabs.innerHTML = dmTabs
    .map(([page, label]) => `<button type="button" class="dm-kds-tab ${page === current ? "is-active" : ""}" data-action="set-dm-page" data-dm-page="${page}">${label}</button>`)
    .join("");
  content.prepend(tabs);
}

function setupDmTabsObserver() {
  const observer = new MutationObserver(() => injectDmTabs());
  observer.observe(document.body, { childList: true, subtree: true });
  injectDmTabs();
}

getVersionInfo().then(renderBadge);
setupDmTabsObserver();
