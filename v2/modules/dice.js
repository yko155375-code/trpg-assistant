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
    if (!Number.isInteger(count) || !Number.isInteger(sides) || count < 1 || count > 50 || sides < 2 || sides > 1000) {
      return { ok: false, error: "骰數必須為 1-50，骰面必須為 2-1000。" };
    }
    return { ok: true, type: "dice", sign, count, sides };
  }

  if (/^\d+$/.test(body)) {
    return { ok: true, type: "modifier", value: sign * Number(body) };
  }

  return { ok: false, error: "公式格式錯誤，請使用像 1d20、2d12、1d6+2、2d8-1 的格式。" };
}

function tokenizeFormula(formula) {
  const normalized = String(formula || "").replace(/\s+/g, "").toLowerCase();
  if (!normalized) return { ok: true, terms: [], normalized };

  const tokens = normalized.match(/[+-]?(\d*d\d+|\d+)/g) || [];
  if (tokens.join("") !== normalized) {
    return { ok: false, terms: [], normalized };
  }

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
      continue;
    }

    diceCount += term.count;
    diceCounts.set(term.sides, (diceCounts.get(term.sides) || 0) + term.sign * term.count);
  }

  return { diceCounts, modifier, diceCount };
}

function appendSignedTerm(segments, term, sign = 1) {
  if (sign < 0) {
    segments.push(`-${term}`);
    return;
  }
  segments.push(segments.length ? `+${term}` : term);
}

function formatFormulaSummary(summary) {
  const segments = [];
  const sortedDice = Array.from(summary.diceCounts.entries()).sort((a, b) => a[0] - b[0]);

  for (const [sides, count] of sortedDice) {
    if (!count) continue;
    const absoluteCount = Math.abs(count);
    const term = absoluteCount === 1 ? `d${sides}` : `${absoluteCount}d${sides}`;
    appendSignedTerm(segments, term, count < 0 ? -1 : 1);
  }

  if (summary.modifier) {
    appendSignedTerm(segments, String(Math.abs(summary.modifier)), summary.modifier < 0 ? -1 : 1);
  }

  return segments.join("");
}

function appendRawFormulaToken(current, nextToken) {
  if (!current) {
    return nextToken.startsWith("+") ? nextToken.slice(1) : nextToken;
  }
  return /^[+-]/.test(nextToken) ? `${current}${nextToken}` : `${current}+${nextToken}`;
}

export function appendFormulaToken(formula, token) {
  const current = String(formula || "").replace(/\s+/g, "").toLowerCase();
  const nextToken = String(token || "").replace(/\s+/g, "").toLowerCase();
  if (!nextToken) return current;

  const candidate = appendRawFormulaToken(current, nextToken);
  const parsed = tokenizeFormula(candidate);
  if (!parsed.ok) return candidate;

  return formatFormulaSummary(summarizeFormulaTerms(parsed.terms));
}

export function rollFormula(formula) {
  const parsed = tokenizeFormula(formula);
  if (!parsed.normalized || !parsed.ok) {
    return { ok: false, error: "公式格式錯誤，請使用像 1d20、2d12、1d6+2、2d8-1 的格式。" };
  }

  const summary = summarizeFormulaTerms(parsed.terms);
  if (!summary.diceCount) {
    return { ok: false, error: "公式至少需要包含一個骰子，例如 1d20。" };
  }
  if (summary.diceCount > 100) return { ok: false, error: "單次擲骰最多 100 顆骰子。" };

  const dice = [];
  const terms = [];
  let modifier = 0;

  for (const term of parsed.terms) {
    if (term.type === "modifier") {
      modifier += term.value;
      terms.push({ type: "modifier", value: term.value });
      continue;
    }

    const results = Array.from({ length: term.count }, () => rollDie(term.sides));
    dice.push(...results.map((value) => term.sign * value));
    terms.push({ type: "dice", sign: term.sign, count: term.count, sides: term.sides, results });
  }

  const diceTotal = dice.reduce((sum, value) => sum + value, 0);

  return {
    ok: true,
    type: "formula",
    formula: formatFormulaSummary(summary) || parsed.normalized,
    dice,
    terms,
    modifier,
    total: diceTotal + modifier,
    time: new Date().toISOString(),
  };
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
    prompt = "尚未設定目標值，先記錄希望較高並套用希望 +1。";
  } else {
    fearDelta = 1;
    prompt = "尚未設定目標值，先記錄恐懼較高並套用 GM 恐懼 +1。";
  }

  return {
    ok: true,
    type: "duality",
    formula: hasTarget ? `希望 d12 + 恐懼 d12 vs ${target}` : "希望 d12 + 恐懼 d12",
    hope,
    fear,
    higher,
    tie,
    target: hasTarget ? target : null,
    success,
    outcome,
    outcomeClass,
    prompt,
    effects: { hopeDelta, stressDelta, fearDelta },
    total,
    time: new Date().toISOString(),
  };
}

