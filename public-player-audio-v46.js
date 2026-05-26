const BGM_TRACKS_V46 = {
  explore: {
    label: "\u63a2\u7d22",
    type: "youtube",
    src: "https://www.youtube.com/watch?v=ERSFzWMas1Q&list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=3",
  },
  tension: { label: "\u7dca\u5f35", type: "synth", tone: "tension" },
  battle: { label: "\u6230\u9b25", type: "synth", tone: "battle" },
  mystery: {
    label: "\u795e\u79d8",
    type: "youtube",
    src: "https://www.youtube.com/watch?v=6Vzi4bvVLik&list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=2",
  },
};

const SFX_TRACKS_V46 = {
  reveal: { label: "\u7dda\u7d22", tone: "reveal" },
  hit: { label: "\u53d7\u64ca", tone: "hit" },
  danger: { label: "\u5371\u96aa", tone: "danger" },
  success: { label: "\u6210\u529f", tone: "success" },
  failure: { label: "\u5931\u6557", tone: "failure" },
};

let htmlAudioV46 = null;
let synthBgmNodesV46 = null;

function applyPublicPlayerAudioV46() {
  forcePlayerDefaultV46();
  ensurePublicPlayerStylesV46();
  ensureDmEntryV46();
  ensureReturnPlayerButtonV46();
  updateTraditionalChineseLabelsV46();
  cleanPlayerModeV46();
  rebuildAtmosphereAudioV46();
  patchAudioFunctionsV46();
  updatePublicPlayerVersionV46();
}

function forcePlayerDefaultV46() {
  if (sessionStorage.getItem("dmModeActiveV46") === "true") return;
  if (state.mode !== "player") {
    state.mode = "player";
    state.activeTab = "dashboard";
    persistLocalModeV46();
  }
}

function ensurePublicPlayerStylesV46() {
  if (document.getElementById("public-player-audio-v46-style")) return;
  const style = document.createElement("style");
  style.id = "public-player-audio-v46-style";
  style.textContent = `
    .eyebrow {
      display: none !important;
    }

    .dm-entry-v46 {
      position: fixed;
      top: 8px;
      right: 12px;
      z-index: 80;
      width: 28px;
      height: 28px;
      min-height: 28px;
      padding: 0;
      border: 1px solid rgba(185, 135, 59, 0.14);
      border-radius: 50%;
      background: rgba(8, 13, 23, 0.28);
      color: rgba(245, 223, 170, 0.74);
      opacity: 0.22;
      font-size: 0;
    }

    .dm-entry-v46::before {
      content: "\\25d0";
      font-size: 15px;
      line-height: 1;
    }

    .dm-entry-v46:hover,
    .dm-entry-v46:focus-visible,
    .dm-entry-v46:active {
      opacity: 0.75;
    }

    .mode-switch {
      display: none !important;
    }

    .return-player-v46 {
      display: none;
      width: 100%;
      margin-top: 8px;
    }

    body[data-mode="dm"] .return-player-v46 {
      display: inline-flex;
    }

    body[data-mode="player"] .tabbar {
      display: none !important;
    }

    body[data-mode="player"] #combat,
    body[data-mode="player"] #audio,
    body[data-mode="player"] #notes,
    body[data-mode="player"] #playerPanel,
    body[data-mode="player"] #characterForm,
    body[data-mode="player"] .bottom-add-form,
    body[data-mode="player"] .bottom-add-card,
    body[data-mode="player"] .danger-delete-button,
    body[data-mode="player"] #clearRollsButton,
    body[data-mode="player"] #diceSourceField {
      display: none !important;
    }

    body[data-mode="player"] #dashboard,
    body[data-mode="player"] #dice {
      display: block !important;
    }

    body[data-mode="player"] #dashboard {
      padding-top: 14px;
    }

    body[data-mode="player"] .stat-control__row button,
    body[data-mode="player"] .asset-control button {
      display: none !important;
    }

    body[data-mode="player"] .stat-control__row,
    body[data-mode="player"] .asset-control {
      grid-template-columns: 1fr;
    }

    body[data-mode="player"] .session-strip {
      grid-template-columns: minmax(0, 1fr) auto;
    }

    body[data-mode="player"] .hero-fear-card {
      display: none !important;
    }

    .public-clue-card-v46 {
      margin-bottom: 8px;
    }

    .public-clue-card-v46 p {
      margin: 0;
      line-height: 1.6;
      color: rgba(242, 234, 214, 0.88);
    }

    .audio-section-title-v46 {
      grid-column: 1 / -1;
      margin-top: 4px;
      color: var(--muted);
      font-size: 0.78rem;
      font-weight: 900;
    }

    .audio-grid .is-active {
      border-color: rgba(212, 154, 53, 0.9) !important;
      box-shadow: 0 0 0 2px rgba(212, 154, 53, 0.14);
    }

    .stop-background-v46 {
      border-color: rgba(143, 30, 36, 0.62) !important;
      background: linear-gradient(180deg, rgba(143, 30, 36, 0.42), rgba(45, 18, 24, 0.78)) !important;
      color: #ffd1c7 !important;
    }

    .youtube-player-v46 {
      margin-top: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      overflow: hidden;
      background: rgba(5, 8, 14, 0.82);
    }

    .youtube-player-v46 iframe {
      display: block;
      width: 100%;
      height: 96px;
      border: 0;
    }

    .audio-message-v46 {
      margin-top: 6px;
      color: var(--muted);
      font-size: 0.76rem;
      line-height: 1.4;
    }

    @media (min-width: 720px) {
      body[data-mode="player"] main {
        display: grid;
        grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
        gap: 12px;
        align-items: start;
      }

      body[data-mode="player"] #dashboard,
      body[data-mode="player"] #dice {
        padding-top: 14px;
      }
    }
  `;
  document.head.appendChild(style);
}

