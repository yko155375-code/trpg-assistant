const SHOP_ITEMS_V43 = [
  ...["闊劍", "長劍", "戰斧", "巨劍", "釘頭錘", "戰鎚", "匕首", "長棍", "彎刀", "刺劍", "長柄斧", "長矛", "短弓", "弩", "長弓", "奧術拳套", "聖化斧", "發光戒環", "手部符文", "迴旋刃", "短法杖", "雙頭法杖", "權杖", "魔杖", "大法杖"].map((name) => ({ type: "primary", tier: 1, name })),
  ...["精良闊劍", "精良長劍", "精良戰斧", "精良巨劍", "精良釘頭錘", "精良戰鎚", "精良匕首", "精良長棍", "精良彎刀", "精良刺劍", "精良長柄斧", "精良長矛", "精良短弓", "精良弩", "精良長弓", "鍍金彎刃", "指節刃", "烏洛克闊劍", "刃鞭", "戰鐮", "火銃", "巨弓", "細弦弓", "精良奧術拳套", "精良聖化斧", "精良發光戒環", "精良手部符文", "精良迴旋刃", "精良短法杖", "精良雙頭法杖", "精良權杖", "精良魔杖", "精良大法杖"].map((name) => ({ type: "primary", tier: 2, name })),
  ...["高階闊劍", "高階長劍", "高階戰斧", "高階巨劍", "高階釘頭錘", "高階戰鎚", "高階匕首", "高階長棍", "高階彎刀", "高階刺劍", "高階長柄斧", "高階長矛", "高階短弓", "高階弩", "高階長弓", "閃翼刃", "勇者劍", "憤怒之鎚", "雙刃斧", "子午彎刀", "伸縮軍刀", "雙頭連枷", "利爪雙刃", "黑火藥左輪", "尖刺弓", "高階奧術拳套", "高階聖化斧", "高階發光戒環", "高階手部符文", "高階迴旋刃", "高階短法杖", "高階雙頭法杖", "高階權杖", "高階魔杖", "高階大法杖"].map((name) => ({ type: "primary", tier: 3, name })),
  ...["傳奇闊劍", "傳奇長劍", "傳奇戰斧", "傳奇巨劍", "傳奇釘頭錘", "傳奇戰鎚", "傳奇匕首", "傳奇長棍", "傳奇彎刀", "傳奇刺劍", "傳奇長柄斧", "傳奇長矛", "傳奇短弓", "傳奇弩", "傳奇長弓", "傳奇奧術拳套", "傳奇聖化斧", "傳奇發光戒環", "傳奇手部符文", "傳奇迴旋刃", "傳奇短法杖", "傳奇雙頭法杖", "傳奇權杖", "傳奇魔杖", "傳奇大法杖"].map((name) => ({ type: "primary", tier: 4, name })),
  ...["短劍", "圓盾", "塔盾", "小匕首", "鞭", "擒抱器", "手弩"].map((name) => ({ type: "secondary", tier: 1, name })),
  ...["精良短劍", "精良圓盾", "精良塔盾", "精良小匕首", "精良鞭", "精良擒抱器", "精良手弩", "尖刺盾", "格擋匕首", "迴旋斧"].map((name) => ({ type: "secondary", tier: 2, name })),
  ...["高階短劍", "高階圓盾", "高階塔盾", "高階小匕首", "高階鞭", "高階擒抱器", "高階手弩", "小圓盾", "動力拳套", "手投索"].map((name) => ({ type: "secondary", tier: 3, name })),
  ...["傳奇短劍", "傳奇圓盾", "傳奇塔盾", "傳奇小匕首", "傳奇鞭", "傳奇擒抱器", "傳奇手弩", "勇者盾", "指節爪", "引燃碎片"].map((name) => ({ type: "secondary", tier: 4, name })),
  ...["軟甲", "皮甲", "鎖子甲", "全身板甲"].map((name) => ({ type: "armor", tier: 1, name })),
  ...["精良軟甲", "精良皮甲", "精良鎖子甲", "精良全身板甲", "艾倫德里亞鎖甲", "悲骨護甲", "鐵樹胸甲", "符文漂浮甲", "泰瑞斯軟甲", "薔薇荒野甲"].map((name) => ({ type: "armor", tier: 2, name })),
  ...["高階軟甲", "高階皮甲", "高階鎖子甲", "高階全身板甲", "貝拉米精緻甲", "龍鱗甲", "尖刺板甲", "刃旅甲", "莫奈特斗篷", "堅固符文"].map((name) => ({ type: "armor", tier: 3, name })),
  ...["傳奇軟甲", "傳奇皮甲", "傳奇鎖子甲", "傳奇全身板甲", "杜納米絲絲鏈甲", "導流護甲", "燼織護甲", "全強化護甲", "真理蛋白石甲", "救贖鎖甲"].map((name) => ({ type: "armor", tier: 4, name })),
];

