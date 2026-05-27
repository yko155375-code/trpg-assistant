function applyPlayerPanelTabsV60() {
  ensurePlayerPanelTabsStylesV60();
  ensureActivePlayerPanelV60();
  ensurePlayerPanelTabsV60();
  syncCurrentPlayerAssetV60();
  applyPlayerPanelVisibilityV60();
  patchPlayerRollRoutingV60();
}

function ensureActivePlayerPanelV60() {
  if (!state.activePlayerPanel || !["status", "roller"].includes(state.activePlayerPanel)) {
    state.activePlayerPanel = "status";
  }
  document.body.dataset.activePlayerPanel = state.activePlayerPanel;
}

function ensurePlayerPanelTabsStylesV60() {
  if (document.getElementById("player-panel-tabs-v60-style")) return;
  const style = document.createElement("style");
  style.id = "player-panel-tabs-v60-style";
  style.textContent = `
    body[data-mode="player"] .tabbar{display:none!important}
    .player-panel-tabs-v60{display:none}
    body[data-mode="player"] .player-panel-tabs-v60{display:flex;gap:8px;margin:8px 42px 12px 0;padding:4px;border:1px solid var(--line);border-radius:999px;background:rgba(18,20,23,.72);backdrop-filter:blur(12px)}
    .player-panel-tab-v60{flex:1;min-height:38px;border:1px solid rgba(255,255,255,.08);border-radius:999px;background:rgba(18,20,23,.45);color:var(--muted);font-weight:900;letter-spacing:0}
    .player-panel-tab-v60.is-active{border-color:rgba(226,183,94,.88);background:linear-gradient(180deg,rgba(226,183,94,.22),rgba(116,73,28,.34));color:#fff4cf;box-shadow:0 0 12px rgba(201,164,92,.24)}
    body[data-mode="player"] #dashboard,body[data-mode="player"] #dice{position:static!important;inset:auto!important;z-index:auto!important;min-height:0!important}
    body[data-mode="player"][data-active-player-panel="status"] #dashboard{display:block!important}
    body[data-mode="player"][data-active-player-panel="status"] #dice{display:none!important}
    body[data-mode="player"][data-active-player-panel="roller"] #dashboard{display:none!important}
    body[data-mode="player"][data-active-player-panel="roller"] #dice{display:block!important}
    body[data-mode="player"] #combat,body[data-mode="player"] #audio,body[data-mode="player"] #playerPanel{display:none!important}
    body[data-mode="player"] #diceSourceZone,body[data-mode="player"] #diceSourceCharacter{display:none!important}
    body[data-mode="player"] #characterList .asset-row,body[data-mode="player"] #playerCharacterCard .asset-row,body[data-mode="player"] #diceSourceCharacter .asset-row{display:none!important}
    .current-player-strip-v60{width:100%;display:grid!important;grid-template-columns:minmax(0,1fr) auto;gap:6px;align-items:end}
    .current-player-strip-v60>span{grid-column:1/-1}
    .current-player-strip-v60 .scene-title-input{display:none!important}
    .current-player-asset-v60{display:flex;align-items:center;gap:5px;min-height:34px;padding:4px 6px;border:1px solid rgba(226,183,94,.25);border-radius:8px;background:rgba(18,20,23,.58);white-space:nowrap}
    .current-player-asset-v60__label{color:var(--muted);font-size:.72rem;font-weight:900}
    .current-player-asset-v60 strong{min-width:28px;color:var(--gold);font-size:.95rem;text-align:center}
    .current-player-asset-v60 button{display:inline-flex;align-items:center;justify-content:center;width:28px;min-width:28px;height:28px;min-height:28px;padding:0;border-radius:7px;font-weight:900;touch-action:manipulation}
    @media(min-width:720px){body[data-mode="player"][data-active-player-panel="status"] #dashboard,body[data-mode="player"][data-active-player-panel="roller"] #dice{display:grid!important;grid-template-columns:1fr 1fr;gap:12px;align-items:start}body[data-mode="player"][data-active-player-panel="status"] #dashboard .section-heading,body[data-mode="player"][data-active-player-panel="status"] #dashboard .roster-card,body[data-mode="player"][data-active-player-panel="roller"] #dice .section-heading,body[data-mode="player"][data-active-player-panel="roller"] #dice .roll-history-card{grid-column:1/-1}}
    @media(max-width:720px){body[data-mode="player"] .player-panel-tabs-v60{margin-right:36px}.current-player-strip-v60{grid-template-columns:1fr}.current-player-asset-v60{justify-content:space-between;width:100%}}
  `;
  document.head.appendChild(style);
}

