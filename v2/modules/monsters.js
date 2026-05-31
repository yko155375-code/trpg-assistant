const numberFields = new Set(["hp", "maxHp", "stress", "maxStress", "difficulty", "attack"]);

function makeMonsterId() {
  return `monster-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
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

export function normalizeMonster(monster = {}) {
  const maxHp = Math.max(0, toNumber(monster.maxHp, 10));
  const maxStress = Math.max(0, toNumber(monster.maxStress, 6));

  return {
    id: monster.id || makeMonsterId(),
    name: monster.name || "未命名怪物",
    hp: clamp(toNumber(monster.hp, maxHp), 0, maxHp),
    maxHp,
    stress: clamp(toNumber(monster.stress), 0, maxStress),
    maxStress,
    difficulty: Math.max(0, toNumber(monster.difficulty, 10)),
    attack: toNumber(monster.attack),
    damage: monster.damage || "1d6",
    threshold: monster.threshold || "",
    notes: monster.notes || "",
  };
}

export function normalizeMonsters(monsters) {
  return Array.isArray(monsters) ? monsters.map(normalizeMonster) : [];
}

export function addMonster(state, values = {}) {
  const monster = normalizeMonster({
    id: makeMonsterId(),
    name: values.name || "新怪物",
    hp: values.hp,
    maxHp: values.maxHp,
    stress: values.stress,
    maxStress: values.maxStress,
    difficulty: values.difficulty,
    attack: values.attack,
    damage: values.damage,
    threshold: values.threshold,
    notes: values.notes,
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

export function deleteMonster(state, monsterId) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).filter((monster) => monster.id !== monsterId),
  };
}

export function adjustMonsterValue(state, monsterId, field, delta) {
  return {
    ...state,
    monsters: normalizeMonsters(state.monsters).map((monster) => {
      if (monster.id !== monsterId) return monster;
      const maxField = field === "hp" ? "maxHp" : "maxStress";
      return normalizeMonster({
        ...monster,
        [field]: clamp(monster[field] + delta, 0, monster[maxField]),
      });
    }),
  };
}

export function renderMonsterManager(state) {
  const monsters = normalizeMonsters(state.monsters);

  return `
    <section class="monster-panel">
      ${renderAddMonsterForm()}
      ${
        monsters.length
          ? `<div class="monster-grid">
              ${monsters.map(renderMonsterCard).join("")}
            </div>`
          : `<section class="empty-panel">
              <strong>尚未建立怪物</strong>
              <p>新增怪物後，就能管理 HP、壓力、難度、攻擊與戰鬥備註。</p>
            </section>`
      }
    </section>
  `;
}

function renderAddMonsterForm() {
  return `
    <form class="editor-panel monster-add-form" data-add-monster-form>
      <div class="form-grid">
        <label class="form-field">
          <span>怪物名稱</span>
          <input data-new-monster-field="name" type="text" placeholder="例如：哥布林斥候" autocomplete="off" />
        </label>
        <label class="form-field">
          <span>最大 HP</span>
          <input data-new-monster-field="maxHp" type="number" inputmode="numeric" min="0" value="10" />
        </label>
        <label class="form-field">
          <span>HP</span>
          <input data-new-monster-field="hp" type="number" inputmode="numeric" min="0" value="10" />
        </label>
        <label class="form-field">
          <span>最大壓力</span>
          <input data-new-monster-field="maxStress" type="number" inputmode="numeric" min="0" value="6" />
        </label>
        <label class="form-field">
          <span>壓力</span>
          <input data-new-monster-field="stress" type="number" inputmode="numeric" min="0" value="0" />
        </label>
        <label class="form-field">
          <span>難度</span>
          <input data-new-monster-field="difficulty" type="number" inputmode="numeric" min="0" value="10" />
        </label>
        <label class="form-field">
          <span>攻擊</span>
          <input data-new-monster-field="attack" type="number" inputmode="numeric" value="0" />
        </label>
        <label class="form-field">
          <span>傷害</span>
          <input data-new-monster-field="damage" type="text" value="1d6" />
        </label>
        <label class="form-field">
          <span>閾值</span>
          <input data-new-monster-field="threshold" type="text" placeholder="例如：5 / 10" />
        </label>
        <label class="form-field form-field-full">
          <span>備註</span>
          <textarea data-new-monster-field="notes" rows="2" placeholder="戰術、特性或弱點"></textarea>
        </label>
      </div>
      <button class="primary-button full-width-button" type="submit">新增怪物</button>
    </form>
  `;
}

function renderMonsterCard(monster) {
  return `
    <article class="monster-card">
      <div class="editor-heading">
        <h3>${escapeHtml(monster.name)}</h3>
        <button class="danger-button" type="button" data-action="delete-monster" data-monster-id="${escapeHtml(monster.id)}">刪除</button>
      </div>
      <label class="form-field">
        <span>怪物名稱</span>
        <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="name" type="text" value="${escapeHtml(monster.name)}" />
      </label>
      <div class="monster-step-grid">
        ${renderMonsterStepper(monster, "hp", "HP", monster.hp, monster.maxHp)}
        ${renderMonsterStepper(monster, "stress", "壓力", monster.stress, monster.maxStress)}
      </div>
      <div class="form-grid">
        <label class="form-field">
          <span>最大 HP</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="maxHp" type="number" inputmode="numeric" min="0" value="${monster.maxHp}" />
        </label>
        <label class="form-field">
          <span>最大壓力</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="maxStress" type="number" inputmode="numeric" min="0" value="${monster.maxStress}" />
        </label>
        <label class="form-field">
          <span>難度</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="difficulty" type="number" inputmode="numeric" min="0" value="${monster.difficulty}" />
        </label>
        <label class="form-field">
          <span>攻擊</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="attack" type="number" inputmode="numeric" value="${monster.attack}" />
        </label>
        <label class="form-field">
          <span>傷害</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="damage" type="text" value="${escapeHtml(monster.damage)}" />
        </label>
        <label class="form-field">
          <span>閾值</span>
          <input data-monster-id="${escapeHtml(monster.id)}" data-monster-field="threshold" type="text" value="${escapeHtml(monster.threshold)}" />
        </label>
        <label class="form-field form-field-full">
          <span>備註</span>
          <textarea data-monster-id="${escapeHtml(monster.id)}" data-monster-field="notes" rows="3">${escapeHtml(monster.notes)}</textarea>
        </label>
      </div>
    </article>
  `;
}

function renderMonsterStepper(monster, field, label, value, maxValue) {
  return `
    <div class="monster-stepper" aria-label="${label}">
      <span>${label}</span>
      <button type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="${field}" data-delta="-1">-</button>
      <strong>${value} / ${maxValue}</strong>
      <button type="button" data-action="adjust-monster" data-monster-id="${escapeHtml(monster.id)}" data-monster-field="${field}" data-delta="1">+</button>
    </div>
  `;
}

export function renderMonsterOverview(state) {
  const monsters = normalizeMonsters(state.monsters);
  const aliveMonsters = monsters.filter((monster) => monster.hp > 0);

  return `
    <section class="dm-section-card monster-overview-card">
      <span>怪物摘要</span>
      <small>怪物數量：${monsters.length}</small>
      <small>仍有 HP：${aliveMonsters.length}</small>
      ${
        monsters.length
          ? `<p>${monsters.map((monster) => `${escapeHtml(monster.name)} ${monster.hp}/${monster.maxHp}`).join("、")}</p>`
          : `<p>尚未建立怪物。</p>`
      }
    </section>
  `;
}