function ensureDmEntryV46() {
  if (document.getElementById("dmEntryV46")) return;
  const button = document.createElement("button");
  button.id = "dmEntryV46";
  button.className = "dm-entry-v46";
  button.type = "button";
  button.setAttribute("aria-label", "\u9032\u5165 DM \u4ecb\u9762");
  button.addEventListener("click", handleEnterDmMode);
  document.body.appendChild(button);
}

function handleEnterDmMode() {
  sessionStorage.setItem("dmModeActiveV46", "true");
  state.mode = "dm";
  state.activeTab = state.activeTab && state.activeTab !== "notes" ? state.activeTab : "dashboard";
  persistLocalModeV46();
  if (typeof render === "function") render();
}

function handleReturnPlayerModeV46() {
  sessionStorage.removeItem("dmModeActiveV46");
  state.mode = "player";
  state.activeTab = "dashboard";
  persistLocalModeV46();
  if (typeof render === "function") render();
}

function ensureReturnPlayerButtonV46() {
  const sessionStrip = document.querySelector(".session-strip");
  if (!sessionStrip || document.getElementById("returnPlayerV46")) return;
  const button = document.createElement("button");
  button.id = "returnPlayerV46";
  button.className = "text-button return-player-v46";
  button.type = "button";
  button.textContent = "\u8fd4\u56de\u73a9\u5bb6\u756b\u9762";
  button.addEventListener("click", handleReturnPlayerModeV46);
  sessionStrip.appendChild(button);
}

