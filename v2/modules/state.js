import { normalizeCharacters } from "./characters.js";
import { normalizeMonsters } from "./monsters.js";
import { normalizeSession } from "./public-info.js";
import { normalizeShop } from "./shop.js";

export const APP_VERSION = "v2-stage-5";

function isRecord(value) { return Boolean(value) && typeof value === "object" && !Array.isArray(value); }
function recordOrEmpty(value) { return isRecord(value) ? value : {}; }
function recordArray(value) { return Array.isArray(value) ? value.filter(isRecord) : []; }
function textArray(value) { return Array.isArray(value) ? value.filter((entry) => typeof entry === "string") : []; }
function sanitizeCharacter(character) {
  const source = recordOrEmpty(character); const assets = recordOrEmpty(source.assets);
  return { ...source, stats: recordOrEmpty(source.stats), attributes: recordOrEmpty(source.attributes), assets: { ...assets, gold: recordOrEmpty(assets.gold), items: textArray(assets.items), equipment: textArray(assets.equipment), consumables: textArray(assets.consumables), inventory: textArray(assets.inventory) }, conditions: textArray(source.conditions), buffs: textArray(source.buffs), debuffs: textArray(source.debuffs) };
}
function makeEncounterId() { return `encounter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`; }
function normalizeEncounterMonster(monster = {}) {
  const maxHp = Math.max(1, Number(monster.maxHp ?? monster.hp ?? 1) || 1); const hp = Math.min(maxHp, Math.max(0, Number(monster.hp ?? maxHp) || 0)); const maxStress = Math.max(0, Number(monster.maxStress ?? monster.stress ?? 0) || 0); const stress = Math.min(maxStress, Math.max(0, Number(monster.stress ?? 0) || 0));
  return { name: String(monster.name || "未命名怪物").trim() || "未命名怪物", hp, maxHp, stress, maxStress, difficulty: Math.max(0, Number(monster.difficulty ?? 10) || 10), attack: String(monster.attack || monster.attackFormula || "").trim(), damage: String(monster.damage || monster.damageFormula || "").trim(), threshold: String(monster.threshold || "").trim(), notes: String(monster.notes || monster.note || "").trim(), tag: String(monster.tag || "").trim() };
}
export function normalizeEncounter(encounter = {}) { const source = recordOrEmpty(encounter); return { id: String(source.id || makeEncounterId()), name: String(source.name || "未命名遭遇").trim() || "未命名遭遇", monsters: recordArray(source.monsters).map(normalizeEncounterMonster), createdAt: source.createdAt || new Date().toISOString() }; }
export function normalizeEncounters(encounters) { return recordArray(encounters).map(normalizeEncounter); }
export function createDefaultState() {
  const now = new Date().toISOString();
  return { meta: { version: APP_VERSION, createdAt: now, updatedAt: now }, session: { scene: "", publicInfo: "", gmNotes: "", fear: 0, hopePool: 0, round: 0, monsterRoundResults: [] }, characters: [], monsters: [], encounters: [], shop: { items: [], purchaseLog: [] }, rolls: [], audio: { currentTrackId: null, isPlaying: false, volume: 0.7 }, ui: { mode: "player", currentCharacterId: null, selectedCharacterId: null, playerPage: "characters", dmPage: "overview", isTeamStatusOpen: false, expandedMonsterId: null, rollFormulaDrafts: {}, rollEdgeMode: "", isCriticalDamageRoll: false } };
}
export function normalizeState(input) {
  const fallback = createDefaultState(); const source = recordOrEmpty(input); const sourceMeta = recordOrEmpty(source.meta); const sourceSession = recordOrEmpty(source.session); const sourceAudio = recordOrEmpty(source.audio); const sourceUi = recordOrEmpty(source.ui); const sourceShop = recordOrEmpty(source.shop); const characters = normalizeCharacters(recordArray(source.characters).map(sanitizeCharacter)); const monsters = normalizeMonsters(recordArray(source.monsters)); const encounters = normalizeEncounters(source.encounters); const requestedCharacterId = sourceUi.currentCharacterId || sourceUi.selectedCharacterId || null; const currentCharacterId = characters.some((character) => character.id === requestedCharacterId) ? requestedCharacterId : characters[0]?.id || null;
  return { ...fallback, ...source, meta: { ...fallback.meta, ...sourceMeta, version: APP_VERSION }, session: normalizeSession({ ...fallback.session, ...sourceSession }), characters, monsters, encounters, shop: normalizeShop({ ...fallback.shop, ...sourceShop, items: recordArray(sourceShop.items), purchaseLog: recordArray(sourceShop.purchaseLog) }), rolls: recordArray(source.rolls), audio: { ...fallback.audio, ...sourceAudio }, ui: { ...fallback.ui, ...sourceUi, currentCharacterId, selectedCharacterId: currentCharacterId, expandedCharacterId: characters.some((character) => character.id === sourceUi.expandedCharacterId) ? sourceUi.expandedCharacterId : null, expandedMonsterId: monsters.some((monster) => monster.id === sourceUi.expandedMonsterId) ? sourceUi.expandedMonsterId : null, rollFormulaDrafts: isRecord(sourceUi.rollFormulaDrafts) ? sourceUi.rollFormulaDrafts : {}, rollEdgeMode: ["advantage", "disadvantage"].includes(sourceUi.rollEdgeMode) ? sourceUi.rollEdgeMode : "", isCriticalDamageRoll: Boolean(sourceUi.isCriticalDamageRoll) } };
}
