import { normalizeCharacters } from "./characters.js";
import { normalizeSession } from "./public-info.js";

export const APP_VERSION = "v2-stage-4b";

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
    },
    characters: [],
    monsters: [],
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
    },
  };
}

export function normalizeState(input) {
  const fallback = createDefaultState();
  const source = input && typeof input === "object" ? input : {};

  return {
    ...fallback,
    ...source,
    meta: {
      ...fallback.meta,
      ...(source.meta || {}),
      version: APP_VERSION,
    },
    session: normalizeSession({ ...fallback.session, ...(source.session || {}) }),
    characters: normalizeCharacters(source.characters),
    monsters: Array.isArray(source.monsters) ? source.monsters : fallback.monsters,
    shop: {
      ...fallback.shop,
      ...(source.shop || {}),
      items: Array.isArray(source.shop?.items) ? source.shop.items : fallback.shop.items,
      purchaseLog: Array.isArray(source.shop?.purchaseLog)
        ? source.shop.purchaseLog
        : fallback.shop.purchaseLog,
    },
    rolls: Array.isArray(source.rolls) ? source.rolls : fallback.rolls,
    audio: {
      ...fallback.audio,
      ...(source.audio || {}),
    },
    ui: {
      ...fallback.ui,
      ...(source.ui || {}),
      currentCharacterId: normalizeCharacters(source.characters).some(
        (character) => character.id === source.ui?.currentCharacterId,
      )
        ? source.ui.currentCharacterId
        : normalizeCharacters(source.characters)[0]?.id || null,
    },
  };
}
