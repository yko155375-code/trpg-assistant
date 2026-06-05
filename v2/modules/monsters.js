import { rollFormula } from "./dice.js";

const numberFields = new Set(["hp", "maxHp", "stress", "maxStress", "difficulty"]);

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function toNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function normalizeAttackFormula(value) {
  if (value === "" || value === null || value === undefined) return "";
  const text = String(value).trim();
  if (/^-?\d+$/.test(text)) {
    const modifier = Number(text);
    if (modifier === 0) return "d20";
    return `d20${modifier > 0 ? "+" : ""}${modifier}`;
  }
  return text;
}

function isMonsterDead(monster) {
  return Boolean(monster.isDead) || toNumber(monster.hp) <= 0;
}

function makeMonsterRoll(monster, action, round = null) {
  const formula = action === "attack" ? monster.attack : monster.damage;
  const label = action === "attack" ? "攻擊" : "傷害";

  if (!String(formula || "").trim()) {
    return {
      ok: false,
      skipped: true,
      action,
      formula: "",
      error: `未設定${label}公式`,
      monsterId: monster.id,
      monsterName: monster.name,
      round,
    };
  }

  const result = rollFormula(formula);
  return {
    ...result,
    action,
    monsterId: monster.id,
    monsterName: monster.name,
    round,
    error: result.ok ? "" : `無效${label}公式：${result.error}`,
  };
}

function prependRolls(state, rolls) {
  return {
    ...state,
    rolls: [...rolls, ...(Array.isArray(state.rolls) ? state.rolls : [])].slice(0, 80),
  };
}

function toRollRecord(result, rollType, actor) {
  return {
    id: makeId("roll"),
    actor,
    ...result,
    monsterRollType: rollType,
    time: result.time || new Date().toISOString(),
  };
}

export function normalizeMonster(monster = {}) {
  const maxHp = Math.max(0, toNumber(monster.maxHp, 10));
  const maxStress = Math.max(0, toNumber(monster.maxStress, 6));

  return {
    id: monster.id || makeId("monster"),
    name: monster.name || "未命名怪物",
    hp: clamp(toNumber(monster.hp, maxHp), 0, maxHp),
    maxHp,
    stress: clamp(toNumber(monster.stress), 0, maxStress),
    maxStress,
    difficulty: Math.max(0, toNumber(monster.difficulty, 10)),
    attack: normalizeAttackFormula(monster.attack),
    damage: String(monster.damage || "1d6"),
    threshold: monster.threshold || "",
    notes: monster.notes || "",
    isDead: Boolean(monster.isDead),
  };
}

export function normalizeMonsters(monsters) {
  return Array.isArray(monsters) ? monsters.map(normalizeMonster) : [];
}

export function addMonster(state, values = {}) {
  const monster = normalizeMonster({
    id: makeId("monster"),
    name: values.name || "新怪物",
    hp: values.hp,
    maxHp: values.maxHp,
    stress: values.stress,
    maxStress: values.maxStress,
    difficulty: values.difficulty,
    attack: values.attack || "d20",
    damage: values.damage || "1d6",
    threshold: values.threshold,
    notes: values.notes,
    isDead: values.isDead,
  });

  return {
    ...state,
    monsters: [...normalizeMonsters(state.monsters), monster],
  };
}

export function updateMonster(state, monsterId, field, value) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).map((monster) =>
      monster.id === monsterId
        ? normalizeMonster({
            ...monster,
            [field]: numberFields.has(field) ? toNumber(value) : value,
          })
        : monster,
    ),
  };
}

export function toggleMonsterDeath(state, monsterId) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).map((monster) =>
      monster.id === monsterId ? normalizeMonster({ ...monster, isDead: !monster.isDead }) : monster,
    ),
  };
}

export function deleteMonster(state, monsterId) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).filter((monster) => monster.id !== monsterId),
    ui: {
      ...state.ui,
      expandedMonsterId: state.ui?.expandedMonsterId === monsterId ? null : state.ui?.expandedMonsterId,
    },
  };
}