function ensurePlayerPanelTabsV60() {
  let tabs = document.getElementById("playerPanelTabsV60");
  if (!tabs) {
    tabs = document.createElement("nav");
    tabs.id = "playerPanelTabsV60";
    tabs.className = "player-panel-tabs-v60";
    tabs.setAttribute("aria-label", "\u73a9\u5bb6\u4ecb\u9762\u5206\u9801");
    tabs.innerHTML = `
      <button class="player-panel-tab-v60" data-player-panel-v60="status" type="button">\u73a9\u5bb6\u72c0\u614b</button>
      <button class="player-panel-tab-v60" data-player-panel-v60="roller" type="button">\u64f2\u9ab0\u5de5\u5177</button>
    `;
    const main = document.querySelector("main");
    const firstPanel = document.getElementById("dashboard");
    if (main && firstPanel) main.insertBefore(tabs, firstPanel);
    else document.body.appendChild(tabs);
  }

  tabs.querySelectorAll("[data-player-panel-v60]").forEach((button) => {
    const active = button.dataset.playerPanelV60 === state.activePlayerPanel;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", active ? "true" : "false");
  });

  if (tabs.dataset.boundV60 !== "true") {
    tabs.dataset.boundV60 = "true";
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-player-panel-v60]");
      if (!button) return;
      setActivePlayerPanelV60(button.dataset.playerPanelV60, true);
    });
  }
}

function setActivePlayerPanelV60(panel, scrollTop = false) {
  if (!["status", "roller"].includes(panel)) return;
  state.activePlayerPanel = panel;
  document.body.dataset.activePlayerPanel = panel;
  persistPlayerPanelTabsV60();
  applyPlayerPanelTabsV60();
  if (scrollTop) window.scrollTo({ top: 0, behavior: "smooth" });
}

function applyPlayerPanelVisibilityV60() {
  if (state.mode !== "player") {
    document.getElementById("playerPanelTabsV60")?.setAttribute("hidden", "");
    return;
  }
  const tabs = document.getElementById("playerPanelTabsV60");
  if (tabs) tabs.hidden = false;

  const dashboard = document.getElementById("dashboard");
  const dice = document.getElementById("dice");
  const showStatus = state.activePlayerPanel === "status";
  if (dashboard) {
    dashboard.hidden = !showStatus;
    dashboard.classList.toggle("is-active", showStatus);
  }
  if (dice) {
    dice.hidden = showStatus;
    dice.classList.toggle("is-active", !showStatus);
  }
  ["combat", "audio", "playerPanel"].forEach((id) => {
    const panel = document.getElementById(id);
    if (panel) {
      panel.hidden = true;
      panel.classList.remove("is-active");
    }
  });
}

function syncCurrentPlayerAssetV60() {
  const wrap = document.querySelector(".session-strip > div");
  const select = document.getElementById("currentCharacterSelect");
  if (!wrap || !select) return;
  wrap.classList.add("current-player-strip-v60");

  let asset = document.getElementById("currentPlayerAssetV60");
  if (!asset) {
    asset = document.createElement("div");
    asset.id = "currentPlayerAssetV60";
    asset.className = "current-player-asset-v60";
    select.insertAdjacentElement("afterend", asset);
  }
  const player = currentPlayerForPanelV60();
  const assets = normalizeAssetsForPanelV60(player);
  asset.innerHTML = `
    <span class="current-player-asset-v60__label">\u8cc7\u7522</span>
    <button class="text-button" data-current-asset-step-v60="-1" type="button" ${player ? "" : "disabled"}>-</button>
    <strong>${player ? assets.total : "--"}</strong>
    <button class="text-button" data-current-asset-step-v60="1" type="button" ${player ? "" : "disabled"}>+</button>
  `;
  bindCurrentAssetButtonsV60();
}

