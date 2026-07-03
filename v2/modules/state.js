import { normalizeCharacters } from "./characters.js";
import { normalizeMonsters } from "./monsters.js";
import { normalizeSession } from "./public-info.js";
import { normalizeShop } from "./shop.js";

export const APP_VERSION = "v2-stage-5";
export const SCHEMA_VERSION = 1;
export const SHOP_SCHEMA_VERSION = 1;

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function recordOrEmpty(value) {
  return isRecord(value) ? value : {};
}

function recordArray(value) {
  return Array.isArray(value) ? value.filter(isRecord) : [];
}

function textArray(value) {
  return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : [];
}

function normalizeAssetQuantity(value) {
  const number = Number(value);
  return Number.isFinite(number) && number >= 1 ? Math.trunc(number) : 1;
}

function normalizeAssetListEntry(entry, index) {
  if (typeof entry === "string") {
    const name = entry.trim() || `未命名資產 ${index + 1}`;
    return { name, quantity: 1 };
  }
  const source = recordOrEmpty(entry);
  const name = String(source.name || source.nameSnapshot || source.itemName || source.entry || "").trim()
    || `未命名資產 ${index + 1}`;
  return {
    ...source,
    name,
    quantity: normalizeAssetQuantity(source.quantity),
  };
}

function assetEntryArray(value) {
  return Array.isArray(value) ? value.map(normalizeAssetListEntry) : [];
}

function wholeNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.trunc(number) : fallback;
}

function nonNegativeWholeNumber(value, fallback = 0) {
  return Math.max(0, wholeNumber(value, fallback));
}

function normalizeStock(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? Math.max(0, Math.trunc(number)) : 0;
}

function moneyToHandfuls(value, fallback = 0) {
  if (!isRecord(value)) return nonNegativeWholeNumber(value, fallback);
  return nonNegativeWholeNumber(
    nonNegativeWholeNumber(value.chests ?? value.boxes) * 100 +
      nonNegativeWholeNumber(value.bags) * 10 +
      nonNegativeWholeNumber(value.handfuls),
    fallback,
  );
}

function normalizeCategory(value, legacyType = "") {
  const categories = new Set(["weapon", "armor", "consumable", "tool", "magic", "service", "material", "misc"]);
  if (categories.has(value)) return value;
  if (legacyType === "裝備") return "armor";
  if (legacyType === "消耗品") return "consumable";
  return "misc";
}

function legacyItemId(name, fallback) {
  const normalized = String(name || "").trim().toLowerCase().replace(/[^a-z0-9\u3400-\u9fff]+/g, "-");
  return normalized ? `legacy-item-${normalized}` : fallback;
}

function normalizeInventoryItem(entry, { characterId, listKey, index }) {
  const source = typeof entry === "string" ? { nameSnapshot: entry } : recordOrEmpty(entry);
  const nameSnapshot = String(source.nameSnapshot || source.name || source.itemName || "").trim() || "未命名物品";
  return {
    ...source,
    id: String(source.id || `inventory-${characterId || "character"}-${listKey}-${index}`),
    itemId: String(source.itemId || legacyItemId(nameSnapshot, `legacy-item-${listKey}-${index}`)),
    nameSnapshot,
    quantity: Math.max(1, nonNegativeWholeNumber(source.quantity, 1)),
    acquiredFrom: String(source.acquiredFrom || "legacy"),
    acquiredAt: String(source.acquiredAt || ""),
    equipped: source.equipped === undefined ? listKey === "equipment" : Boolean(source.equipped),
    slot: source.slot == null ? null : String(source.slot),
    notes: String(source.notes || ""),
    customData: recordOrEmpty(source.customData),
  };
}

function normalizeCharacterAssets(character, normalizedCharacter, index) {
  const source = recordOrEmpty(character);
  const sourceAssets = recordOrEmpty(source.assets);
  const normalized = normalizedCharacter;
  const characterId = normalized?.id || source.id || `character-${index}`;
  const inventorySource = Array.isArray(sourceAssets.inventory)
    ? sourceAssets.inventory
    : [
        ...assetEntryArray(sourceAssets.items).map((entry) => ({ entry, listKey: "items" })),
        ...assetEntryArray(sourceAssets.equipment).map((entry) => ({ entry, listKey: "equipment" })),
        ...assetEntryArray(sourceAssets.consumables).map((entry) => ({ entry, listKey: "consumables" })),
      ];
  const inventory = inventorySource.map((entry, itemIndex) => {
    const wrapped = isRecord(entry) && Object.prototype.hasOwnProperty.call(entry, "entry")
      ? entry
      : { entry, listKey: "inventory" };
    return normalizeInventoryItem(wrapped.entry, {
      characterId,
      listKey: wrapped.listKey || "inventory",
      index: itemIndex,
    });
  });

  return {
    ...normalized,
    assets: {
      ...normalized.assets,
      characterId,
      inventory,
      notes: String(sourceAssets.notes || ""),
    },
  };
}

