export const playerPages = [
  { id: "characters", label: "角色" },
  { id: "assets", label: "資產" },
  { id: "dice", label: "擲骰" },
  { id: "shop", label: "商店" },
  { id: "public-info", label: "公開資訊" },
];

export const dmPages = [
  { id: "overview", label: "總覽" },
  { id: "players", label: "玩家" },
  { id: "monsters", label: "怪物" },
  { id: "dice", label: "骰子" },
  { id: "shop", label: "商店" },
  { id: "public-info", label: "公開資訊" },
  { id: "audio", label: "音樂" },
];

export function getActivePages(mode) {
  return mode === "dm" ? dmPages : playerPages;
}

export function getActivePageId(state) {
  return state.ui.mode === "dm" ? state.ui.dmPage : state.ui.playerPage;
}

export function setMode(state, mode) {
  return {
    ...state,
    ui: {
      ...state.ui,
      mode,
    },
  };
}

export function setActivePage(state, pageId) {
  const pageKey = state.ui.mode === "dm" ? "dmPage" : "playerPage";

  return {
    ...state,
    ui: {
      ...state.ui,
      [pageKey]: pageId,
    },
  };
}