function updateTraditionalChineseLabelsV46() {
  setTextV46("#dashboard .section-heading h2", "\u73a9\u5bb6\u72c0\u614b");
  setTextV46("#dashboard .card-header h3", "\u968a\u4f0d\u8cc7\u6e90");
  setTextV46('.tabbar__button[data-tab="dashboard"]', "\u73a9\u5bb6\u72c0\u614b");
  setTextV46("#combat .section-heading h2", "\u6575\u65b9\u55ae\u4f4d");
  setTextV46('.tabbar__button[data-tab="combat"]', "\u6575\u65b9\u55ae\u4f4d");
  setTextV46("#dice .section-heading h2", "\u64f2\u9ab0\u5de5\u5177");
  setTextV46('.tabbar__button[data-tab="dice"]', "\u64f2\u9ab0\u5de5\u5177");
  setTextV46("#dice .dice-card h3", "\u5e0c\u671b\u8207\u6050\u61fc");
  setTextV46(".roll-history-card h3", "\u64f2\u9ab0\u7d00\u9304");
  setTextV46("#audio .section-heading h2", "\u6c1b\u570d\u97f3\u6a02");
  setTextV46('.tabbar__button[data-tab="audio"]', "\u97f3\u6a02\u63a7\u5236");
  setTextV46("#audio .audio-card h3", "\u6c1b\u570d\u97f3\u6548");
  setTextV46("#audioStatus", "\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02");
  setTextV46("#playerPanel .section-heading h2", "\u73a9\u5bb6\u756b\u9762");
}

function cleanPlayerModeV46() {
  if (state.mode !== "player") return;
  document.querySelectorAll(".dm-panel").forEach((panel) => {
    panel.hidden = !["dashboard", "dice"].includes(panel.id);
    panel.classList.toggle("is-active", ["dashboard", "dice"].includes(panel.id));
  });
  const playerPanel = document.getElementById("playerPanel");
  if (playerPanel) playerPanel.hidden = true;
  ensurePublicClueCardV46();
}

function ensurePublicClueCardV46() {
  const dashboard = document.getElementById("dashboard");
  if (!dashboard) return;
  let card = document.getElementById("publicClueCardV46");
  if (!card) {
    card = document.createElement("section");
    card.id = "publicClueCardV46";
    card.className = "tool-card public-clue-card-v46";
    const heading = dashboard.querySelector(".section-heading");
    if (heading?.nextSibling) {
      dashboard.insertBefore(card, heading.nextSibling);
    } else {
      dashboard.prepend(card);
    }
  }
  card.innerHTML = `<div class="card-header"><div><h3>\u516c\u958b\u6558\u4e8b\u8207\u7dda\u7d22</h3></div></div><p>${escapeV46(state.publicNotes || "\u76ee\u524d\u6c92\u6709\u516c\u958b\u7dda\u7d22\u3002")}</p>`;
}

