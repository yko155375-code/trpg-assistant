const storageKey = "trpg-assistant-state-v24";
const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const id = () => crypto.randomUUID ? crypto.randomUUID() : `id-${Date.now()}-${Math.random()}`;
const clamp = (n, a, b) => Math.min(b, Math.max(a, Number(n) || 0));
const esc = (v) => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));

const statuses = [
  ["vulnerable","脆","Vulnerable / 脆弱：所有以你為目標的擲骰具有優勢。"],
  ["restrained","束","Restrained / 受束縛：不能移動，但仍可從目前位置行動。"],
  ["poisoned","毒","Poisoned / 中毒：每次行動時承受 1d10 direct physical damage。"],
  ["cursed","咒","Cursed / 受詛咒：依詛咒效果文字處理與解除。"],
  ["silenced","默","Silenced / 沉默：不能發出聲音，也不能施法。"],
  ["glowing","光","Glowing / 發光：不能 Hidden；對發光目標攻擊具有優勢。"],
  ["taunted","挑","Taunted / 被挑釁：下次攻擊若不是攻擊挑釁者，會有劣勢。"],
  ["enveloped","吞","Enveloped / 被吞沒：做 action roll 時可能額外標記 Stress。"],
  ["drowning","溺","Drowning / 溺水中：通常同時 Restrained 與 Vulnerable。"],
  ["petrifying","石","Petrification Countdown / 石化倒數：倒數觸發時可能進入 death move。"],
  ["unconscious","昏","Unconscious / 昏迷：不能移動、不能行動，也不能被攻擊鎖定。"],
  ["scarred","疤","Scar / 傷疤：永久劃掉 Hope slot；恢復方式與 GM 決定。"],
];

const defaults = {
  mode: "dm", activeTab: "dashboard", playerCharacterId: "", sceneName: "裂牙門入口", fear: 3, hope: 2, round: 0,
  characters: [
    { id: id(), name: "洛恩", hopeDice: 2, stress: 1, armor: 2, hp: 2, evasion: 12, statuses: [] },
    { id: id(), name: "薇薇", hopeDice: 1, stress: 2, armor: 1, hp: 1, evasion: 14, statuses: [] },
  ],
  monsters: [
    { id: id(), name: "裂牙守衛", hp: 5, stress: 1, maxStress: 3, difficulty: 12, attack: "+2", threshold: "8/16", damage: "1d8+2", traits: "守門：阻擋通道並逼迫角色分散。", lastAttack: null, lastDamage: null, lastCrit: false },
    { id: id(), name: "鏡影蟲", hp: 3, stress: 0, maxStress: 2, difficulty: 14, attack: "+3", threshold: "6/12", damage: "1d6+3", traits: "鏡閃：受擊後可短距離位移。", lastAttack: null, lastDamage: null, lastCrit: false },
  ],
  rolls: [], publicNotes: "地面有拖痕。門弧附近的白火燈座被人移動過。", gmNotes: "",
};

function normalize(s) {
  s.characters = (s.characters || []).map(c => ({...c, hopeDice: clamp(c.hopeDice,0,6), stress: clamp(c.stress,0,12), armor: clamp(c.armor,0,12), hp: clamp(c.hp,0,12), statuses: Array.isArray(c.statuses) ? c.statuses : []}));
  s.monsters = (s.monsters || []).map(m => ({difficulty:10, attack:"+0", threshold:"6/12", damage:"1d6", traits:"", lastAttack:null, lastDamage:null, lastCrit:false, maxStress:3, ...m}));
  if (s.activeTab === "notes") s.activeTab = "audio";
  if (!s.playerCharacterId && s.characters[0]) s.playerCharacterId = s.characters[0].id;
  return s;
}

let state = normalize(JSON.parse(localStorage.getItem(storageKey) || "null") || structuredClone(defaults));
let installPrompt = null, audioContext = null, bgmNodes = null;
const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
const set = (p) => { state = {...state, ...p}; save(); render(); };

function stat(label, value, scope, itemId, key, min, max) {
  return `<div class="stat-control"><span>${label}</span><div class="stat-control__row"><button data-scope="${scope}" data-id="${itemId}" data-stat="${key}" data-step="-1" data-min="${min}" data-max="${max}" type="button">−</button><strong>${value}</strong><button data-scope="${scope}" data-id="${itemId}" data-stat="${key}" data-step="1" data-min="${min}" data-max="${max}" type="button">＋</button></div></div>`;
}

