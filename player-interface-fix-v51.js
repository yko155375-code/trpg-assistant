function applyPlayerInterfaceFixV51() {
  ensurePlayerInterfaceStylesV51();
  removePublicStoryCardsV51();
  enhanceAttributeSteppersV51();
  exposePlayerAddMemberV51();
  patchFastDmEntryV51();
}

function ensurePlayerInterfaceStylesV51() {
  if (document.getElementById("player-interface-fix-v51-style")) return;
  const style = document.createElement("style");
  style.id = "player-interface-fix-v51-style";
  style.textContent = `
    body[data-mode="player"] #publicClueCardV46,
    body[data-mode="player"] .public-clue-card-v46 {
      display: none !important;
    }

    body[data-mode="player"] #characterForm.bottom-add-form,
    body[data-mode="player"] .roster-card #characterForm {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(86px, .45fr) auto;
      gap: 6px;
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--line);
    }

    body[data-mode="player"] #characterForm button {
      min-height: 38px;
      padding: 0 12px;
      font-size: .78rem;
    }

    body[data-mode="player"] .stat-control__row,
    body[data-mode="player"] .asset-control,
    .resource-stepper-v51 {
      display: grid !important;
      grid-template-columns: 34px minmax(40px, 1fr) 34px !important;
      align-items: center;
      gap: 5px;
    }

    body[data-mode="player"] .stat-control__row button,
    body[data-mode="player"] .asset-control button,
    .resource-stepper-v51 button {
      display: inline-flex !important;
      align-items: center;
      justify-content: center;
      width: 34px !important;
      min-width: 34px;
      min-height: 34px !important;
      padding: 0 !important;
      border-radius: 7px;
      font-size: 1rem;
      font-weight: 900;
    }

    body[data-mode="player"] .stat-control__row strong,
    body[data-mode="player"] .asset-control strong,
    .resource-stepper-v51 input {
      min-width: 40px;
      font-size: 1rem !important;
      font-weight: 900;
      text-align: center;
    }

    .attribute-cell-v44 {
      display: grid !important;
      gap: 4px;
    }

    .resource-stepper-v51 input {
      width: 100%;
      min-height: 34px;
      border: 1px solid var(--line);
      border-radius: 7px;
      background: rgba(18,20,23,.72);
      color: var(--text);
      font: inherit;
    }

    .dm-entry-v46.is-switching {
      opacity: .9 !important;
      border-color: rgba(212,154,53,.78) !important;
      transform: scale(1.08);
    }

    body.is-entering-dm::after {
      content: "正在開啟 DM";
      position: fixed;
      top: 10px;
      right: 76px;
      z-index: 120;
      padding: 5px 8px;
      border: 1px solid rgba(212,154,53,.3);
      border-radius: 7px;
      background: rgba(8,13,23,.84);
      color: var(--gold);
      font-size: 11px;
      pointer-events: none;
    }

    @media (max-width: 620px) {
      body[data-mode="player"] #characterForm.bottom-add-form,
      body[data-mode="player"] .roster-card #characterForm {
        grid-template-columns: 1fr;
      }

      body[data-mode="player"] .stat-control__row,
      body[data-mode="player"] .asset-control,
      .resource-stepper-v51 {
        grid-template-columns: 38px minmax(48px, 1fr) 38px !important;
      }

      body[data-mode="player"] .stat-control__row button,
      body[data-mode="player"] .asset-control button,
      .resource-stepper-v51 button {
        width: 38px !important;
        min-width: 38px;
        min-height: 38px !important;
      }
    }
  `;
  document.head.appendChild(style);
}

function removePublicStoryCardsV51() {
  if (typeof ensurePublicClueCardV46 === "function") {
    ensurePublicClueCardV46 = function removePublicClueCardV51() {
      document.getElementById("publicClueCardV46")?.remove();
    };
  }
  document.getElementById("publicClueCardV46")?.remove();
  document.querySelectorAll(".public-clue-card-v46").forEach((card) => card.remove());
}