export function applyDualityEffects(state, roll) {
  if (!roll?.ok || roll.type !== "duality") return { state, roll };

  const effects = [];
  let nextState = { ...state };
  const characters = Array.isArray(nextState.characters) ? nextState.characters : [];
  const characterId = nextState.ui?.currentCharacterId;
  const currentCharacter = characters.find((character) => character.id === characterId);
  const hopeDelta = toNumber(roll.effects?.hopeDelta);
  const stressDelta = toNumber(roll.effects?.stressDelta);
  const fearDelta = toNumber(roll.effects?.fearDelta);

  if ((hopeDelta || stressDelta) && currentCharacter) {
    nextState = {
      ...nextState,
      characters: characters.map((character) => {
        if (character.id !== currentCharacter.id) return character;
        const stats = character.stats || {};
        const maxStress = clamp(toNumber(stats.maxStress, 6), 1);
        return {
          ...character,
          stats: {
            ...stats,
            hope: clamp(toNumber(stats.hope) + hopeDelta, 0),
            stress: clamp(toNumber(stats.stress) + stressDelta, 0, maxStress),
          },
        };
      }),
    };
    if (hopeDelta) effects.push(`hope ${hopeDelta > 0 ? "+" : ""}${hopeDelta}`);
    if (stressDelta) effects.push(`stress ${stressDelta > 0 ? "+" : ""}${stressDelta}`);
  } else if (hopeDelta || stressDelta) {
    effects.push("未選擇角色：未套用角色 hope / stress 效果");
  }

  if (fearDelta) {
    nextState = {
      ...nextState,
      session: {
        ...(nextState.session || {}),
        fear: clamp(toNumber(nextState.session?.fear) + fearDelta, 0),
      },
    };
    effects.push(`fear ${fearDelta > 0 ? "+" : ""}${fearDelta}`);
  }

  if (roll.outcomeClass === "critical") {
    nextState = {
      ...nextState,
      ui: {
        ...(nextState.ui || {}),
        isCriticalDamageRoll: true,
      },
    };
  }

  return {
    state: nextState,
    roll: {
      ...roll,
      characterId: currentCharacter?.id || null,
      characterName: currentCharacter?.name || null,
      appliedEffects: effects,
    },
  };
}

export function addRoll(state, roll, actor = "玩家") {
  if (!roll.ok) return state;
  const applied = roll.type === "duality" ? applyDualityEffects(state, roll) : { state, roll };
  const isCriticalDamageRoll = Boolean(applied.state.ui?.isCriticalDamageRoll) && applied.roll.type === "formula";
  const nextState = isCriticalDamageRoll
    ? { ...applied.state, ui: { ...applied.state.ui, isCriticalDamageRoll: false } }
    : applied.state;
  const nextRoll = isCriticalDamageRoll
    ? { ...applied.roll, criticalDamage: true, note: "關鍵成功傷害骰" }
    : applied.roll;
  return {
    ...nextState,
    rolls: [
      { id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, actor, ...nextRoll },
      ...(Array.isArray(nextState.rolls) ? nextState.rolls : []),
    ].slice(0, 80),
  };
}

export function clearRolls(state) {
  return { ...state, rolls: [] };
}

function renderQuickDiceButtons() {
  const tokens = ["d2", "d4", "d6", "d8", "d10", "d12", "d20", "d100", "+1", "-1"];
  return `
    <div class="quick-dice-row" aria-label="快速加入擲骰公式">
      ${tokens.map((token) => `<button type="button" data-action="append-roll-token" data-roll-token="${token}">${token}</button>`).join("")}
    </div>
  `;
}