const SHOP_TYPE_LABEL_V43 = {
  primary: "主武器",
  secondary: "副武器",
  armor: "防具",
};

const SHOP_PRICE_RULE_V43 = {
  1: { unit: "hand", sides: 5, label: "1d5 把" },
  2: { unit: "bag", sides: 2, label: "1d2 袋" },
  3: { unit: "bag", sides: 6, offset: 4, label: "1d6+4 袋" },
  4: { unit: "box", sides: 2, label: "1d2 箱" },
};

function applyShopV43() {
  ensureShopStylesV43();
  patchAssetLoggerV43();
  ensureShopEntryV43();
  ensureShopPanelV43();
  ensureAssetLogPanelV43();
  renderShopPanelV43();
  updateShopVersionV43();
}

function ensureShopStylesV43() {
  if (document.getElementById("shop-v43-style")) return;
  const style = document.createElement("style");
  style.id = "shop-v43-style";
  style.textContent = `
    .shop-entry-button-v43{margin-left:4px}
    .player-shop-button-v43{min-height:34px;padding:0 12px;white-space:nowrap}
    body[data-mode="player"] .shop-entry-button-v43{display:inline-flex!important}
    body[data-mode="dm"] .player-shop-button-v43{display:none!important}
    body[data-mode="player"] #priceRollTabButton{display:inline-flex!important}
    body[data-mode="player"] #shopPanelV43{display:none}
    body[data-mode="player"][data-shop-open="true"] #shopPanelV43{display:grid}
    body[data-mode="player"][data-shop-open="true"] #dice{display:none!important}
    body[data-mode="dm"] #shopPanelV43{display:none}
    body[data-mode="dm"][data-shop-open="true"] #shopPanelV43{display:grid}
    .shop-panel{display:grid;gap:8px;align-self:start;margin-top:8px}
    .shop-toolbar{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:5px}
    .shop-toolbar button{min-height:32px;padding:0 8px;font-size:.75rem}
    .shop-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:6px;max-height:520px;overflow:auto}
    .shop-item{padding:7px;border:1px solid var(--line);border-radius:7px;background:rgba(18,20,23,.58);display:grid;gap:5px}
    .shop-item strong{font-size:.78rem}
    .shop-item span,.shop-item p{margin:0;color:var(--muted);font-size:.66rem;line-height:1.35}
    .shop-item button{min-height:30px;font-size:.72rem}
    .shop-dm-controls{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:5px}
    .shop-dm-controls button{min-height:32px;font-size:.74rem}
    .asset-log{margin-top:8px;padding-top:7px;border-top:1px solid var(--line)}
    .asset-log h4{font-size:.72rem;color:var(--muted);margin:0 0 5px}
    .asset-log ol{display:grid;gap:4px;max-height:112px;overflow:auto;margin:0;padding-left:18px}
    .asset-log li{font-size:.68rem;color:var(--muted);line-height:1.35}
    @media(min-width:720px){
      body[data-mode="player"][data-shop-open="true"] main{display:grid;grid-template-columns:minmax(0,1fr) minmax(320px,.95fr);gap:12px;align-items:start}
      body[data-mode="player"][data-shop-open="true"] #shopPanelV43{grid-column:2}
      body[data-mode="dm"][data-shop-open="true"] #shopPanelV43{grid-column:1 / -1}
    }
    @media(max-width:620px){
      .shop-grid{grid-template-columns:1fr}
      .shop-toolbar,.shop-dm-controls{grid-template-columns:repeat(2,minmax(0,1fr))}
    }
  `;
  document.head.appendChild(style);
}

