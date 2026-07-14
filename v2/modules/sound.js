export const SOUND_FOUNDATION_VERSION = "v2-sound-event-manifest-foundation";

export const SOUND_CATEGORIES = Object.freeze([
  "ui",
  "system",
  "gameplay",
  "dice",
  "shop",
  "inventory",
  "combat",
  "magic",
  "reward",
  "penalty",
  "quest",
  "mystery",
  "dungeon",
  "monster",
  "horror",
  "weather",
  "ambient",
  "bgm",
  "stinger",
]);

export const SOUND_LAYERS = Object.freeze(["bgm", "sfx", "ambient"]);
export const SOUND_OVERLAP_MODES = Object.freeze(["none", "limited", "full"]);
export const SOUND_ASSET_STATUSES = Object.freeze(["missing", "planned", "ready"]);
export const SOUND_ASSET_PLAYBACK_STATUSES = Object.freeze(["unverified", "playable", "failed"]);
export const SOUND_ASSET_COMMERCIAL_USE = Object.freeze(["unknown", "allowed", "not-allowed"]);

const SOUND_EVENT_DEFINITIONS = [
  ["system.boot.start", "system", "sfx", "none", 1, "phase1"],
  ["system.boot.ready", "system", "sfx", "none", 1, "phase1"],
  ["system.save.success", "system", "sfx", "none", 1, "phase1"],
  ["system.save.failed", "system", "sfx", "none", 1, "phase1"],
  ["system.import.success", "system", "sfx", "none", 1, "phase1"],
  ["system.export.success", "system", "sfx", "none", 1, "phase1"],
  ["system.warning", "system", "sfx", "limited", 2, "phase1"],
  ["system.error", "system", "sfx", "none", 1, "phase1"],
  ["system.confirm", "ui", "sfx", "none", 1, "phase1"],
  ["system.cancel", "ui", "sfx", "none", 1, "phase1"],
  ["ui.click.soft", "ui", "sfx", "none", 1, "phase1"],
  ["ui.hover.soft", "ui", "sfx", "none", 1, "phase1"],
  ["ui.page.switch", "ui", "sfx", "limited", 2, "phase1"],
  ["ui.tab.switch", "ui", "sfx", "limited", 2, "phase1"],
  ["ui.longpress", "ui", "sfx", "limited", 2, "backlog"],
  ["ui.drag.start", "ui", "sfx", "none", 1, "backlog"],
  ["ui.drag.drop", "ui", "sfx", "none", 1, "backlog"],
  ["ui.modal.open", "ui", "sfx", "none", 1, "phase1"],
  ["ui.modal.close", "ui", "sfx", "none", 1, "phase1"],
  ["ui.popup.open", "ui", "sfx", "limited", 2, "phase1"],
  ["player.character.switch", "gameplay", "sfx", "none", 1, "phase2"],
  ["player.hp.change", "gameplay", "sfx", "limited", 2, "phase2"],
  ["player.hp.damage", "combat", "sfx", "full", 4, "phase2"],
  ["player.hp.heal", "magic", "sfx", "full", 4, "phase2"],
  ["player.hp.zero", "combat", "sfx", "none", 1, "phase2"],
  ["player.stress.increase", "gameplay", "sfx", "limited", 2, "phase2"],
  ["player.stress.decrease", "gameplay", "sfx", "limited", 2, "phase2"],
  ["player.hope.increase", "reward", "sfx", "full", 4, "phase2"],
  ["player.hope.decrease", "penalty", "sfx", "limited", 2, "phase2"],
  ["player.shield.increase", "combat", "sfx", "full", 4, "phase2"],
  ["player.shield.break", "combat", "sfx", "full", 4, "phase2"],
  ["player.buff.add", "magic", "sfx", "full", 4, "phase4"],
  ["player.debuff.add", "magic", "sfx", "full", 4, "phase4"],
  ["player.death", "combat", "sfx", "none", 1, "phase4"],
  ["player.revive", "magic", "sfx", "none", 1, "phase4"],
  ["player.levelup", "reward", "sfx", "none", 1, "backlog"],
  ["dice.roll.start", "dice", "sfx", "none", 1, "phase1"],
  ["dice.roll.loop", "dice", "sfx", "none", 1, "backlog"],
  ["dice.roll.success", "dice", "sfx", "limited", 2, "phase1"],
  ["dice.roll.fail", "dice", "sfx", "limited", 2, "phase1"],
  ["dice.natural20", "reward", "sfx", "none", 1, "phase1"],
  ["dice.natural1", "penalty", "sfx", "none", 1, "phase1"],
  ["dice.critical", "reward", "sfx", "none", 1, "backlog"],
  ["shop.buy.success", "shop", "sfx", "full", 3, "phase1"],
  ["shop.sell.success", "shop", "sfx", "full", 3, "backlog"],
  ["shop.money.insufficient", "shop", "sfx", "none", 1, "phase1"],
  ["shop.transaction.complete", "shop", "sfx", "none", 1, "backlog"],
  ["shop.transaction.failed", "shop", "sfx", "none", 1, "backlog"],
  ["inventory.item.add", "inventory", "sfx", "limited", 2, "phase2"],
  ["inventory.item.remove", "inventory", "sfx", "limited", 2, "phase2"],
  ["inventory.quantity.up", "inventory", "sfx", "limited", 2, "phase2"],
  ["inventory.quantity.down", "inventory", "sfx", "limited", 2, "phase2"],
  ["dm.bgm.play", "system", "sfx", "none", 1, "phase3"],
  ["dm.bgm.stop", "system", "sfx", "none", 1, "phase3"],
  ["dm.sfx.play", "gameplay", "sfx", "full", 6, "phase3"],
  ["dm.boss.intro", "combat", "sfx", "none", 1, "phase4"],
  ["dm.combat.start", "combat", "sfx", "none", 1, "phase4"],
  ["dm.combat.end", "combat", "sfx", "none", 1, "phase4"],
  ["dm.secret.reveal", "mystery", "sfx", "limited", 2, "phase4"],
  ["dm.puzzle.success", "quest", "sfx", "none", 1, "phase4"],
  ["dm.trap.trigger", "dungeon", "sfx", "full", 4, "phase4"],
  ["dm.horror.stinger", "horror", "sfx", "limited", 2, "phase4"],
  ["dm.environment.event", "dungeon", "sfx", "full", 4, "backlog"],
  ["ambient.forest.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.cave.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.dungeon.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.town.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.tavern.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.rain.loop", "weather", "ambient", "none", 1, "phase5"],
  ["ambient.thunder.event", "weather", "sfx", "limited", 2, "phase5"],
  ["ambient.campfire.loop", "ambient", "ambient", "none", 1, "phase5"],
  ["ambient.ruins.loop", "ambient", "ambient", "none", 1, "phase5"],
];