export function adjustMonsterValue(state, monsterId, field, delta) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).map((monster) => {
      if (monster.id !== monsterId) return monster;
      if (field === "isDead") return normalizeMonster({ ...monster, isDead: !monster.isDead });
      const maxField = field === "hp" ? "maxHp" : "maxStress";
      return normalizeMonster({
        ...monster,
        [field]: clamp(monster[field] + delta, 0, monster[maxField]),
      });
    }),
  };
}

export function expandMonster(state, monsterId) {
  return {
    ...state,
    ui: {
      ...state.ui,
      expandedMonsterId: state.ui?.expandedMonsterId === monsterId ? null : monsterId,
    },
  };
}

export function rollMonsterAction(state, monsterId, action) {
  const monster = normalizeMonsters(state.monsters).find((entry) => entry.id === monsterId);
  if (!monster) return state;

  const result = makeMonsterRoll(monster, action, state.session?.round || 0);
  const label = action === "attack" ? "攻擊" : "傷害";
  const record = toRollRecord(result, `monster ${action} roll`, `${monster.name} ${label}`);

  return {
    ...prependRolls(state, [record]),
    session: {
      ...state.session,
      lastMonsterAction: record,
    },
  };
}

export function advanceMonsterRound(state) {
  const round = Math.max(0, Math.floor(toNumber(state.session?.round))) + 1;
  const monsters = normalizeMonsters(state.monsters);
  const activeMonsters = monsters.filter((monster) => !isMonsterDead(monster));
  const skippedDeadCount = monsters.length - activeMonsters.length;
  const results = activeMonsters.map((monster) => {
    const attackRoll = makeMonsterRoll(monster, "attack", round);
    const damageRoll = makeMonsterRoll(monster, "damage", round);
    return {
      id: makeId("monster-round"),
      monsterId: monster.id,
      monsterName: monster.name,
      round,
      attackRoll,
      damageRoll,
      time: new Date().toISOString(),
    };
  });
  const records = results.map((result) =>
    toRollRecord(
      {
        ok: true,
        type: "monster-round",
        formula: `第 ${round} 回合`,
        total: result.attackRoll.ok ? result.attackRoll.total : "-",
        dice: [],
        terms: [],
        monsterId: result.monsterId,
        monsterName: result.monsterName,
        round,
        attackRoll: result.attackRoll,
        damageRoll: result.damageRoll,
        time: result.time,
      },
      "monster round roll",
      `怪物回合：${result.monsterName}`,
    ),
  );

  return {
    ...prependRolls(state, records),
    session: {
      ...state.session,
      round,
      monsterRoundResults: results,
      skippedDeadMonsters: skippedDeadCount,
    },
  };
}

export function resetMonsterRound(state) {
  return {
    ...state,
    session: {
      ...state.session,
      round: 0,
      monsterRoundResults: [],
      skippedDeadMonsters: 0,
    },
  };
}

export function renderMonsterManager(state) {
  const monsters = normalizeMonsters(state.monsters);
  const expandedMonster = monsters.find((monster) => monster.id === state.ui?.expandedMonsterId);

  return `
    <section class="monster-panel">
      ${renderMonsterCompactStyles()}
      ${renderRoundPanel(state)}
      ${renderMonsterNameSummary(monsters)}
      ${
        monsters.length
          ? `<div class="monster-grid">${monsters.map(renderMonsterCard).join("")}</div>`
          : `<section class="empty-panel"><strong>目前沒有怪物</strong><p>新增怪物後即可管理戰鬥狀態與回合擲骰。</p></section>`
      }
      ${expandedMonster ? renderMonsterDetails(expandedMonster) : ""}
      ${renderAddMonsterForm()}
    </section>
  `;
}