function ensureShopEntryV43() {
  const tabbar = document.querySelector(".tabbar");
  ensurePlayerShopButtonV43();
  if (!tabbar) return;

  let button = document.getElementById("priceRollTabButton");
  if (!button) {
    button = document.createElement("button");
    button.id = "priceRollTabButton";
    button.className = "tabbar__button shop-entry-button-v43";
    button.type = "button";
    const audioButton = document.querySelector('[data-tab="audio"]');
    if (audioButton?.nextSibling) {
      audioButton.parentNode.insertBefore(button, audioButton.nextSibling);
    } else {
      tabbar.appendChild(button);
    }
  }

  button.textContent = "商店";
  button.classList.add("shop-entry-button-v43");
  button.onclick = (event) => {
    event.preventDefault();
    openShopPanelV43();
  };
}

function ensurePlayerShopButtonV43() {
  const sessionStrip = document.querySelector(".session-strip");
  if (!sessionStrip || document.getElementById("playerShopButtonV43")) return;
  const button = document.createElement("button");
  button.id = "playerShopButtonV43";
  button.className = "text-button player-shop-button-v43";
  button.type = "button";
  button.textContent = "商店";
  button.addEventListener("click", (event) => {
    event.preventDefault();
    openShopPanelV43();
  });
  sessionStrip.appendChild(button);
}

function ensureShopPanelV43() {
  if (document.getElementById("shopPanelV43")) return;
  const main = document.querySelector("main") || document.body;
  const panel = document.createElement("section");
  panel.id = "shopPanelV43";
  panel.className = "tool-card shop-panel";
  main.appendChild(panel);
  panel.addEventListener("click", handleShopClickV43, true);
  if (!state.shopPricesV43) rollAllShopPricesV43(false);
}

function renderShopPanelV43(filter = currentShopFilterV43()) {
  const panel = document.getElementById("shopPanelV43");
  if (!panel) return;
  const isDm = state.mode === "dm";
  panel.innerHTML = `
    <div class="card-header">
      <div><h3>商店</h3></div>
      <button class="text-button" data-close-shop type="button">關閉</button>
    </div>
    ${isDm ? DmShopControlsV43() : ""}
    ${PlayerShopViewV43(filter)}
  `;
}

function PlayerShopViewV43(filter = "all") {
  return `
    <div class="shop-toolbar">
      <button class="text-button ${filter === "all" ? "is-active" : ""}" data-shop-filter="all" type="button">全部</button>
      <button class="text-button ${filter === "primary" ? "is-active" : ""}" data-shop-filter="primary" type="button">主武器</button>
      <button class="text-button ${filter === "secondary" ? "is-active" : ""}" data-shop-filter="secondary" type="button">副武器</button>
      <button class="text-button ${filter === "armor" ? "is-active" : ""}" data-shop-filter="armor" type="button">防具</button>
    </div>
    <div class="shop-grid" id="shopGridV43">${shopGridHtmlV43(filter)}</div>
  `;
}

function DmShopControlsV43() {
  return `
    <div class="shop-dm-controls">
      <button class="text-button" id="rollShopPricesButton" type="button">重新定價</button>
      <button class="text-button" id="rerollShopPricesButton" type="button">重擲商品價格</button>
    </div>
  `;
}

function openShopPanelV43() {
  document.body.dataset.shopOpen = "true";
  state.activeTab = state.mode === "dm" ? state.activeTab : "dashboard";
  renderShopPanelV43(currentShopFilterV43());
  if (typeof persistLocalModeV46 === "function") persistLocalModeV46();
}

