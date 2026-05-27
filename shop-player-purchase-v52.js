const SHOP_FIX_VERSION_V52 = "版本 v0.1.40";

function applyShopPlayerPurchaseV52() {
  ensureShopFixStylesV52();
  hideInstallButtonsV52();
  moveVersionToFooterV52();
  patchShopPanelsV52();
  patchShopViewsV52();
  patchShopActionsV52();
}

function ensureShopFixStylesV52() {
  if (document.getElementById("shop-player-purchase-v52-style")) return;
  const style = document.createElement("style");
  style.id = "shop-player-purchase-v52-style";
  style.textContent = `
    #installButton,
    #installIconV50 {
      display: none !important;
    }

    .version-footer-v52 {
      width: 100%;
      margin: 18px auto 8px;
      padding: 8px 12px;
      text-align: center;
      color: var(--muted);
      font-size: 10px;
      line-height: 1;
      opacity: .38;
      pointer-events: none;
    }

    .version-footer-v52 .status-pill,
    .version-footer-badge-v52 {
      position: static !important;
      right: auto !important;
      bottom: auto !important;
      z-index: auto !important;
      display: inline !important;
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      color: inherit !important;
      font-size: inherit !important;
      opacity: 1 !important;
    }

    body[data-mode="dm"][data-shop-open="true"] .tab-panel {
      display: none !important;
    }

    body[data-mode="dm"] #shopPanelV43 {
      display: none !important;
      position: static !important;
      width: 100% !important;
      max-height: none !important;
      margin-top: 10px !important;
      transform: none !important;
    }

    body[data-mode="dm"][data-shop-open="true"] #shopPanelV43 {
      display: grid !important;
    }

    body[data-mode="player"] #shopPanelV43 {
      display: none !important;
    }

    body[data-mode="player"][data-shop-open="true"] #shopPanelV43 {
      display: grid !important;
    }

    body[data-mode="player"] .shop-dm-controls,
    body[data-mode="player"] #rollShopPricesButton,
    body[data-mode="player"] #rerollShopPricesButton,
    body[data-mode="player"] [data-shop-price-action],
    body[data-mode="player"] [data-shop-edit-action] {
      display: none !important;
    }

    body[data-mode="player"] .shop-item [data-player-buy-shop] {
      display: inline-flex !important;
    }

    .shop-buyer-v52 {
      display: grid;
      gap: 6px;
      padding: 7px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(18, 20, 23, .52);
    }

    .shop-buyer-v52 label {
      display: grid;
      gap: 4px;
      color: var(--muted);
      font-size: .72rem;
      font-weight: 900;
    }

    .shop-buyer-v52 select {
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(12, 16, 23, .9);
      color: var(--text);
      padding: 0 8px;
      font: inherit;
    }

    .shop-message-v52 {
      min-height: 1em;
      margin: 0;
      color: var(--gold);
      font-size: .72rem;
      line-height: 1.35;
    }
  `;
  document.head.appendChild(style);
}

function hideInstallButtonsV52() {
  ["installButton", "installIconV50"].forEach((id) => {
    const button = document.getElementById(id);
    if (!button) return;
    button.hidden = true;
    button.setAttribute("aria-hidden", "true");
    button.tabIndex = -1;
  });
}

function moveVersionToFooterV52() {
  let footer = document.getElementById("versionFooterV52");
  if (!footer) {
    footer = document.createElement("footer");
    footer.id = "versionFooterV52";
    footer.className = "version-footer-v52";
    document.body.appendChild(footer);
  }

  let badge = document.querySelector(".session-strip .status-pill") || footer.querySelector(".status-pill");
  if (!badge) {
    badge = document.createElement("span");
    badge.className = "status-pill";
  }

  badge.classList.remove("version-corner-v50");
  badge.classList.add("version-footer-badge-v52");
  badge.textContent = SHOP_FIX_VERSION_V52;
  footer.appendChild(badge);
}

