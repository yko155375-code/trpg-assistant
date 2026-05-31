import { getCurrentCharacter, renderAssetsEditor, renderCharacterEditor } from "./characters.js";
import { renderDicePanel } from "./dice.js";
import { renderPublicInfoView } from "./public-info.js";

const pageContent = {
  characters: {
    title: "角色",
    summary: "玩家在這裡選擇與檢視目前角色。後續階段會加入角色狀態、條件與編輯控制。",
    items: ["目前角色選擇", "角色基本狀態", "角色異常狀態"],
  },
  assets: {
    title: "資產",
    summary: "玩家在這裡管理個人資產。後續階段會加入金錢、物品、裝備與消耗品。",
    items: ["金錢", "物品", "裝備", "消耗品"],
  },
  dice: {
    title: "擲骰",
    summary: "玩家在這裡執行擲骰。後續階段會加入一般骰、希望與恐懼骰、擲骰紀錄。",
    items: ["擲骰公式", "希望與恐懼", "擲骰紀錄"],
  },
  shop: {
    title: "商店",
    summary: "玩家在這裡瀏覽商店。後續階段會加入商品清單與購買流程。",
    items: ["商品分類", "商品價格", "購買紀錄"],
  },
  "public-info": {
    title: "公開資訊",
    summary: "玩家在這裡查看公開資訊。後續階段會加入目前場景、公開線索與公開公告。",
    items: ["目前場景", "公開線索", "隊伍公告"],
  },
};

export function renderPlayerPage(pageId, state) {
  const page = pageContent[pageId] || pageContent.characters;
  const characterCount = Array.isArray(state.characters) ? state.characters.length : 0;
  const currentCharacter = getCurrentCharacter(state);

  if (pageId === "characters") {
    return `
      <section class="mobile-page-card" aria-labelledby="active-page-title">
        <p class="eyebrow">玩家端 · 角色</p>
        <h2 id="active-page-title">角色</h2>
        ${renderCharacterEditor(state, { includeAssets: false, title: "目前角色" })}
      </section>
    `;
  }

  if (pageId === "assets") {
    return `
      <section class="mobile-page-card" aria-labelledby="active-page-title">
        <p class="eyebrow">玩家端 · 資產</p>
        <h2 id="active-page-title">資產</h2>
        ${renderAssetsEditor(state)}
      </section>
    `;
  }

  if (pageId === "dice") {
    return `
      <section class="mobile-page-card" aria-labelledby="active-page-title">
        <p class="eyebrow">玩家端 · 擲骰</p>
        <h2 id="active-page-title">擲骰</h2>
        ${renderDicePanel(state, { actor: currentCharacter ? currentCharacter.name : "玩家", title: "玩家擲骰" })}
      </section>
    `;
  }

  if (pageId === "public-info") {
    return `
      <section class="mobile-page-card" aria-labelledby="active-page-title">
        <p class="eyebrow">玩家端 · 公開資訊</p>
        <h2 id="active-page-title">公開資訊</h2>
        ${renderPublicInfoView(state)}
      </section>
    `;
  }

  return `
    <section class="mobile-page-card" aria-labelledby="active-page-title">
      <p class="eyebrow">玩家端 · 手機優先骨架</p>
      <h2 id="active-page-title">${page.title}</h2>
      <p class="placeholder">${page.summary}</p>
      <div class="mobile-section-list" aria-label="${page.title}頁面內容">
        ${page.items
          .map(
            (item) => `
              <article class="mobile-section-item">
                <span>${item}</span>
                <small>待階段功能</small>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="state-card" aria-label="玩家端狀態">
        <span><strong>目前頁面：</strong>${page.title}</span>
        <span><strong>目前角色：</strong>${currentCharacter ? currentCharacter.name : "未選擇"}</span>
        <span><strong>角色數量：</strong>${characterCount}</span>
        <span><strong>最後更新：</strong>${state.meta.updatedAt}</span>
      </div>
    </section>
  `;
}
