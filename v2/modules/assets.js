export const assetLists = [
  { key: "items", label: "物品" },
  { key: "equipment", label: "裝備" },
  { key: "consumables", label: "消耗品" },
];

export const goldUnitFields = [
  { key: "chests", label: "箱", rate: 100 },
  { key: "bags", label: "袋", rate: 10 },
  { key: "handfuls", label: "把", rate: 1 },
];

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function toWholeNumber(value, fallback = 0) {
  return Math.trunc(toNumber(value, fallback));
}

export function normalizeGoldFromHandfuls(value = 0) {
  const total = Math.max(0, toWholeNumber(value));
  const chests = Math.floor(total / 100);
  const bags = Math.floor((total % 100) / 10);
  const handfuls = total % 10;

  return { chests, bags, handfuls };
}

export function goldToHandfuls(gold = {}) {
  if (typeof gold === "number" || typeof gold === "string") {
    return Math.max(0, toWholeNumber(gold));
  }

  return Math.max(
    0,
    goldUnitFields.reduce((total, unit) => total + Math.max(0, toWholeNumber(gold?.[unit.key])) * unit.rate, 0),
  );
}

export function normalizeGold(gold, fallbackMoney = 0) {
  const hasGoldValue =
    gold &&
    typeof gold === "object" &&
    goldUnitFields.some((unit) => Object.prototype.hasOwnProperty.call(gold, unit.key));
  const total = hasGoldValue ? goldToHandfuls(gold) : Math.max(0, toWholeNumber(fallbackMoney));

  return normalizeGoldFromHandfuls(total);
}

export function formatGold(value) {
  const gold = typeof value === "number" || typeof value === "string" ? normalizeGoldFromHandfuls(value) : normalizeGold(value);
  return goldUnitFields.map((unit) => `${gold[unit.key]}${unit.label}`).join(" ");
}

export function normalizeAssets(assets = {}) {
  const gold = normalizeGold(assets.gold, assets.money);

  return {
    money: goldToHandfuls(gold),
    gold,
    items: Array.isArray(assets.items) ? assets.items : [],
    equipment: Array.isArray(assets.equipment) ? assets.equipment : [],
    consumables: Array.isArray(assets.consumables) ? assets.consumables : [],
  };
}