function toSoundEvent([id, category, layer, overlapMode, maxVoices, phase]) {
  return Object.freeze({
    id,
    category,
    layer,
    overlapMode,
    maxVoices,
    phase,
    assetStatus: "planned",
  });
}

export const SOUND_EVENT_REGISTRY = Object.freeze(SOUND_EVENT_DEFINITIONS.map(toSoundEvent));
export const SOUND_EVENT_REGISTRY_BY_ID = Object.freeze(
  Object.fromEntries(SOUND_EVENT_REGISTRY.map((event) => [event.id, event])),
);

export const SOUND_MANIFEST_SCHEMA = Object.freeze({
  requiredFields: Object.freeze([
    "id",
    "label",
    "category",
    "layer",
    "defaultVolume",
    "priority",
    "overlapMode",
    "maxVoices",
    "loop",
    "duckBgm",
    "duckAmount",
    "cooldownMs",
    "phase",
    "assetStatus",
  ]),
  categories: SOUND_CATEGORIES,
  layers: SOUND_LAYERS,
  overlapModes: SOUND_OVERLAP_MODES,
  assetStatuses: SOUND_ASSET_STATUSES,
  runtimeVersion: SOUND_FOUNDATION_VERSION,
});

export const SOUND_SETTINGS_DEFAULTS = Object.freeze({
  masterVolume: 1,
  bgmVolume: 0.7,
  sfxVolume: 0.8,
  uiVolume: 0.45,
  ambientVolume: 0.45,
  muteAll: false,
  reduceStingers: false,
  disableHoverSounds: false,
  disableHorrorSounds: false,
});

