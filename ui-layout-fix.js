function applyFearHopeLayout() {
  ensureCombatLayoutStyles();
  ensureRoundResetButton();
  ensureDiceSourceSelect();
  ensureDualityResourceRules();

  const modeSwitch = document.querySelector(".mode-switch");
  const cards = Array.from(document.querySelectorAll(".metric-card"));
  const fearCard = cards.find((card) => card.textContent.includes("恐懼點"));
  const hopeCard = cards.find((card) => card.textContent.includes("希望池"));

  if (hopeCard) {
    hopeCard.hidden = true;
    hopeCard.style.display = "none";
  }

  if (!modeSwitch || !fearCard) return;

  let row = document.querySelector(".hero-fear-row");
  if (!row) {
    row = document.createElement("div");
    row.className = "hero-fear-row";
    modeSwitch.insertAdjacentElement("afterend", row);
  }

  if (fearCard.parentElement !== row) {
    row.appendChild(fearCard);
  }

  row.style.marginTop = "8px";
  row.style.display = "grid";
  row.style.gridTemplateColumns = "1fr";
  row.style.gap = "8px";

  fearCard.classList.add("hero-fear-card");
  fearCard.style.minHeight = "78px";
  fearCard.style.marginBottom = "0";
  fearCard.style.padding = "10px 12px";

  const counter = fearCard.querySelector(".counter");
  if (counter) {
    counter.style.gridTemplateColumns = "38px minmax(48px, 1fr) 38px";
  }
}

function ensureCombatLayoutStyles() {
  if (document.getElementById("combat-layout-fix-style")) return;

  const style = document.createElement("style");
  style.id = "combat-layout-fix-style";
  style.textContent = `
    @media (min-width: 720px) {
      #combat.tab-panel.is-active {
        grid-template-columns: 1fr;
      }

      #combat .section-heading,
      #combat .round-card,
      #combat .monster-list,
      #combat .bottom-add-card {
        grid-column: 1 / -1;
      }

      #combat .monster-list,
      #combat .monster-card {
        width: 100%;
      }

      #combat .inline-form {
        grid-template-columns: minmax(150px, 1.4fr) repeat(3, minmax(86px, 1fr)) auto;
        gap: 6px;
      }

      #combat .inline-form .field {
        max-width: none;
        margin-bottom: 0;
      }

      #combat .bottom-add-card {
        padding: 6px;
      }

      #combat .inline-form input,
      #combat .inline-form button {
        min-height: 34px;
        padding: 6px 8px;
        font-size: 0.82rem;
      }

      #combat .inline-form .field span {
        font-size: 0.68rem;
      }
    }

    .round-actions {
      display: flex;
      gap: 6px;
      align-items: center;
      flex-wrap: wrap;
      justify-content: flex-end;
    }

    .round-actions .text-button {
      min-height: 34px;
      padding: 0 10px;
      font-size: 0.78rem;
    }

    .dice-source-field {
      margin-bottom: 8px;
    }

    .dice-source-field select {
      min-height: 36px;
      padding: 7px 9px;
      font-size: 0.86rem;
    }

    .duality-grid .is-critical-tie,
    .roll-result.is-critical-roll {
      border-color: rgba(226, 183, 94, 0.95);
      background: rgba(226, 183, 94, 0.2);
      box-shadow: 0 0 0 2px rgba(226, 183, 94, 0.18);
    }

    .duality-grid .is-critical-tie strong,
    .roll-result.is-critical-roll strong {
      color: var(--gold);
    }

    .crit-note {
      display: block;
      margin-top: 4px;
      color: var(--gold);
      font-size: 0.72rem;
      font-weight: 900;
    }
  `;
  document.head.appendChild(style);
}

function ensureRoundResetButton() {
  const roundCard = document.querySelector("#combat .round-card");
  const nextButton = document.getElementById("nextRoundButton");
  if (!roundCard || !nextButton || document.getElementById("resetRoundButton")) return;

  let actions = roundCard.querySelector(".round-actions");
  if (!actions) {
    actions = document.createElement("div");
    actions.className = "round-actions";
    nextButton.insertAdjacentElement("beforebegin", actions);
    actions.appendChild(nextButton);
  }

  const button = document.createElement("button");
  button.className = "text-button";
  button.id = "resetRoundButton";
  button.type = "button";
  button.textContent = "重製回合";
  button.addEventListener("click", () => {
    state.round = 0;
    persistLayoutState();
    render();
  });
  actions.appendChild(button);
}

function ensureDiceSourceSelect() {
  const formulaField = document.querySelector("#dice .compact-dice-card .compact-field");
  if (!formulaField) return;

  let field = document.getElementById("diceSourceField");
  let select = document.getElementById("diceSourceSelect");
  const previousValue = select?.value || "DM";

  if (!field) {
    field = document.createElement("label");
    field.className = "field compact-field dice-source-field";
    field.id = "diceSourceField";
    field.innerHTML = '<span>指定名稱</span><select id="diceSourceSelect"></select>';
    formulaField.insertAdjacentElement("beforebegin", field);
    select = field.querySelector("select");
  }

  const options = ["DM", ...state.characters.map((character) => character.name)];
  select.innerHTML = options
    .map((name) => `<option value="${layoutEscapeHtml(name)}">${layoutEscapeHtml(name)}</option>`)
    .join("");
  select.value = options.includes(previousValue) ? previousValue : "DM";
}

function ensureDualityResourceRules() {
  const button = document.getElementById("dualityRollButton");
  if (!button || button.dataset.resourceRulesBound === "true") return;

  button.dataset.resourceRulesBound = "true";
  button.onclick = runDualityWithResourceRules;
}

