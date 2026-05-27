function applyPlayerInterfacePolishV53() {
  ensurePlayerInterfacePolishStylesV53();
  markDmSceneRowV53();
  restorePlayerResourceControlsV53();
  ensureAttributeSteppersV53();
  shrinkReturnPlayerButtonV53();
  syncAudioActiveStateV53();
}

function ensurePlayerInterfacePolishStylesV53() {
  let style = document.getElementById("player-interface-polish-v53-style");
  if (style) style.remove();
  style = document.createElement("style");
  style.id = "player-interface-polish-v53-style";
  style.textContent = `
    html,
    body {
      overflow-x: hidden;
    }

    body[data-mode="player"] #shopPanelV43,
    body[data-mode="player"] .status-reference-panel {
      overflow: hidden !important;
      pointer-events: none !important;
      opacity: 0 !important;
      transform: translateX(calc(100% + 56px)) !important;
      transition: transform .18s ease, opacity .14s ease !important;
    }

    body[data-mode="player"][data-shop-open="true"] #shopPanelV43,
    body[data-mode="player"] .status-reference-panel.is-open {
      overflow: auto !important;
      pointer-events: auto !important;
      opacity: 1 !important;
      transform: translateX(0) !important;
    }

    body[data-mode="player"] #shopPanelV43:not([hidden]) {
      display: grid !important;
    }

    body[data-mode="player"]:not([data-shop-open="true"]) #shopPanelV43 {
      display: grid !important;
    }

    body[data-mode="player"] .stat-control__row,
    body[data-mode="player"] .asset-control,
    .resource-stepper-v51 {
      display: grid !important;
      grid-template-columns: 36px minmax(44px, 1fr) 36px !important;
      align-items: center !important;
      gap: 5px !important;
    }

    body[data-mode="player"] .stat-control__row button,
    body[data-mode="player"] .asset-control button,
    .resource-stepper-v51 button {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 36px !important;
      min-width: 36px !important;
      min-height: 36px !important;
      padding: 0 !important;
      border-radius: 7px !important;
      font-size: 1rem !important;
      font-weight: 900 !important;
      pointer-events: auto !important;
    }

    body[data-mode="player"] .stat-control__row strong,
    body[data-mode="player"] .asset-control strong,
    .resource-stepper-v51 input {
      min-width: 44px !important;
      font-size: 1rem !important;
      font-weight: 900 !important;
      text-align: center !important;
    }

    .resource-stepper-v51 input {
      width: 100% !important;
      min-height: 36px !important;
      border: 1px solid var(--line) !important;
      border-radius: 7px !important;
      background: rgba(18, 20, 23, .72) !important;
      color: var(--text) !important;
      font: inherit !important;
    }

    body[data-mode="dm"] .dm-scene-row-v53 {
      display: none !important;
    }

    body[data-mode="dm"] #returnPlayerV46.return-player-v46 {
      position: fixed !important;
      top: 10px !important;
      right: 44px !important;
      z-index: 95 !important;
      width: auto !important;
      min-height: 24px !important;
      margin: 0 !important;
      padding: 4px 8px !important;
      border-radius: 7px !important;
      font-size: 12px !important;
      line-height: 1 !important;
      opacity: .65 !important;
    }

    body[data-mode="dm"] #returnPlayerV46.return-player-v46:hover,
    body[data-mode="dm"] #returnPlayerV46.return-player-v46:focus-visible {
      opacity: 1 !important;
    }

    #audio [data-v46-bgm],
    #audio [data-v46-sfx],
    #audio [data-v46-stop-bgm] {
      border-color: rgba(203, 213, 225, .16) !important;
      background: rgba(18, 20, 23, .58) !important;
      color: var(--muted) !important;
      box-shadow: none !important;
      filter: saturate(.78) brightness(.82);
    }

    #audio [data-v46-bgm].is-active {
      border-color: rgba(212, 154, 53, .9) !important;
      background: linear-gradient(180deg, rgba(185, 135, 59, .56), rgba(88, 61, 24, .78)) !important;
      color: #fff5d8 !important;
      box-shadow: 0 0 0 2px rgba(212, 154, 53, .14) !important;
      filter: none;
    }

    #audio [data-v46-sfx].is-triggering-v53 {
      border-color: rgba(77, 208, 225, .72) !important;
      color: #dffbff !important;
      filter: none;
    }

    #audio [data-v46-stop-bgm] {
      border-color: rgba(143, 30, 36, .42) !important;
      color: #f0b7b2 !important;
    }

    @media (max-width: 620px) {
      body[data-mode="player"] .stat-control__row,
      body[data-mode="player"] .asset-control,
      .resource-stepper-v51 {
        grid-template-columns: 40px minmax(48px, 1fr) 40px !important;
      }

      body[data-mode="player"] .stat-control__row button,
      body[data-mode="player"] .asset-control button,
      .resource-stepper-v51 button {
        width: 40px !important;
        min-width: 40px !important;
        min-height: 40px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function markDmSceneRowV53() {
  const sceneInput = document.getElementById("sceneNameInput");
  sceneInput?.parentElement?.classList.add("dm-scene-row-v53");
}

function restorePlayerResourceControlsV53() {
  document.querySelectorAll("body[data-mode='player'] .stat-control__row button, body[data-mode='player'] .asset-control button").forEach((button) => {
    button.hidden = false;
    button.style.removeProperty("display");
  });
}

function ensureAttributeSteppersV53() {
  if (typeof enhanceAttributeSteppersV51 === "function") {
    enhanceAttributeSteppersV51();
    return;
  }

  document.querySelectorAll(".attribute-cell-v44 input[data-character-attr-id][data-character-attr-key]").forEach((input) => {
    if (input.closest(".resource-stepper-v51")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "resource-stepper-v51";

    const minus = document.createElement("button");
    minus.className = "text-button";
    minus.type = "button";
    minus.textContent = "-";
    minus.dataset.attrStepV51 = "-1";

    const plus = document.createElement("button");
    plus.className = "text-button";
    plus.type = "button";
    plus.textContent = "+";
    plus.dataset.attrStepV51 = "1";

    input.insertAdjacentElement("beforebegin", wrapper);
    wrapper.append(minus, input, plus);
  });
}

function shrinkReturnPlayerButtonV53() {
  const button = document.getElementById("returnPlayerV46");
  if (!button) return;
  button.classList.add("return-player-v53");
  button.title = "返回玩家畫面";
}

function syncAudioActiveStateV53() {
  if (!document.querySelector("[data-v46-bgm]")) return;
  const status = document.getElementById("audioStatus")?.textContent || "";
  const activeLabel = status.startsWith("背景：") ? status.replace("背景：", "").trim() : "";
  document.querySelectorAll("[data-v46-bgm]").forEach((button) => {
    const track = typeof BGM_TRACKS_V46 === "object" ? BGM_TRACKS_V46[button.dataset.v46Bgm] : null;
    button.classList.toggle("is-active", !!activeLabel && track?.label === activeLabel);
  });
  if (!activeLabel) {
    document.querySelectorAll("[data-v46-bgm]").forEach((button) => button.classList.remove("is-active"));
  }
  document.querySelectorAll("[data-v46-sfx], [data-v46-stop-bgm]").forEach((button) => button.classList.remove("is-active"));
}

document.addEventListener("click", (event) => {
  const sfxButton = event.target.closest("[data-v46-sfx]");
  if (sfxButton) {
    sfxButton.classList.add("is-triggering-v53");
    window.setTimeout(() => sfxButton.classList.remove("is-triggering-v53"), 320);
  }
  window.setTimeout(syncAudioActiveStateV53, 0);
  window.setTimeout(syncAudioActiveStateV53, 120);
}, true);

if (typeof setActiveBgmButtonV46 === "function" && !window.audioActivePatchedV53) {
  const originalSetActiveBgmButtonV46 = setActiveBgmButtonV46;
  setActiveBgmButtonV46 = function setActiveBgmButtonOnlyCurrentV53(key) {
    originalSetActiveBgmButtonV46(key);
    document.querySelectorAll("[data-v46-sfx], [data-v46-stop-bgm]").forEach((button) => button.classList.remove("is-active"));
  };
  window.audioActivePatchedV53 = true;
}

if (typeof render === "function" && !window.playerInterfacePolishRenderPatchedV53) {
  const originalRenderV53 = render;
  render = function renderWithPlayerInterfacePolishV53() {
    originalRenderV53();
    applyPlayerInterfacePolishV53();
  };
  window.playerInterfacePolishRenderPatchedV53 = true;
}

window.addEventListener("load", applyPlayerInterfacePolishV53);
window.setTimeout(applyPlayerInterfacePolishV53, 0);
window.setTimeout(applyPlayerInterfacePolishV53, 500);
applyPlayerInterfacePolishV53();
