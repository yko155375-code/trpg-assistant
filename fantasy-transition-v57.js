const FANTASY_TRANSITION_DURATION_V57 = 1280;
const FANTASY_TRANSITION_REDUCED_DURATION_V57 = 420;
let fantasyTransitionActiveV57 = false;
let fantasyDmTapCountV57 = 0;
let fantasyDmTapTimerV57 = null;

function FantasyTransitionOverlay({ active, title = "", subtitle = "", variant = "scene", onComplete } = {}) {
  ensureFantasyTransitionStylesV57();
  if (!active) {
    document.getElementById("fantasyTransitionOverlayV57")?.remove();
    fantasyTransitionActiveV57 = false;
    return null;
  }
  if (fantasyTransitionActiveV57) return document.getElementById("fantasyTransitionOverlayV57");
  fantasyTransitionActiveV57 = true;
  document.getElementById("fantasyTransitionOverlayV57")?.remove();
  const overlay = document.createElement("div");
  overlay.id = "fantasyTransitionOverlayV57";
  overlay.className = `fantasy-transition-v57 fantasy-transition-v57--${variant}`;
  overlay.setAttribute("role", "status");
  overlay.setAttribute("aria-live", "polite");
  overlay.innerHTML = `<div class="fantasy-transition-v57__veil"></div><div class="fantasy-transition-v57__emblem" aria-hidden="true"><div class="fantasy-transition-v57__glow"></div><div class="fantasy-transition-v57__beam">ᚱ</div><div class="fantasy-transition-v57__horn fantasy-transition-v57__horn--left"></div><div class="fantasy-transition-v57__horn fantasy-transition-v57__horn--right"></div><div class="fantasy-transition-v57__crest"><div class="fantasy-transition-v57__skull">☠</div></div><div class="fantasy-transition-v57__plaque"><strong>${escapeFantasyTransitionHtmlV57(title)}</strong>${subtitle ? `<span>${escapeFantasyTransitionHtmlV57(subtitle)}</span>` : ""}</div></div>`;
  document.body.appendChild(overlay);
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const duration = reducedMotion ? FANTASY_TRANSITION_REDUCED_DURATION_V57 : FANTASY_TRANSITION_DURATION_V57;
  window.setTimeout(() => {
    try { if (typeof onComplete === "function") onComplete(); }
    finally {
      overlay.classList.add("is-complete");
      window.setTimeout(() => {
        overlay.remove();
        fantasyTransitionActiveV57 = false;
      }, reducedMotion ? 120 : 220);
    }
  }, duration);
  return overlay;
}

