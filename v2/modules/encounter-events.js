import { addMonster } from "./monsters.js";
import { loadState, saveState } from "./storage.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeEncounterMonster(monster = {}) {
  return {
    name: String(monster.name || "未命名怪物").trim() || "未命名怪物",
    hp: Number(monster.hp ?? monster.maxHp ?? 1) || 1,
    maxHp: Number(monster.maxHp ?? monster.hp ?? 1) || 1,
    stress: Number(monster.stress ?? 0) || 0,
    maxStress: Number(monster.maxStress ?? 0) || 0,
    difficulty: Number(monster.difficulty ?? 10) || 10,
    attack: String(monster.attack || monster.attackFormula || "").trim(),
    damage: String(monster.damage || monster.damageFormula || "").trim(),
    notes: String(monster.notes || monster.note || "").trim(),
    tag: String(monster.tag || "").trim(),
  };
}

function normalizeEncounters(encounters) {
  if (!Array.isArray(encounters)) return [];
  return encounters.map((encounter) => ({
    id: String(encounter.id || makeId("encounter")),
    name: String(encounter.name || "未命名遭遇").trim() || "未命名遭遇",
    monsters: Array.isArray(encounter.monsters) ? encounter.monsters.map(normalizeEncounterMonster) : [],
  }));
}

function encounterMonsterSummary(monsters = []) {
  const counts = monsters.reduce((summary, monster) => {
    const name = normalizeEncounterMonster(monster).name;
    summary.set(name, (summary.get(name) || 0) + 1);
    return summary;
  }, new Map());

  return Array.from(counts.entries())
    .map(([name, count]) => `${name} x${count}`)
    .join("、");
}

function withEncounterUi(state, message) {
  return { ...state, ui: { ...(state.ui || {}), encounterTemplateMessage: message } };
}

function saveEncounter(state, name) {
  const encounterName = String(name || "").trim();
  if (!encounterName) return withEncounterUi(state, "請先輸入遭遇名稱。");
  if (!Array.isArray(state.monsters) || state.monsters.length === 0) {
    return withEncounterUi(state, "目前沒有怪物，無法儲存遭遇。");
  }

  const encounters = normalizeEncounters(state.encounters);
  const encounter = {
    id: makeId("encounter"),
    name: encounterName,
    monsters: state.monsters.map(normalizeEncounterMonster),
  };

  return withEncounterUi({ ...state, encounters: [...encounters, encounter] }, `已儲存遭遇：${encounterName}`);
}

function loadEncounter(state, encounterId, mode) {
  const encounters = normalizeEncounters(state.encounters);
  const encounter = encounters.find((item) => item.id === encounterId);
  if (!encounter) return withEncounterUi(state, "找不到遭遇模板。");

  let nextState = {
    ...state,
    encounters,
    monsters: mode === "append" ? [...(state.monsters || [])] : [],
    ui: { ...(state.ui || {}), expandedMonsterId: null },
  };

  encounter.monsters.forEach((monster) => {
    nextState = addMonster(nextState, { ...monster, isDead: false });
  });

  return withEncounterUi(nextState, mode === "append" ? `已追加遭遇：${encounter.name}` : `已載入遭遇：${encounter.name}`);
}

function deleteEncounter(state, encounterId) {
  return withEncounterUi(
    { ...state, encounters: normalizeEncounters(state.encounters).filter((encounter) => encounter.id !== encounterId) },
    "已刪除遭遇模板。",
  );
}

function renderEncounterCard(encounter) {
  const summary = encounterMonsterSummary(encounter.monsters);
  return `
    <article class="monster-encounter-card">
      <div>
        <strong>${escapeHtml(encounter.name)}</strong>
        <span>${encounter.monsters.length} 隻</span>
        <small>${summary ? escapeHtml(summary) : "無怪物"}</small>
      </div>
      <div class="monster-encounter-actions">
        <button type="button" data-action="load-encounter-replace" data-encounter-id="${escapeHtml(encounter.id)}">載入並清空目前</button>
        <button type="button" data-action="load-encounter-append" data-encounter-id="${escapeHtml(encounter.id)}">追加到目前</button>
        <button type="button" class="danger-button" data-action="delete-encounter" data-encounter-id="${escapeHtml(encounter.id)}">刪除遭遇</button>
      </div>
    </article>
  `;
}

