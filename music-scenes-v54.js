const defaultMusicScenes = [
  {
    id: "tavern_normal",
    label: "酒館",
    scene: "接任務、聊天、休息",
    sourceHint: "Tabletop Audio - Tavern Music / Bardify - Cozy Tavern",
    mood: "輕鬆、熱鬧",
  },
  {
    id: "tavern_shadow",
    label: "陰暗酒館",
    scene: "黑市、情報交易、盜賊據點",
    sourceHint: "Tabletop Audio - Den of Iniquity",
    mood: "低沉、可疑",
  },
  {
    id: "city",
    label: "城市",
    scene: "採買、進城、日常探索",
    sourceHint: "Bardify - Cities & Villages / Tabletop Audio - City of Wonders",
    mood: "人群、開放、生活感",
  },
  {
    id: "alley",
    label: "暗巷",
    scene: "追蹤、小偷、犯罪區",
    sourceHint: "Tabletop Audio - Cutpurse Pursuit / Bardify - City of Thieves",
    mood: "緊張、狹窄",
  },
  {
    id: "forest",
    label: "森林",
    scene: "旅行、野外探索",
    sourceHint: "Tabletop Audio - Sun Dappled Trail",
    mood: "自然、平穩",
  },
  {
    id: "dark_forest",
    label: "幽暗森林",
    scene: "迷霧森林、妖精領地、危險路線",
    sourceHint: "Tabletop Audio - The Verdant Dark",
    mood: "壓迫、未知",
  },
  {
    id: "road_tense",
    label: "危險旅途",
    scene: "伏擊前、追蹤、趕路",
    sourceHint: "Bardify - Tense Path / Tabletop Audio - Treacherous Path",
    mood: "緊繃、警戒",
  },
  {
    id: "dungeon",
    label: "地城",
    scene: "礦坑、古墓、廢棄遺跡",
    sourceHint: "Tabletop Audio - Dungeon I",
    mood: "昏暗、探索",
  },
  {
    id: "mechanical_dungeon",
    label: "機關地城",
    scene: "謎題、機械迷宮、陷阱房",
    sourceHint: "Tabletop Audio - Puzzle Dungeon / Dungeon II: Mechanical",
    mood: "機械、壓迫",
  },
  {
    id: "combat",
    label: "戰鬥",
    scene: "普通遭遇戰",
    sourceHint: "Tabletop Audio - Skirmish / Bardify - Epic Fight",
    mood: "節奏明確、開戰",
  },
  {
    id: "boss",
    label: "首領戰",
    scene: "Boss、儀式決戰、章節高潮",
    sourceHint: "Bardify - Dungeon Boss / Epic Fight",
    mood: "史詩、壓迫",
  },
  {
    id: "mystery",
    label: "調查",
    scene: "偵查、找線索、解謎",
    sourceHint: "Bardify - Investigating a Mystery / Tabletop RPG Music suspense",
    mood: "懸疑、低干擾",
  },
];

const MUSIC_SCENE_TONES_V54 = {
  tavern_normal: "explore",
  tavern_shadow: "mystery",
  city: "explore",
  alley: "tension",
  forest: "explore",
  dark_forest: "mystery",
  road_tense: "tension",
  dungeon: "mystery",
  mechanical_dungeon: "tension",
  combat: "battle",
  boss: "battle",
  mystery: "mystery",
};

function applyMusicScenesV54() {
  ensureMusicSceneStylesV54();
  registerMusicScenesV54();
  rebuildMusicSceneGridV54();
  patchMusicSceneVersionV54();
}