function closeShopPanelV43() {
  document.body.dataset.shopOpen = "false";
  if (typeof persistLocalModeV46 === "function") persistLocalModeV46();
}

function ensureAssetLogPanelV43() {
  document.querySelectorAll("#characterList .monitor-card").forEach((card) => {
    const row = card.querySelector(".asset-row");
    const id = row?.dataset.assetCharacter;
    if (!row || !id) return;
    let log = card.querySelector(".asset-log");
    if (!log) {
      log = document.createElement("div");
      log.className = "asset-log";
      row.insertAdjacentElement("afterend", log);
    }
    const items = assetLogsForV43(id);
    log.innerHTML = `<h4>資產紀錄</h4><ol>${items.map((item) => `<li>${escapeShopHtmlV43(item)}</li>`).join("") || `<li>尚無紀錄</li>`}</ol>`;
  });
}

function handleShopClickV43(event) {
  const close = event.target.closest("[data-close-shop]");
  if (close) {
    event.preventDefault();
    closeShopPanelV43();
    return;
  }

  const filter = event.target.closest("[data-shop-filter]");
  if (filter) {
    event.preventDefault();
    renderShopPanelV43(filter.dataset.shopFilter);
    return;
  }

  const priceButton = event.target.closest("#rollShopPricesButton, #rerollShopPricesButton");
  if (priceButton) {
    event.preventDefault();
    if (state.mode !== "dm") return;
    rollAllShopPricesV43(true);
    renderShopPanelV43(currentShopFilterV43());
    return;
  }

  const buy = event.target.closest("[data-buy-shop]");
  if (buy) {
    event.preventDefault();
    buyShopItemV43(buy.dataset.buyShop);
  }
}

function rollAllShopPricesV43(announce = true) {
  const prices = {};
  SHOP_ITEMS_V43.forEach((item, index) => {
    const rule = SHOP_PRICE_RULE_V43[item.tier];
    const amount = Math.floor(Math.random() * rule.sides) + 1 + (rule.offset || 0);
    prices[itemKeyV43(item, index)] = {
      amount,
      unit: rule.unit,
      label: `${amount}${unitLabelV43(rule.unit)}`,
      rule: rule.label,
    };
  });
  state.shopPricesV43 = prices;
  if (announce) addGlobalAssetLogV43("DM 重新定價商店商品");
  persistShopV43();
  if (announce && typeof render === "function") render();
}

function shopGridHtmlV43(filter = "all") {
  const prices = state.shopPricesV43 || {};
  return SHOP_ITEMS_V43
    .map((item, index) => ({ ...item, key: itemKeyV43(item, index) }))
    .filter((item) => filter === "all" || item.type === filter)
    .map((item) => {
      const price = prices[item.key] || priceForItemV43(item);
      return `<article class="shop-item"><strong>T${item.tier} ${escapeShopHtmlV43(item.name)}</strong><span>${SHOP_TYPE_LABEL_V43[item.type]}｜價格 ${price.label}</span><p>定價規則：${price.rule}</p><button class="primary-button" data-buy-shop="${item.key}" type="button">購買</button></article>`;
    })
    .join("");
}

function renderShopGridV43(filter = "all") {
  const grid = document.getElementById("shopGridV43");
  if (grid) grid.innerHTML = shopGridHtmlV43(filter);
}

function buyShopItemV43(key) {
  const entry = SHOP_ITEMS_V43.map((item, index) => ({ ...item, key: itemKeyV43(item, index) })).find((item) => item.key === key);
  if (!entry) return;
  const character = state.characters.find((item) => item.id === state.playerCharacterId) || state.characters[0];
  if (!character) {
    alert("請先新增玩家角色");
    return;
  }
  const price = (state.shopPricesV43 || {})[key] || priceForItemV43(entry);
  const cost = toHandsV43(price.amount, price.unit);
  const assets = normalizeShopAssetsV43(character);
  if (assets.total < cost) {
    alert("資產不足，無法購買");
    return;
  }
  state.characters = state.characters.map((item) => (
    item.id === character.id ? { ...item, assets: { total: assets.total - cost } } : item
  ));
  addAssetLogV43(character.id, `${character.name} 購買 ${entry.name}，花費 ${price.label}`);
  persistShopV43();
  if (typeof render === "function") render();
}