function renderEncounterPanel(state) {
  const encounters = normalizeEncounters(state.encounters);
  const message = state.ui?.encounterTemplateMessage;
  return `
    <section class="monster-encounter-panel" data-encounter-panel>
      <div class="section-title">
        <div>
          <p class="eyebrow">Encounter</p>
          <h3>遭遇模板</h3>
        </div>
        <span>${encounters.length} 組</span>
      </div>
      <form class="monster-encounter-save" data-save-encounter-form>
        <input type="text" data-encounter-name placeholder="遭遇名稱，例如：村口伏擊" />
        <button type="submit">儲存為遭遇</button>
      </form>
      ${message ? `<p class="monster-encounter-message">${escapeHtml(message)}</p>` : ""}
      <div class="monster-encounter-list">
        ${encounters.length ? encounters.map(renderEncounterCard).join("") : `<p class="empty-state">尚未保存遭遇模板。</p>`}
      </div>
    </section>
  `;
}

function ensureEncounterStyles() {
  if (document.querySelector("[data-encounter-template-styles]")) return;
  const style = document.createElement("style");
  style.dataset.encounterTemplateStyles = "true";
  style.textContent = `
    .monster-encounter-panel {
      margin: 0 0 10px;
      padding: 10px;
      border: 1px solid rgba(199, 164, 92, 0.22);
      border-radius: 12px;
      background: rgba(11, 18, 32, 0.72);
    }

    .monster-encounter-save {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      gap: 8px;
      margin: 8px 0;
    }

    .monster-encounter-save input,
    .monster-encounter-save button {
      min-height: 34px;
      font-size: 13px;
    }

    .monster-encounter-message {
      margin: 4px 0 8px;
      font-size: 12px;
      color: #facc15;
    }

    .monster-encounter-list {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 8px;
    }

    .monster-encounter-card {
      display: grid;
      gap: 8px;
      min-width: 0;
      padding: 8px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      border-radius: 10px;
      background: rgba(15, 23, 42, 0.72);
    }

    .monster-encounter-card strong,
    .monster-encounter-card span,
    .monster-encounter-card small {
      display: block;
      min-width: 0;
    }

    .monster-encounter-card small {
      overflow: hidden;
      color: rgba(226, 232, 240, 0.72);
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .monster-encounter-actions {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .monster-encounter-actions button {
      min-height: 30px;
      padding: 4px 8px;
      font-size: 12px;
    }

    @media (max-width: 520px) {
      .monster-encounter-save,
      .monster-encounter-list {
        grid-template-columns: 1fr;
      }
    }
  `;
  document.head.append(style);
}

function ensureEncounterPanel() {
  ensureEncounterStyles();
  const monsterPanel = document.querySelector(".monster-panel");
  if (!monsterPanel || monsterPanel.querySelector("[data-encounter-panel]")) return;
  monsterPanel.insertAdjacentHTML("afterbegin", renderEncounterPanel(loadState()));
}

const observer = new MutationObserver(ensureEncounterPanel);
observer.observe(document.body, { childList: true, subtree: true });
ensureEncounterPanel();

document.addEventListener(
  "submit",
  (event) => {
    const form = event.target.closest("[data-save-encounter-form]");
    if (!form) return;

    event.preventDefault();
    event.stopPropagation();
    const input = form.querySelector("[data-encounter-name]");
    saveState(saveEncounter(loadState(), input?.value || ""));
    ensureEncounterPanel();
    window.location.reload();
  },
  true,
);

document.addEventListener(
  "click",
  (event) => {
    const button = event.target.closest("[data-action]");
    if (!button) return;

    const action = button.dataset.action;
    if (!["load-encounter-replace", "load-encounter-append", "delete-encounter"].includes(action)) return;

    event.preventDefault();
    event.stopPropagation();
    const state = loadState();
    const encounterId = button.dataset.encounterId;

    if (action === "load-encounter-replace") {
      if (window.confirm("載入此遭遇並清空目前怪物？")) {
        saveState(loadEncounter(state, encounterId, "replace"));
        window.location.reload();
      }
      return;
    }

    if (action === "load-encounter-append") {
      saveState(loadEncounter(state, encounterId, "append"));
      window.location.reload();
      return;
    }

    if (window.confirm("確定要刪除此遭遇模板？目前怪物不會被刪除。")) {
      saveState(deleteEncounter(state, encounterId));
      window.location.reload();
    }
  },
  true,
);