function rebuildAtmosphereAudioV46() {
  const audioGrid = document.querySelector("#audio .audio-grid");
  const audioCard = document.querySelector("#audio .audio-card");
  if (!audioGrid || !audioCard) return;
  if (audioGrid.dataset.v46Built === "true" && audioGrid.querySelector("[data-v46-bgm]")) return;
  audioGrid.dataset.v46Built = "true";
  audioGrid.innerHTML = `
    <div class="audio-section-title-v46">\u80cc\u666f\u97f3\u6a02</div>
    ${Object.entries(BGM_TRACKS_V46).map(([key, track]) => `<button class="primary-button" data-v46-bgm="${key}" type="button">${track.label}</button>`).join("")}
    <button class="text-button stop-background-v46" id="stopBgmButton" data-v46-stop-bgm type="button">\u505c\u6b62\u80cc\u666f</button>
    <div class="audio-section-title-v46">\u5373\u6642\u97f3\u6548</div>
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
    message.textContent = "\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02";
    audioCard.appendChild(message);
  }
}

function patchAudioFunctionsV46() {
  if (!window.audioPatchBoundV46) {
    window.audioPatchBoundV46 = true;
    document.addEventListener("click", handleAudioClickV46, true);
  }

  try {
    stopBgm = stopBackgroundAudioV46;
  } catch (error) {
    window.stopBgm = stopBackgroundAudioV46;
  }
}

function handleAudioClickV46(event) {
  const bgmButton = event.target.closest("[data-v46-bgm]");
  const sfxButton = event.target.closest("[data-v46-sfx]");
  const stopButton = event.target.closest("[data-v46-stop-bgm]");
  if (!bgmButton && !sfxButton && !stopButton) return;

  event.preventDefault();
  event.stopPropagation();
  event.stopImmediatePropagation();

  if (bgmButton) playBackgroundTrackV46(bgmButton.dataset.v46Bgm);
  if (sfxButton) playSfxV46(sfxButton.dataset.v46Sfx);
  if (stopButton) stopBackgroundAudioV46();
}

function playBackgroundTrackV46(trackKey) {
  const track = BGM_TRACKS_V46[trackKey];
  if (!track) return;
  stopBackgroundAudioV46(false);
  setActiveBgmButtonV46(trackKey);

  if (track.type === "youtube" || isYouTubeUrlV46(track.src)) {
    playYouTubeBgmV46(track.src, track.label);
    return;
  }

  if (isAudioFileUrlV46(track.src)) {
    playHtmlAudioV46(track.src, track.label);
    return;
  }

  playSynthBgmV46(track.tone || trackKey, track.label);
}

function playYouTubeBgmV46(url, label) {
  const player = document.getElementById("audioPlayerV46");
  const status = document.getElementById("audioStatus");
  const message = document.getElementById("audioMessageV46");
  const videoId = extractYouTubeVideoId(url);
  if (!player || !videoId) return;

  const parsed = safeUrlV46(url);
  const hasPlaylist = parsed?.searchParams.has("list");
  player.hidden = false;
  player.innerHTML = `<iframe src="https://www.youtube.com/embed/${escapeV46(videoId)}?playsinline=1&autoplay=1" title="${escapeV46(label)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  if (status) status.textContent = `\u80cc\u666f\uff1a${label}`;
  if (message) {
    message.textContent = hasPlaylist
      ? "\u76ee\u524d\u50c5\u652f\u63f4\u55ae\u652f YouTube \u5f71\u7247\uff0c\u5df2\u64ad\u653e\u6e05\u55ae\u4e2d\u7684\u55ae\u652f\u5f71\u7247\u3002\u82e5\u700f\u89bd\u5668\u963b\u64cb\uff0c\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02\u3002"
      : "\u82e5\u700f\u89bd\u5668\u963b\u64cb\uff0c\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02\u3002";
  }
}

function playHtmlAudioV46(src, label) {
  htmlAudioV46 = new Audio(src);
  htmlAudioV46.loop = true;
  htmlAudioV46.play()
    .then(() => {
      setTextV46("#audioStatus", `\u80cc\u666f\uff1a${label}`);
      setTextV46("#audioMessageV46", "");
    })
    .catch(() => setTextV46("#audioMessageV46", "\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02"));
}

function playSynthBgmV46(tone, label) {
  const ctx = getAudioContext();
  const config = {
    tension: { base: 92, type: "sawtooth", gain: 0.04 },
    battle: { base: 118, type: "square", gain: 0.035 },
    mystery: { base: 58, type: "triangle", gain: 0.045 },
    explore: { base: 65, type: "triangle", gain: 0.045 },
  }[tone] || { base: 65, type: "triangle", gain: 0.045 };
  const gain = ctx.createGain();
  gain.gain.value = config.gain;
  gain.connect(ctx.destination);
  const oscA = ctx.createOscillator();
  const oscB = ctx.createOscillator();
  oscA.type = "sine";
  oscB.type = config.type;
  oscA.frequency.value = config.base;
  oscB.frequency.value = config.base * 1.5;
  oscA.connect(gain);
  oscB.connect(gain);
  oscA.start();
  oscB.start();
  synthBgmNodesV46 = [oscA, oscB];
  setTextV46("#audioStatus", `\u80cc\u666f\uff1a${label}`);
  setTextV46("#audioMessageV46", "");
}