export function renderDicePanel(state, options = {}) {
  const { actor = "玩家", title = "擲骰" } = options;
  const isCriticalDamageRoll = Boolean(state.ui?.isCriticalDamageRoll);
  return `
    <section class="editor-panel dice-panel">
      <div class="editor-heading"><h3>${title}</h3><button class="danger-button" type="button" data-action="clear-rolls">清空紀錄</button></div>
      <form class="inline-form" data-roll-form data-roll-actor="${escapeHtml(actor)}">
        <label class="form-field"><span>擲骰公式</span><input data-roll-formula type="text" placeholder="例如 1d20、2d8-1" autocomplete="off" /></label>
        <button class="primary-button" type="submit">擲骰</button>
      </form>
      ${isCriticalDamageRoll ? `<p class="critical-damage-banner">目前為關鍵成功傷害骰：這次公式擲骰會標記為 critical damage roll。</p>` : ""}
      ${renderQuickDiceButtons()}
      <button class="primary-button full-width-button" type="button" data-action="roll-duality" data-roll-actor="${escapeHtml(actor)}">二元骰：希望 / 恐懼</button>
      <p class="form-message" data-roll-message></p>
      ${renderRollHistory(state)}
    </section>`;
}

function renderDualityRollDetails(roll) {
  const effectText = Array.isArray(roll.appliedEffects) && roll.appliedEffects.length ? roll.appliedEffects.join("、") : "無自動效果";
  return `
    <p class="duality-result-line">
      <span class="duality-die hope">希望 ${roll.hope}</span>
      <span class="duality-die fear">恐懼 ${roll.fear}</span>
      <span class="duality-outcome ${escapeHtml(roll.outcomeClass || "")}">${escapeHtml(roll.outcome || "未判定")}</span>
    </p>
    <p>較高：${escapeHtml(roll.higher)}${roll.target ? `，目標值：${roll.target}` : "，未設定目標值"}。自動效果：${escapeHtml(effectText)}</p>
    ${roll.prompt ? `<p class="roll-note">${escapeHtml(roll.prompt)}</p>` : ""}
  `;
}

function renderFormulaRollDetails(roll) {
  const diceText = (roll.dice || []).join("、");
  return `
    <p>骰面：${diceText}${roll.modifier ? `，修正：${roll.modifier}` : ""}</p>
    ${roll.criticalDamage ? `<p class="roll-note critical">critical damage roll：關鍵成功傷害骰。</p>` : ""}
  `;
}

export function renderRollHistory(state) {
  const rolls = Array.isArray(state.rolls) ? state.rolls : [];
  if (!rolls.length) return `<section class="empty-panel"><strong>尚無擲骰紀錄</strong><p>擲骰後會自動保存在這裡。</p></section>`;
  return `<section class="roll-history" aria-label="擲骰紀錄">${rolls
    .map((roll) => {
      const rollClass = roll.type === "duality" ? `roll-card-duality ${escapeHtml(roll.outcomeClass || "")}` : roll.criticalDamage ? "roll-card-critical-damage" : "";
      return `<article class="roll-card ${rollClass}"><div class="roll-card-main"><strong>${escapeHtml(roll.actor || "未知")}</strong><span>${escapeHtml(roll.formula)}</span><b>${roll.total}</b></div>${roll.type === "duality" ? renderDualityRollDetails(roll) : renderFormulaRollDetails(roll)}<time>${new Date(roll.time).toLocaleString("zh-TW")}</time></article>`;
    })
    .join("")}</section>`;
}

if (typeof document !== "undefined" && !document.documentElement.dataset.v2DiceQuickButtons) {
  document.documentElement.dataset.v2DiceQuickButtons = "true";
  document.addEventListener("click", (event) => {
    const button = event.target.closest('[data-action="append-roll-token"]');
    if (!button) return;
    const input = button.closest(".dice-panel")?.querySelector("[data-roll-formula]");
    if (!input) return;
    input.value = appendFormulaToken(input.value, button.dataset.rollToken);
    input.focus();
  });

  document.addEventListener(
    "submit",
    (event) => {
      const rollForm = event.target.closest?.("[data-roll-form]");
      if (!rollForm) return;

      const input = rollForm.querySelector("[data-roll-formula]");
      const formulaValue = input?.value ?? "";
      const rollActor = rollForm.dataset.rollActor || "";

      window.setTimeout(() => {
        const forms = Array.from(document.querySelectorAll("[data-roll-form]"));
        const nextForm = forms.find((form) => (form.dataset.rollActor || "") === rollActor) || forms[0];
        const nextInput = nextForm?.querySelector("[data-roll-formula]");
        if (nextInput) nextInput.value = formulaValue;
      }, 0);
    },
    true,
  );
}
