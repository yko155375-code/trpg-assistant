import { createDefaultState, normalizeState } from "./state.js";

export const STORAGE_KEY = "trpg-assistant-v2-state";

export function loadState() {
  const raw = window.localStorage.getItem(STORAGE_KEY);

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

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextState));
  return nextState;
}
