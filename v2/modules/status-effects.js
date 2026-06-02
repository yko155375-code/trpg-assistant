export const statusEffectGroups = {
  buffs: [
    { id: "blessed", label: "祝福" },
    { id: "guarded", label: "守護" },
    { id: "inspired", label: "振奮" },
  ],
  debuffs: [
    {
      id: "hidden",
      label: "隱藏",
      description: "所有以你為目標的擲骰都具有劣勢。一旦你可以被看見或者你進行攻擊，將脫離隱藏狀態。",
    },
    { id: "vulnerable", label: "脆弱", description: "所有以你為目標的擲骰都具有優勢。" },
    { id: "restrained", label: "束縛", description: "你無法移動，但仍然可以在當前位置執行動作。" },
    { id: "dazed", label: "眩暈", description: "（催眠閃光）無法移動、進行動作或反應。" },
    {
      id: "frightened",
      label: "驚懼",
      description: "（夜魘降臨）目標獲得脆弱狀態。從 GM 處竊取等同於驚懼目標數量的恐懼點。",
    },
    { id: "charmed", label: "迷醉", description: "（心醉神迷）目標的注意力會固定在施法者身上。" },
    { id: "burning", label: "點燃", description: "（餘燼之握）行動結束時額外受到 2d6 魔法傷害。" },
    { id: "poisoned", label: "中毒", description: "每次行動都會受到 1d10 點直接物理傷害，無法使用護甲。" },
  ],
};

function normalizeTextList(value) {
  return Array.isArray(value) ? value.map((entry) => String(entry || "").trim()).filter(Boolean) : [];
}

function getPresetLabels(effectType) {
  return (statusEffectGroups[effectType] || []).map((effect) => effect.label);
}

export function getStatusDescription(effectType, label) {
  return (statusEffectGroups[effectType] || []).find((effect) => effect.label === label)?.description || "";
}

export function sortStatusLabels(effectType, entries = []) {
  const normalized = normalizeTextList(entries);
  const presetLabels = getPresetLabels(effectType);
  const seen = new Set();
  const orderedPresets = presetLabels.filter((label) => {
    if (!normalized.includes(label) || seen.has(label)) return false;
    seen.add(label);
    return true;
  });
  const custom = normalized.filter((label) => {
    if (seen.has(label)) return false;
    seen.add(label);
    return true;
  });

  return [...orderedPresets, ...custom];
}