function renderMonsterNameSummary(monsters) {
  if (!monsters.length) return "";
  const groups = new Map();
  for (const monster of monsters) {
    const key = monster.name || "未命名怪物";
    const current = groups.get(key) || { name: key, total: 0, alive: 0 };
    current.total += 1;
    if (!isMonsterDead(monster)) current.alive += 1;
    groups.set(key, current);
  }

  return `
    <section class="monster-name-summary" aria-label="怪物彙總列">
      ${Array.from(groups.values())
        .sort((a, b) => a.name.localeCompare(b.name, "zh-Hant"))
        .map(
          (group) => `
            <span class="monster-name-chip ${group.alive ? "" : "is-all-dead"}">
              <b>${escapeHtml(group.name)}</b>
              <small>${group.alive}/${group.total}</small>
            </span>
          `,
        )
        .join("")}
    </section>
  `;
}

function renderRoundPanel(state) {
  const round = Math.max(0, Math.floor(toNumber(state.session?.round)));
  const results = Array.isArray(state.session?.monsterRoundResults) ? state.session.monsterRoundResults : [];
  const skippedDeadCount = Math.max(0, toNumber(state.session?.skippedDeadMonsters));
  const lastAction = state.session?.lastMonsterAction;

  return `
    <section class="monster-round-panel">
      <div class="monster-round-heading">
        <div><span>回合計數器</span><strong>目前回合：第 ${round} 回合</strong></div>
        <div class="monster-round-actions">
          <button class="primary-button" type="button" data-action="next-monster-round">下一回合</button>
          <button type="button" data-action="reset-monster-round">重設回合</button>
        </div>
      </div>
      ${skippedDeadCount ? `<p class="monster-skip-note">已跳過 ${skippedDeadCount} 隻死亡或 HP 0 的怪物。</p>` : ""}
      ${
        results.length
          ? `<div class="monster-round-results">
              ${results
                .map(
                  (result) => `
                    <article>
                      <strong>${escapeHtml(result.monsterName)}</strong>
                      ${renderActionResult("攻擊", result.attackRoll)}
                      ${renderActionResult("傷害", result.damageRoll)}
                    </article>`,
                )
                .join("")}
            </div>`
          : `<p class="empty-hint">尚無本回合怪物行動摘要。</p>`
      }
      ${
        lastAction
          ? `<div class="monster-last-action">
              <strong>最近快捷擲骰：${escapeHtml(lastAction.actor || lastAction.monsterName)}</strong>
              ${renderActionResult(lastAction.action === "damage" ? "傷害" : "攻擊", lastAction)}
            </div>`
          : ""
      }
    </section>
  `;
}

function renderActionResult(label, result = {}) {
  if (!result.ok) return `<span><b>${label}</b> ${escapeHtml(result.error || "未設定")}</span>`;
  return `<span><b>${label}</b> ${escapeHtml(result.formula)} = <strong>${result.total}</strong></span>`;
}

function renderAddMonsterForm() {
  return `
    <form class="editor-panel monster-add-form" data-add-monster-form>
      <div class="editor-heading"><h3>新增怪物</h3></div>
      <div class="monster-add-grid">
        <label class="form-field"><span>名稱</span><input data-new-monster-field="name" type="text" placeholder="怪物名稱" autocomplete="off" /></label>
        <label class="form-field"><span>最大 HP</span><input data-new-monster-field="maxHp" type="number" inputmode="numeric" min="0" value="10" /></label>
        <label class="form-field"><span>HP</span><input data-new-monster-field="hp" type="number" inputmode="numeric" min="0" value="10" /></label>
        <label class="form-field"><span>攻擊公式</span><input data-new-monster-field="attack" type="text" value="d20" /></label>
        <label class="form-field"><span>傷害公式</span><input data-new-monster-field="damage" type="text" value="1d6" /></label>
      </div>
      <button class="primary-button" type="submit">新增怪物</button>
    </form>
  `;
}

