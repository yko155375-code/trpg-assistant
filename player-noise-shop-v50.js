const SHOP_COUNTS_V50 = {
  primary: [25, 33, 34, 25],
  secondary: [7, 10, 10, 10],
  armor: [4, 10, 10, 10],
};

const SHOP_TYPE_LABEL_V50 = { primary: "武器", secondary: "武器", armor: "防具" };
const SHOP_TYPE_FILTER_LABEL_V50 = { all: "全部", primary: "主武器", secondary: "副武器", armor: "防具" };

function zhShopItemsV50() {
  const prefix = { primary: "主武器", secondary: "副武器", armor: "防具" };
  return Object.entries(SHOP_COUNTS_V50).flatMap(([type, counts]) => (
    counts.flatMap((count, tierIndex) => (
      Array.from({ length: count }, (_, index) => ({
        type,
        tier: tierIndex + 1,
        name: `第${tierIndex + 1}階${prefix[type]} ${String(index + 1).padStart(2, "0")}`,
      }))
    ))
  ));
}

function applyPlayerNoiseShopV50() {
  ensurePlayerNoiseStylesV50();
  ensurePlayerToolRailV50();
  ensureInstallIconV50();
  patchShopRenderingV50();
  patchStatusReferenceTextV50();
  updateVisibleTextV50();
  moveVersionBadgeV50();
  syncInstallIconV50();
}

function ensurePlayerNoiseStylesV50() {
  if (document.getElementById("player-noise-shop-v50-style")) return;
  const style = document.createElement("style");
  style.id = "player-noise-shop-v50-style";
  style.textContent = `
    body[data-mode="player"] .hero{min-height:auto;padding-bottom:8px}
    body[data-mode="player"] .hero__copy,
    body[data-mode="player"] .session-strip .hero-fear-card,
    body[data-mode="player"] #installButton,
    body[data-mode="player"] #priceRollTabButton,
    body[data-mode="player"] #playerShopButtonV43{display:none!important}
    body[data-mode="player"] .session-strip{grid-template-columns:minmax(0,1fr)!important;gap:6px;margin-top:6px}
    body[data-mode="player"] main{padding-right:42px}
    body[data-mode="player"] #dashboard{max-width:1120px;margin:0 auto}
    body[data-mode="player"] #dice{max-width:760px;margin:0 auto}
    body[data-mode="player"] .tool-card{box-shadow:none}
    body[data-mode="player"] .bottom-add-form,
    body[data-mode="player"] .danger-delete-button,
    body[data-mode="player"] .shop-dm-controls,
    body[data-mode="player"] #rollShopPricesButton,
    body[data-mode="player"] #rerollShopPricesButton{display:none!important}
    .version-corner-v50{position:fixed!important;right:8px!important;bottom:6px!important;z-index:90!important;font-size:10px!important;line-height:1!important;opacity:.35!important;pointer-events:none!important;padding:0!important;border:0!important;background:transparent!important;color:var(--muted)!important}
    .install-icon-v50{position:fixed;top:8px;right:44px;z-index:85;width:26px;height:26px;min-height:26px;padding:0;border:1px solid rgba(185,135,59,.12);border-radius:50%;background:rgba(8,13,23,.18);color:rgba(245,223,170,.68);opacity:.28;font-size:0}
    .install-icon-v50::before{content:"\\2913";font-size:14px;line-height:1}
    .install-icon-v50:hover,.install-icon-v50:focus-visible{opacity:.78}
    .player-tool-rail-v50{position:fixed;right:6px;top:42%;z-index:75;display:grid;gap:6px}
    .player-tool-rail-v50 button{writing-mode:vertical-rl;min-width:30px;min-height:72px;padding:7px 4px;border:1px solid var(--line);border-radius:8px 0 0 8px;background:rgba(12,16,23,.86);color:var(--muted);font-weight:900;font-size:.72rem;letter-spacing:0}
    .player-tool-rail-v50 button:hover,.player-tool-rail-v50 button.is-active{color:var(--gold);border-color:rgba(212,154,53,.56)}
    body[data-mode="dm"] .player-tool-rail-v50{display:none}
    #statusReferenceToggle{display:none!important}
    .status-reference-panel{right:42px!important;top:64px!important;z-index:74!important;width:min(310px,calc(100vw - 58px))!important;max-height:calc(100vh - 92px)!important}
    #shopPanelV43{position:fixed!important;top:64px!important;right:42px!important;z-index:74!important;width:min(380px,calc(100vw - 58px))!important;max-height:calc(100vh - 92px)!important;overflow:auto!important;margin:0!important;transform:translateX(calc(100% + 60px));transition:transform .18s ease}
    body[data-shop-open="true"] #shopPanelV43{transform:translateX(0)}
    body[data-mode="player"] #shopPanelV43{display:grid!important}
    body[data-mode="player"][data-shop-open="true"] #dice{display:block!important}
    .shop-grid{grid-template-columns:1fr!important;max-height:none!important}
    .shop-item p{font-size:.68rem}
    body[data-mode="player"] .shop-item [data-buy-shop]{display:none!important}
    @media(max-width:720px){
      body[data-mode="player"] main{padding-right:36px}
      .player-tool-rail-v50{right:3px;top:38%}
      .player-tool-rail-v50 button{min-width:28px;min-height:64px;font-size:.68rem}
      #shopPanelV43,.status-reference-panel{right:34px!important;top:58px!important;width:calc(100vw - 46px)!important;max-height:calc(100vh - 76px)!important}
    }
  `;
  document.head.appendChild(style);
}

