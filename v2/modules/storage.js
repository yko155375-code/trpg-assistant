import { createDefaultState, normalizeState } from "./state.js";

export const STORAGE_KEY = "trpg-assistant-v2-state";

let memoryState = null;

function canUseLocalStorage() {
  try {
    const testKey = `${STORAGE_KEY}.__test__`;
    window.localStorage.setItem(testKey, "1");
    window.localStorage.removeItem(testKey);
    return true;
  } catch (error) {
    console.warn("v2 localStorage unavailable, using memory state.", error);
    return false;
  }
}

function readRawState() {
  if (!canUseLocalStorage()) return memoryState;
  try {
    return window.localStorage.getItem(STORAGE_KEY);
  } catch (error) {
    console.warn("v2 state read failed, using memory/default state.", error);
    return memoryState;
  }
}

function writeRawState(value) {
  memoryState = value;
  if (!canUseLocalStorage()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, value);
  } catch (error) {
    console.warn("v2 state write failed, keeping memory state.", error);
  }
}

export function loadState() {
  const raw = readRawState();

  if (!raw) {
    return createDefaultState();
  }

  try {
    return normalizeState(JSON.parse(raw));
  } catch (error) {
    console.warn("v2 state parse failed, using default state.", error);
    return createDefaultState();
  }
}

export function saveState(state) {
  const nextState = normalizeState({
    ...state,
    meta: {
      ...(state.meta || {}),
      updatedAt: new Date().toISOString(),
    },
  });

  writeRawState(JSON.stringify(nextState));
  return nextState;
}
