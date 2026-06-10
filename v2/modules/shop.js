import { formatGold, goldToHandfuls, normalizeGoldFromHandfuls } from "./assets.js";
import { getCurrentCharacter, updateCharacter } from "./characters.js";

const typeOptions = [
  { value: "物品", label: "物品", assetKey: "items" },
  { value: "裝備", label: "裝備", assetKey: "equipment" },
  { value: "消耗品", label: "消耗品", assetKey: "consumables" },
];

function makeShopItemId() {
  return `shop-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getAssetKey(type) {
  return typeOptions.find((option) => option.value === type)?.assetKey || "items";
}

export function normalizeShopItem(item = {}) {
  return {
    id: item.id || makeShopItemId(),
    name: item.name || "未命名商品",
    type: typeOptions.some((option) => option.value === item.type) ? item.type : "物品",
    price: Math.max(0, toNumber(item.price)),
    stock: Math.max(0, toNumber(item.stock, 1)),
    description: item.description || "",
  };
}

export function normalizeShop(shop = {}) {
  return {
    items: Array.isArray(shop.items) ? shop.items.map(normalizeShopItem) : [],
    purchaseLog: Array.isArray(shop.purchaseLog) ? shop.purchaseLog : [],
  };
}

export function addShopItem(state, values = {}) {
  const item = normalizeShopItem({
    id: makeShopItemId(),
    name: values.name || "新商品",
    type: values.type || "物品",
    price: values.price,
    stock: values.stock,
    description: values.description,
  });

  return {
    ...state,
    shop: {
      ...normalizeShop(state.shop),
      items: [...normalizeShop(state.shop).items, item],
    },
  };
}

export function updateShopItem(state, itemId, field, value) {
  return {
    ...state,
    shop: {
      ...normalizeShop(state.shop),
      items: normalizeShop(state.shop).items.map((item) =>
        item.id === itemId
          ? normalizeShopItem({
              ...item,
              [field]: field === "price" || field === "stock" ? toNumber(value) : value,
            })
          : item,
      ),
    },
  };
}

export function deleteShopItem(state, itemId) {
  return {
    ...state,
    shop: {
      ...normalizeShop(state.shop),
      items: normalizeShop(state.shop).items.filter((item) => item.id !== itemId),
    },
  };
}

export function setShopMessage(state, message) {
  return {
    ...state,
    ui: {
      ...state.ui,
      shopMessage: message,
    },
  };
}

export function purchaseShopItem(state, itemId) {
  const shop = normalizeShop(state.shop);
  const item = shop.items.find((entry) => entry.id === itemId);
  const character = getCurrentCharacter(state);

  if (!character) {
    return setShopMessage(state, "請先選擇角色後再購買。");
  }

  if (!item) {
    return setShopMessage(state, "找不到商品。");
  }

  if (item.stock <= 0) {
    return setShopMessage(state, "此商品已售完。");
  }

  if (character.assets.money < item.price) {
    return setShopMessage(state, "金錢不足，無法購買。");
  }

  const assetKey = getAssetKey(item.type);
  const nextLog = {
    id: `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    characterName: character.name,
    itemName: item.name,
    price: item.price,
    time: new Date().toISOString(),
  };

  const stateWithCharacter = updateCharacter(state, character.id, (current) => {
    const gold = normalizeGoldFromHandfuls(current.assets.money - item.price);

    return {
      ...current,
      assets: {
        ...current.assets,
        money: goldToHandfuls(gold),
        gold,
        [assetKey]: [...(current.assets[assetKey] || []), item.name],
      },
    };
  });

  return setShopMessage({
    ...stateWithCharacter,
    shop: {
      ...shop,
      items: shop.items.map((entry) =>
        entry.id === item.id ? normalizeShopItem({ ...entry, stock: entry.stock - 1 }) : entry,
      ),
      purchaseLog: [nextLog, ...shop.purchaseLog].slice(0, 100),
    },
  }, `已購買：${item.name}`);
}

export function renderPlayerShop(state) {
  const shop = normalizeShop(state.shop);
  const character = getCurrentCharacter(state);

  return `
    <section class="shop-panel shop-panel-compact">
      <div class="shop-summary shop-summary-compact">
        <h3>玩家商店</h3>
        <p>${character ? `目前角色：${escapeHtml(character.name)}｜金錢：${formatGold(character.assets.gold)}` : "尚未選擇角色"}</p>
      </div>
      ${state.ui.shopMessage ? `<p class="form-message">${escapeHtml(state.ui.shopMessage)}</p>` : ""}
      ${
        shop.items.length
          ? `<div class="shop-grid shop-player-grid">
              ${shop.items.map((item) => renderPlayerShopItem(item, character)).join("")}
            </div>`
          : `<p class="empty-hint">商店目前沒有商品。</p>`
      }
    </section>
  `;
}

