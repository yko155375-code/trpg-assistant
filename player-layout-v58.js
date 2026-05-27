function applyPlayerLayoutV58() {
  ensurePlayerLayoutStylesV58();
  patchFantasyTransitionScopeV58();
  syncPlayerLayoutStateV58();
}

function ensurePlayerLayoutStylesV58() {
  if (document.getElementById("player-layout-v58-style")) return;
  const style = document.createElement("style");
  style.id = "player-layout-v58-style";
  style.textContent = `
    html,body{overflow-x:hidden}
    body[data-mode="player"] main{padding-right:42px!important;overflow-x:clip}
    #dmEntryV46.dm-entry-v46{position:fixed!important;top:8px!important;left:8px!important;right:auto!important;z-index:80!important;width:28px!important;height:28px!important;min-width:28px!important;min-height:28px!important;padding:0!important;border:0!important;background:transparent!important;opacity:.18!important;box-shadow:none!important}
    #dmEntryV46.dm-entry-v46:hover,#dmEntryV46.dm-entry-v46:focus-visible{opacity:.75!important}
    body[data-mode="player"] #playerShopButtonV43,body[data-mode="player"] .session-strip #playerShopButtonV43,body[data-mode="player"] #priceRollTabButton{display:none!important}
    body[data-mode="player"] #playerToolRailV50{display:grid!important;right:6px!important;z-index:78!important}
    body[data-mode="player"] #shopPanelV43{position:fixed!important;top:64px!important;right:42px!important;z-index:74!important;width:min(380px,calc(100vw - 58px))!important;max-height:calc(100vh - 92px)!important;margin:0!important;display:grid!important;opacity:0!important;overflow:hidden!important;pointer-events:none!important;transform:translateX(calc(100% + 64px))!important;transition:transform .18s ease,opacity .14s ease!important}
    body[data-mode="player"]:not([data-shop-open="true"]) #shopPanelV43>*{visibility:hidden!important}
    body[data-mode="player"][data-shop-open="true"] #shopPanelV43{opacity:1!important;overflow:auto!important;pointer-events:auto!important;transform:translateX(0)!important}
    body[data-mode="player"][data-shop-open="true"] #shopPanelV43>*{visibility:visible!important}
    body[data-mode="player"] .status-reference-panel{overflow:hidden!important}
    body[data-mode="player"] .status-reference-panel:not(.is-open)>*{visibility:hidden!important}
    body[data-mode="player"] .status-reference-panel.is-open{overflow:auto!important}
    body[data-mode="player"] .status-reference-panel.is-open>*{visibility:visible!important}
    body[data-mode="player"] .monitor-card .stat-grid{display:grid!important;grid-template-columns:repeat(4,minmax(112px,1fr))!important;gap:8px!important;align-items:stretch!important;min-width:0!important}
    body[data-mode="player"] .monitor-card .stat-control{display:grid!important;gap:4px!important;min-width:0!important;padding:6px 8px!important;overflow:hidden!important}
    body[data-mode="player"] .monitor-card .stat-control>span{min-width:0!important;overflow:hidden!important;text-overflow:ellipsis!important;white-space:nowrap!important;font-size:.72rem!important;line-height:1.15!important}
    body[data-mode="player"] .monitor-card .stat-control__row{display:grid!important;grid-template-columns:28px minmax(28px,1fr) 28px!important;align-items:center!important;gap:4px!important;width:100%!important;min-width:0!important;min-height:30px!important;position:static!important}
    body[data-mode="player"] .monitor-card .stat-control__row button{position:static!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;width:28px!important;min-width:28px!important;height:28px!important;min-height:28px!important;padding:0!important;border-radius:7px!important;font-size:.92rem!important;line-height:1!important;touch-action:manipulation}
    body[data-mode="player"] .monitor-card .stat-control__row strong{min-width:28px!important;font-size:.95rem!important;line-height:1!important;text-align:center!important}
    body[data-mode="player"] .asset-grid{display:grid!important;grid-template-columns:repeat(auto-fit,minmax(160px,1fr))!important;gap:6px!important;align-items:stretch!important;min-width:0!important}
    body[data-mode="player"] .asset-control{display:grid!important;grid-template-columns:30px minmax(34px,1fr) 30px!important;align-items:center!important;gap:5px!important;min-width:0!important;min-height:34px!important;position:static!important}
    body[data-mode="player"] .asset-control button{width:30px!important;min-width:30px!important;height:30px!important;min-height:30px!important;padding:0!important;touch-action:manipulation}
    body[data-mode="player"] .asset-control strong{min-width:34px!important;text-align:center!important}
    @media(max-width:900px){body[data-mode="player"] .monitor-card .stat-grid{grid-template-columns:repeat(2,minmax(130px,1fr))!important}}
    @media(max-width:720px){body[data-mode="player"] main{padding-right:36px!important}body[data-mode="player"] #playerToolRailV50{right:3px!important}body[data-mode="player"] #shopPanelV43{top:58px!important;right:34px!important;width:calc(100vw - 46px)!important;max-height:calc(100vh - 76px)!important}}
    @media(max-width:480px){body[data-mode="player"] .monitor-card .stat-grid{grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:6px!important}body[data-mode="player"] .monitor-card .stat-control{padding:5px 6px!important}body[data-mode="player"] .monitor-card .stat-control__row{grid-template-columns:28px minmax(26px,1fr) 28px!important}body[data-mode="player"] .monitor-card .stat-control__row button{width:28px!important;min-width:28px!important;height:28px!important;min-height:28px!important}}
  `;
  document.head.appendChild(style);
}