function exposePlayerAddMemberV51() {
  const form = document.getElementById("characterForm");
  if (!form) return;
  const button = form.querySelector("button");
  if (button) button.textContent = "新增隊員";
}

function enhanceAttributeSteppersV51() {
  document.querySelectorAll(".attribute-cell-v44 input[data-character-attr-id][data-character-attr-key]").forEach((input) => {
    if (input.closest(".resource-stepper-v51")) return;
    const wrapper = document.createElement("div");
    wrapper.className = "resource-stepper-v51";

    const minus = document.createElement("button");
    minus.className = "text-button";
    minus.type = "button";
    minus.textContent = "-";
    minus.dataset.attrStepV51 = "-1";

    const plus = document.createElement("button");
    plus.className = "text-button";
    plus.type = "button";
    plus.textContent = "+";
    plus.dataset.attrStepV51 = "1";

    input.insertAdjacentElement("beforebegin", wrapper);
    wrapper.append(minus, input, plus);
  });
}

function updateAttributeByStepV51(input, step) {
  const characterId = input.dataset.characterAttrId;
  const key = input.dataset.characterAttrKey;
  if (!characterId || !key) return;

  const current = Number(input.value || 0);
  const nextValue = Number.isFinite(current) ? current + step : step;
  input.value = nextValue;

  state.characters = state.characters.map((character) => (
    character.id === characterId
      ? { ...character, attributes: { ...(character.attributes || {}), [key]: nextValue } }
      : character
  ));

  if (typeof save === "function") save();
  else if (typeof saveState === "function") saveState();
  if (typeof render === "function") render();
}

function patchFastDmEntryV51() {
  if (window.fastDmEntryPatchedV51) return;
  window.fastDmEntryPatchedV51 = true;

  window.enterDmMode = function fastEnterDmModeV51() {
    const entry = document.getElementById("dmEntryV46");
    entry?.classList.add("is-switching");
    document.body.classList.add("is-entering-dm");
    sessionStorage.setItem("dmModeActiveV46", "true");
    state.mode = "dm";
    state.activeTab = state.activeTab && state.activeTab !== "notes" ? state.activeTab : "dashboard";
    document.body.dataset.mode = "dm";
    document.body.dataset.shopOpen = "false";
    document.getElementById("statusReferencePanel")?.classList.remove("is-open");

    if (typeof renderMode === "function") renderMode();

    try {
      localStorage.setItem(storageKey, JSON.stringify(state));
    } catch (error) {}

    requestAnimationFrame(() => {
      if (typeof render === "function") render();
      requestAnimationFrame(() => {
        entry?.classList.remove("is-switching");
        document.body.classList.remove("is-entering-dm");
      });
    });
  };

  window.handleEnterDmMode = window.enterDmMode;
  try {
    enterDmMode = window.enterDmMode;
    handleEnterDmMode = window.enterDmMode;
  } catch (error) {}
}

document.addEventListener("click", (event) => {
  const attrButton = event.target.closest("[data-attr-step-v51]");
  if (attrButton) {
    event.preventDefault();
    event.stopPropagation();
    const wrapper = attrButton.closest(".resource-stepper-v51");
    const input = wrapper?.querySelector("[data-character-attr-id][data-character-attr-key]");
    if (input) updateAttributeByStepV51(input, Number(attrButton.dataset.attrStepV51 || 0));
  }
}, true);

if (typeof render === "function" && !window.playerInterfaceRenderPatchedV51) {
  const originalRenderV51 = render;
  render = function renderWithPlayerInterfaceFixV51() {
    originalRenderV51();
    applyPlayerInterfaceFixV51();
  };
  window.playerInterfaceRenderPatchedV51 = true;
}

window.addEventListener("load", applyPlayerInterfaceFixV51);
applyPlayerInterfaceFixV51();
