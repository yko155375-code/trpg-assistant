function applyFantasyThemeV45() {
  ensureFantasyThemeStylesV45();
  updateFantasyThemeVersionV45();
}

function ensureFantasyThemeStylesV45() {
  if (document.getElementById("fantasy-theme-v45-style")) return;

  const style = document.createElement("style");
  style.id = "fantasy-theme-v45-style";
  style.textContent = `
    :root {
      --bg: #080d17;
      --panel: #111923;
      --panel-2: #182331;
      --text: #f2ead6;
      --muted: #b9ad93;
      --line: rgba(188, 145, 69, 0.26);
      --red: #8f1e24;
      --teal: #55c8c0;
      --gold: #b9873b;
      --blue: #6aa8bd;
      --hope: #d49a35;
      --fear: #2b1328;
      --fear-red: #7b1723;
      --parchment: #2d2619;
      --parchment-soft: rgba(191, 155, 86, 0.12);
      --shadow: 0 18px 48px rgba(0, 0, 0, 0.52);
      font-family: "Noto Sans TC", "Microsoft JhengHei", "PingFang TC", "Segoe UI", Arial, sans-serif;
    }

    body {
      background:
        linear-gradient(180deg, rgba(8, 13, 23, 0.2) 0, #080d17 420px),
        radial-gradient(circle at 50% 0, rgba(120, 24, 34, 0.18), transparent 320px),
        linear-gradient(135deg, #070b13, #101827 48%, #090d16);
    }

    h1,
    h2,
    h3,
    .section-heading h2,
    .card-header h3,
    .monitor-card__top strong,
    .public-board strong {
      font-family: "Cinzel", "Cormorant Garamond", "Times New Roman", "Noto Serif TC", serif;
      font-weight: 800;
    }

    h1 {
      color: #f5dfaa;
      text-shadow: 0 2px 0 rgba(0, 0, 0, 0.55), 0 0 26px rgba(185, 135, 59, 0.22);
    }

    h2,
    h3 {
      color: #ead7a7;
    }

    .eyebrow {
      color: var(--gold);
    }

    .hero__overlay {
      background:
        linear-gradient(180deg, rgba(8, 13, 23, 0.08), rgba(8, 13, 23, 0.56) 42%, #080d17 97%),
        linear-gradient(90deg, rgba(8, 13, 23, 0.84), rgba(43, 19, 40, 0.22));
    }

    .session-strip,
    .mode-switch,
    .tabbar__button,
    .tool-card,
    .initiative-card,
    .monitor-card,
    .character-row,
    .roll-result,
    .stat-control,
    .monster-roll-panel,
    .attribute-cell-v44,
    .asset-control,
    .shop-item,
    input,
    textarea,
    select,
    .status-pill {
      border-color: var(--line);
    }

    .tool-card,
    .initiative-card,
    .monitor-card {
      background:
        linear-gradient(180deg, rgba(17, 25, 35, 0.92), rgba(9, 13, 21, 0.96)),
        radial-gradient(circle at 50% 0, rgba(185, 135, 59, 0.08), transparent 70%);
      box-shadow: var(--shadow), inset 0 1px 0 rgba(245, 223, 170, 0.06);
    }

    .tool-card::before,
    .monitor-card::before {
      content: "";
      display: block;
      height: 2px;
      margin: -1px 0 7px;
      border-radius: 999px;
      background: linear-gradient(90deg, transparent, rgba(185, 135, 59, 0.6), transparent);
      pointer-events: none;
    }

    .stat-control,
    .monster-roll-panel,
    .roll-result,
    .attribute-cell-v44,
    .asset-control,
    .shop-item,
    .public-board,
    .status-reference-item {
      background:
        linear-gradient(180deg, rgba(45, 38, 25, 0.64), rgba(20, 17, 12, 0.48)),
        rgba(8, 13, 23, 0.64);
      box-shadow: inset 0 0 0 1px rgba(245, 223, 170, 0.04);
    }

    .tabbar {
      background: linear-gradient(180deg, #080d17, rgba(8, 13, 23, 0.86));
    }

    .tabbar__button,
    .text-button,
    .ghost-button,
    .row-actions button,
    .counter button,
    .icon-button,
    .stat-control__row button {
      background: linear-gradient(180deg, #1b2b36, #101923);
      color: #d7e7e4;
      border: 1px solid rgba(85, 200, 192, 0.22);
    }

    .tabbar__button.is-active,
    .mode-switch__button.is-active,
    .primary-button {
      background: linear-gradient(180deg, #d4a34e, #9b6825);
      color: #1b1206;
      box-shadow: inset 0 1px 0 rgba(255, 241, 187, 0.42), 0 0 0 1px rgba(185, 135, 59, 0.32);
    }

    button:hover,
    .tabbar__button:hover,
    .text-button:hover,
    .ghost-button:hover {
      border-color: rgba(85, 200, 192, 0.58);
      filter: brightness(1.06);
    }

    input,
    textarea,
    select,
    .scene-title-input {
      background: rgba(5, 8, 14, 0.82);
      color: var(--text);
    }

    input:focus,
    textarea:focus,
    select:focus,
    .scene-title-input:focus {
      border-color: var(--teal);
      box-shadow: 0 0 0 3px rgba(85, 200, 192, 0.15);
    }

    .danger-delete-button {
      border-color: rgba(170, 42, 48, 0.9);
      background: linear-gradient(180deg, rgba(143, 30, 36, 0.58), rgba(76, 15, 23, 0.82));
      color: #ffd1c7;
    }

    .monster-card {
      border-color: rgba(143, 30, 36, 0.55);
    }

    .audio-card,
    .shop-panel {
      border-color: rgba(185, 135, 59, 0.44);
    }

    #hopeValue,
    .duality-grid .is-hope-high strong,
    .status-token.is-active,
    .asset-control strong,
    .monster-roll-panel strong,
    .initiative-score {
      color: var(--hope);
    }

    .duality-grid .is-hope-high {
      border-color: rgba(212, 154, 53, 0.9);
      background: rgba(212, 154, 53, 0.18);
    }

    .duality-grid .is-fear-high,
    .monster-roll-panel.is-crit {
      border-color: rgba(123, 23, 35, 0.94);
      background:
        linear-gradient(180deg, rgba(43, 19, 40, 0.58), rgba(123, 23, 35, 0.18));
    }

    .duality-grid .is-fear-high strong,
    .monster-roll-panel em {
      color: #e27474;
    }

    .status-token {
      background: rgba(7, 10, 17, 0.7);
    }

    .status-token.is-active {
      background: rgba(212, 154, 53, 0.19);
      border-color: rgba(212, 154, 53, 0.78);
    }

    .pip.is-filled {
      background: linear-gradient(90deg, #7b1723, #c46b45);
    }

    ::selection {
      background: rgba(85, 200, 192, 0.32);
    }
  `;
  document.head.appendChild(style);
}

function updateFantasyThemeVersionV45() {
  const version = document.querySelector(".session-strip .status-pill");
  if (version) version.textContent = "v0.1.16 \u6697\u8272\u5947\u5e7b\u4e3b\u984c";
}

if (typeof render === "function" && !window.fantasyThemeRenderPatchedV45) {
  const originalRenderV45 = render;
  render = function renderWithFantasyThemeV45() {
    originalRenderV45();
    applyFantasyThemeV45();
  };
  window.fantasyThemeRenderPatchedV45 = true;
}

window.addEventListener("load", applyFantasyThemeV45);
applyFantasyThemeV45();