function runDualityWithResourceRules() {
  const source = selectedDiceSource();
  const hopeDie = Math.floor(Math.random() * 12) + 1;
  const fearDie = Math.floor(Math.random() * 12) + 1;
  const total = hopeDie + fearDie;
  const isPlayerSource = source !== "DM";
  const character = isPlayerSource
    ? state.characters.find((item) => item.name === source)
    : null;
  let note = "";

  if (character) {
    if (fearDie > hopeDie) {
      state.fear = layoutClamp((state.fear || 0) + 1, 0, 12);
      note = "恐懼較高：恐懼點 +1";
    } else if (hopeDie > fearDie) {
      character.hopeDice = layoutClamp((character.hopeDice || 0) + 1, 0, 6);
      note = `${source} 希望骰 +1`;
    } else {
      character.hopeDice = layoutClamp((character.hopeDice || 0) + 1, 0, 6);
      character.stress = layoutClamp((character.stress || 0) - 1, 0, 12);
      window.layoutPendingCritSource = source;
      note = `${source} 爆擊：希望骰 +1，壓力 -1，下次擲骰套用爆擊`;
    }
  }

  const tieClass = hopeDie === fearDie ? "is-critical-tie" : "";
  const result = document.getElementById("dualityResult");
  if (result) {
    result.innerHTML = `
      <div class="duality-grid">
        <div class="${hopeDie > fearDie ? "is-hope-high" : tieClass}">
          <span>希望骰</span>
          <strong>${hopeDie}</strong>
        </div>
        <div class="${fearDie > hopeDie ? "is-fear-high" : tieClass}">
          <span>恐懼骰</span>
          <strong>${fearDie}</strong>
        </div>
        <div class="${tieClass}">
          <span>總和</span>
          <strong>${total}</strong>
          ${note ? `<em class="crit-note">${layoutEscapeHtml(note)}</em>` : ""}
        </div>
      </div>
    `;
  }

  state.rolls.unshift({
    source,
    formula: "二元骰子",
    total,
    parts: [hopeDie, fearDie],
    detail: `(希望 ${hopeDie}, 恐懼 ${fearDie}${note ? `；${note}` : ""})`,
    time: Date.now(),
  });
  persistLayoutState();
  renderRollsSafely();
  render();
}

function selectedDiceSource() {
  return document.getElementById("diceSourceSelect")?.value || "DM";
}

if (typeof showRoll === "function") {
  const originalLayoutShowRoll = showRoll;
  showRoll = function showRollWithSelectedSource(targetSelector, formulaInput, source) {
    const finalSource = targetSelector === "#rollResult" ? selectedDiceSource() : source;
    const pendingSource = window.layoutPendingCritSource;

    if (targetSelector === "#rollResult" && pendingSource && pendingSource === finalSource) {
      showCriticalFormulaRoll(targetSelector, formulaInput, finalSource);
      return;
    }

    clearCriticalRollStyle(targetSelector);
    originalLayoutShowRoll(targetSelector, formulaInput, finalSource);
  };
}

function showCriticalFormulaRoll(targetSelector, formulaInput, source) {
  try {
    const roll = rollFormula(formulaInput.value);
    const critBonus = getFormulaMax(roll.formula || formulaInput.value);
    const total = roll.total + critBonus;
    const target = document.querySelector(targetSelector);

    if (target) {
      target.classList.add("is-critical-roll");
      target.innerHTML = `
        <div>
          <strong>${total}</strong>
          <span>${layoutEscapeHtml(roll.formula)} · ${layoutEscapeHtml(roll.parts.join(" + "))} + 滿擲 ${critBonus}</span>
          <em class="crit-note">爆擊</em>
        </div>
      `;
    }

    state.rolls.unshift({
      ...roll,
      source,
      total,
      detail: `(${roll.parts.join(" + ")} + 滿擲 ${critBonus})`,
      time: Date.now(),
    });
    window.layoutPendingCritSource = "";
    persistLayoutState();
    render();
  } catch (error) {
    const target = document.querySelector(targetSelector);
    if (target) target.innerHTML = `<span>${layoutEscapeHtml(error.message)}</span>`;
  }
}

function getFormulaMax(formula) {
  if (typeof maxDice === "function") return maxDice(formula);
  if (typeof maxFormula === "function") return maxFormula(formula);
  return layoutMaxDice(formula);
}

function layoutMaxDice(formula) {
  return (String(formula).toLowerCase().replace(/\s+/g, "").match(/[+-]?[^+-]+/g) || [])
    .reduce((sum, term) => {
      const sign = term[0] === "-" ? -1 : 1;
      const match = term.replace(/^[+-]/, "").match(/^(\d*)d(\d+)$/);
      if (!match) return sum;
      return sum + layoutClamp(Number(match[1] || 1), 1, 20) * layoutClamp(Number(match[2]), 2, 100) * sign;
    }, 0);
}

function clearCriticalRollStyle(targetSelector) {
  document.querySelector(targetSelector)?.classList.remove("is-critical-roll");
}

function renderRollsSafely() {
  if (typeof renderRolls === "function") renderRolls();
}

function persistLayoutState() {
  if (typeof save === "function") {
    save();
    return;
  }

  if (typeof saveState === "function") {
    saveState();
  }
}

function layoutClamp(value, min, max) {
  return Math.min(max, Math.max(min, Number(value) || 0));
}

function layoutEscapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  })[char]);
}

if (typeof render === "function") {
  const originalLayoutRender = render;
  render = function renderWithFearLayout() {
    originalLayoutRender();
    applyFearHopeLayout();
  };
}

window.addEventListener("load", applyFearHopeLayout);
applyFearHopeLayout();
