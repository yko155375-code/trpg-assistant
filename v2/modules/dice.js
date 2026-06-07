function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function rollDie(sides) {
  return Math.floor(Math.random() * sides) + 1;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function clamp(number, min, max = Infinity) {
  return Math.min(max, Math.max(min, number));
}

function parseFormulaTerm(token) {
  const sign = token.startsWith("-") ? -1 : 1;
  const body = token.replace(/^[+-]/, "");
  const diceMatch = body.match(/^(\d*)d(\d+)$/);
  if (diceMatch) {
    const count = Number(diceMatch[1] || 1);
    const sides = Number(diceMatch[2]);
    if (!Number.isInteger(count) || !Number.isInteger(sides) || count < 1 || count > 50 || sides < 2 || sides > 1000) return { ok: false };
    return { ok: true, type: "dice", sign, count, sides };
  }
  if (/^\d+$/.test(body)) return { ok: true, type: "modifier", value: sign * Number(body) };
  return { ok: false };
}

function tokenizeFormula(formula) {
  const normalized = String(formula || "").replace(/\s+/g, "").toLowerCase();
  if (!normalized) return { ok: true, terms: [], normalized };
  const tokens = normalized.match(/[+-]?(\d*d\d+|\d+)/g) || [];
  if (tokens.join("") !== normalized) return { ok: false, terms: [], normalized };
  const terms = [];
  for (const token of tokens) {
    const parsed = parseFormulaTerm(token);
    if (!parsed.ok) return { ok: false, terms: [], normalized };
    terms.push(parsed);
  }
  return { ok: true, terms, normalized };
}

function summarizeFormulaTerms(terms) {
  const diceCounts = new Map();
  let modifier = 0;
  let diceCount = 0;
  for (const term of terms) {
    if (term.type === "modifier") {
      modifier += term.value;
    } else {
      diceCount += term.count;
      diceCounts.set(term.sides, (diceCounts.get(term.sides) || 0) + term.sign * term.count);
    }
  }
  return { diceCounts, modifier, diceCount };
}

function appendSignedTerm(segments, term, sign = 1) {
  segments.push(sign < 0 ? `-${term}` : segments.length ? `+${term}` : term);
}

function formatFormulaSummary(summary) {
  const segments = [];
  for (const [sides, count] of Array.from(summary.diceCounts.entries()).sort((a, b) => a[0] - b[0])) {
    if (!count) continue;
    const abs = Math.abs(count);
    appendSignedTerm(segments, abs === 1 ? `d${sides}` : `${abs}d${sides}`, count < 0 ? -1 : 1);
  }
  if (summary.modifier) appendSignedTerm(segments, String(Math.abs(summary.modifier)), summary.modifier < 0 ? -1 : 1);
  return segments.join("");
}

function appendRawFormulaToken(current, nextToken) {
  if (!current) return nextToken.startsWith("+") ? nextToken.slice(1) : nextToken;
  return /^[+-]/.test(nextToken) ? `${current}${nextToken}` : `${current}+${nextToken}`;
}

export function appendFormulaToken(formula, token) {
  const current = String(formula || "").replace(/\s+/g, "").toLowerCase();
  const nextToken = String(token || "").replace(/\s+/g, "").toLowerCase();
  if (!nextToken) return current;
  const candidate = appendRawFormulaToken(current, nextToken);
  const parsed = tokenizeFormula(candidate);
  return parsed.ok ? formatFormulaSummary(summarizeFormulaTerms(parsed.terms)) : candidate;
}

export function rollFormula(formula) {
  const parsed = tokenizeFormula(formula);
  if (!parsed.normalized || !parsed.ok) return { ok: false, error: "公式格式錯誤，請使用像 1d20、2d12、1d6+2、2d8-1 的格式。" };
  const summary = summarizeFormulaTerms(parsed.terms);
  if (!summary.diceCount) return { ok: false, error: "公式需要至少一顆骰子，例如 1d20。" };
  if (summary.diceCount > 100) return { ok: false, error: "一次最多擲 100 顆骰子。" };
  const dice = [];
  const terms = [];
  let modifier = 0;
  for (const term of parsed.terms) {
    if (term.type === "modifier") {
      modifier += term.value;
      terms.push({ type: "modifier", value: term.value });
    } else {
      const results = Array.from({ length: term.count }, () => rollDie(term.sides));
      dice.push(...results.map((value) => term.sign * value));
      terms.push({ type: "dice", sign: term.sign, count: term.count, sides: term.sides, results });
    }
  }
  return { ok: true, type: "formula", formula: formatFormulaSummary(summary) || parsed.normalized, dice, terms, modifier, total: dice.reduce((sum, value) => sum + value, 0) + modifier, time: new Date().toISOString() };
}

export function rollDuality(options = {}) {
  const target = Number(options.target);
  const hasTarget = Number.isFinite(target) && target > 0;
  const hope = rollDie(12);
  const fear = rollDie(12);
  const tie = hope === fear;
  const total = hope + fear;
  const higher = tie ? "同值" : hope > fear ? "希望" : "恐懼";
  const success = hasTarget ? total >= target : null;
  let outcome = "未判定";
  let outcomeClass = higher === "希望" ? "hope" : "fear";
  let prompt = "";
  let hopeDelta = 0;
  let stressDelta = 0;
  let fearDelta = 0;
  if (tie) {
    outcome = "關鍵成功";
    outcomeClass = "critical";
    hopeDelta = 1;
    stressDelta = -1;
    prompt = "攻擊造成額外傷害：先加入傷害骰可擲出的最高值，再照常擲傷害骰。";
  } else if (hasTarget && success && hope > fear) {
    outcome = "希望成功";
    hopeDelta = 1;
  } else if (hasTarget && success && fear > hope) {
    outcome = "恐懼成功";
    fearDelta = 1;
  } else if (hasTarget && !success && hope > fear) {
    outcome = "希望失敗";
    hopeDelta = 1;
    prompt = "會有其他後果發生，但你獲得 1 希望點。";
  } else if (hasTarget && !success && fear > hope) {
    outcome = "恐懼失敗";
    fearDelta = 1;
    prompt = "引發嚴重後果或複雜情況。GM 獲得 1 恐懼點。";
  } else if (hope > fear) {
    hopeDelta = 1;
    prompt = "未設定目標值，只判定希望較高：目前角色希望 +1。";
  } else {
    fearDelta = 1;
    prompt = "未設定目標值，只判定恐懼較高：GM 恐懼 +1。";
  }
  return { ok: true, type: "duality", formula: hasTarget ? `希望 d12 + 恐懼 d12 vs ${target}` : "希望 d12 + 恐懼 d12", hope, fear, higher, tie, target: hasTarget ? target : null, success, outcome, outcomeClass, prompt, effects: { hopeDelta, stressDelta, fearDelta }, total, time: new Date().toISOString() };
}

export function applyDualityEffects(state, roll) {
  if (!roll?.ok || roll.type !== "duality") return { state, roll };
  const effects = [];
  let nextState = { ...state };
  const characters = Array.isArray(nextState.characters) ? nextState.characters : [];
  const characterId = nextState.ui?.currentCharacterId;
  const currentCharacter = characters.find((character) => character.id === characterId);
  const hopeDelta = Number(roll.effects?.hopeDelta || 0);
  const stressDelta = Number(roll.effects?.stressDelta || 0);
  const fearDelta = Number(roll.effects?.fearDelta || 0);
  if ((hopeDelta || stressDelta) && currentCharacter) {
    nextState = { ...nextState, characters: characters.map((character) => character.id === currentCharacter.id ? { ...character, stats: { ...(character.stats || {}), hope: clamp(toNumber(character.stats?.hope) + hopeDelta, 0, 6), stress: clamp(toNumber(character.stats?.stress) + stressDelta, 0, clamp(toNumber(character.stats?.maxStress, 6), 1)) } } : character) };
    if (hopeDelta) effects.push(`hope ${hopeDelta > 0 ? "+" : ""}${hopeDelta}`);
    if (stressDelta) effects.push(`stress ${stressDelta > 0 ? "+" : ""}${stressDelta}`);
  } else if (hopeDelta || stressDelta) {
    effects.push("沒有選擇角色，未套用 hope / stress。");
  }
  if (fearDelta) {
    nextState = { ...nextState, session: { ...(nextState.session || {}), fear: clamp(toNumber(nextState.session?.fear) + fearDelta, 0, 12) } };
    effects.push(`fear ${fearDelta > 0 ? "+" : ""}${fearDelta}`);
  }
  if (roll.outcomeClass === "critical") nextState = { ...nextState, ui: { ...(nextState.ui || {}), isCriticalDamageRoll: true } };
  return { state: nextState, roll: { ...roll, characterId: currentCharacter?.id || null, characterName: currentCharacter?.name || null, appliedEffects: effects } };
}

function getMaxDiceDamage(roll) {
  return (Array.isArray(roll.terms) ? roll.terms : []).reduce((sum, term) => term.type === "dice" && term.sign > 0 ? sum + term.count * term.sides : sum, 0);
}

function applyCriticalDamageFormula(roll) {
  const maxDiceDamage = getMaxDiceDamage(roll);
  const normalRollTotal = Array.isArray(roll.dice) ? roll.dice.reduce((sum, value) => sum + value, 0) : 0;
  const modifierTotal = toNumber(roll.modifier);
  if (!maxDiceDamage) return { ...roll, criticalDamage: true, isCriticalDamageRoll: true, criticalDamageSkipped: true, note: "關鍵成功傷害骰", criticalDamageMessage: "此公式沒有可計算滿骰傷害的骰子，未套用額外滿骰傷害。" };
  const totalDamage = maxDiceDamage + normalRollTotal + modifierTotal;
  return { ...roll, criticalDamage: true, isCriticalDamageRoll: true, maxDiceDamage, normalRollTotal, modifierTotal, totalDamage, total: totalDamage, note: "關鍵成功傷害骰" };
}

export function addRoll(state, roll, actor = "玩家") {
  if (!roll.ok) return state;
  const applied = roll.type === "duality" ? applyDualityEffects(state, roll) : { state, roll };
  const isCriticalDamageRoll = Boolean(applied.state.ui?.isCriticalDamageRoll) && applied.roll.type === "formula";
  const nextState = isCriticalDamageRoll ? { ...applied.state, ui: { ...applied.state.ui, isCriticalDamageRoll: false } } : applied.state;
  const nextRoll = isCriticalDamageRoll ? applyCriticalDamageFormula(applied.roll) : applied.roll;
  return { ...nextState, rolls: [{ id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, actor, ...nextRoll }, ...(Array.isArray(nextState.rolls) ? nextState.rolls : [])].slice(0, 80) };
}

export function clearRolls(state) {
  return { ...state, rolls: [] };
}

function renderQuickDiceButtons() {
  const tokens = ["d2", "d4", "d6", "d8", "d10", "d12", "d20", "d100"];
  return `<div class="quick-dice-row" aria-label="快速骰">${tokens.map((token) => `<button type="button" data-action="append-roll-token" data-roll-token="${token}">${token}</button>`).join("")}</div>`;
}

export function renderDicePanel(state, options = {}) {
  const { actor = "玩家", title = "擲骰" } = options;
  const actorKey = actor === "DM" ? "DM" : "player";
  const formulaDraft = state.ui?.rollFormulaDrafts?.[actorKey] || "";
  const isCriticalDamageRoll = Boolean(state.ui?.isCriticalDamageRoll);
  return `<section class="editor-panel dice-panel"><div class="editor-heading"><h3>${escapeHtml(title)}</h3><button class="danger-button" type="button" data-action="clear-rolls">清空紀錄</button></div><form class="inline-form" data-roll-form data-roll-actor="${escapeHtml(actorKey)}"><label class="form-field"><span>擲骰公式</span><span class="roll-formula-input-row"><input data-roll-formula type="text" placeholder="例如 1d20、2d8-1" autocomplete="off" value="${escapeHtml(formulaDraft)}" /><span class="roll-modifier-buttons"><button type="button" data-action="append-roll-token" data-roll-token="-1">-1</button><button type="button" data-action="append-roll-token" data-roll-token="+1">+1</button></span></span></label><button class="primary-button" type="submit">擲骰</button></form>${isCriticalDamageRoll ? `<p class="critical-damage-banner">目前為關鍵成功傷害骰：這次公式擲骰會標記為 critical damage roll。</p>` : ""}${renderQuickDiceButtons()}<button class="primary-button full-width-button" type="button" data-action="roll-duality" data-roll-actor="${escapeHtml(actorKey)}">二元骰：希望 / 恐懼</button><p class="form-message" data-roll-message></p>${renderRollHistory(state)}</section>`;
}

function renderDualityRollDetails(roll) {
  const effectText = Array.isArray(roll.appliedEffects) && roll.appliedEffects.length ? roll.appliedEffects.join("、") : "無自動套用";
  return `<p class="duality-result-line"><span class="duality-die hope">希望 ${roll.hope}</span><span class="duality-die fear">恐懼 ${roll.fear}</span><span class="duality-outcome ${escapeHtml(roll.outcomeClass || "")}">${escapeHtml(roll.outcome || "未判定")}</span></p><p>較高者：${escapeHtml(roll.higher)}${roll.target ? `，目標值 ${roll.target}` : "，未設定目標值"}；套用：${escapeHtml(effectText)}</p>${roll.prompt ? `<p class="roll-note">${escapeHtml(roll.prompt)}</p>` : ""}`;
}

function renderFormulaRollDetails(roll) {
  const diceText = (roll.dice || []).join("、");
  const edge = roll.edgeBreakdown ? `<p class="roll-note">${roll.edgeBreakdown.mode === "advantage" ? "優勢骰" : "劣勢骰"}：${roll.edgeBreakdown.mode === "advantage" ? "+" : "-"}${roll.edgeBreakdown.die}；原結果 ${roll.edgeBreakdown.baseTotal}；最終 ${roll.edgeBreakdown.finalTotal}</p>` : "";
  if (roll.criticalDamage && !roll.criticalDamageSkipped) return `<p>骰面：${diceText}${roll.modifier ? `，修正：${roll.modifier}` : ""}</p>${edge}<p class="roll-note critical">critical damage roll：關鍵成功傷害骰。</p><p class="roll-note critical">公式：${escapeHtml(roll.formula)}｜滿骰傷害：${roll.maxDiceDamage}｜正常擲骰：${roll.normalRollTotal}｜固定修正：${roll.modifierTotal}｜總傷害：${roll.totalDamage}</p>`;
  return `<p>骰面：${diceText}${roll.modifier ? `，修正：${roll.modifier}` : ""}</p>${edge}${roll.criticalDamage ? `<p class="roll-note critical">critical damage roll：關鍵成功傷害骰。${roll.criticalDamageMessage ? ` ${escapeHtml(roll.criticalDamageMessage)}` : ""}</p>` : ""}`;
}

export function renderRollHistory(state) {
  const rolls = Array.isArray(state.rolls) ? state.rolls : [];
  if (!rolls.length) return `<section class="empty-panel"><strong>尚無擲骰紀錄</strong><p>擲骰後會在這裡顯示最新結果。</p></section>`;
  return `<section class="roll-history" aria-label="擲骰紀錄">${rolls.map((roll) => { const rollClass = roll.type === "duality" ? `roll-card-duality ${escapeHtml(roll.outcomeClass || "")}` : roll.criticalDamage ? "roll-card-critical-damage" : ""; return `<article class="roll-card ${rollClass}"><div class="roll-card-main"><strong>${escapeHtml(roll.actor || "未知")}</strong><span>${escapeHtml(roll.formula)}</span><b>${roll.total}</b></div>${roll.type === "duality" ? renderDualityRollDetails(roll) : renderFormulaRollDetails(roll)}<time>${new Date(roll.time).toLocaleString("zh-TW")}</time></article>`; }).join("")}</section>`;
}
