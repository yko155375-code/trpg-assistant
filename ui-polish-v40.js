function applyUiPolishV40() {
  ensureUiPolishV40Styles();
  updateVisibleVersionV40();
  arrangeHeroControlsV40();
  arrangeAudioLibraryV40();
}

function ensureUiPolishV40Styles() {
  if (document.getElementById("ui-polish-v40-style")) return;

  const style = document.createElement("style");
  style.id = "ui-polish-v40-style";
  style.textContent = `
    .mode-switch {
      position: fixed !important;
      left: max(10px, env(safe-area-inset-left));
      bottom: max(10px, env(safe-area-inset-bottom));
      z-index: 40;
      width: auto;
      max-width: calc(100vw - 20px);
      margin: 0 !important;
      padding: 3px !important;
      border-radius: 8px;
      box-shadow: 0 10px 28px rgba(0, 0, 0, 0.35);
    }

    .mode-switch__button {
      min-height: 30px;
      padding: 0 9px;
      font-size: 0.74rem;
      white-space: nowrap;
    }

    .session-strip {
      grid-template-columns: minmax(0, 1fr) auto auto;
      align-items: stretch;
      gap: 8px;
      margin-top: 8px;
    }

    .session-strip .hero-fear-card {
      min-height: 0 !important;
      padding: 8px 10px !important;
      margin: 0 !important;
      min-width: 148px;
    }

    .session-strip .hero-fear-card > span {
      font-size: 0.7rem;
    }

    .session-strip .hero-fear-card .counter {
      grid-template-columns: 30px 38px 30px !important;
      gap: 4px;
    }

    .session-strip .hero-fear-card .counter button {
      min-height: 28px;
      width: 30px;
      padding: 0;
    }

    .session-strip .hero-fear-card .counter strong {
      font-size: 1rem;
    }

    @media (max-width: 620px) {
      .session-strip {
        grid-template-columns: 1fr;
      }

      .session-strip .hero-fear-card {
        width: 100%;
      }
    }

    #combat .monster-list {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 8px;
      align-items: start;
    }

    #combat .monster-card {
      min-width: 0;
      padding: 6px;
      gap: 5px;
      border-radius: 7px;
    }

    #combat .monster-card .monitor-card__top {
      gap: 5px;
    }

    #combat .monster-card .monitor-card__top strong {
      font-size: 0.88rem;
    }

    #combat .monster-card .status-pill {
      font-size: 0.66rem;
      padding: 2px 5px;
    }

    #combat .monster-card .stat-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 4px;
    }

    #combat .monster-card .stat-control,
    #combat .monster-roll-panel {
      min-height: 42px;
      padding: 5px;
    }

    #combat .monster-card .stat-control span,
    #combat .monster-field span,
    #combat .monster-traits span,
    #combat .monster-roll-panel span,
    #combat .monster-roll-panel em {
      font-size: 0.62rem;
    }

    #combat .monster-card .stat-control strong,
    #combat .monster-roll-panel strong {
      font-size: 0.88rem;
    }

    #combat .monster-detail-grid {
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 4px;
    }

    #combat .monster-field input,
    #combat .monster-traits textarea {
      min-height: 30px;
      padding: 5px;
      font-size: 0.76rem;
    }

    #combat .monster-traits textarea {
      min-height: 42px;
      max-height: 64px;
    }

    #combat .danger-delete-button {
      min-width: 30px;
      min-height: 28px;
      padding: 0 6px;
      font-size: 0.68rem;
    }

    @media (max-width: 980px) {
      #combat .monster-list {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }

    @media (max-width: 640px) {
      #combat .monster-list {
        grid-template-columns: 1fr;
      }
    }

    .audio-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 8px;
    }

    .audio-group-title {
      grid-column: 1 / -1;
      margin-top: 2px;
      color: var(--muted);
      font-size: 0.74rem;
      font-weight: 900;
      letter-spacing: 0;
    }

    .audio-grid button {
      min-height: 38px;
      padding: 0 10px;
      font-size: 0.82rem;
    }
  `;
  document.head.appendChild(style);
}

function updateVisibleVersionV40() {
  const versionBadge = document.querySelector(".session-strip .status-pill");
  if (versionBadge) {
    versionBadge.textContent = "v0.1.12 介面音樂整理版";
  }
}

