function applyFearHopeLayout() {
  ensureCombatLayoutStyles();
  ensureRoundResetButton();
  ensureDiceSourceSelect();

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

function selectedDiceSource() {
  return document.getElementById("diceSourceSelect")?.value || "DM";
}

if (typeof showRoll === "function") {
  const originalLayoutShowRoll = showRoll;
  showRoll = function showRollWithSelectedSource(targetSelector, formulaInput, source) {
    const finalSource = targetSelector === "#rollResult" ? selectedDiceSource() : source;
    originalLayoutShowRoll(targetSelector, formulaInput, finalSource);
  };
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