function ensureFantasyTransitionStylesV57() {
  if (document.getElementById("fantasy-transition-v57-style")) return;
  const style = document.createElement("style");
  style.id = "fantasy-transition-v57-style";
  style.textContent = `
    .fantasy-transition-v57{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;overflow:hidden;pointer-events:all;isolation:isolate}
    .fantasy-transition-v57__veil{position:absolute;inset:0;background:radial-gradient(circle at 50% 42%,rgba(185,135,59,.18),transparent 28rem),rgba(3,6,12,.78);backdrop-filter:blur(3px);animation:fantasy-veil-v57 1280ms ease both}
    .fantasy-transition-v57__emblem{position:relative;width:min(360px,calc(100vw - 38px));min-height:272px;display:grid;place-items:center;transform:scale(.82);opacity:0;animation:fantasy-emblem-v57 1280ms cubic-bezier(.17,.84,.28,1) both}
    .fantasy-transition-v57__glow{position:absolute;width:92%;aspect-ratio:1;border-radius:50%;background:radial-gradient(circle,rgba(212,154,53,.28),rgba(78,20,25,.16) 42%,transparent 68%);filter:blur(10px);opacity:.82}
    .fantasy-transition-v57__beam{position:absolute;top:6px;color:rgba(255,226,162,.92);font-family:Georgia,"Times New Roman",serif;font-size:34px;text-shadow:0 0 16px rgba(212,154,53,.7);transform:translateY(-30px);opacity:0;animation:fantasy-beam-v57 1280ms ease both}
    .fantasy-transition-v57__horn{position:absolute;top:70px;width:128px;height:136px;border:6px solid rgba(156,103,45,.95);border-bottom-color:transparent;border-radius:86% 14% 72% 28%;filter:drop-shadow(0 12px 16px rgba(0,0,0,.48));opacity:0}
    .fantasy-transition-v57__horn--left{left:16px;transform:translateX(-24px) rotate(-32deg);animation:fantasy-horn-left-v57 1280ms ease both}
    .fantasy-transition-v57__horn--right{right:16px;transform:translateX(24px) rotate(32deg) scaleX(-1);animation:fantasy-horn-right-v57 1280ms ease both}
    .fantasy-transition-v57__crest{position:absolute;top:76px;width:138px;height:138px;display:grid;place-items:center;border:2px solid rgba(212,154,53,.9);border-radius:50%;background:linear-gradient(145deg,rgba(55,22,26,.94),rgba(9,13,23,.96)),radial-gradient(circle,rgba(245,223,170,.1),transparent 62%);box-shadow:inset 0 0 0 8px rgba(9,13,23,.68),0 16px 34px rgba(0,0,0,.58)}
    .fantasy-transition-v57__skull{width:78px;height:78px;display:grid;place-items:center;border-radius:50%;border:1px solid rgba(245,223,170,.36);color:rgba(245,223,170,.88);background:rgba(4,7,13,.45);font-size:42px;line-height:1;text-shadow:0 2px 0 rgba(0,0,0,.45)}
    .fantasy-transition-v57__plaque{position:absolute;bottom:28px;min-width:min(292px,calc(100vw - 76px));max-width:calc(100vw - 56px);padding:13px 22px 12px;border:2px solid rgba(116,73,28,.92);border-radius:7px;background:linear-gradient(180deg,rgba(238,211,154,.96),rgba(173,130,73,.96));color:#2b1708;box-shadow:inset 0 0 0 1px rgba(255,246,202,.55),0 12px 26px rgba(0,0,0,.46);text-align:center;transform:translateY(12px);opacity:0;animation:fantasy-plaque-v57 1280ms cubic-bezier(.2,.9,.2,1) both}
    .fantasy-transition-v57__plaque strong{display:block;font-family:Georgia,"Noto Serif TC","Times New Roman",serif;font-size:clamp(1.2rem,7vw,2rem);line-height:1.1;letter-spacing:0}.fantasy-transition-v57__plaque span{display:block;margin-top:4px;font-size:.78rem;color:rgba(43,23,8,.78)}
    .fantasy-transition-v57--battle .fantasy-transition-v57__crest{border-color:rgba(145,35,39,.95)}.fantasy-transition-v57--dm .fantasy-transition-v57__plaque{background:linear-gradient(180deg,rgba(226,203,151,.98),rgba(133,93,48,.98))}.fantasy-transition-v57--rest .fantasy-transition-v57__glow{background:radial-gradient(circle,rgba(65,174,159,.24),transparent 68%)}.fantasy-transition-v57.is-complete{opacity:0;transition:opacity 180ms ease}
    @keyframes fantasy-veil-v57{0%{opacity:0}18%,78%{opacity:1}100%{opacity:0}}@keyframes fantasy-emblem-v57{0%{opacity:0;transform:scale(.82)}20%{opacity:1;transform:scale(1.04)}32%,78%{opacity:1;transform:scale(1)}100%{opacity:0;transform:scale(.97)}}@keyframes fantasy-horn-left-v57{0%{opacity:0;transform:translateX(-24px) rotate(-38deg)}25%,82%{opacity:1;transform:translateX(0) rotate(-32deg)}100%{opacity:0;transform:translateX(-12px) rotate(-32deg)}}@keyframes fantasy-horn-right-v57{0%{opacity:0;transform:translateX(24px) rotate(38deg) scaleX(-1)}25%,82%{opacity:1;transform:translateX(0) rotate(32deg) scaleX(-1)}100%{opacity:0;transform:translateX(12px) rotate(32deg) scaleX(-1)}}@keyframes fantasy-plaque-v57{0%,18%{opacity:0;transform:translateY(12px) scale(.98)}36%,82%{opacity:1;transform:translateY(0) scale(1)}100%{opacity:0;transform:translateY(4px) scale(.99)}}@keyframes fantasy-beam-v57{0%{opacity:0;transform:translateY(-30px)}28%,72%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(8px)}}
    @media(max-width:520px){.fantasy-transition-v57__emblem{width:min(320px,calc(100vw - 24px));min-height:244px}.fantasy-transition-v57__horn{width:106px;height:120px}.fantasy-transition-v57__crest{width:118px;height:118px}.fantasy-transition-v57__skull{width:66px;height:66px;font-size:36px}}
    @media(prefers-reduced-motion:reduce){.fantasy-transition-v57 *,.fantasy-transition-v57{animation:fantasy-reduced-v57 420ms ease both!important;transition-duration:80ms!important}.fantasy-transition-v57__horn,.fantasy-transition-v57__beam,.fantasy-transition-v57__plaque,.fantasy-transition-v57__emblem{transform:none!important}}@keyframes fantasy-reduced-v57{0%{opacity:0}30%,78%{opacity:1}100%{opacity:0}}
  `;
  document.head.appendChild(style);
}