function isRecord(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function cleanText(value, maxLength = 2048) {
  return String(value || "").trim().slice(0, maxLength);
}

export function makeSoundAssetLabel(soundId) {
  return String(soundId || "")
    .split(".")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function normalizeSoundAssetCommercialUse(value) {
  return SOUND_ASSET_COMMERCIAL_USE.includes(value) ? value : "unknown";
}

export function normalizeSoundAssetPlaybackStatus(value) {
  return SOUND_ASSET_PLAYBACK_STATUSES.includes(value) ? value : "unverified";
}

export function validateSoundAssetUrl(value) {
  const url = cleanText(value);
  if (!url) return { ok: false, reason: "empty-url", message: "請輸入可直接播放的音檔 URL。" };
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, reason: "unsupported-protocol", message: "音檔 URL 必須使用 http 或 https。" };
    }
    if (!/\.(mp3|ogg|wav|webm)$/i.test(parsed.pathname)) {
      return {
        ok: false,
        reason: "not-direct-audio-url",
        message: "請使用可直接播放的音檔 URL（.mp3 / .ogg / .wav / .webm），不要貼 YouTube、Google Drive 或素材頁面網址。",
      };
    }
    return { ok: true, url };
  } catch {
    return { ok: false, reason: "invalid-url", message: "URL 格式無法解析，請確認是否為完整網址。" };
  }
}

export function normalizeSoundAssetBinding(binding, fallbackSoundId = "") {
  if (!isRecord(binding)) return null;
  const soundId = cleanText(binding.soundId || fallbackSoundId, 160);
  if (!SOUND_EVENT_REGISTRY_BY_ID[soundId]) return null;
  const label = cleanText(binding.label, 160) || makeSoundAssetLabel(soundId);
  const commercialUse = normalizeSoundAssetCommercialUse(binding.commercialUse);
  const playbackStatus = normalizeSoundAssetPlaybackStatus(binding.playbackStatus);

  return {
    soundId,
    label,
    url: cleanText(binding.url),
    fallbackUrl: cleanText(binding.fallbackUrl),
    sourcePageUrl: cleanText(binding.sourcePageUrl),
    license: cleanText(binding.license, 500),
    commercialUse,
    attributionRequired: Boolean(binding.attributionRequired),
    attributionText: cleanText(binding.attributionText, 1000),
    notes: cleanText(binding.notes, 2000),
    playbackStatus,
    updatedAt: cleanText(binding.updatedAt, 80),
  };
}

export function normalizeSoundAssets(assets = {}) {
  if (!isRecord(assets)) return {};
  return Object.entries(assets).reduce((normalized, [key, value]) => {
    const binding = normalizeSoundAssetBinding(value, key);
    if (binding && binding.soundId === key) normalized[key] = binding;
    return normalized;
  }, {});
}

function clampUnit(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(1, Math.max(0, number)) : fallback;
}

export function normalizeSoundSettings(settings = {}) {
  const source = settings && typeof settings === "object" && !Array.isArray(settings) ? settings : {};
  return {
    masterVolume: clampUnit(source.masterVolume, SOUND_SETTINGS_DEFAULTS.masterVolume),
    bgmVolume: clampUnit(source.bgmVolume, SOUND_SETTINGS_DEFAULTS.bgmVolume),
    sfxVolume: clampUnit(source.sfxVolume, SOUND_SETTINGS_DEFAULTS.sfxVolume),
    uiVolume: clampUnit(source.uiVolume, SOUND_SETTINGS_DEFAULTS.uiVolume),
    ambientVolume: clampUnit(source.ambientVolume, SOUND_SETTINGS_DEFAULTS.ambientVolume),
    muteAll: Boolean(source.muteAll),
    reduceStingers: Boolean(source.reduceStingers),
    disableHoverSounds: Boolean(source.disableHoverSounds),
    disableHorrorSounds: Boolean(source.disableHorrorSounds),
  };
}

function createDiagnostics() {
  return {
    audioUnlocked: false,
    activeBgm: null,
    activeAmbient: [],
    activeVoices: 0,
    blockedPlayCount: 0,
    missingAssetCount: 0,
    droppedVoiceCount: 0,
    poolExhaustedCount: 0,
    lastAudioError: "",
  };
}

function createBgmManager() {
  return {
    maxVoices: 2,
    activePrimary: null,
    outgoingVoice: null,
    incomingVoice: null,
    getDiagnostics() {
      return {
        activePrimary: this.activePrimary,
        hasOutgoingVoice: Boolean(this.outgoingVoice),
        hasIncomingVoice: Boolean(this.incomingVoice),
        maxVoices: this.maxVoices,
      };
    },
  };
}