function ensurePlayerToolRailV50() {
  if (document.getElementById("playerToolRailV50")) return;
  const rail = document.createElement("div");
  rail.id = "playerToolRailV50";
  rail.className = "player-tool-rail-v50";
  rail.innerHTML = `
    <button type="button" data-tool-v50="status">異常狀態</button>
    <button type="button" data-tool-v50="shop">商店</button>
  `;
  rail.addEventListener("click", (event) => {
    const button = event.target.closest("[data-tool-v50]");
    if (!button) return;
    if (button.dataset.toolV50 === "status") toggleStatusDrawerV50();
    if (button.dataset.toolV50 === "shop") toggleShopDrawerV50();
  });
  document.body.appendChild(rail);
}

function toggleStatusDrawerV50() {
  const panel = document.getElementById("statusReferencePanel");
  if (!panel) return;
  document.body.dataset.shopOpen = "false";
  panel.classList.toggle("is-open");
  syncToolRailActiveV50();
}

function toggleShopDrawerV50() {
  const panel = document.getElementById("statusReferencePanel");
  if (panel) panel.classList.remove("is-open");
  const open = document.body.dataset.shopOpen !== "true";
  document.body.dataset.shopOpen = open ? "true" : "false";
  if (open && typeof renderShopPanelV43 === "function") renderShopPanelV43();
  syncToolRailActiveV50();
}

function syncToolRailActiveV50() {
  document.querySelectorAll("[data-tool-v50]").forEach((button) => {
    const isStatus = button.dataset.toolV50 === "status" && document.getElementById("statusReferencePanel")?.classList.contains("is-open");
    const isShop = button.dataset.toolV50 === "shop" && document.body.dataset.shopOpen === "true";
    button.classList.toggle("is-active", isStatus || isShop);
  });
}

function ensureInstallIconV50() {
  if (document.getElementById("installIconV50")) return;
  const button = document.createElement("button");
  button.id = "installIconV50";
  button.className = "install-icon-v50";
  button.type = "button";
  button.hidden = true;
  button.setAttribute("aria-label", "安裝");
  button.addEventListener("click", () => document.getElementById("installButton")?.click());
  document.body.appendChild(button);
  const original = document.getElementById("installButton");
  if (original) new MutationObserver(syncInstallIconV50).observe(original, { attributes: true, attributeFilter: ["hidden"] });
}

function syncInstallIconV50() {
  const icon = document.getElementById("installIconV50");
  const original = document.getElementById("installButton");
  if (!icon) return;
  icon.hidden = !original || original.hidden;
}