function renderPlayerShopItem(item, character) {
  const soldOut = item.stock <= 0;
  const hasCharacter = Boolean(character);
  const canAfford = hasCharacter && character.assets.money >= item.price;
  const disabled = !hasCharacter || soldOut || !canAfford;
  const buttonText = soldOut ? "售完" : !hasCharacter ? "未選角色" : !canAfford ? "金錢不足" : "購買";
  const description = item.description ? `<small class="shop-compact-description">${escapeHtml(item.description)}</small>` : "";

  return `
    <article class="shop-item-card shop-item-compact">
      <div class="shop-compact-head">
        <h4>${escapeHtml(item.name)}</h4>
        <span>${escapeHtml(item.type)}</span>
      </div>
      <div class="shop-compact-meta">
        <b>${formatGold(item.price)}</b>
        <span>${soldOut ? "售完" : `庫存 ${item.stock}`}</span>
      </div>
      ${description}
      <button class="primary-button shop-buy-button" type="button" data-action="purchase-shop-item" data-shop-item-id="${escapeHtml(item.id)}" ${disabled ? "disabled" : ""}>${buttonText}</button>
    </article>
  `;
}

export function renderDmShopManager(state) {
  const shop = normalizeShop(state.shop);

  return `
    <section class="shop-panel shop-panel-compact shop-manager-panel">
      <div class="editor-heading">
        <h3>商店管理</h3>
      </div>
      ${renderAddShopItemForm()}
      ${
        shop.items.length
          ? `<div class="shop-manager-list">
              ${shop.items.map(renderDmShopItem).join("")}
            </div>`
          : `<p class="empty-hint">尚未建立商品。</p>`
      }
      ${renderPurchaseLog(shop.purchaseLog)}
    </section>
  `;
}

function renderAddShopItemForm() {
  return `
    <form class="editor-panel shop-add-form shop-add-form-compact" data-add-shop-item-form>
      <div class="form-grid shop-add-grid-compact">
        <label class="form-field">
          <span>商品名稱</span>
          <input data-new-shop-name type="text" placeholder="治療藥水" autocomplete="off" />
        </label>
        <label class="form-field">
          <span>類型</span>
          <select data-new-shop-type>
            ${typeOptions.map((option) => `<option value="${option.value}">${option.label}</option>`).join("")}
          </select>
        </label>
        <label class="form-field">
          <span>價格（把）</span>
          <input data-new-shop-price type="number" inputmode="numeric" min="0" value="0" />
        </label>
        <label class="form-field">
          <span>庫存</span>
          <input data-new-shop-stock type="number" inputmode="numeric" min="0" value="1" />
        </label>
        <label class="form-field form-field-full">
          <span>描述</span>
          <textarea data-new-shop-description rows="2" placeholder="商品效果或備註"></textarea>
        </label>
      </div>
      <button class="primary-button full-width-button" type="submit">新增商品</button>
    </form>
  `;
}

function renderDmShopItem(item) {
  return `
    <details class="shop-manager-row">
      <summary class="shop-manager-summary">
        <strong>${escapeHtml(item.name)}</strong>
        <span>${escapeHtml(item.type)}</span>
        <b>${formatGold(item.price)}</b>
        <span>${item.stock <= 0 ? "售完" : `庫存 ${item.stock}`}</span>
        <em>編輯</em>
        <button class="danger-button shop-row-delete" type="button" data-action="delete-shop-item" data-shop-item-id="${escapeHtml(item.id)}">刪除</button>
      </summary>
      <div class="shop-manager-editor">
        <label class="form-field">
          <span>商品名稱</span>
          <input data-shop-item-id="${escapeHtml(item.id)}" data-shop-item-field="name" type="text" value="${escapeHtml(item.name)}" />
        </label>
        <label class="form-field">
          <span>類型</span>
          <select data-shop-item-id="${escapeHtml(item.id)}" data-shop-item-field="type">
            ${typeOptions
              .map(
                (option) => `<option value="${option.value}" ${item.type === option.value ? "selected" : ""}>${option.label}</option>`,
              )
              .join("")}
          </select>
        </label>
        <label class="form-field">
          <span>價格（把）</span>
          <input data-shop-item-id="${escapeHtml(item.id)}" data-shop-item-field="price" type="number" inputmode="numeric" min="0" value="${item.price}" />
        </label>
        <label class="form-field">
          <span>庫存</span>
          <input data-shop-item-id="${escapeHtml(item.id)}" data-shop-item-field="stock" type="number" inputmode="numeric" min="0" value="${item.stock}" />
        </label>
        <label class="form-field form-field-full">
          <span>描述</span>
          <textarea data-shop-item-id="${escapeHtml(item.id)}" data-shop-item-field="description" rows="2">${escapeHtml(item.description)}</textarea>
        </label>
      </div>
    </details>
  `;
}

function renderPurchaseLog(purchaseLog) {
  return `
    <section class="editor-panel shop-log-panel">
      <h4>購買紀錄</h4>
      ${
        purchaseLog.length
          ? `<ul class="purchase-log-list">
              ${purchaseLog
                .map(
                  (log) => `
                    <li>
                      <span>${escapeHtml(log.characterName)} 購買 ${escapeHtml(log.itemName)}</span>
                      <small>${formatGold(log.price)}｜${new Date(log.time).toLocaleString("zh-TW")}</small>
                    </li>
                  `,
                )
                .join("")}
            </ul>`
          : `<p class="empty-hint">尚無購買紀錄。</p>`
      }
    </section>
  `;
}