function recordAssetChangeV43(characterId, unit, step) {
  const character = state.characters.find((item) => item.id === characterId);
  if (!character || !step) return;
  const sign = step > 0 ? "+" : "";
  addAssetLogV43(characterId, `${character.name} 資產 ${sign}${step}${unitLabelV43(unit)}`);
  persistShopV43();
}

function patchAssetLoggerV43() {
  if (window.assetLoggerPatchedV43 || typeof window.updateCharacterAssetV41 !== "function") return;
  const original = window.updateCharacterAssetV41;
  window.updateCharacterAssetV41 = function updateCharacterAssetWithLogV43(characterId, unit, step) {
    original(characterId, unit, step);
    recordAssetChangeV43(characterId, unit, Number(step));
    ensureAssetLogPanelV43();
  };
  try {
    updateCharacterAssetV41 = window.updateCharacterAssetV41;
  } catch (error) {}
  window.assetLoggerPatchedV43 = true;
}

function priceForItemV43(item) {
  const rule = SHOP_PRICE_RULE_V43[item.tier];
  return { amount: 1, unit: rule.unit, label: `1${unitLabelV43(rule.unit)}`, rule: rule.label };
}

function itemKeyV43(item, index) {
  return `${item.type}-${item.tier}-${index}`;
}

function toHandsV43(amount, unit) {
  return unit === "box" ? amount * 100 : unit === "bag" ? amount * 10 : amount;
}

function unitLabelV43(unit) {
  return unit === "box" ? "箱" : unit === "bag" ? "袋" : "把";
}

function normalizeShopAssetsV43(character) {
  if (typeof normalizeAssetsV41 === "function") return normalizeAssetsV41(character);
  return { total: Number(character.assets?.total || 0) };
}

function currentShopFilterV43() {
  return document.querySelector("[data-shop-filter].is-active")?.dataset.shopFilter || "all";
}

function addAssetLogV43(characterId, text) {
  state.assetLogsV43 = state.assetLogsV43 || {};
  state.assetLogsV43[characterId] = [
    `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${text}`,
    ...(state.assetLogsV43[characterId] || []),
  ].slice(0, 20);
}

function addGlobalAssetLogV43(text) {
  state.assetLogsV43 = state.assetLogsV43 || {};
  state.assetLogsV43.global = [
    `${new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} ${text}`,
    ...(state.assetLogsV43.global || []),
  ].slice(0, 20);
}

function assetLogsForV43(characterId) {
  return [
    ...(state.assetLogsV43?.[characterId] || []),
    ...(state.assetLogsV43?.global || []).slice(0, 3),
  ].slice(0, 8);
}

function persistShopV43() {
  if (typeof writeAssetShadowV41 === "function") writeAssetShadowV41();
  if (typeof save === "function") {
    save();
  } else if (typeof saveState === "function") {
    saveState();
  }
  if (typeof saveCloudState === "function") {
    window.clearTimeout(window.shopCloudSaveV43);
    window.shopCloudSaveV43 = window.setTimeout(() => saveCloudState(), 30);
  }
}

function updateShopVersionV43() {
  const version = document.querySelector(".session-strip .status-pill");
  if (version) version.textContent = "v0.1.18 商店權限版";
}

function escapeShopHtmlV43(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function" && !window.shopRenderPatchedV43) {
  const originalRenderV43 = render;
  render = function renderWithShopV43() {
    originalRenderV43();
    applyShopV43();
  };
  window.shopRenderPatchedV43 = true;
}

window.recordAssetChangeV43 = recordAssetChangeV43;
window.openShopPanelV43 = openShopPanelV43;
window.addEventListener("load", applyShopV43);
applyShopV43();
