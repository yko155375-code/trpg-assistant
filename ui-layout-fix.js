function applyFearHopeLayout() {
  ensureCombatLayoutStyles();

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
        grid-template-columns: minmax(150px, 1.4fr) repeat(3, minmax(90px, 1fr));
      }

      #combat .inline-form .field {
        max-width: none;
      }
    }
  `;
  document.head.appendChild(style);
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