function patchShopRenderingV50() {
  if (window.shopRenderingPatchedV50) return;
  window.shopRenderingPatchedV50 = true;
  window.zhShopItems = zhShopItemsV50();

  shopGridHtmlV43 = function shopGridHtmlV50(filter = "all", allowPurchase = state.mode === "dm") {
    const prices = state.shopPricesV43 || {};
    return window.zhShopItems
      .map((item, index) => ({ ...item, key: `${item.type}-${item.tier}-${index}` }))
      .filter((item) => filter === "all" || item.type === filter)
      .map((item) => ShopItemCardV50(item, prices[item.key], allowPurchase && state.mode === "dm"))
      .join("");
  };

  PlayerShopViewV43 = function PlayerShopViewV50(filter = "all") {
    return `
      <div class="shop-toolbar">
        ${["all", "primary", "secondary", "armor"].map((key) => `<button class="text-button ${filter === key ? "is-active" : ""}" data-shop-filter="${key}" type="button">${SHOP_TYPE_FILTER_LABEL_V50[key]}</button>`).join("")}
      </div>
      <div class="shop-grid" id="shopGridV43">${shopGridHtmlV43(filter, state.mode === "dm")}</div>
    `;
  };

  DmShopControlsV43 = function DmShopControlsV50() {
    return `<div class="shop-dm-controls"><button class="text-button" id="rollShopPricesButton" type="button">重新定價</button></div>`;
  };
}

function ShopItemCardV50(item, price, allowPurchase) {
  const shownPrice = price || priceForItemV43(item);
  const action = allowPurchase
    ? `<button class="primary-button" data-buy-shop="${item.key}" type="button">登記購買</button>`
    : `<p>狀態：可購買</p>`;
  return `<article class="shop-item"><strong>${escapeShopHtmlV43(item.name)}</strong><span>${SHOP_TYPE_LABEL_V50[item.type]}｜價格 ${shownPrice.label}</span><p>${shopDescriptionV50(item)}</p>${action}</article>`;
}

function shopDescriptionV50(item) {
  if (item.type === "armor") return `第 ${item.tier} 階防具，供角色提升防護與敘事風格。`;
  if (item.type === "secondary") return `第 ${item.tier} 階副武器，適合搭配主武器或戰術行動。`;
  return `第 ${item.tier} 階武器，適合戰鬥、威嚇或英雄式行動。`;
}

function patchStatusReferenceTextV50() {
  document.querySelectorAll("#statusReferencePanel strong").forEach((node) => {
    if (node.textContent.includes(" / ")) node.textContent = node.textContent.split(" / ")[0];
  });
}

function updateVisibleTextV50() {
  const labels = [
    ["#dashboard .section-heading h2", "玩家狀態"],
    ["#dashboard .card-header h3", "隊伍資源"],
    ["#combat .section-heading h2", "怪物狀態"],
    ["#dice .section-heading h2", "擲骰工具"],
    ["#dice .dice-card h3", "希望與恐懼"],
    [".roll-history-card h3", "擲骰紀錄"],
    ["#audio .section-heading h2", "音樂控制"],
    ["#audio .audio-card h3", "氛圍音樂"],
    ["#playerPanel .section-heading h2", "玩家介面"],
    ["#playerPanel .card-header h3", "我的角色"],
  ];
  labels.forEach(([selector, text]) => {
    const element = document.querySelector(selector);
    if (element) element.textContent = text;
  });
  const install = document.getElementById("installButton");
  if (install) install.textContent = "安裝";
  document.querySelectorAll(".eyebrow").forEach((node) => {
    node.textContent = "";
  });
}

function moveVersionBadgeV50() {
  const badge = document.querySelector(".session-strip .status-pill");
  if (!badge) return;
  badge.classList.add("version-corner-v50");
  badge.textContent = "v0.1.20";
}

if (typeof render === "function" && !window.playerNoiseRenderPatchedV50) {
  const originalRenderV50 = render;
  render = function renderWithPlayerNoiseV50() {
    originalRenderV50();
    applyPlayerNoiseShopV50();
  };
  window.playerNoiseRenderPatchedV50 = true;
}

document.addEventListener("click", (event) => {
  const clickedDrawer = event.target.closest("#shopPanelV43, #statusReferencePanel, #playerToolRailV50");
  if (!clickedDrawer && state.mode === "player") {
    document.body.dataset.shopOpen = "false";
    document.getElementById("statusReferencePanel")?.classList.remove("is-open");
    syncToolRailActiveV50();
  }
}, true);

window.addEventListener("load", applyPlayerNoiseShopV50);
applyPlayerNoiseShopV50();