function createPool({ name, maxVoices, priorityFloor = 0 }) {
  return {
    name,
    maxVoices,
    priorityFloor,
    voices: [],
    getDiagnostics() {
      return {
        name: this.name,
        activeVoices: this.voices.length,
        maxVoices: this.maxVoices,
        priorityFloor: this.priorityFloor,
      };
    },
  };
}

function createAmbientManager() {
  return {
    maxLayers: 2,
    activeLayers: [],
    getDiagnostics() {
      return {
        activeAmbient: [...this.activeLayers],
        maxLayers: this.maxLayers,
      };
    },
  };
}

function createBrowserUnlockController() {
  return {
    audioUnlocked: false,
    safeMode: false,
    maxDeferredRequests: 3,
    deferredTtlMs: 1500,
    deferredQueue: [],
    configure({ safeMode = false } = {}) {
      this.safeMode = Boolean(safeMode);
      if (this.safeMode) this.deferredQueue = [];
    },
    markUnlocked() {
      this.audioUnlocked = true;
    },
    getDiagnostics() {
      return {
        audioUnlocked: this.audioUnlocked,
        safeMode: this.safeMode,
        deferredQueueLength: this.deferredQueue.length,
        maxDeferredRequests: this.maxDeferredRequests,
        deferredTtlMs: this.deferredTtlMs,
      };
    },
  };
}

export function createAudioManager() {
  const diagnostics = createDiagnostics();
  const manager = {
    version: SOUND_FOUNDATION_VERSION,
    registry: SOUND_EVENT_REGISTRY_BY_ID,
    manifestSchema: SOUND_MANIFEST_SCHEMA,
    settings: normalizeSoundSettings(),
    bgm: createBgmManager(),
    sfxPool: createPool({ name: "sfx", maxVoices: 8, priorityFloor: 20 }),
    uiSfxPool: createPool({ name: "ui", maxVoices: 4, priorityFloor: 0 }),
    stingerPool: createPool({ name: "stinger", maxVoices: 2, priorityFloor: 60 }),
    ambient: createAmbientManager(),
    browserUnlock: createBrowserUnlockController(),
    diagnostics,
    configure({ settings, safeMode = false } = {}) {
      this.settings = normalizeSoundSettings(settings);
      this.browserUnlock.configure({ safeMode });
      this.diagnostics.audioUnlocked = this.browserUnlock.audioUnlocked;
      this.diagnostics.activeBgm = this.bgm.activePrimary;
      this.diagnostics.activeAmbient = [...this.ambient.activeLayers];
      this.diagnostics.activeVoices =
        this.sfxPool.voices.length +
        this.uiSfxPool.voices.length +
        this.stingerPool.voices.length;
      return this;
    },
    getEvent(soundId) {
      return this.registry[String(soundId || "")] || null;
    },
    play(soundId) {
      const event = this.getEvent(soundId);
      if (!event) {
        this.diagnostics.missingAssetCount += 1;
        this.diagnostics.lastAudioError = `Unknown sound id: ${String(soundId || "")}`;
        return { ok: false, reason: "unknown-sound-id" };
      }
      return { ok: false, reason: "sound-runtime-not-wired", event };
    },
    stop(layer = "") {
      if (!SOUND_LAYERS.includes(layer)) return { ok: false, reason: "unknown-layer" };
      return { ok: true, reason: "sound-runtime-not-wired", layer };
    },
    getDiagnostics() {
      return {
        ...this.diagnostics,
        bgm: this.bgm.getDiagnostics(),
        sfxPool: this.sfxPool.getDiagnostics(),
        uiSfxPool: this.uiSfxPool.getDiagnostics(),
        stingerPool: this.stingerPool.getDiagnostics(),
        ambient: this.ambient.getDiagnostics(),
        browserUnlock: this.browserUnlock.getDiagnostics(),
      };
    },
  };
  return manager.configure();
}

let audioManager = null;

export function getAudioManager() {
  if (!audioManager) audioManager = createAudioManager();
  return audioManager;
}

export function initializeAudioManager(options = {}) {
  return getAudioManager().configure(options);
}