function arrangeHeroControlsV40() {
  const sessionStrip = document.querySelector(".session-strip");
  const fearCard = document.getElementById("fearValue")?.closest(".metric-card");
  const hopeCard = document.getElementById("hopeValue")?.closest(".metric-card");

  if (hopeCard) {
    hopeCard.hidden = true;
    hopeCard.style.display = "none";
  }

  if (sessionStrip && fearCard && fearCard.parentElement !== sessionStrip) {
    sessionStrip.insertBefore(fearCard, sessionStrip.children[1] || null);
  }

  if (fearCard) {
    fearCard.classList.add("hero-fear-card");
    fearCard.style.display = "";
  }
}

function arrangeAudioLibraryV40() {
  const audioGrid = document.querySelector("#audio .audio-grid");
  const audioCard = document.querySelector("#audio .audio-card");
  if (!audioGrid || !audioCard) return;

  const tracks = [
    { title: "背景音樂" },
    { id: "calm", label: "背景：探索", className: "primary-button", kind: "bgm", value: "calm" },
    { id: "tension", label: "背景：緊張", className: "primary-button", kind: "bgm", value: "tension" },
    { id: "tavern", label: "背景：酒館大廳", className: "primary-button", kind: "youtubeBgm", value: "https://www.youtube.com/embed/ERSFzWMas1Q?list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=3&autoplay=1" },
    { id: "rain", label: "背景：雨天", className: "primary-button", kind: "youtubeBgm", value: "https://www.youtube.com/embed/6Vzi4bvVLik?list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=2&autoplay=1" },
    { title: "音效音樂" },
    { id: "reveal", label: "音效：線索", className: "text-button", kind: "sfx", value: "reveal" },
    { id: "hit", label: "音效：受擊", className: "text-button", kind: "sfx", value: "hit" },
    { id: "danger", label: "音效：危險", className: "text-button", kind: "sfx", value: "danger" },
    { id: "stop", label: "停止背景", className: "text-button", kind: "stop", value: "" },
  ];

  audioGrid.innerHTML = "";

  tracks.forEach((track) => {
    if (track.title) {
      const title = document.createElement("div");
      title.className = "audio-group-title";
      title.textContent = track.title;
      audioGrid.appendChild(title);
      return;
    }

    const button = document.createElement("button");
    button.className = track.className;
    button.type = "button";
    button.textContent = track.label;

    if (track.kind === "bgm") button.dataset.bgm = track.value;
    if (track.kind === "sfx") button.dataset.sfx = track.value;
    if (track.kind === "youtubeBgm") {
      button.dataset.youtubeBgm = track.id;
      button.dataset.youtubeSrc = track.value;
    }
    if (track.kind === "stop") button.id = "stopBgmButton";

    audioGrid.appendChild(button);
  });

  if (!document.getElementById("youtubeBgmFrame")) {
    const frame = document.createElement("div");
    frame.id = "youtubeBgmFrame";
    frame.className = "youtube-bgm-frame";
    frame.hidden = true;
    audioCard.appendChild(frame);
  }

  if (window.uiPolishYoutubeBound) return;
  window.uiPolishYoutubeBound = true;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-youtube-bgm]");
    if (button) {
      event.preventDefault();
      event.stopPropagation();
      if (typeof stopBgm === "function") stopBgm();
      const frame = document.getElementById("youtubeBgmFrame");
      if (frame) {
        frame.hidden = false;
        frame.innerHTML = `<iframe src="${escapeUiPolishHtml(button.dataset.youtubeSrc)}" title="${escapeUiPolishHtml(button.textContent)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
      }
      const status = document.getElementById("audioStatus");
      if (status) status.textContent = button.textContent;
      return;
    }

    if (event.target.closest("#stopBgmButton")) {
      const frame = document.getElementById("youtubeBgmFrame");
      if (frame) {
        frame.innerHTML = "";
        frame.hidden = true;
      }
    }
  }, true);
}

function escapeUiPolishHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function") {
  const originalUiPolishRender = render;
  render = function renderWithUiPolishV40() {
    originalUiPolishRender();
    applyUiPolishV40();
  };
}

window.addEventListener("load", applyUiPolishV40);
applyUiPolishV40();

(function loadPlayerAssetsV41() {
  if (document.querySelector('script[src*="player-assets-v41.js"]')) return;
  const script = document.createElement("script");
  script.src = "player-assets-v41.js?v=41";
  script.defer = true;
  document.body.appendChild(script);
})();