function sanitizeCharacter(character) {
  const source = recordOrEmpty(character);
  const assets = recordOrEmpty(source.assets);
  return {
    ...source,
    stats: recordOrEmpty(source.stats),
    attributes: recordOrEmpty(source.attributes),
    assets: {
      ...assets,
      gold: recordOrEmpty(assets.gold),
      items: assetEntryArray(assets.items),
      equipment: assetEntryArray(assets.equipment),
      consumables: assetEntryArray(assets.consumables),
      inventory: textArray(assets.inventory),
    },
    conditions: textArray(source.conditions),
    buffs: textArray(source.buffs),
    debuffs: textArray(source.debuffs),
  };
}

function normalizeCompatibleShopItem(item, index) {
  const source = recordOrEmpty(item);
  const id = String(source.id || `shop-item-${index}`);
  const name = String(source.name || source.nameSnapshot || "未命名商品");
  const type = ["物品", "裝備", "消耗品"].includes(source.type) ? source.type : "物品";
  return {
    ...source,
    id,
    name,
    type,
    price: moneyToHandfuls(source.price),
    stock: normalizeStock(source.stock),
    description: String(source.description || ""),
    category: normalizeCategory(source.category, source.type),
    tier: Math.min(4, nonNegativeWholeNumber(source.tier, 1)),
    tags: textArray(source.tags),
    available: source.available === undefined ? true : Boolean(source.available),
  };
}

function normalizeItemDefinition(item, index) {
  const source = normalizeCompatibleShopItem(item, index);
  return {
    id: String(item.itemId || legacyItemId(source.name, `item-${source.id}`)),
    name: source.name,
    category: source.category,
    tier: source.tier,
    description: source.description,
    tags: source.tags,
    stackable: item.stackable === undefined ? source.category === "consumable" : Boolean(item.stackable),
    consumable: item.consumable === undefined ? source.category === "consumable" : Boolean(item.consumable),
    equippable: item.equippable === undefined ? source.type === "裝備" : Boolean(item.equippable),
    slot: item.slot == null ? null : String(item.slot),
    effects: recordArray(item.effects),
    notes: String(item.notes || ""),
  };
}

function normalizeShopListing(listing, index, fallbackItem) {
  const source = recordOrEmpty(listing);
  const fallback = normalizeCompatibleShopItem(fallbackItem, index);
  return {
    ...source,
    id: String(source.id || fallback.id || `listing-${index}`),
    itemId: String(source.itemId || legacyItemId(fallback.name, `item-${fallback.id}`)),
    nameSnapshot: String(source.nameSnapshot || fallback.name || "未命名商品"),
    price: moneyToHandfuls(source.price ?? fallback.price),
    stock: normalizeStock(Object.prototype.hasOwnProperty.call(source, "stock") ? source.stock : fallback.stock),
    maxStock: normalizeStock(source.maxStock),
    available: source.available === undefined ? fallback.available : Boolean(source.available),
    rarity: String(source.rarity || "common"),
    tags: textArray(source.tags),
    sortOrder: wholeNumber(source.sortOrder, index),
    restockRule: isRecord(source.restockRule) ? source.restockRule : null,
    notes: String(source.notes || ""),
  };
}

function normalizeTransaction(record, index) {
  const source = recordOrEmpty(record);
  const itemNameSnapshot = String(source.itemNameSnapshot || source.itemName || "未命名商品");
  return {
    ...source,
    id: String(source.id || `transaction-${index}`),
    type: String(source.type || "purchase"),
    characterId: String(source.characterId || ""),
    shopListingId: source.shopListingId == null ? null : String(source.shopListingId),
    itemId: String(source.itemId || legacyItemId(itemNameSnapshot, `legacy-item-${index}`)),
    itemNameSnapshot,
    price: moneyToHandfuls(source.price),
    quantity: Math.max(1, nonNegativeWholeNumber(source.quantity, 1)),
    createdAt: String(source.createdAt || source.time || ""),
    notes: String(source.notes || ""),
  };
}