function bindCurrentAssetButtonsV60() {
  if (window.currentAssetButtonsBoundV60) return;
  window.currentAssetButtonsBoundV60 = true;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-current-asset-step-v60]");
    if (!button || state.mode !== "player") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    const player = currentPlayerForPanelV60();
    if (!player) return;
    const step = Number(button.dataset.currentAssetStepV60 || 0);
    if (typeof updateCharacterAssetV41 === "function") {
      updateCharacterAssetV41(player.id, "hand", step);
      return;
    }
    const assets = normalizeAssetsForPanelV60(player);
    state.characters = state.characters.map((item) => (
      item.id === player.id ? { ...item, assets: { total: Math.max(0, assets.total + step) } } : item
    ));
    persistPlayerPanelTabsV60();
    if (typeof render === "function") render();
  }, true);
}

function patchPlayerRollRoutingV60() {
  if (window.playerRollRoutingPatchedV60) return;
  window.playerRollRoutingPatchedV60 = true;
  document.addEventListener("click", (event) => {
    const rollButton = event.target.closest("#rollButton");
    const dualityButton = event.target.closest("#dualityRollButton");
    if (state.mode !== "player" || (!rollButton && !dualityButton)) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (rollButton) {
      const source = currentPlayerForPanelV60()?.name || "\u672a\u9078\u64c7\u89d2\u8272";
      showRoll("#rollResult", document.getElementById("diceFormula"), source);
      return;
    }
    showPlayerDualityRollV60();
  }, true);
}

function showPlayerDualityRollV60() {
  const source = currentPlayerForPanelV60()?.name || "\u672a\u9078\u64c7\u89d2\u8272";
  if (typeof rollD12 !== "function") {
    if (typeof showDualityRoll === "function") showDualityRoll();
    return;
  }
  const hopeDie = rollD12();
  const fearDie = rollD12();
  const total = hopeDie + fearDie;
  const hopeClass = hopeDie >= fearDie ? "is-hope-high" : "";
  const fearClass = fearDie >= hopeDie ? "is-fear-high" : "";
  document.getElementById("dualityResult").innerHTML = `
    <div class="duality-grid">
      <div class="${hopeClass}"><span>\u5e0c\u671b\u9ab0</span><strong>${hopeDie}</strong></div>
      <div class="${fearClass}"><span>\u6050\u61fc\u9ab0</span><strong>${fearDie}</strong></div>
      <div><span>\u7e3d\u548c</span><strong>${total}</strong></div>
    </div>
  `;
  state.rolls.unshift({
    source,
    formula: "\u5e0c\u671b\u8207\u6050\u61fc",
    total,
    parts: [hopeDie, fearDie],
    detail: `(\u5e0c\u671b ${hopeDie}, \u6050\u61fc ${fearDie})`,
    time: Date.now(),
  });
  persistPlayerPanelTabsV60();
  if (typeof renderRolls === "function") renderRolls();
}

function currentPlayerForPanelV60() {
  if (typeof currentPlayerV59 === "function") return currentPlayerV59();
  return state.characters?.find((item) => item.id === state.playerCharacterId) || null;
}

function normalizeAssetsForPanelV60(player) {
  if (!player) return { total: 0 };
  if (typeof normalizeAssetsV41 === "function") return normalizeAssetsV41(player);
  return { total: Math.max(0, Number(player.assets?.total || 0)) };
}

function persistPlayerPanelTabsV60() {
  if (typeof writeAssetShadowV41 === "function") writeAssetShadowV41();
  if (typeof saveState === "function") saveState();
  else if (typeof save === "function") save();
}

if (typeof render === "function" && !window.playerPanelTabsRenderPatchedV60) {
  const originalRenderV60 = render;
  render = function renderWithPlayerPanelTabsV60() {
    originalRenderV60();
    applyPlayerPanelTabsV60();
  };
  window.playerPanelTabsRenderPatchedV60 = true;
}

window.addEventListener("load", applyPlayerPanelTabsV60);
window.setTimeout(applyPlayerPanelTabsV60, 0);
window.setTimeout(applyPlayerPanelTabsV60, 500);
applyPlayerPanelTabsV60();
