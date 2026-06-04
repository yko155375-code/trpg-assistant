const DEFAULT_VERSION_INFO = {
  version: "v2",
  label: "value-thresholds",
  commit: "9399d91ef429401e27961526b66de912f8f54adf",
  sourceCommit: "9399d91ef429401e27961526b66de912f8f54adf",
  versionCommit: "9399d91ef429401e27961526b66de912f8f54adf",
  updatedAt: "2026-06-05T02:30:34+08:00",
  note: "Enforce hope, shield, and fear thresholds."
};

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
}

loadVersionInfo();
