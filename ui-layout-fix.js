function applyFearHopeLayout() {
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

if (typeof render === "function") {
  const originalLayoutRender = render;
  render = function renderWithFearLayout() {
    originalLayoutRender();
    applyFearHopeLayout();
  };
}

window.addEventListener("load", applyFearHopeLayout);
applyFearHopeLayout();
