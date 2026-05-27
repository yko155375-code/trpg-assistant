function applyPlayerCurrentShopV59() {
  ensureCurrentPlayerV59();
  ensurePlayerCurrentShopStylesV59();
  patchPlayerShopViewV59();
  patchPlayerDeleteButtonsV59();
  patchPlayerCurrentSelectV59();
  syncPlayerCurrentShopUiV59();
}

function ensureCurrentPlayerV59() {
  if (!state) return null;
  if (!state.playerCharacterId && state.characters?.length) {
    state.playerCharacterId = state.characters[0].id;
    persistCurrentShopV59();
  }
  if (state.playerCharacterId && !state.characters?.some((item) => item.id === state.playerCharacterId)) {
    state.playerCharacterId = state.characters?.[0]?.id || "";
    persistCurrentShopV59();
  }
  state.selectedPlayerId = state.playerCharacterId || null;
  return currentPlayerV59();
}

function currentPlayerV59() {
  return state.characters?.find((item) => item.id === state.playerCharacterId) || null;
}

function ensurePlayerCurrentShopStylesV59() {
  if (document.getElementById("player-current-shop-v59-style")) return;
  const style = document.createElement("style");
  style.id = "player-current-shop-v59-style";
  style.textContent = `
    body[data-mode="player"] .danger-delete-button{display:inline-flex!important;width:24px!important;min-width:24px!important;height:24px!important;min-height:24px!important;padding:0!important;align-items:center!important;justify-content:center!important;border-radius:999px!important;font-size:0!important;background:rgba(122,28,34,.82)!important;border:1px solid rgba(255,185,156,.38)!important;color:#ffd9c9!important;opacity:.72!important}
    body[data-mode="player"] .danger-delete-button::before{content:"\\00d7";font-size:15px;font-weight:900;line-height:1}
    body[data-mode="player"] .danger-delete-button:hover,body[data-mode="player"] .danger-delete-button:focus-visible{opacity:1!important}
    body[data-mode="player"] .shop-buyer-v52{display:none!important}
    .shop-current-player-v59{display:grid;gap:5px;padding:8px;border:1px solid rgba(212,154,53,.28);border-radius:7px;background:rgba(18,20,23,.62)}
    .shop-current-player-v59__row{display:flex;align-items:center;justify-content:space-between;gap:8px;color:var(--muted);font-size:.72rem;font-weight:900}
    .shop-current-player-v59 strong{color:var(--text);font-size:.9rem}
    .shop-current-player-v59 em{font-style:normal;color:var(--gold)}
    .shop-message-v59{min-height:1em;margin:0;color:var(--gold);font-size:.72rem;line-height:1.35}
    #shopPanelV43 .shop-grid{display:grid!important;grid-template-columns:repeat(2,minmax(0,1fr))!important;gap:8px!important;align-items:stretch!important}
    #shopPanelV43 .shop-item{min-width:0!important;padding:8px!important;display:grid!important;gap:5px!important}
    #shopPanelV43 .shop-item strong{font-size:.86rem!important;line-height:1.2!important;overflow-wrap:anywhere}
    #shopPanelV43 .shop-item span,#shopPanelV43 .shop-item-detail-v56{font-size:.66rem!important;line-height:1.3!important}
    #shopPanelV43 .shop-item .primary-button{min-height:30px!important;padding:5px 8px!important;font-size:.72rem!important}
    body[data-mode="player"] #shopPanelV43 .shop-item .primary-button:disabled{opacity:.42!important;cursor:not-allowed!important}
    @media(max-width:520px){#shopPanelV43 .shop-grid{grid-template-columns:1fr!important}}
  `;
  document.head.appendChild(style);
}

function patchPlayerShopViewV59() {
  if (window.playerCurrentShopViewPatchedV59 || typeof shopGridHtmlV43 !== "function") return;
  window.playerCurrentShopViewPatchedV59 = true;

  PlayerShopViewV43 = function PlayerShopViewV59(filter = "all") {
    return `
      ${shopCurrentPlayerHeaderV59()}
      <div class="shop-toolbar">
        ${["all", "primary", "secondary", "armor"].map((key) => `<button class="text-button ${filter === key ? "is-active" : ""}" data-shop-filter="${key}" type="button">${shopFilterLabelForV59(key)}</button>`).join("")}
      </div>
      <div class="shop-grid" id="shopGridV43">${shopGridHtmlV43(filter, true)}</div>
    `;
  };
}

function shopFilterLabelForV59(key) {
  if (typeof shopFilterLabelV56 === "function") return shopFilterLabelV56(key);
  return ({ all: "\u5168\u90e8", primary: "\u4e3b\u6b66\u5668", secondary: "\u526f\u6b66\u5668", armor: "\u8b77\u7532" })[key] || key;
}

function shopCurrentPlayerHeaderV59() {
  const player = ensureCurrentPlayerV59();
  if (!player) {
    return `
      <div class="shop-current-player-v59">
        <div class="shop-current-player-v59__row"><span>\u76ee\u524d\u89d2\u8272</span><strong>\u5c1a\u672a\u9078\u64c7\u89d2\u8272</strong></div>
        <p class="shop-message-v59" id="shopMessageV52">\u8acb\u5148\u9078\u64c7\u76ee\u524d\u89d2\u8272</p>
      </div>
    `;
  }
  const assets = normalizeCurrentAssetsV59(player);
  const message = window.shopMessageV52 || "";
  return `
    <div class="shop-current-player-v59">
      <div class="shop-current-player-v59__row"><span>\u76ee\u524d\u89d2\u8272</span><strong>${escapeShopTextV59(player.name)}</strong></div>
      <div class="shop-current-player-v59__row"><span>\u73a9\u5bb6\u8cc7\u7522</span><em>${assets.total}</em></div>
      <p class="shop-message-v59" id="shopMessageV52">${escapeShopTextV59(message)}</p>
    </div>
  `;
}