function patchShopPanelsV52() {
  if (!window.shopPanelPatchedV52) {
    window.shopPanelPatchedV52 = true;

    document.addEventListener("click", (event) => {
      const tabButton = event.target.closest(".tabbar__button[data-tab]");
      if (!tabButton) return;
      document.body.dataset.shopOpen = "false";
      document.getElementById("shopPanelV43")?.setAttribute("hidden", "");
    }, true);
  }

  if (typeof openShopPanelV43 === "function" && !window.openShopPanelPatchedV52) {
    const originalOpenShopPanelV43 = openShopPanelV43;
    window.openShopPanelPatchedV52 = true;
    window.openShopPanelV43 = function openShopPanelWithTabsV52() {
      document.body.dataset.shopOpen = "true";
      const panel = document.getElementById("shopPanelV43");
      panel?.removeAttribute("hidden");
      originalOpenShopPanelV43();
      if (state.mode === "dm") {
        document.querySelectorAll(".tabbar__button").forEach((button) => button.classList.remove("is-active"));
        document.querySelectorAll(".tab-panel").forEach((panelNode) => panelNode.classList.remove("is-active"));
      }
    };
    try {
      openShopPanelV43 = window.openShopPanelV43;
    } catch (error) {}
  }

  if (typeof closeShopPanelV43 === "function" && !window.closeShopPanelPatchedV52) {
    const originalCloseShopPanelV43 = closeShopPanelV43;
    window.closeShopPanelPatchedV52 = true;
    window.closeShopPanelV43 = function closeShopPanelWithTabsV52() {
      originalCloseShopPanelV43();
      document.body.dataset.shopOpen = "false";
      if (state.mode === "dm" && state.activeTab) {
        document.getElementById(state.activeTab)?.classList.add("is-active");
        document.querySelector(`.tabbar__button[data-tab="${state.activeTab}"]`)?.classList.add("is-active");
      }
    };
    try {
      closeShopPanelV43 = window.closeShopPanelV43;
    } catch (error) {}
  }
}

function patchShopViewsV52() {
  if (window.shopViewsPatchedV52 || typeof shopGridHtmlV43 !== "function") return;
  window.shopViewsPatchedV52 = true;

  shopGridHtmlV43 = function shopGridHtmlV52(filter = "all", allowPurchase = state.mode === "dm") {
    const prices = state.shopPricesV43 || {};
    return shopItemsWithKeysV52()
      .filter((item) => filter === "all" || item.type === filter)
      .map((item) => shopItemCardV52(item, prices[item.key], allowPurchase || state.mode === "player"))
      .join("");
  };

  PlayerShopViewV43 = function PlayerShopViewV52(filter = "all") {
    return `
      ${state.mode === "player" ? buyerSelectorV52() : ""}
      <div class="shop-toolbar">
        ${["all", "primary", "secondary", "armor"].map((key) => `<button class="text-button ${filter === key ? "is-active" : ""}" data-shop-filter="${key}" type="button">${shopFilterLabelV52(key)}</button>`).join("")}
      </div>
      <div class="shop-grid" id="shopGridV43">${shopGridHtmlV43(filter, true)}</div>
    `;
  };

  DmShopControlsV43 = function DmShopControlsV52() {
    return `<div class="shop-dm-controls"><button class="text-button" id="rollShopPricesButton" type="button">重新定價</button></div>`;
  };
}

function patchShopActionsV52() {
  if (window.shopActionsPatchedV52) return;
  window.shopActionsPatchedV52 = true;

  document.addEventListener("change", (event) => {
    const select = event.target.closest("#shopBuyerSelectV52");
    if (!select) return;
    state.playerCharacterId = select.value;
    persistShopPurchaseV52();
    if (typeof renderShopPanelV43 === "function") {
      renderShopPanelV43(typeof currentShopFilterV43 === "function" ? currentShopFilterV43() : "all");
    }
  }, true);

  document.addEventListener("click", (event) => {
    const buy = event.target.closest("[data-player-buy-shop]");
    if (!buy || state.mode !== "player") return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    buyShopItemV52(buy.dataset.playerBuyShop);
  }, true);
}

function shopItemsWithKeysV52() {
  const source = Array.isArray(window.zhShopItems) && window.zhShopItems.length
    ? window.zhShopItems
    : SHOP_ITEMS_V43;
  return source.map((item, index) => ({
    ...item,
    key: item.key || (typeof itemKeyV43 === "function" ? itemKeyV43(item, index) : `${item.type}-${item.tier}-${index}`),
  }));
}

function shopFilterLabelV52(key) {
  return ({ all: "全部", primary: "主武器", secondary: "副武器", armor: "防具" })[key] || key;
}