function characterCard(c) {
  const active = new Set(c.statuses || []);
  return `<article class="monitor-card"><div class="monitor-card__top"><strong>${esc(c.name)}</strong><div class="monitor-card__meta"><span>閃避值 ${esc(c.evasion)}</span><button class="danger-delete-button" data-delete-character="${c.id}" type="button">刪</button></div></div><div class="stat-grid">${stat("希望骰",c.hopeDice,"character",c.id,"hopeDice",0,6)}${stat("壓力",c.stress,"character",c.id,"stress",0,12)}${stat("護盾槽",c.armor,"character",c.id,"armor",0,12)}${stat("血量",c.hp,"character",c.id,"hp",0,12)}</div><div class="status-row">${statuses.map(([sid,label,tip]) => `<button class="status-token ${active.has(sid) ? "is-active" : ""}" data-character-id="${c.id}" data-status-id="${sid}" title="${esc(tip)}" type="button">${label}</button>`).join("")}</div></article>`;
}

function monsterField(label, m, key) {
  return `<label class="monster-field"><span>${label}</span><input data-monster-field="${key}" data-id="${m.id}" value="${esc(m[key])}" /></label>`;
}

function rollPanel(label, value, crit) {
  return `<div class="monster-roll-panel ${crit && label === "攻擊" ? "is-crit" : ""}"><span>${label}</span><strong>${value ?? "—"}</strong>${crit && label === "攻擊" ? "<em>爆擊</em>" : ""}</div>`;
}

function monsterCard(m) {
  return `<article class="monitor-card monster-card"><div class="monitor-card__top"><strong>${esc(m.name)}</strong><div class="monitor-card__meta"><span>難度 ${esc(m.difficulty)}</span><button class="danger-delete-button" data-delete-monster="${m.id}" type="button">刪</button></div></div><div class="stat-grid">${stat("血量",m.hp,"monster",m.id,"hp",0,9999)}${stat("壓力",m.stress,"monster",m.id,"stress",0,m.maxStress || 99)}${rollPanel("攻擊",m.lastAttack,m.lastCrit)}${rollPanel("傷害",m.lastDamage,m.lastCrit)}</div><div class="monster-detail-grid">${monsterField("難度",m,"difficulty")}${monsterField("攻擊",m,"attack")}${monsterField("閾值",m,"threshold")}${monsterField("傷害",m,"damage")}</div><label class="monster-traits"><span>特性</span><textarea data-monster-traits="${m.id}" rows="2">${esc(m.traits)}</textarea></label></article>`;
}

function render() {
  document.body.dataset.mode = state.mode;
  $$(".mode-switch__button").forEach(b => b.classList.toggle("is-active", b.dataset.mode === state.mode));
  const player = state.mode === "player";
  $(".tabbar").hidden = player; $$(".dm-panel").forEach(p => p.hidden = player); $("#playerPanel").hidden = !player;
  if ($("#sceneNameInput")) $("#sceneNameInput").value = state.sceneName || "未命名場景";
  $("#sceneInput").value = state.sceneName || ""; $("#fearValue").textContent = state.fear; $("#hopeValue").textContent = state.hope; $("#roundCounter").textContent = state.round || 0;
  $("#publicNotes").value = state.publicNotes || ""; $("#gmNotes").value = state.gmNotes || "";
  $("#characterList").innerHTML = state.characters.map(characterCard).join("");
  $("#monsterList").innerHTML = state.monsters.map(monsterCard).join("");
  $("#rollLog").innerHTML = state.rolls.slice(0,12).map(r => `<li><strong>${esc(r.source)}</strong> ${esc(r.formula)} = ${esc(r.total)} <span>${esc(r.detail || "")}</span></li>`).join("");
  const select = $("#playerCharacterSelect"); select.innerHTML = state.characters.map(c => `<option value="${c.id}">${esc(c.name)}</option>`).join("");
  if (!state.characters.some(c => c.id === state.playerCharacterId)) state.playerCharacterId = state.characters[0]?.id || "";
  select.value = state.playerCharacterId;
  const c = state.characters.find(x => x.id === state.playerCharacterId);
  $("#playerCharacterCard").innerHTML = c ? characterCard(c) : `<p class="empty-text">尚未建立角色。</p>`;
  $("#playerSceneName").textContent = state.sceneName || "未命名場景"; $("#playerPublicNotes").textContent = state.publicNotes || "目前沒有公開線索。";
}