function normalizeShopTransactionHistoryRecord(record, index) {
  const source = recordOrEmpty(record);
  const itemName = String(source.itemName || source.itemNameSnapshot || "未命名商品");
  const type = source.type === "sell" ? "sell" : "buy";
  const quantity = Math.max(1, nonNegativeWholeNumber(source.quantity, 1));
  const unitPrice = moneyToHandfuls(source.unitPrice ?? source.price, 0);
  const totalPrice = moneyToHandfuls(source.totalPrice, unitPrice * quantity);

  return {
    ...source,
    id: String(source.id || `shop-transaction-history-${index}`),
    createdAt: String(source.createdAt || source.time || ""),
    type,
    characterId: String(source.characterId || ""),
    characterName: String(source.characterName || ""),
    itemName,
    itemCategory: source.itemCategory == null ? null : String(source.itemCategory),
    itemType: source.itemType == null
      ? (source.itemCategory == null ? null : String(source.itemCategory))
      : String(source.itemType),
    quantity,
    unitPrice,
    totalPrice,
    currency: String(source.currency || "gold-handfuls"),
    resource: String(source.resource || "money"),
  };
}

function inferMusicSourceType(url) {
  const value = String(url || "").trim().toLowerCase();
  if (!value) return "unknown";
  if (value.includes("youtube.com/") || value.includes("youtu.be/")) return "youtube";
  if (/\.(mp3|ogg|wav)(\?|#|$)/i.test(value)) return "audio";
  return "url";
}

function normalizeMusicTrack(track, index) {
  const source = recordOrEmpty(track);
  const url = String(source.url || "").trim();
  const title = String(source.title || source.name || "").trim() || url || "未命名音樂";
  const scene = String(source.scene || "").trim();
  const tags = Array.isArray(source.tags)
    ? textArray(source.tags)
    : String(source.tags || scene || "")
        .split(/[,\s]+/)
        .map((entry) => entry.trim())
        .filter(Boolean);
  const sourceType = ["youtube", "audio", "url", "unknown"].includes(source.sourceType)
    ? source.sourceType
    : inferMusicSourceType(url);

  return {
    ...source,
    id: String(source.id || `music-track-${index}`),
    title,
    url,
    sourceType,
    tags,
    scene,
    notes: String(source.notes || ""),
    createdAt: String(source.createdAt || ""),
  };
}

function normalizeAudio(audio, fallbackAudio) {
  const source = recordOrEmpty(audio);
  const tracks = recordArray(source.tracks).map(normalizeMusicTrack).filter((track) => track.url);
  const currentTrackId = tracks.some((track) => track.id === source.currentTrackId)
    ? source.currentTrackId
    : null;

  return {
    ...fallbackAudio,
    ...source,
    tracks,
    currentTrackId,
    isPlaying: currentTrackId ? Boolean(source.isPlaying) : false,
    volume: Number.isFinite(Number(source.volume)) ? Number(source.volume) : fallbackAudio.volume,
  };
}

function getDriveFileId(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  try {
    const url = new URL(raw);
    if (!/drive\.google\.com$/i.test(url.hostname)) return "";
    const pathMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
    const id = pathMatch?.[1] || url.searchParams.get("id") || "";
    return /^[A-Za-z0-9_-]+$/.test(id) ? id : "";
  } catch {
    return "";
  }
}

export function normalizeIntroImageUrl(value) {
  const trimmed = typeof value === "string" ? value.trim().slice(0, 2048) : "";
  const driveId = getDriveFileId(trimmed);
  return driveId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w512` : trimmed;
}

function normalizeIntroImage(image, index) {
  const source = recordOrEmpty(image);
  const originalUrl = String(source.originalUrl || source.url || "").trim().slice(0, 2048);
  const url = normalizeIntroImageUrl(source.url || originalUrl);
  return {
    ...source,
    id: String(source.id || `intro-image-${index}`),
    title: String(source.title || source.name || "").trim() || "未命名開頭圖片",
    url,
    originalUrl,
    notes: String(source.notes || "").trim(),
    createdAt: String(source.createdAt || ""),
  };
}

function normalizeIntroImages(introImages, fallbackIntroImages) {
  const source = recordOrEmpty(introImages);
  return {
    ...fallbackIntroImages,
    ...source,
    images: recordArray(source.images).map(normalizeIntroImage).filter((image) => image.url),
  };
}

export function normalizePlayerBackgroundImageUrl(value) {
  const trimmed = typeof value === "string" ? value.trim().slice(0, 2048) : "";
  const driveId = getDriveFileId(trimmed);
  return driveId ? `https://drive.google.com/thumbnail?id=${encodeURIComponent(driveId)}&sz=w1600` : trimmed;
}

function normalizePlayerBackgroundImage(image, index) {
  const source = recordOrEmpty(image);
  const originalUrl = String(source.originalUrl || source.url || "").trim().slice(0, 2048);
  const url = normalizePlayerBackgroundImageUrl(source.url || originalUrl);
  return {
    ...source,
    id: String(source.id || `player-background-image-${index}`),
    title: String(source.title || source.name || "").trim() || "未命名背景圖片",
    url,
    originalUrl,
    notes: String(source.notes || "").trim(),
    createdAt: String(source.createdAt || ""),
  };
}

function normalizePlayerBackgroundImages(playerBackgroundImages, fallbackPlayerBackgroundImages) {
  const source = recordOrEmpty(playerBackgroundImages);
  return {
    ...fallbackPlayerBackgroundImages,
    ...source,
    images: recordArray(source.images).map(normalizePlayerBackgroundImage).filter((image) => image.url),
  };
}

function normalizeCompatibleShop(shop, fallbackShop) {
  const source = recordOrEmpty(shop);
  const legacy = normalizeShop({
    ...fallbackShop,
    ...source,
    items: recordArray(source.items),
    purchaseLog: recordArray(source.purchaseLog),
  });
  const items = legacy.items.map((item, index) =>
    normalizeCompatibleShopItem({ ...item, ...recordArray(source.items)[index] }, index),
  );
  const definitionsSource = recordArray(source.itemDefinitions);
  const listingsSource = recordArray(source.listings);
  const itemDefinitions = (definitionsSource.length ? definitionsSource : items)
    .map((item, index) => normalizeItemDefinition(item, index));
  const listings = (listingsSource.length ? listingsSource : items)
    .map((listing, index) => normalizeShopListing(listing, index, items[index] || listing));
  const purchaseLog = legacy.purchaseLog.map((record, index) => ({
    ...record,
    ...normalizeTransaction(record, index),
    characterName: String(record.characterName || ""),
    itemName: String(record.itemName || record.itemNameSnapshot || "未命名商品"),
    time: String(record.time || record.createdAt || ""),
  }));
  const transactionHistorySource = recordArray(source.transactionHistory);
  const legacyHistorySource = purchaseLog.length ? purchaseLog : recordArray(source.transactions);
  const transactionHistory = (transactionHistorySource.length ? transactionHistorySource : legacyHistorySource)
    .map(normalizeShopTransactionHistoryRecord)
    .slice(0, 100);
  return {
    ...legacy,
    schemaVersion: nonNegativeWholeNumber(source.schemaVersion, SHOP_SCHEMA_VERSION),
    items,
    itemDefinitions,
    listings,
    purchaseLog,
    transactionHistory,
    transactions: (recordArray(source.transactions).length ? recordArray(source.transactions) : purchaseLog)
      .map(normalizeTransaction),
  };
}

function makeEncounterId() {
  return `encounter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEncounterMonster(monster = {}) {
  const maxHp = Math.max(1, Number(monster.maxHp ?? monster.hp ?? 1) || 1);
  const hp = Math.min(maxHp, Math.max(0, Number(monster.hp ?? maxHp) || 0));
  const maxStress = Math.max(0, Number(monster.maxStress ?? monster.stress ?? 0) || 0);
  const stress = Math.min(maxStress, Math.max(0, Number(monster.stress ?? 0) || 0));

  return {
    name: String(monster.name || "未命名怪物").trim() || "未命名怪物",
    hp,
    maxHp,
    stress,
    maxStress,
    difficulty: Math.max(0, Number(monster.difficulty ?? 10) || 10),
    attack: String(monster.attack || monster.attackFormula || "").trim(),
    damage: String(monster.damage || monster.damageFormula || "").trim(),
    threshold: String(monster.threshold || "").trim(),
    notes: String(monster.notes || monster.note || "").trim(),
    tag: String(monster.tag || "").trim(),
  };
}

export function normalizeEncounter(encounter = {}) {
  const source = recordOrEmpty(encounter);
  return {
    id: String(source.id || makeEncounterId()),
    name: String(source.name || "未命名遭遇").trim() || "未命名遭遇",
    monsters: recordArray(source.monsters).map(normalizeEncounterMonster),
    createdAt: source.createdAt || new Date().toISOString(),
  };
}

export function normalizeEncounters(encounters) {
  return recordArray(encounters).map(normalizeEncounter);
}

export function createDefaultState() {
  const now = new Date().toISOString();

  return {
    meta: {
      version: APP_VERSION,
      schemaVersion: SCHEMA_VERSION,
      createdAt: now,
      updatedAt: now,
      lastSavedAt: "",
    },
    session: {
      scene: "",
      publicInfo: "",
      gmNotes: "",
      fear: 0,
      hopePool: 0,
      round: 0,
      monsterRoundResults: [],
    },
    characters: [],
    monsters: [],
    encounters: [],
    shop: {
      schemaVersion: SHOP_SCHEMA_VERSION,
      items: [],
      itemDefinitions: [],
      listings: [],
      purchaseLog: [],
      transactionHistory: [],
      transactions: [],
    },
    rolls: [],
    audio: {
      currentTrackId: null,
      isPlaying: false,
      volume: 0.7,
      tracks: [],
    },
    introImages: {
      images: [],
    },
    playerBackgroundImages: {
      images: [],
    },
    ui: {
      mode: "player",
      currentCharacterId: null,
      selectedCharacterId: null,
      playerPage: "characters",
      dmPage: "overview",
      isTeamStatusOpen: false,
      expandedMonsterId: null,
      rollFormulaDrafts: {},
      rollEdgeMode: "",
      isCriticalDamageRoll: false,
    },
  };
}

export function normalizeState(input) {
  const fallback = createDefaultState();
  const source = recordOrEmpty(input);
  const sourceMeta = recordOrEmpty(source.meta);
  const sourceSession = recordOrEmpty(source.session);
  const sourceAudio = recordOrEmpty(source.audio);
  const sourceIntroImages = recordOrEmpty(source.introImages);
  const sourcePlayerBackgroundImages = recordOrEmpty(source.playerBackgroundImages);
  const sourceUi = recordOrEmpty(source.ui);
  const sourceShop = recordOrEmpty(source.shop);
  const sourceCharacters = recordArray(source.characters);
  const normalizedCharacters = normalizeCharacters(sourceCharacters.map(sanitizeCharacter));
  const characters = sourceCharacters.map((character, index) =>
    normalizeCharacterAssets(character, normalizedCharacters[index], index),
  );
  const monsters = normalizeMonsters(recordArray(source.monsters));
  const encounters = normalizeEncounters(source.encounters);
  const requestedCharacterId = sourceUi.currentCharacterId || sourceUi.selectedCharacterId || null;
  const currentCharacterId = characters.some((character) => character.id === requestedCharacterId)
    ? requestedCharacterId
    : characters[0]?.id || null;

  return {
    ...fallback,
    ...source,
    meta: {
      ...fallback.meta,
      ...sourceMeta,
      version: APP_VERSION,
      schemaVersion: nonNegativeWholeNumber(sourceMeta.schemaVersion, SCHEMA_VERSION),
      lastSavedAt: String(sourceMeta.lastSavedAt || ""),
    },
    session: normalizeSession({ ...fallback.session, ...sourceSession }),
    characters,
    monsters,
    encounters,
    shop: normalizeCompatibleShop(sourceShop, fallback.shop),
    rolls: recordArray(source.rolls),
    audio: normalizeAudio(sourceAudio, fallback.audio),
    introImages: normalizeIntroImages(sourceIntroImages, fallback.introImages),
    playerBackgroundImages: normalizePlayerBackgroundImages(sourcePlayerBackgroundImages, fallback.playerBackgroundImages),
    ui: {
      ...fallback.ui,
      ...sourceUi,
      currentCharacterId,
      selectedCharacterId: currentCharacterId,
      expandedCharacterId: characters.some((character) => character.id === sourceUi.expandedCharacterId)
        ? sourceUi.expandedCharacterId
        : null,
      expandedMonsterId: monsters.some((monster) => monster.id === sourceUi.expandedMonsterId)
        ? sourceUi.expandedMonsterId
        : null,
      rollFormulaDrafts:
        isRecord(sourceUi.rollFormulaDrafts)
          ? sourceUi.rollFormulaDrafts
          : {},
      rollEdgeMode: ["advantage", "disadvantage"].includes(sourceUi.rollEdgeMode) ? sourceUi.rollEdgeMode : "",
      isCriticalDamageRoll: Boolean(sourceUi.isCriticalDamageRoll),
    },
  };
}