function renderMonsterCard(monster) {
  const dead = isMonsterDead(monster);
  return `
    <article class="monster-card monster-compact-card ${dead ? "is-dead" : ""}">
      <div class="monster-card-heading">
        <div>
          <h3>${escapeHtml(monster.name)}</h3>
          <small>難度 ${monster.difficulty}</small>
        </div>
        <div class="monster-card-actions">
          <button class="monster-death-toggle ${dead ? "is-active" : ""}" type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="isDead" data-delta="1" aria-pressed="${dead}">
            ${dead ? "死亡" : "存活"}
          </button>
          <button class="monster-edit-button" type="button" data-action="expand-monster" data-monster-id="${escapeHtml(monster.id)}" aria-label="編輯 ${escapeHtml(monster.name)}">⋯</button>
        </div>
      </div>
      <div class="monster-step-grid">
        ${renderMonsterStepper(monster, "hp", "HP", monster.hp, monster.maxHp)}
        ${renderMonsterStepper(monster, "stress", "壓", monster.stress, monster.maxStress)}
      </div>
      <div class="monster-quick-actions">
        <span class="monster-formula-pill"><b>攻</b>${escapeHtml(monster.attack || "未設定")}</span>
        <button type="button" data-action="roll-monster-attack" data-monster-id="${escapeHtml(monster.id)}">攻</button>
        <span class="monster-formula-pill"><b>傷</b>${escapeHtml(monster.damage || "未設定")}</span>
        <button type="button" data-action="roll-monster-damage" data-monster-id="${escapeHtml(monster.id)}">傷</button>
      </div>
    </article>
  `;
}

function renderMonsterDetails(monster) {
  const dead = isMonsterDead(monster);
  return `
    <section class="editor-panel monster-detail-panel">
      <div class="editor-heading">
        <h3>編輯 ${escapeHtml(monster.name)}</h3>
        <div class="monster-card-actions">
          <button class="monster-death-toggle ${dead ? "is-active" : ""}" type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="isDead" data-delta="1" aria-pressed="${dead}">
            ${dead ? "取消死亡" : "標記死亡"}
          </button>
          <button class="danger-button" type="button" data-action="delete-monster" data-monster-id="${escapeHtml(monster.id)}">刪除怪物</button>
        </div>
      </div>
      <div class="form-grid">
        <label class="form-field"><span>名稱</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="name" type="text" value="${escapeHtml(monster.name)}" /></label>
        <label class="form-field"><span>HP</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="hp" type="number" min="0" value="${monster.hp}" /></label>
        <label class="form-field"><span>最大 HP</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="maxHp" type="number" min="0" value="${monster.maxHp}" /></label>
        <label class="form-field"><span>壓力</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="stress" type="number" min="0" value="${monster.stress}" /></label>
        <label class="form-field"><span>最大壓力</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="maxStress" type="number" min="0" value="${monster.maxStress}" /></label>
        <label class="form-field"><span>難度 / 閃避</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="difficulty" type="number" min="0" value="${monster.difficulty}" /></label>
        <label class="form-field"><span>攻擊公式</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="attack" type="text" value="${escapeHtml(monster.attack)}" /></label>
        <label class="form-field"><span>傷害公式</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="damage" type="text" value="${escapeHtml(monster.damage)}" /></label>
        <label class="form-field"><span>閾值</span><input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="threshold" type="text" value="${escapeHtml(monster.threshold)}" /></label>
        <label class="form-field form-field-full"><span>備註</span><textarea data-monster-id="${escapeHtml(monster.id)}" data-monster-field="notes" rows="3">${escapeHtml(monster.notes)}</textarea></label>
      </div>
    </section>
  `;
}

function renderMonsterStepper(monster, field, label, value, maxValue) {
  return `
    <div class="monster-stepper" aria-label="${label}">
      <span>${label}</span>
      <button type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="${field}" data-delta="-1">−</button>
      <strong>${value}/${maxValue}</strong>
      <button type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="${field}" data-delta="1">+</button>
    </div>
  `;
}

