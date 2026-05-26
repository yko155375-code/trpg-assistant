function applyInteractionFixes() {
  ensureMobileDeleteHandler();
  ensureStatusReferencePanel();
  ensureYoutubeBgmButtons();
}

function ensureMobileDeleteHandler() {
  if (window.layoutDeleteHandlerBound) return;
  window.layoutDeleteHandlerBound = true;
  document.addEventListener("click", (event) => {
    const characterButton = event.target.closest("[data-delete-character]");
    const monsterButton = event.target.closest("[data-delete-monster]");
    if (!characterButton && !monsterButton) return;
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
    if (characterButton) {
      const id = characterButton.dataset.deleteCharacter;
      const character = state.characters.find((item) => item.id === id);
      if (!character) return;
      if (confirm(`確定要刪除玩家「${character.name}」？這個動作不能復原。`)) {
        state.characters = state.characters.filter((item) => item.id !== id);
        if (state.playerCharacterId === id) state.playerCharacterId = state.characters[0]?.id || "";
        persistInteractionState();
        render();
      }
      return;
    }
    const id = monsterButton.dataset.deleteMonster;
    const monster = state.monsters.find((item) => item.id === id);
    if (!monster) return;
    if (confirm(`確定要刪除怪物「${monster.name}」？這個動作不能復原。`)) {
      state.monsters = state.monsters.filter((item) => item.id !== id);
      persistInteractionState();
      render();
    }
  }, true);
}

function ensureStatusReferencePanel() {
  ensureStatusReferenceStyles();
  let toggle = document.getElementById("statusReferenceToggle");
  let panel = document.getElementById("statusReferencePanel");
  if (!toggle) {
    toggle = document.createElement("button");
    toggle.id = "statusReferenceToggle";
    toggle.className = "status-reference-toggle";
    toggle.type = "button";
    toggle.textContent = "狀態";
    document.body.appendChild(toggle);
  }
  if (!panel) {
    panel = document.createElement("aside");
    panel.id = "statusReferencePanel";
    panel.className = "status-reference-panel";
    panel.innerHTML = `<h3>異常狀態</h3><h4>目前作用中</h4><div class="status-reference-list" id="activeStatusReferenceList"></div><h4>全部效果</h4><div class="status-reference-list" id="allStatusReferenceList"></div>`;
    document.body.appendChild(panel);
  }
  if (toggle.dataset.bound !== "true") {
    toggle.dataset.bound = "true";
    toggle.addEventListener("click", () => panel.classList.toggle("is-open"));
  }
  updateStatusReferencePanel();
}

function ensureStatusReferenceStyles() {
  if (document.getElementById("interaction-fix-style")) return;
  const style = document.createElement("style");
  style.id = "interaction-fix-style";
  style.textContent = `.status-reference-toggle{position:fixed;right:10px;top:50%;z-index:20;min-height:38px;padding:0 10px;border-radius:8px 0 0 8px;border:1px solid var(--line);background:var(--gold);color:#251b08;font-size:.78rem;font-weight:900;box-shadow:var(--shadow)}.status-reference-panel{position:fixed;top:72px;right:8px;z-index:19;width:min(310px,calc(100vw - 28px));max-height:calc(100vh - 92px);overflow:auto;padding:10px;border:1px solid var(--line);border-radius:8px;background:rgba(27,32,38,.98);box-shadow:var(--shadow);transform:translateX(calc(100% + 18px));transition:transform .18s ease}.status-reference-panel.is-open{transform:translateX(0)}.status-reference-panel h3{margin-bottom:8px;font-size:.98rem}.status-reference-panel h4{margin:10px 0 6px;color:var(--muted);font-size:.74rem;letter-spacing:0}.status-reference-list{display:grid;gap:6px}.status-reference-item{padding:7px;border:1px solid var(--line);border-radius:6px;background:rgba(18,20,23,.64);font-size:.78rem;line-height:1.45}.status-reference-item strong{display:block;color:var(--text);font-size:.82rem}.status-reference-item span{display:block;margin-top:2px;color:var(--muted)}.status-reference-item.is-active{border-color:rgba(226,183,94,.95);background:rgba(226,183,94,.18);animation:activeStatusFlash 1.1s ease-in-out infinite alternate}@keyframes activeStatusFlash{from{box-shadow:0 0 0 rgba(226,183,94,0)}to{box-shadow:0 0 14px rgba(226,183,94,.35)}}.youtube-bgm-frame{margin-top:8px;border-radius:8px;overflow:hidden;border:1px solid var(--line);background:#111418}.youtube-bgm-frame iframe{display:block;width:100%;aspect-ratio:16/9;border:0}`;
  document.head.appendChild(style);
}