function patchFantasyTransitionScopeV58() {
  if (window.fantasyTransitionScopePatchedV58) return;
  window.fantasyTransitionScopePatchedV58 = true;
  removeFantasyTransitionV57HandlerV58();
  window.setTimeout(removeFantasyTransitionV57HandlerV58, 0);
  window.setTimeout(removeFantasyTransitionV57HandlerV58, 160);
  window.setTimeout(removeFantasyTransitionV57HandlerV58, 600);
  document.addEventListener("click", handleFantasyShopOnlyTransitionV58, true);
}

function removeFantasyTransitionV57HandlerV58() {
  if (typeof handleFantasyTransitionClicksV57 === "function") {
    document.removeEventListener("click", handleFantasyTransitionClicksV57, true);
  }
}

function handleFantasyShopOnlyTransitionV58(event) {
  if (typeof fantasyTransitionActiveV57 !== "undefined" && fantasyTransitionActiveV57) {
    event.preventDefault();
    event.stopImmediatePropagation();
    return;
  }
  const shopButton = event.target.closest?.('[data-tool-v50="shop"]');
  if (!shopButton || state.mode !== "player" || document.body.dataset.shopOpen === "true") return;
  event.preventDefault();
  event.stopImmediatePropagation();
  if (typeof playFantasyTransitionV57 === "function") {
    playFantasyTransitionV57({
      title: "\u5546\u5e97",
      subtitle: "\u7ffb\u958b\u65c5\u9014\u88dc\u7d66\u6e05\u55ae",
      variant: "shop",
      onComplete: openShopAfterTransitionV58,
    });
    return;
  }
  openShopAfterTransitionV58();
}

function openShopAfterTransitionV58() {
  document.getElementById("statusReferencePanel")?.classList.remove("is-open");
  document.body.dataset.shopOpen = "true";
  if (typeof renderShopPanelV43 === "function") renderShopPanelV43();
  if (typeof syncToolRailActiveV50 === "function") syncToolRailActiveV50();
}

function syncPlayerLayoutStateV58() {
  const entry = document.getElementById("dmEntryV46");
  if (entry) {
    entry.setAttribute("title", "");
    entry.setAttribute("aria-label", "DM");
  }
  if (typeof ensurePlayerToolRailV50 === "function") ensurePlayerToolRailV50();
  if (state?.mode === "player" && document.body.dataset.shopOpen !== "true") {
    document.body.dataset.shopOpen = "false";
  }
}

if (typeof render === "function" && !window.playerLayoutRenderPatchedV58) {
  const originalRenderV58 = render;
  render = function renderWithPlayerLayoutV58() {
    originalRenderV58();
    applyPlayerLayoutV58();
  };
  window.playerLayoutRenderPatchedV58 = true;
}

window.addEventListener("load", applyPlayerLayoutV58);
applyPlayerLayoutV58();
