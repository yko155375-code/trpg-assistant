import { formatGold, goldToHandfuls, normalizeGoldFromHandfuls } from "./assets.js";
import { getCurrentCharacter } from "./characters.js";

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

function toNonNegativeInteger(value, fallback = 0) {
  return Math.max(0, Math.trunc(toNumber(value, fallback)));
}

function makeInventoryItemId() {
  return `inventory-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function makeTransactionId() {
  return `purchase-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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
    ...item,
    id: item.id || makeShopItemId(),
    name: item.name || "未命名商品",
    type: typeOptions.some((option) => option.value === item.type) ? item.type : "物品",
    price: toNonNegativeInteger(item.price),
    stock: item.stock == null ? null : toNonNegativeInteger(item.stock, 1),
    description: item.description || "",
    category: item.category || "misc",
    tier: toNonNegativeInteger(item.tier, 1),
    tags: Array.isArray(item.tags) ? item.tags : [],
    available: item.available === undefined ? true : Boolean(item.available),
  };
}

export function normalizeShop(shop = {}) {
  return {
    ...shop,
    items: Array.isArray(shop.items) ? shop.items.map(normalizeShopItem) : [],
    purchaseLog: Array.isArray(shop.purchaseLog) ? shop.purchaseLog : [],
    itemDefinitions: Array.isArray(shop.itemDefinitions) ? shop.itemDefinitions : [],
    listings: Array.isArray(shop.listings) ? shop.listings : [],
    transactions: Array.isArray(shop.transactions) ? shop.transactions : [],
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

function resolvePurchaseCharacter(state) {
  const characters = Array.isArray(state.characters) ? state.characters : [];
  const selectedId = state.ui?.selectedCharacterId || state.ui?.currentCharacterId || null;
  return characters.find((character) => character.id === selectedId) || characters[0] || null;
}

function resolveListing(shop, item) {
  return shop.listings.find((listing) => listing.id === item.id || listing.itemId === item.itemId) || null;
}

function resolveItemDefinition(shop, item, listing) {
  const itemId = listing?.itemId || item.itemId || `legacy-item-${item.id}`;
  return shop.itemDefinitions.find((definition) => definition.id === itemId) || null;
}

function normalizeInventoryEntry(entry, fallbackIndex = 0) {
  const source = entry && typeof entry === "object" && !Array.isArray(entry)
    ? entry
    : { nameSnapshot: String(entry || "未命名物品") };
  const nameSnapshot = String(source.nameSnapshot || source.name || "未命名物品");
  return {
    ...source,
    id: String(source.id || `legacy-inventory-${fallbackIndex}`),
    itemId: String(source.itemId || `legacy-item-${fallbackIndex}`),
    nameSnapshot,
    quantity: Math.max(1, toNonNegativeInteger(source.quantity, 1)),
    acquiredFrom: String(source.acquiredFrom || "legacy"),
    acquiredAt: String(source.acquiredAt || ""),
    equipped: Boolean(source.equipped),
    slot: source.slot == null ? null : String(source.slot),
    notes: String(source.notes || ""),
    customData: source.customData && typeof source.customData === "object" && !Array.isArray(source.customData)
      ? source.customData
      : {},
  };
}

function addPurchasedInventoryItem(inventory, purchaseItem, stackable) {
  const normalized = Array.isArray(inventory)
    ? inventory.map((entry, index) => normalizeInventoryEntry(entry, index))
    : [];
  if (stackable) {
    const existingIndex = normalized.findIndex((entry) => entry.itemId === purchaseItem.itemId);
    if (existingIndex >= 0) {
      return normalized.map((entry, index) =>
        index === existingIndex ? { ...entry, quantity: entry.quantity + purchaseItem.quantity } : entry,
      );
    }
  }
  return [...normalized, purchaseItem];
}

export function purchaseShopItem(state, itemId) {
  const shop = normalizeShop(state.shop);
  const item = shop.items.find((entry) => entry.id === itemId);
  const character = resolvePurchaseCharacter(state);

  if (!character) {
    return setShopMessage(state, "請先選擇角色後再購買。");
  }

  if (!item) {
    return setShopMessage(state, "找不到商品。");
  }

  const listing = resolveListing(shop, item);
  const definition = resolveItemDefinition(shop, item, listing);
  const available = listing?.available ?? item.available ?? true;
  const price = toNonNegativeInteger(listing?.price ?? item.price);
  const stockValue = listing ? listing.stock : item.stock;
  const stock = stockValue == null ? null : toNonNegativeInteger(stockValue);
  const money = toNonNegativeInteger(
    character.assets?.money ?? goldToHandfuls(character.assets?.gold),
  );

  if (!available) {
    return setShopMessage(state, "此商品目前未開放購買。");
  }

  if (stock !== null && stock < 1) {
    return setShopMessage(state, "此商品已售完。");
  }

  if (money < price) {
    return setShopMessage(state, "金錢不足，無法購買。");
  }

  const assetKey = getAssetKey(item.type);
  const purchasedAt = new Date().toISOString();
  const resolvedItemId = String(listing?.itemId || item.itemId || definition?.id || `legacy-item-${item.id}`);
  const itemName = String(listing?.nameSnapshot || item.name || definition?.name || "未命名商品");
  const inventoryItem = {
    id: makeInventoryItemId(),
    itemId: resolvedItemId,
    nameSnapshot: itemName,
    quantity: 1,
    acquiredFrom: `shop:${listing?.id || item.id}`,
    acquiredAt: purchasedAt,
    equipped: false,
    slot: definition?.slot ?? item.slot ?? null,
    notes: "",
    customData: {},
  };
  const transactionId = makeTransactionId();
  const nextLog = {
    id: transactionId,
    type: "purchase",
    characterId: character.id,
    shopListingId: listing?.id || item.id,
    itemId: resolvedItemId,
    itemNameSnapshot: itemName,
    quantity: 1,
    createdAt: purchasedAt,
    notes: "",
    characterName: character.name,
    itemName,
    price,
    time: purchasedAt,
  };

  const nextMoney = money - price;
  const gold = normalizeGoldFromHandfuls(nextMoney);
  const characters = state.characters.map((current) =>
    current.id === character.id
      ? {
          ...current,
          assets: {
            ...(current.assets || {}),
            characterId: current.id,
            money: goldToHandfuls(gold),
            gold,
            inventory: addPurchasedInventoryItem(
              current.assets?.inventory,
              inventoryItem,
              Boolean(definition?.stackable ?? item.stackable ?? item.type === "消耗品"),
            ),
            [assetKey]: [...(Array.isArray(current.assets?.[assetKey]) ? current.assets[assetKey] : []), itemName],
          },
        }
      : current,
  );
  const nextStock = stock === null ? null : stock - 1;

  return setShopMessage({
    ...state,
    characters,
    shop: {
      ...shop,
      items: shop.items.map((entry) =>
        entry.id === item.id ? normalizeShopItem({ ...entry, stock: nextStock }) : entry,
      ),
      listings: shop.listings.map((entry) =>
        listing && entry.id === listing.id ? { ...entry, stock: nextStock } : entry,
      ),
      purchaseLog: [nextLog, ...shop.purchaseLog].slice(0, 100),
      transactions: [nextLog, ...shop.transactions],
    },
  }, `已購買：${itemName}`);
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
  const soldOut = item.stock !== null && item.stock <= 0;
  const hasCharacter = Boolean(character);
  const canAfford = hasCharacter && toNonNegativeInteger(character.assets?.money) >= item.price;
  const disabled = !hasCharacter || !item.available || soldOut || !canAfford;
  const buttonText = !item.available ? "未開放" : soldOut ? "售完" : !hasCharacter ? "未選角色" : !canAfford ? "金錢不足" : "購買";
  const description = item.description ? `<small class="shop-compact-description">${escapeHtml(item.description)}</small>` : "";

  return `
    <article class="shop-item-card shop-item-compact">
      <div class="shop-compact-head">
        <h4>${escapeHtml(item.name)}</h4>
        <span>${escapeHtml(item.type)}</span>
      </div>
      <div class="shop-compact-meta">
        <b>${formatGold(item.price)}</b>
        <span>${soldOut ? "售完" : item.stock === null ? "庫存不限" : `庫存 ${item.stock}`}</span>
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
