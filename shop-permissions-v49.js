(function applyShopPermissionsV49() {
  if (window.shopPermissionsPatchedV49) return;
  window.shopPermissionsPatchedV49 = true;

  const originalShopGridHtml = typeof shopGridHtmlV43 === "function" ? shopGridHtmlV43 : null;
  if (originalShopGridHtml) {
    shopGridHtmlV43 = function shopGridHtmlWithPermissionsV49(filter = "all", allowPurchase = state.mode === "dm") {
      const html = originalShopGridHtml(filter, allowPurchase && state.mode === "dm");
      if (state.mode === "dm") return html;
      return html.replace(/<button class="primary-button" data-buy-shop="[^"]+" type="button">[^<]*<\/button>/g, "<p>\u72c0\u614b\uff1a\u53ef\u8cfc\u8cb7</p>");
    };
  }

  const originalRenderShopGrid = typeof renderShopGridV43 === "function" ? renderShopGridV43 : null;
  if (originalRenderShopGrid) {
    renderShopGridV43 = function renderShopGridWithPermissionsV49(filter = "all") {
      const grid = document.getElementById("shopGridV43");
      if (grid && typeof shopGridHtmlV43 === "function") {
        grid.innerHTML = shopGridHtmlV43(filter, state.mode === "dm");
        return;
      }
      originalRenderShopGrid(filter);
    };
  }

  document.addEventListener("click", (event) => {
    const buyButton = event.target.closest("[data-buy-shop]");
    if (buyButton && state.mode !== "dm") {
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation();
    }
  }, true);

  if (typeof render === "function") render();
})();