function rollFormula(input) {
  const formula = String(input).trim().toLowerCase().replace(/\s+/g, "");
  const terms = formula.match(/[+-]?[^+-]+/g);
  if (!terms || terms.join("") !== formula) throw new Error("請使用像 2d12+3、1d20 或 3d6-1 的格式。");
  let total = 0; const parts = [];
  for (const term of terms) {
    const sign = term[0] === "-" ? -1 : 1, clean = term.replace(/^[+-]/, "");
    const d = clean.match(/^(\d*)d(\d+)$/), n = clean.match(/^\d+$/);
    if (d) for (let i = 0; i < clamp(d[1] || 1,1,20); i++) { const v = Math.floor(Math.random() * clamp(d[2],2,100)) + 1; total += v * sign; parts.push(`${sign < 0 ? "-" : ""}${v}`); }
    else if (n) { total += Number(clean) * sign; parts.push(String(Number(clean) * sign)); }
    else throw new Error("請使用像 2d12+3、1d20 或 3d6-1 的格式。");
  }
  return { formula, total, parts };
}

function maxDice(input) {
  return (String(input).toLowerCase().replace(/\s+/g, "").match(/[+-]?[^+-]+/g) || []).reduce((sum, term) => {
    const sign = term[0] === "-" ? -1 : 1, d = term.replace(/^[+-]/, "").match(/^(\d*)d(\d+)$/);
    return d ? sum + clamp(d[1] || 1,1,20) * clamp(d[2],2,100) * sign : sum;
  }, 0);
}

function mergeFormula(current, token) {
  const dice = new Map(), order = []; let mod = 0;
  (`${current || ""}+${token}`).toLowerCase().replace(/\s+/g, "").match(/[+-]?[^+-]+/g)?.forEach(term => {
    const sign = term[0] === "-" ? -1 : 1, clean = term.replace(/^[+-]/, ""), d = clean.match(/^(\d*)d(\d+)$/);
    if (d) { const side = Number(d[2]); if (!dice.has(side)) { dice.set(side,0); order.push(side); } dice.set(side, dice.get(side) + clamp(d[1] || 1,1,99) * sign); }
    else if (/^\d+$/.test(clean)) mod += Number(clean) * sign;
  });
  const parts = order.filter(s => dice.get(s)).map(s => `${dice.get(s) === 1 ? "" : dice.get(s)}d${s}`);
  if (mod) parts.push(String(mod));
  return parts.join("+").replace(/\+-/g,"-") || token;
}

function showRoll(target, input, source) {
  try { const r = rollFormula(input.value); $(target).innerHTML = `<div><strong>${r.total}</strong><span>${r.formula} · ${r.parts.join(" + ")}</span></div>`; state.rolls.unshift({...r, source, time: Date.now()}); save(); render(); }
  catch (e) { $(target).innerHTML = `<span>${esc(e.message)}</span>`; }
}

function duality() {
  const h = Math.floor(Math.random()*12)+1, f = Math.floor(Math.random()*12)+1, total = h + f;
  $("#dualityResult").innerHTML = `<div class="duality-grid"><div class="${h >= f ? "is-hope-high" : ""}"><span>希望骰</span><strong>${h}</strong></div><div class="${f >= h ? "is-fear-high" : ""}"><span>恐懼骰</span><strong>${f}</strong></div><div><span>總和</span><strong>${total}</strong></div></div>`;
  state.rolls.unshift({source:"DM", formula:"二元骰子", total, detail:`(希望 ${h}, 恐懼 ${f})`, time:Date.now()}); save(); render();
}