function playFantasyTransitionV57({ title, subtitle, variant, onComplete }) {
  if (fantasyTransitionActiveV57) return;
  FantasyTransitionOverlay({ active: true, title, subtitle, variant, onComplete });
}

function setupFantasyTransitionIntegrationsV57() {
  ensureFantasyTransitionStylesV57();
  document.addEventListener("click", handleFantasyTransitionClicksV57, true);
}

function handleFantasyTransitionClicksV57(event) {
  if (fantasyTransitionActiveV57) { event.preventDefault(); event.stopImmediatePropagation(); return; }
  const shopButton = event.target.closest('[data-tool-v50="shop"]');
  if (shopButton && state.mode === "player" && document.body.dataset.shopOpen !== "true") {
    event.preventDefault(); event.stopImmediatePropagation();
    playFantasyTransitionV57({ title: "商店", subtitle: "翻開旅途補給清單", variant: "shop", onComplete: openShopAfterTransitionV57 });
    return;
  }
  const dmEntry = event.target.closest("#dmEntryV46");
  if (dmEntry && state.mode === "player") {
    event.preventDefault(); event.stopImmediatePropagation();
    handleDmEntryTapWithTransitionV57();
    return;
  }
  const returnPlayer = event.target.closest("#returnPlayerV46");
  if (returnPlayer && state.mode === "dm") {
    event.preventDefault(); event.stopImmediatePropagation();
    playFantasyTransitionV57({ title: "玩家介面", subtitle: "回到隊伍視角", variant: "rest", onComplete: returnPlayerAfterTransitionV57 });
  }
}

function handleDmEntryTapWithTransitionV57() {
  fantasyDmTapCountV57 += 1;
  window.clearTimeout(fantasyDmTapTimerV57);
  if (fantasyDmTapCountV57 >= 3) {
    fantasyDmTapCountV57 = 0;
    playFantasyTransitionV57({ title: "DM 介面", subtitle: "幕後帷幕開啟", variant: "dm", onComplete: enterDmAfterTransitionV57 });
    return;
  }
  fantasyDmTapTimerV57 = window.setTimeout(() => { fantasyDmTapCountV57 = 0; }, 1200);
}

function openShopAfterTransitionV57() {
  document.getElementById("statusReferencePanel")?.classList.remove("is-open");
  document.body.dataset.shopOpen = "true";
  if (typeof renderShopPanelV43 === "function") renderShopPanelV43();
  if (typeof syncToolRailActiveV50 === "function") syncToolRailActiveV50();
}

function enterDmAfterTransitionV57() {
  const entry = document.getElementById("dmEntryV46");
  entry?.classList.add("is-switching");
  document.body.classList.add("is-entering-dm");
  sessionStorage.setItem("dmModeActiveV46", "true");
  state.mode = "dm";
  state.activeTab = state.activeTab && state.activeTab !== "notes" ? state.activeTab : "dashboard";
  document.body.dataset.mode = "dm";
  document.body.dataset.shopOpen = "false";
  document.getElementById("statusReferencePanel")?.classList.remove("is-open");
  persistFantasyTransitionStateV57();
  if (typeof renderMode === "function") renderMode();
  if (typeof render === "function") render();
  entry?.classList.remove("is-switching");
  document.body.classList.remove("is-entering-dm");
}

function returnPlayerAfterTransitionV57() {
  sessionStorage.removeItem("dmModeActiveV46");
  state.mode = "player";
  state.activeTab = "dashboard";
  document.body.dataset.mode = "player";
  document.body.dataset.shopOpen = "false";
  document.getElementById("statusReferencePanel")?.classList.remove("is-open");
  persistFantasyTransitionStateV57();
  if (typeof render === "function") render();
}

function persistFantasyTransitionStateV57() {
  if (typeof save === "function") return save();
  if (typeof saveState === "function") return saveState();
  try { localStorage.setItem(storageKey, JSON.stringify(state)); } catch (error) {}
}

function escapeFantasyTransitionHtmlV57(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]);
}

window.FantasyTransitionOverlay = FantasyTransitionOverlay;
window.playFantasyTransitionV57 = playFantasyTransitionV57;
setupFantasyTransitionIntegrationsV57();