function updateStatusReferencePanel() {
  const defs = getInteractionStatusDefinitions();
  const activeList = document.getElementById("activeStatusReferenceList");
  const allList = document.getElementById("allStatusReferenceList");
  if (!activeList || !allList) return;
  const activeEntries = [];
  state.characters.forEach((character) => {
    (character.statuses || []).forEach((statusId) => {
      const status = defs.find((item) => item.id === statusId);
      if (status) activeEntries.push({ ...status, characterName: character.name });
    });
  });
  activeList.innerHTML = activeEntries.length ? activeEntries.map((status) => statusReferenceItem(status, true)).join("") : '<div class="status-reference-item"><strong>目前沒有啟用狀態</strong><span>點玩家卡片下方小方塊後，會出現在這裡。</span></div>';
  const activeIds = new Set(activeEntries.map((item) => item.id));
  allList.innerHTML = defs.map((status) => statusReferenceItem(status, activeIds.has(status.id))).join("");
}

function statusReferenceItem(status, active) {
  const owner = status.characterName ? `${status.characterName} · ` : "";
  return `<div class="status-reference-item ${active ? "is-active" : ""}"><strong>${escapeInteractionHtml(owner)}${escapeInteractionHtml(status.zh || status.label)} / ${escapeInteractionHtml(status.en || status.id)}</strong><span>${escapeInteractionHtml(status.tip || "")}</span></div>`;
}

function getInteractionStatusDefinitions() {
  if (typeof STATUS_DEFS !== "undefined" && Array.isArray(STATUS_DEFS)) return STATUS_DEFS;
  if (typeof statusDefs !== "undefined" && Array.isArray(statusDefs)) return statusDefs.map(([id, label, tip]) => ({ id, label, zh: label, en: id, tip }));
  return [];
}

function ensureYoutubeBgmButtons() {
  const audioGrid = document.querySelector("#audio .audio-grid");
  const audioCard = document.querySelector("#audio .audio-card");
  if (!audioGrid || !audioCard) return;
  [["tavern", "背景：酒館大廳", "https://www.youtube.com/embed/ERSFzWMas1Q?list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=3&autoplay=1"], ["rain", "背景：雨天", "https://www.youtube.com/embed/6Vzi4bvVLik?list=PLFsp59zNVdqKflLldglvgT-Lbf6D987Cr&index=2&autoplay=1"]].forEach(([id, label, src]) => {
    if (document.querySelector(`[data-youtube-bgm="${id}"]`)) return;
    const button = document.createElement("button");
    button.className = "primary-button";
    button.type = "button";
    button.dataset.youtubeBgm = id;
    button.dataset.youtubeSrc = src;
    button.textContent = label;
    audioGrid.appendChild(button);
  });
  if (!document.getElementById("youtubeBgmFrame")) {
    const frame = document.createElement("div");
    frame.id = "youtubeBgmFrame";
    frame.className = "youtube-bgm-frame";
    frame.hidden = true;
    audioCard.appendChild(frame);
  }
  if (window.layoutYoutubeBgmBound) return;
  window.layoutYoutubeBgmBound = true;
  document.addEventListener("click", (event) => {
    const button = event.target.closest("[data-youtube-bgm]");
    if (button) {
      event.preventDefault();
      playYoutubeBgm(button.dataset.youtubeSrc, button.textContent);
      return;
    }
    if (event.target.closest("#stopBgmButton")) stopYoutubeBgm();
  }, true);
}

function playYoutubeBgm(src, label) {
  if (typeof stopBgm === "function") stopBgm();
  const frame = document.getElementById("youtubeBgmFrame");
  if (!frame) return;
  frame.hidden = false;
  frame.innerHTML = `<iframe src="${escapeInteractionHtml(src)}" title="${escapeInteractionHtml(label)}" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  const status = document.getElementById("audioStatus");
  if (status) status.textContent = label;
}

function stopYoutubeBgm() {
  const frame = document.getElementById("youtubeBgmFrame");
  if (!frame) return;
  frame.innerHTML = "";
  frame.hidden = true;
}

function persistInteractionState() {
  if (typeof save === "function") return save();
  if (typeof saveState === "function") saveState();
}

function escapeInteractionHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

if (typeof render === "function") {
  const originalInteractionRender = render;
  render = function renderWithInteractionFixes() {
    originalInteractionRender();
    applyInteractionFixes();
  };
}

window.addEventListener("load", applyInteractionFixes);
applyInteractionFixes();