function nextRound() {
  const logs = []; state.round = (state.round || 0) + 1;
  state.monsters = state.monsters.map(m => {
    const d20 = Math.floor(Math.random()*20)+1, atk = /^[+-]?\d+$/.test(m.attack) ? Number(m.attack) : 0, crit = d20 === 20;
    let dmg = "公式錯誤", detail = String(m.damage || "");
    try { const r = rollFormula(m.damage || "1d6"); const bonus = crit ? maxDice(m.damage || "1d6") : 0; dmg = r.total + bonus; detail = crit ? `(${r.parts.join(" + ")} + 滿擲 ${bonus})` : `(${r.parts.join(" + ")})`; } catch {}
    logs.push({source:m.name, formula:`攻擊 1d20${atk >= 0 ? "+" : ""}${atk}`, total:d20+atk, detail:`(d20 ${d20}${crit ? ", 爆擊" : ""})`});
    logs.push({source:m.name, formula:`傷害 ${m.damage || "1d6"}`, total:dmg, detail});
    return {...m, lastAttack:d20+atk, lastDamage:dmg, lastCrit:crit};
  });
  state.rolls = [...logs, ...state.rolls]; save(); render();
}

function playBgm(kind) {
  const ctx = audioContext ||= new AudioContext(); if (bgmNodes) bgmNodes.forEach(n => n.stop());
  const gain = ctx.createGain(); gain.gain.value = .045; gain.connect(ctx.destination);
  const a = ctx.createOscillator(), b = ctx.createOscillator(); a.type = "sine"; b.type = kind === "tension" ? "sawtooth" : "triangle"; a.frequency.value = kind === "tension" ? 92 : 65; b.frequency.value = a.frequency.value * 1.5; a.connect(gain); b.connect(gain); a.start(); b.start(); bgmNodes = [a,b]; $("#audioStatus").textContent = kind === "tension" ? "背景：緊張" : "背景：探索";
}
function stopBgm(){ if (bgmNodes) bgmNodes.forEach(n => n.stop()); bgmNodes = null; $("#audioStatus").textContent = "未播放"; }
function sfx(kind){ const ctx = audioContext ||= new AudioContext(), o = ctx.createOscillator(), g = ctx.createGain(), now = ctx.currentTime; const cfg = {reveal:["triangle",520,840,.28],hit:["square",130,60,.18],danger:["sawtooth",220,170,.45]}[kind]; o.type=cfg[0]; o.frequency.setValueAtTime(cfg[1],now); o.frequency.exponentialRampToValueAtTime(cfg[2],now+cfg[3]); g.gain.setValueAtTime(.001,now); g.gain.exponentialRampToValueAtTime(.12,now+.02); g.gain.exponentialRampToValueAtTime(.001,now+cfg[3]); o.connect(g); g.connect(ctx.destination); o.start(now); o.stop(now+cfg[3]+.03); }