function playSfxV46(key) {
  const track = SFX_TRACKS_V46[key];
  if (!track) return;
  const ctx = getAudioContext();
  const gain = ctx.createGain();
  const osc = ctx.createOscillator();
  const now = ctx.currentTime;
  const settings = {
    reveal: { type: "triangle", start: 520, end: 840, time: 0.28 },
    hit: { type: "square", start: 130, end: 60, time: 0.18 },
    danger: { type: "sawtooth", start: 220, end: 170, time: 0.45 },
    success: { type: "triangle", start: 620, end: 980, time: 0.24 },
    failure: { type: "sawtooth", start: 180, end: 72, time: 0.36 },
  }[key];
  osc.type = settings.type;
  osc.frequency.setValueAtTime(settings.start, now);
  osc.frequency.exponentialRampToValueAtTime(settings.end, now + settings.time);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.12, now + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.001, now + settings.time);
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(now);
  osc.stop(now + settings.time + 0.03);
}

function stopBackgroundAudioV46(clearActive = true) {
  if (Array.isArray(synthBgmNodesV46)) {
    synthBgmNodesV46.forEach((node) => {
      try { node.stop(); } catch (error) {}
    });
  }
  synthBgmNodesV46 = null;

  if (Array.isArray(window.bgmNodes)) {
    window.bgmNodes.forEach((node) => {
      try { node.stop(); } catch (error) {}
    });
    window.bgmNodes = null;
  }

  if (htmlAudioV46) {
    htmlAudioV46.pause();
    htmlAudioV46.src = "";
  }
  htmlAudioV46 = null;

  const player = document.getElementById("audioPlayerV46") || document.getElementById("youtubeBgmFrame");
  if (player) {
    player.innerHTML = "";
    player.hidden = true;
  }

  setTextV46("#audioStatus", "\u672a\u64ad\u653e");
  setTextV46("#audioMessageV46", "\u8acb\u9ede\u64ca\u64ad\u653e\u4ee5\u555f\u52d5\u97f3\u6a02");
  if (clearActive) setActiveBgmButtonV46("");
}

function extractYouTubeVideoId(url) {
  const parsed = safeUrlV46(url);
  if (!parsed) return "";
  if (parsed.hostname.includes("youtu.be")) {
    return parsed.pathname.split("/").filter(Boolean)[0] || "";
  }
  if (parsed.pathname.startsWith("/embed/")) {
    return parsed.pathname.split("/").filter(Boolean)[1] || "";
  }
  if (parsed.hostname.includes("youtube.com")) {
    return parsed.searchParams.get("v") || "";
  }
  return "";
}

function isYouTubeUrlV46(url) {
  const parsed = safeUrlV46(url);
  return !!parsed && (parsed.hostname.includes("youtube.com") || parsed.hostname.includes("youtu.be"));
}

function isAudioFileUrlV46(url = "") {
  return /\.(mp3|ogg|wav)(\?|#|$)/i.test(url);
}

function safeUrlV46(url) {
  try {
    return new URL(url, location.href);
  } catch {
    return null;
  }
}

function setActiveBgmButtonV46(key) {
  document.querySelectorAll("[data-v46-bgm]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.v46Bgm === key);
  });
}

function persistPublicPlayerStateV46() {
  if (typeof save === "function") {
    save();
  } else if (typeof saveState === "function") {
    saveState();
  }
}

function persistLocalModeV46() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (error) {}
}

function updatePublicPlayerVersionV46() {
  const version = document.querySelector(".session-strip .status-pill");
  if (version) version.textContent = "v0.1.17 \u73a9\u5bb6\u9996\u9801\u8207\u97f3\u6a02\u4fee\u6b63";
}

function setTextV46(selector, text) {
  const element = document.querySelector(selector);
  if (element) element.textContent = text;
}

function escapeV46(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function" && !window.publicPlayerRenderPatchedV46) {
  const originalRenderV46 = render;
  render = function renderWithPublicPlayerV46() {
    originalRenderV46();
    applyPublicPlayerAudioV46();
  };
  window.publicPlayerRenderPatchedV46 = true;
}

window.extractYouTubeVideoId = extractYouTubeVideoId;
window.handleEnterDmMode = handleEnterDmMode;
window.addEventListener("load", applyPublicPlayerAudioV46);
applyPublicPlayerAudioV46();
