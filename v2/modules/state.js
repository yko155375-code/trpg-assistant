import { normalizeCharacters } from "./characters.js";
import { normalizeMonsters } from "./monsters.js";
import { normalizeSession } from "./public-info.js";
import { normalizeShop } from "./shop.js";

export const APP_VERSION = "v2-stage-5";

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
  return {
    id: String(encounter.id || makeEncounterId()),
    name: String(encounter.name || "未命名遭遇").trim() || "未命名遭遇",
    monsters: Array.isArray(encounter.monsters) ? encounter.monsters.map(normalizeEncounterMonster) : [],
    createdAt: encounter.createdAt || new Date().toISOString(),
  };
}

export function normalizeEncounters(encounters) {
  return Array.isArray(encounters) ? encounters.map(normalizeEncounter) : [];
}

export function createDefaultState() {
  const now = new Date().toISOString();

  return {
    meta: {
      version: APP_VERSION,
      createdAt: now,
      updatedAt: now,
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
      items: [],
      purchaseLog: [],
    },
    rolls: [],
    audio: {
      currentTrackId: null,
      isPlaying: false,
      volume: 0.7,
    },
    ui: {
      mode: "player",
      currentCharacterId: null,
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
  const source = input && typeof input === "object" ? input : {};
  const characters = normalizeCharacters(source.characters);
  const monsters = normalizeMonsters(source.monsters);
  const encounters = normalizeEncounters(source.encounters);

  return {
    ...fallback,
    ...source,
    meta: {
      ...fallback.meta,
      ...(source.meta || {}),
      version: APP_VERSION,
    },
    session: normalizeSession({ ...fallback.session, ...(source.session || {}) }),
    characters,
    monsters,
    encounters,
    shop: normalizeShop({ ...fallback.shop, ...(source.shop || {}) }),
    rolls: Array.isArray(source.rolls) ? source.rolls : fallback.rolls,
    audio: {
      ...fallback.audio,
      ...(source.audio || {}),
    },
    ui: {
      ...fallback.ui,
      ...(source.ui || {}),
      currentCharacterId: characters.some((character) => character.id === source.ui?.currentCharacterId)
        ? source.ui.currentCharacterId
        : characters[0]?.id || null,
      expandedCharacterId: characters.some((character) => character.id === source.ui?.expandedCharacterId)
        ? source.ui.expandedCharacterId
        : null,
      expandedMonsterId: monsters.some((monster) => monster.id === source.ui?.expandedMonsterId)
        ? source.ui.expandedMonsterId
        : null,
      rollFormulaDrafts:
        source.ui?.rollFormulaDrafts && typeof source.ui.rollFormulaDrafts === "object"
          ? source.ui.rollFormulaDrafts
          : {},
      rollEdgeMode: ["advantage", "disadvantage"].includes(source.ui?.rollEdgeMode) ? source.ui.rollEdgeMode : "",
      isCriticalDamageRoll: Boolean(source.ui?.isCriticalDamageRoll),
    },
  };
}