function bind() {
  $$(".mode-switch__button").forEach(b => b.onclick = () => set({mode:b.dataset.mode}));
  $$(".tabbar__button").forEach(b => b.onclick = () => { $$(".tabbar__button").forEach(x => x.classList.toggle("is-active", x === b)); $$(".tab-panel").forEach(p => p.classList.toggle("is-active", p.id === b.dataset.tab)); set({activeTab:b.dataset.tab}); });
  document.onclick = (e) => {
    const statBtn = e.target.closest("[data-scope][data-id][data-stat]"); if (statBtn) { const arr = statBtn.dataset.scope === "monster" ? "monsters" : "characters"; state[arr] = state[arr].map(x => x.id === statBtn.dataset.id ? {...x, [statBtn.dataset.stat]: clamp(Number(x[statBtn.dataset.stat]) + Number(statBtn.dataset.step), statBtn.dataset.min, statBtn.dataset.max)} : x); save(); render(); return; }
    const delC = e.target.closest("[data-delete-character]"); if (delC) { const c = state.characters.find(x => x.id === delC.dataset.deleteCharacter); if (c && confirm(`確定要刪除玩家「${c.name}」？這個動作不能復原。`)) { state.characters = state.characters.filter(x => x.id !== c.id); save(); render(); } return; }
    const delM = e.target.closest("[data-delete-monster]"); if (delM) { const m = state.monsters.find(x => x.id === delM.dataset.deleteMonster); if (m && confirm(`確定要刪除怪物「${m.name}」？這個動作不能復原。`)) { state.monsters = state.monsters.filter(x => x.id !== m.id); save(); render(); } return; }
    const st = e.target.closest("[data-status-id]"); if (st) { state.characters = state.characters.map(c => { if (c.id !== st.dataset.characterId) return c; const set = new Set(c.statuses || []); set.has(st.dataset.statusId) ? set.delete(st.dataset.statusId) : set.add(st.dataset.statusId); return {...c, statuses:[...set]}; }); save(); render(); return; }
    const ctr = e.target.closest("[data-counter]"); if (ctr) set({[ctr.dataset.counter]: clamp(state[ctr.dataset.counter] + Number(ctr.dataset.step), 0, ctr.dataset.counter === "fear" ? 12 : 20)});
    const die = e.target.closest("[data-formula]"); if (die) { $("#diceFormula").value = mergeFormula($("#diceFormula").value, die.dataset.formula); $("#diceFormula").focus(); }
    const pDie = e.target.closest("[data-player-formula]"); if (pDie) { $("#playerDiceFormula").value = pDie.dataset.playerFormula; $("#playerRollButton").click(); }
    const bgm = e.target.closest("[data-bgm]"); if (bgm) playBgm(bgm.dataset.bgm);
    const fx = e.target.closest("[data-sfx]"); if (fx) sfx(fx.dataset.sfx);
  };
  document.oninput = (e) => { const mf = e.target.closest("[data-monster-field]"); const mt = e.target.closest("[data-monster-traits]"); if (mf || mt) { const mid = mf?.dataset.id || mt.dataset.monsterTraits, key = mf?.dataset.monsterField || "traits"; state.monsters = state.monsters.map(m => m.id === mid ? {...m, [key]: e.target.value} : m); save(); } };
  $("#characterForm").onsubmit = e => { e.preventDefault(); const name=$("#characterName").value.trim(); if(!name)return; const c={id:id(), name, evasion:clamp($("#characterEvasion").value||10,1,99), hopeDice:0, stress:0, armor:0, hp:0, statuses:[]}; state.characters.push(c); state.playerCharacterId ||= c.id; e.target.reset(); save(); render(); };
  $("#monsterForm").onsubmit = e => { e.preventDefault(); const name=$("#monsterName").value.trim(); if(!name)return; const stress=clamp($("#monsterStress").value,0,99); state.monsters.push({id:id(), name, hp:clamp($("#monsterHp").value||1,1,9999), stress, maxStress:Math.max(stress,3), difficulty:clamp($("#monsterDifficulty").value||10,1,99), attack:$("#monsterAttack").value.trim()||"+0", threshold:$("#monsterThreshold").value.trim()||"6/12", damage:$("#monsterDamage").value.trim()||"1d6", traits:"", lastAttack:null, lastDamage:null, lastCrit:false}); e.target.reset(); save(); render(); };
  $("#dualityRollButton").onclick = duality; $("#nextRoundButton").onclick = nextRound; $("#rollButton").onclick = () => showRoll("#rollResult", $("#diceFormula"), "DM"); $("#addFormulaOneButton").onclick = () => $("#diceFormula").value = mergeFormula($("#diceFormula").value, "1"); $("#clearFormulaButton").onclick = () => { $("#diceFormula").value = ""; $("#diceFormula").focus(); };
  $("#playerRollButton").onclick = () => showRoll("#playerRollResult", $("#playerDiceFormula"), state.characters.find(c=>c.id===state.playerCharacterId)?.name || "玩家"); $("#clearRollsButton").onclick = () => set({rolls:[]}); $("#stopBgmButton").onclick = stopBgm;
  $("#sceneInput").oninput = e => set({sceneName:e.target.value}); $("#sceneNameInput").oninput = e => set({sceneName:e.target.value}); $("#publicNotes").oninput = e => set({publicNotes:e.target.value}); $("#gmNotes").oninput = e => set({gmNotes:e.target.value}); $("#playerCharacterSelect").onchange = e => set({playerCharacterId:e.target.value});
  $("#installButton").onclick = async () => { if (!installPrompt) return; installPrompt.prompt(); await installPrompt.userChoice; installPrompt = null; $("#installButton").hidden = true; };
}

window.addEventListener("beforeinstallprompt", e => { e.preventDefault(); installPrompt = e; $("#installButton").hidden = false; });
if ("serviceWorker" in navigator) window.addEventListener("load", () => navigator.serviceWorker.register("sw.js"));
bind(); render(); const active = $(`.tabbar__button[data-tab="${state.activeTab}"]`); if (active) active.click();