function patchPlayerDeleteButtonsV59() {
  if (window.playerDeleteButtonsPatchedV59) return;
  window.playerDeleteButtonsPatchedV59 = true;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-delete-character]");
    if (!button || state.mode !== "player") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    deleteCharacterFromPlayerV59(button.dataset.deleteCharacter);
  }, true);
}

function deleteCharacterFromPlayerV59(id) {
  const character = state.characters.find((item) => item.id === id);
  if (!character) return;
  if (!confirm(`\u522a\u9664\u968a\u54e1\uff1a${character.name}\uff1f`)) return;
  state.characters = state.characters.filter((item) => item.id !== id);
  if (state.playerCharacterId === id) {
    state.playerCharacterId = state.characters[0]?.id || "";
  }
  state.selectedPlayerId = state.playerCharacterId || null;
  persistCurrentShopV59();
  render();
}

function patchPlayerCurrentSelectV59() {
  if (window.playerCurrentSelectPatchedV59) return;
  window.playerCurrentSelectPatchedV59 = true;
  document.addEventListener("change", (event) => {
    const select = event.target.closest("#currentCharacterSelect,#playerCharacterSelect");
    if (!select) return;
    state.playerCharacterId = select.value || "";
    state.selectedPlayerId = state.playerCharacterId || null;
    persistCurrentShopV59();
    if (document.body.dataset.shopOpen === "true" && typeof renderShopPanelV43 === "function") {
      renderShopPanelV43(typeof currentShopFilterV43 === "function" ? currentShopFilterV43() : "all");
    }
  }, true);
}

function syncPlayerCurrentShopUiV59() {
  ensureCurrentPlayerV59();
  document.querySelectorAll("body[data-mode='player'] [data-player-buy-shop]").forEach((button) => {
    const hasPlayer = Boolean(currentPlayerV59());
    button.disabled = !hasPlayer;
    if (!hasPlayer) button.title = "\u8acb\u5148\u9078\u64c7\u76ee\u524d\u89d2\u8272";
    else button.removeAttribute("title");
  });
}

function normalizeCurrentAssetsV59(player) {
  if (typeof normalizeAssetsV41 === "function") return normalizeAssetsV41(player);
  const total = Math.max(0, Number(player?.assets?.total || 0));
  return { total };
}

function persistCurrentShopV59() {
  if (typeof writeAssetShadowV41 === "function") writeAssetShadowV41();
  if (typeof save === "function") save();
  else if (typeof saveState === "function") saveState();
  if (typeof saveCloudState === "function") {
    window.clearTimeout(window.currentShopCloudSaveV59);
    window.currentShopCloudSaveV59 = window.setTimeout(() => saveCloudState(), 30);
  }
}

function escapeShopTextV59(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof buyShopItemV52 === "function" && !window.buyShopItemPatchedV59) {
  buyShopItemV52 = function buyShopItemWithCurrentPlayerV59(key) {
    ensureCurrentPlayerV59();
    const player = currentPlayerV59();
    const entry = typeof shopItemsWithKeysV52 === "function"
      ? shopItemsWithKeysV52().find((item) => item.key === key)
      : null;
    if (!player || !entry) {
      if (typeof showShopMessageV52 === "function") showShopMessageV52("\u8acb\u5148\u9078\u64c7\u76ee\u524d\u89d2\u8272");
      syncPlayerCurrentShopUiV59();
      return;
    }
    const price = (state.shopPricesV43 || {})[key] || priceForItemV43(entry);
    const cost = toHandsV43(price.amount, price.unit);
    const assets = normalizeCurrentAssetsV59(player);
    if (assets.total < cost) {
      if (typeof showShopMessageV52 === "function") showShopMessageV52("\u8cc7\u7522\u4e0d\u8db3");
      syncPlayerCurrentShopUiV59();
      return;
    }
    state.characters = state.characters.map((item) => (
      item.id === player.id ? { ...item, assets: { total: assets.total - cost } } : item
    ));
    if (typeof addAssetLogV43 === "function") {
      addAssetLogV43(player.id, `${player.name} \u8cfc\u8cb7 ${entry.name} -${price.label}`);
    }
    if (typeof showShopMessageV52 === "function") showShopMessageV52(`\u5df2\u8cfc\u8cb7\uff1a${entry.name}`);
    persistCurrentShopV59();
    if (typeof render === "function") render();
  };
  window.buyShopItemPatchedV59 = true;
}

if (typeof render === "function" && !window.playerCurrentShopRenderPatchedV59) {
  const originalRenderV59 = render;
  render = function renderWithPlayerCurrentShopV59() {
    originalRenderV59();
    applyPlayerCurrentShopV59();
  };
  window.playerCurrentShopRenderPatchedV59 = true;
}

window.addEventListener("load", applyPlayerCurrentShopV59);
window.setTimeout(applyPlayerCurrentShopV59, 0);
window.setTimeout(applyPlayerCurrentShopV59, 500);
applyPlayerCurrentShopV59();
