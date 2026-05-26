function applyViewModeFixes() {
  ensureViewModeStyles();
  normalizePlayerView();
  relocateDiceSourceControl();
  syncDiceSourceOptions();
  renderSelectedDiceCharacter();
}

function ensureViewModeStyles() {
  if (document.getElementById("view-mode-fix-style")) return;
  const style = document.createElement("style");
  style.id = "view-mode-fix-style";
  style.textContent = `
    body[data-mode="player"] .tabbar {
      display: grid;
    }

    body[data-mode="player"] .tabbar__button[data-tab="combat"],
    body[data-mode="player"] .tabbar__button[data-tab="audio"],
    body[data-mode="player"] #combat,
    body[data-mode="player"] #audio,
    body[data-mode="player"] #playerPanel {
      display: none !important;
    }

    body[data-mode="player"] {
      font-family: inherit;
    }

    body[data-mode="player"] .hero {
      min-height: 215px;
    }

    body[data-mode="player"] .hero__content {
      padding-top: 18px;
      padding-bottom: 14px;
    }

    body[data-mode="player"] .hero__copy {
      display: none;
    }

    body[data-mode="player"] h1 {
      font-size: clamp(1.95rem, 10vw, 3.1rem);
      letter-spacing: 0;
    }

    body[data-mode="player"] .session-strip,
    body[data-mode="player"] .mode-switch {
      margin-top: 8px;
    }

    body[data-mode="player"] .session-strip {
      padding: 10px;
    }

    body[data-mode="player"] .mode-switch {
      padding: 4px;
    }

    body[data-mode="player"] .tool-card {
      padding: 7px;
      margin-bottom: 6px;
    }

    body[data-mode="player"] .section-heading h2,
    body[data-mode="player"] .card-header h3,
    body[data-mode="player"] .field span,
    body[data-mode="player"] .tabbar__button,
    body[data-mode="player"] button,
    body[data-mode="player"] input,
    body[data-mode="player"] select,
    body[data-mode="player"] textarea {
      font-family: inherit;
      letter-spacing: 0;
    }

    body[data-mode="player"] .tab-panel.is-active {
      display: block;
    }

    @media (min-width: 720px) {
      body[data-mode="player"] .tab-panel.is-active {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        align-items: start;
      }

      body[data-mode="player"] .section-heading,
      body[data-mode="player"] .roster-card,
      body[data-mode="player"] #dice .tool-card:last-child,
      body[data-mode="player"] .dice-source-zone {
        grid-column: 1 / -1;
      }
    }

    .dice-source-zone {
      grid-column: 1 / -1;
      margin: -4px 0 10px;
      padding: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      background: rgba(18, 20, 23, 0.5);
    }

    .dice-source-zone .dice-source-field {
      margin-bottom: 8px;
    }

    .dice-source-character {
      display: grid;
      gap: 6px;
    }

    .dice-source-character .monitor-card {
      box-shadow: none;
    }

    .dice-source-empty {
      color: var(--muted);
      font-size: 0.82rem;
    }
  `;
  document.head.appendChild(style);
}

function normalizePlayerView() {
  if (state.mode !== "player") return;

  const tabbar = document.querySelector(".tabbar");
  if (tabbar) tabbar.hidden = false;

  document.querySelectorAll(".dm-panel").forEach((panel) => {
    panel.hidden = false;
  });

  const playerPanel = document.getElementById("playerPanel");
  if (playerPanel) playerPanel.hidden = true;

  const activePanel = document.querySelector(".tab-panel.is-active");
  if (!activePanel || ["combat", "audio", "notes"].includes(activePanel.id)) {
    activateVisibleTab("dashboard");
  }
}

function activateVisibleTab(tabId) {
  document.querySelectorAll(".tabbar__button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.tab === tabId);
  });
  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("is-active", panel.id === tabId);
  });
  state.activeTab = tabId;
  persistViewModeState();
}

function relocateDiceSourceControl() {
  const dicePanel = document.getElementById("dice");
  const heading = dicePanel?.querySelector(".section-heading");
  const field = document.getElementById("diceSourceField");
  if (!dicePanel || !heading || !field) return;

  let zone = document.getElementById("diceSourceZone");
  if (!zone) {
    zone = document.createElement("section");
    zone.id = "diceSourceZone";
    zone.className = "dice-source-zone";
    zone.innerHTML = '<div id="diceSourceCharacter" class="dice-source-character"></div>';
    heading.insertAdjacentElement("afterend", zone);
  }

  if (field.parentElement !== zone) {
    zone.insertBefore(field, zone.firstChild);
  }
}

function syncDiceSourceOptions() {
  const select = document.getElementById("diceSourceSelect");
  if (!select) return;

  const previousValue = select.value;
  const playerNames = state.characters.map((character) => character.name);
  const options = state.mode === "player" ? playerNames : ["DM", ...playerNames];
  const fallback = options[0] || "";

  select.innerHTML = options
    .map((name) => `<option value="${escapeViewModeHtml(name)}">${escapeViewModeHtml(name)}</option>`)
    .join("");
  select.value = options.includes(previousValue) ? previousValue : fallback;

  if (select.dataset.viewModeBound !== "true") {
    select.dataset.viewModeBound = "true";
    select.addEventListener("change", renderSelectedDiceCharacter);
  }
}

function renderSelectedDiceCharacter() {
  const target = document.getElementById("diceSourceCharacter");
  const select = document.getElementById("diceSourceSelect");
  if (!target || !select) return;

  const name = select.value;
  const character = state.characters.find((item) => item.name === name);
  if (!character) {
    target.innerHTML = '<div class="dice-source-empty">目前指定名稱是 DM。</div>';
    return;
  }

  if (typeof characterTemplate === "function") {
    target.innerHTML = characterTemplate(character, "character");
    return;
  }

  target.innerHTML = `
    <article class="monitor-card">
      <div class="monitor-card__top"><strong>${escapeViewModeHtml(character.name)}</strong><span>閃避 ${escapeViewModeHtml(character.evasion)}</span></div>
      <div class="stat-grid">
        <div class="stat-control"><span>希望骰</span><strong>${character.hopeDice}</strong></div>
        <div class="stat-control"><span>壓力</span><strong>${character.stress}</strong></div>
        <div class="stat-control"><span>護盾槽</span><strong>${character.armor}</strong></div>
        <div class="stat-control"><span>血量</span><strong>${character.hp}</strong></div>
      </div>
    </article>
  `;
}

function persistViewModeState() {
  if (typeof save === "function") return save();
  if (typeof saveState === "function") saveState();
}

function escapeViewModeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function") {
  const originalViewModeRender = render;
  render = function renderWithViewModeFixes() {
    originalViewModeRender();
    applyViewModeFixes();
  };
}

document.addEventListener("click", (event) => {
  const modeButton = event.target.closest(".mode-switch__button");
  if (!modeButton) return;
  setTimeout(applyViewModeFixes, 0);
}, true);

window.addEventListener("load", applyViewModeFixes);
applyViewModeFixes();

(function loadUiPolishV40() {
  if (document.querySelector('script[src*="ui-polish-v40.js"]')) return;
  const script = document.createElement("script");
  script.src = "ui-polish-v40.js?v=40";
  script.defer = true;
  document.body.appendChild(script);
})();
