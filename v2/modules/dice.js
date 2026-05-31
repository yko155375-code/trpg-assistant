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

export function rollFormula(formula) {
  const normalized = String(formula || "").replace(/\s+/g, "").toLowerCase();
  const match = normalized.match(/^(\d*)d(\d+)([+-]\d+)?$/);

  if (!match) {
    return { ok: false, error: "公式格式錯誤，請使用像 1d20、2d12、1d6+2、2d8-1 的格式。" };
  }

  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const modifier = Number(match[3] || 0);

  if (!Number.isInteger(count) || !Number.isInteger(sides) || count < 1 || count > 50 || sides < 2 || sides > 1000) {
    return { ok: false, error: "骰數必須為 1-50，骰面必須為 2-1000。" };
  }

  const dice = Array.from({ length: count }, () => rollDie(sides));
  const diceTotal = dice.reduce((sum, value) => sum + value, 0);

  return { ok: true, type: "formula", formula: normalized, dice, modifier, total: diceTotal + modifier, time: new Date().toISOString() };
}

export function rollDuality() {
  const hope = rollDie(12);
  const fear = rollDie(12);
  const tie = hope === fear;
  const higher = tie ? "同值" : hope > fear ? "希望" : "恐懼";
  return { ok: true, type: "duality", formula: "希望 d12 + 恐懼 d12", hope, fear, higher, tie, total: hope + fear, time: new Date().toISOString() };
}

export function addRoll(state, roll, actor = "玩家") {
  if (!roll.ok) return state;
  return { ...state, rolls: [{ id: `roll-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, actor, ...roll }, ...(Array.isArray(state.rolls) ? state.rolls : [])].slice(0, 80) };
}

export function clearRolls(state) {
  return { ...state, rolls: [] };
}

export function renderDicePanel(state, options = {}) {
  const { actor = "玩家", title = "擲骰" } = options;
  return `
    <section class="editor-panel dice-panel">
      <div class="editor-heading"><h3>${title}</h3><button class="danger-button" type="button" data-action="clear-rolls">清空紀錄</button></div>
      <form class="inline-form" data-roll-form data-roll-actor="${escapeHtml(actor)}">
        <label class="form-field"><span>擲骰公式</span><input data-roll-formula type="text" placeholder="例如 1d20、2d8-1" autocomplete="off" /></label>
        <button class="primary-button" type="submit">擲骰</button>
      </form>
      <button class="primary-button full-width-button" type="button" data-action="roll-duality" data-roll-actor="${escapeHtml(actor)}">二元骰：希望 / 恐懼</button>
      <p class="form-message" data-roll-message></p>
      ${renderRollHistory(state)}
    </section>`;
}

export function renderRollHistory(state) {
  const rolls = Array.isArray(state.rolls) ? state.rolls : [];
  if (!rolls.length) return `<section class="empty-panel"><strong>尚無擲骰紀錄</strong><p>擲骰後會自動保存在這裡。</p></section>`;
  return `<section class="roll-history" aria-label="擲骰紀錄">${rolls.map((roll) => `<article class="roll-card"><div class="roll-card-main"><strong>${escapeHtml(roll.actor || "未知")}</strong><span>${escapeHtml(roll.formula)}</span><b>${roll.total}</b></div>${roll.type === "duality" ? `<p>希望 ${roll.hope} / 恐懼 ${roll.fear}，較高：${escapeHtml(roll.higher)}${roll.tie ? "，同值" : ""}</p>` : `<p>骰面：${(roll.dice || []).join("、")}${roll.modifier ? `，修正：${roll.modifier}` : ""}</p>`}<time>${new Date(roll.time).toLocaleString("zh-TW")}</time></article>`).join("")}</section>`;
}
