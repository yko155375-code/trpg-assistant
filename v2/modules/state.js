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
    characters: [], monsters: [], shop: { items: [], purchaseLog: [] }, rolls: [],
    audio: { currentTrackId: null, isPlaying: false, volume: 0.7 },
    ui: { mode: "player", currentCharacterId: null, playerPage: "characters", dmPage: "overview", isTeamStatusOpen: false, expandedMonsterId: null },
  };
}

export function normalizeState(input) {
  const fallback = createDefaultState();
  const source = input && typeof input === "object" ? input : {};
  const characters = normalizeCharacters(source.characters);
  const monsters = normalizeMonsters(source.monsters);
  return {
    ...fallback, ...source,
    meta: { ...fallback.meta, ...(source.meta || {}), version: APP_VERSION },
    session: normalizeSession({ ...fallback.session, ...(source.session || {}) }),
    characters, monsters,
    shop: normalizeShop({ ...fallback.shop, ...(source.shop || {}) }),
    rolls: Array.isArray(source.rolls) ? source.rolls : fallback.rolls,
    audio: { ...fallback.audio, ...(source.audio || {}) },
    ui: {
      ...fallback.ui, ...(source.ui || {}),
      currentCharacterId: characters.some((character) => character.id === source.ui?.currentCharacterId) ? source.ui.currentCharacterId : characters[0]?.id || null,
      expandedCharacterId: characters.some((character) => character.id === source.ui?.expandedCharacterId) ? source.ui.expandedCharacterId : null,
      expandedMonsterId: monsters.some((monster) => monster.id === source.ui?.expandedMonsterId) ? source.ui.expandedMonsterId : null,
    },
  };
}
