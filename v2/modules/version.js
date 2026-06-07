const DEFAULT_VERSION_INFO = {
  version: "v2",
  label: "entry-rune-adventurer-nav",
  commit: "133294859e17408b1436b27ee9bd8e484a3c71c4",
  sourceCommit: "133294859e17408b1436b27ee9bd8e484a3c71c4",
  versionCommit: "133294859e17408b1436b27ee9bd8e484a3c71c4",
  updatedAt: "2026-06-07T00:00:00+08:00",
  note: "Set v2 default entry to player mode and add rune/adventurer navigation.",
};

export const VERSION_LABEL = DEFAULT_VERSION_INFO.label;

function shortCommit(commit) {
  return commit ? String(commit).slice(0, 7) : "unknown";
}

function buildLabel(info) {
  return `${info.version} · ${info.label} · ${shortCommit(info.commit)}`;
}

export function renderBuildLabel(info = DEFAULT_VERSION_INFO) {
  return buildLabel(info);
}

export function logBuildInfo(info = DEFAULT_VERSION_INFO) {
  console.log(`TRPG Assistant v2 build: ${info.label} / ${info.commit}`);
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
  logBuildInfo(info);
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

getVersionInfo().then(renderBadge);