function ensureMusicSceneStylesV54() {
  if (document.getElementById("music-scenes-v54-style")) return;
  const style = document.createElement("style");
  style.id = "music-scenes-v54-style";
  style.textContent = `
    .music-scene-grid-v54 {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(138px, 1fr));
      gap: 6px;
      grid-column: 1 / -1;
    }

    .music-scene-button-v54 {
      min-height: 66px;
      padding: 7px !important;
      display: grid !important;
      gap: 3px;
      align-content: start;
      text-align: left;
      white-space: normal;
    }

    .music-scene-button-v54 strong {
      color: inherit;
      font-size: .82rem;
      line-height: 1.15;
    }

    .music-scene-button-v54 span {
      color: var(--muted);
      font-size: .66rem;
      line-height: 1.3;
    }

    .music-scene-button-v54.is-active span {
      color: rgba(255, 245, 216, .86);
    }

    .music-source-note-v54 {
      grid-column: 1 / -1;
      margin: 0;
      color: var(--muted);
      font-size: .68rem;
      line-height: 1.35;
      opacity: .82;
    }
  `;
  document.head.appendChild(style);
}

function registerMusicScenesV54() {
  if (typeof BGM_TRACKS_V46 !== "object") return;
  defaultMusicScenes.forEach((scene) => {
    BGM_TRACKS_V46[scene.id] = {
      label: scene.label,
      type: "synth",
      tone: MUSIC_SCENE_TONES_V54[scene.id] || "explore",
      scene: scene.scene,
      sourceHint: scene.sourceHint,
      mood: scene.mood,
    };
  });
  window.defaultMusicScenes = defaultMusicScenes;
}

function rebuildMusicSceneGridV54() {
  const audioGrid = document.querySelector("#audio .audio-grid");
  const audioCard = document.querySelector("#audio .audio-card");
  if (!audioGrid || !audioCard || typeof SFX_TRACKS_V46 !== "object") return;

  audioGrid.dataset.v54Built = "true";
  audioGrid.innerHTML = `
    <div class="audio-section-title-v46">背景音樂場景</div>
    <div class="music-scene-grid-v54">
      ${defaultMusicScenes.map((scene) => musicSceneButtonV54(scene)).join("")}
    </div>
    <p class="music-source-note-v54">來源提示先作為選曲備註；目前按鈕使用內建音源播放，之後可再替換成實際 YouTube 或音檔連結。</p>
    <button class="text-button stop-background-v46" id="stopBgmButton" data-v46-stop-bgm type="button">停止背景</button>
    <div class="audio-section-title-v46">即時音效</div>
    ${Object.entries(SFX_TRACKS_V46).map(([key, track]) => `<button class="text-button" data-v46-sfx="${key}" type="button">${track.label}</button>`).join("")}
  `;

  let player = document.getElementById("audioPlayerV46");
  if (!player) {
    player = document.createElement("div");
    player.id = "audioPlayerV46";
    player.className = "youtube-player-v46";
    player.hidden = true;
    audioCard.appendChild(player);
  }

  let message = document.getElementById("audioMessageV46");
  if (!message) {
    message = document.createElement("div");
    message.id = "audioMessageV46";
    message.className = "audio-message-v46";
    audioCard.appendChild(message);
  }
}

function musicSceneButtonV54(scene) {
  return `
    <button class="primary-button music-scene-button-v54" data-v46-bgm="${scene.id}" title="${escapeMusicSceneHtmlV54(scene.sourceHint)}" type="button">
      <strong>${escapeMusicSceneHtmlV54(scene.label)}</strong>
      <span>${escapeMusicSceneHtmlV54(scene.scene)}</span>
      <span>${escapeMusicSceneHtmlV54(scene.mood)}</span>
    </button>
  `;
}

function patchMusicSceneVersionV54() {
  const footer = document.getElementById("versionFooterV52");
  const badge = footer?.querySelector(".status-pill");
  if (badge) badge.textContent = "版本 v0.1.41";
}

function escapeMusicSceneHtmlV54(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function" && !window.musicScenesRenderPatchedV54) {
  const originalRenderV54 = render;
  render = function renderWithMusicScenesV54() {
    originalRenderV54();
    applyMusicScenesV54();
  };
  window.musicScenesRenderPatchedV54 = true;
}

window.addEventListener("load", applyMusicScenesV54);
window.setTimeout(applyMusicScenesV54, 0);
window.setTimeout(applyMusicScenesV54, 500);
applyMusicScenesV54();