function shopTypeLabelV52(type) {
  return ({ primary: "主武器", secondary: "副武器", armor: "防具" })[type] || "裝備";
}

function shopItemCardV52(item, price, allowPurchase) {
  const shownPrice = price || priceForItemV43(item);
  const buyAttribute = state.mode === "player" ? "data-player-buy-shop" : "data-buy-shop";
  const action = allowPurchase
    ? `<button class="primary-button" ${buyAttribute}="${escapeShopHtmlV43(item.key)}" type="button">購買</button>`
    : `<p>狀態：可購買</p>`;
  return `
    <article class="shop-item">
      <strong>${escapeShopHtmlV43(item.name)}</strong>
      <span>${shopTypeLabelV52(item.type)} · T${item.tier} · ${escapeShopHtmlV43(shownPrice.label)}</span>
      <p>${shopDescriptionTextV52(item, shownPrice)}</p>
      ${action}
    </article>
  `;
}

function shopDescriptionTextV52(item, price) {
  const type = shopTypeLabelV52(item.type);
  return `${type}裝備，價格規則：${price.rule || "固定價格"}`;
}

function buyerSelectorV52() {
  const characters = state.characters || [];
  if (!state.playerCharacterId && characters[0]) state.playerCharacterId = characters[0].id;
  const options = characters
    .map((character) => `<option value="${escapeShopHtmlV43(character.id)}" ${character.id === state.playerCharacterId ? "selected" : ""}>${escapeShopHtmlV43(character.name)}</option>`)
    .join("");
  const message = window.shopMessageV52 || (characters.length ? "" : "請先新增購買角色");
  return `
    <div class="shop-buyer-v52">
      <label>
        <span>購買角色</span>
        <select id="shopBuyerSelectV52">${options}</select>
      </label>
      <p class="shop-message-v52" id="shopMessageV52">${escapeShopHtmlV43(message)}</p>
    </div>
  `;
}

function buyShopItemV52(key) {
  const entry = shopItemsWithKeysV52().find((item) => item.key === key);
  const character = state.characters.find((item) => item.id === state.playerCharacterId);
  if (!entry || !character) {
    showShopMessageV52("請先選擇購買角色");
    return;
  }

  const price = (state.shopPricesV43 || {})[key] || priceForItemV43(entry);
  const cost = toHandsV43(price.amount, price.unit);
  const assets = normalizeAssetsForPurchaseV52(character);
  if (assets.total < cost) {
    showShopMessageV52("資產不足");
    return;
  }

  state.characters = state.characters.map((item) => (
    item.id === character.id ? { ...item, assets: { total: assets.total - cost } } : item
  ));

  if (typeof addAssetLogV43 === "function") {
    addAssetLogV43(character.id, `${character.name} 已購買：${entry.name}，花費 ${price.label}`);
  }
  showShopMessageV52(`已購買：${entry.name}`);
  persistShopPurchaseV52();
  if (typeof render === "function") render();
}

function normalizeAssetsForPurchaseV52(character) {
  if (typeof normalizeAssetsV41 === "function") return normalizeAssetsV41(character);
  const total = Math.max(0, Number(character.assets?.total || 0));
  return { total };
}

function showShopMessageV52(message) {
  window.shopMessageV52 = message;
  const node = document.getElementById("shopMessageV52");
  if (node) node.textContent = message;
}

function persistShopPurchaseV52() {
  if (typeof writeAssetShadowV41 === "function") writeAssetShadowV41();
  if (typeof save === "function") save();
  else if (typeof saveState === "function") saveState();
  if (typeof saveCloudState === "function") {
    window.clearTimeout(window.shopPurchaseCloudSaveV52);
    window.shopPurchaseCloudSaveV52 = window.setTimeout(() => saveCloudState(), 30);
  }
}

if (typeof render === "function" && !window.shopPurchaseRenderPatchedV52) {
  const originalRenderV52 = render;
  render = function renderWithShopPurchaseV52() {
    originalRenderV52();
    applyShopPlayerPurchaseV52();
  };
  window.shopPurchaseRenderPatchedV52 = true;
}

window.addEventListener("load", applyShopPlayerPurchaseV52);
applyShopPlayerPurchaseV52();
