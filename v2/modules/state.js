import { normalizeCharacters } from "./characters.js";
import { normalizeMonsters } from "./monsters.js";
import { normalizeSession } from "./public-info.js";
import { normalizeShop } from "./shop.js";

export const APP_VERSION = "v2-stage-5";

export function createDefaultState() {
  const now = new Date().toISOString();
  return {
    meta: { version: APP_VERSION, createdAt: now, updatedAt: now },
    session: { scene: "", publicInfo: "", gmNotes: "", fear: 0, hopePool: 0, round: 0, monsterRoundResults: [] },
    characters: [], monsters: [], encounters: [], shop: { items: [], purchaseLog: [] }, rolls: [],
    audio: { currentTrackId: null, isPlaying: false, volume: 0.7 },
    ui: {
      mode: "player",
      currentCharacterId: null,
      playerPage: "characters",
      dmPage: "overview",
      isTeamStatusOpen: false,
      expandedMonsterId: null,
      rollFormulaDrafts: {},
    },
  };
}

export function normalizeState(input) {
  const fallback = createDefaultState();
  const source = input && typeof input === "object" ? input : {};
  const characters = normalizeCharacters(source.characters);
  const monsters = normalizeMonsters(source.monsters);
  const sourceUi = source.ui && typeof source.ui === "object" ? source.ui : {};
  return {
    ...fallback, ...source,
    meta: { ...fallback.meta, ...(source.meta || {}), version: APP_VERSION },
    session: normalizeSession({ ...fallback.session, ...(source.session || {}) }),
    characters, monsters,
    encounters: Array.isArray(source.encounters) ? source.encounters : fallback.encounters,
    shop: normalizeShop({ ...fallback.shop, ...(source.shop || {}) }),
    rolls: Array.isArray(source.rolls) ? source.rolls : fallback.rolls,
    audio: { ...fallback.audio, ...(source.audio || {}) },
    ui: {
      ...fallback.ui, ...sourceUi,
      rollFormulaDrafts:
        sourceUi.rollFormulaDrafts && typeof sourceUi.rollFormulaDrafts === "object" ? sourceUi.rollFormulaDrafts : {},
      currentCharacterId: characters.some((character) => character.id === sourceUi.currentCharacterId) ? sourceUi.currentCharacterId : characters[0]?.id || null,
      expandedCharacterId: characters.some((character) => character.id === sourceUi.expandedCharacterId) ? sourceUi.expandedCharacterId : null,
      expandedMonsterId: monsters.some((monster) => monster.id === sourceUi.expandedMonsterId) ? sourceUi.expandedMonsterId : null,
    },
  };
}