function renderMonsterCompactStyles() {
  return `
    <style data-monster-kds-compact-style>
      .monster-panel { gap: 6px; }
      .monster-name-summary { display: flex; gap: 5px; max-width: 100%; overflow-x: auto; padding: 1px 0 3px; scrollbar-width: thin; }
      .monster-name-chip { display: inline-flex; flex: 0 0 auto; align-items: center; gap: 5px; min-height: 24px; padding: 2px 7px; border: 1px solid rgba(199, 164, 93, 0.26); border-radius: 999px; background: rgba(199, 164, 93, 0.1); color: var(--text); font-size: 11px; white-space: nowrap; }
      .monster-name-chip small { color: var(--gold); font-weight: 800; }
      .monster-name-chip.is-all-dead { opacity: 0.55; filter: grayscale(0.45); }
      .monster-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(145px, 1fr)); gap: 5px; }
      .monster-card.monster-compact-card { gap: 3px; padding: 5px; min-width: 0; border-radius: 8px; }
      .monster-card.monster-compact-card.is-dead { opacity: 0.54; filter: grayscale(0.55); }
      .monster-card.monster-compact-card.is-dead h3 { text-decoration: line-through; }
      .monster-card-heading { display: grid; grid-template-columns: minmax(0, 1fr) auto; align-items: start; gap: 3px; }
      .monster-card-heading > div { gap: 0; }
      .monster-card-heading h3 { margin: 0; overflow: hidden; font-size: 13px; line-height: 1.12; text-overflow: ellipsis; white-space: nowrap; }
      .monster-card-heading small { font-size: 10px; line-height: 1.1; }
      .monster-card-actions { display: flex; align-items: center; gap: 2px; }
      .monster-death-toggle, .monster-edit-button { min-height: 22px; padding: 0 5px; border-radius: 7px; font-size: 10px; }
      .monster-edit-button { width: 22px; min-width: 22px; }
      .monster-death-toggle.is-active { border-color: rgba(188, 64, 78, 0.72); background: rgba(188, 64, 78, 0.22); color: #ffd6dc; }
      .monster-step-grid { grid-template-columns: 1fr; gap: 2px; }
      .monster-stepper { display: grid; grid-template-columns: 22px 22px minmax(38px, auto) 22px; align-items: center; gap: 2px; padding: 2px 3px; border-radius: 7px; font-size: 10px; min-width: 0; }
      .monster-stepper button { width: 22px; min-width: 22px; height: 22px; min-height: 22px; border-radius: 6px; padding: 0; }
      .monster-stepper strong { font-size: 11px; white-space: nowrap; }
      .monster-quick-actions { display: grid; grid-template-columns: minmax(0, 1fr) 26px minmax(0, 1fr) 26px; align-items: center; gap: 3px; }
      .monster-quick-actions button { min-height: 24px; padding: 0 4px; border-radius: 7px; font-size: 11px; }
      .monster-formula-pill { min-width: 0; overflow: hidden; padding: 2px 4px; border-radius: 7px; background: rgba(255, 255, 255, 0.04); color: var(--muted); font-size: 10px; line-height: 1.2; text-overflow: ellipsis; white-space: nowrap; }
      .monster-formula-pill b { margin-right: 3px; color: var(--gold); }
      .monster-skip-note { margin: 4px 0 0; font-size: 12px; color: rgba(243, 234, 216, 0.68); }
      @media (min-width: 1024px) { .monster-grid { grid-template-columns: repeat(auto-fill, minmax(138px, 1fr)); } }
      @media (max-width: 430px) { .monster-grid { grid-template-columns: 1fr; } .monster-card.monster-compact-card { padding: 5px; } .monster-quick-actions { grid-template-columns: minmax(0, 1fr) 30px minmax(0, 1fr) 30px; } .monster-quick-actions button { min-height: 26px; } .monster-stepper button { width: 24px; min-width: 24px; height: 24px; min-height: 24px; } }
    </style>
  `;
}

export function renderMonsterOverview(state) {
  const monsters = normalizeMonsters(state.monsters);
  const aliveMonsters = monsters.filter((monster) => !isMonsterDead(monster));

  return `
    <section class="dm-section-card monster-overview-card">
      <span>怪物摘要</span>
      <small>怪物數：${monsters.length} · 存活：${aliveMonsters.length}</small>
      ${
        monsters.length
          ? `<p>${monsters
              .map((monster) => `${escapeHtml(monster.name)} ${monster.hp}/${monster.maxHp}${isMonsterDead(monster) ? " 死亡" : ""}`)
              .join("、")}</p>`
          : `<p>目前沒有怪物。</p>`
      }
    </section>
  `;
}
