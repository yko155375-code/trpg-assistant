export const assetLists = [
  { key: "items", label: "物品" },
  { key: "equipment", label: "裝備" },
  { key: "consumables", label: "消耗品" },
];

export function normalizeAssets(assets = {}) {
  return {
    money: Number.isFinite(Number(assets.money)) ? Math.max(0, Number(assets.money)) : 0,
    items: Array.isArray(assets.items) ? assets.items : [],
    equipment: Array.isArray(assets.equipment) ? assets.equipment : [],
    consumables: Array.isArray(assets.consumables) ? assets.consumables : [],
  };
}
