import { renderCharacterEditor } from "./characters.js";

const dmPageContent = {
  overview: {
    title: "總覽",
    summary: "集中查看本場遊戲的主持狀態。這裡只建立管理骨架，細節功能留到後續階段。",
    sections: ["目前場景", "玩家摘要", "怪物摘要", "恐懼點", "希望池"],
  },
  players: {
    title: "玩家",
    summary: "管理玩家角色資料、狀態與資源的入口占位。",
    sections: ["玩家列表", "角色狀態", "玩家資源"],
  },
  monsters: {
    title: "怪物",
    summary: "管理怪物、敵方單位與遭遇資料的入口占位。",
    sections: ["怪物列表", "敵方狀態", "遭遇摘要"],
  },
  dice: {
    title: "骰子",
    summary: "DM 擲骰工具與幕後擲骰紀錄的入口占位。",
    sections: ["DM 擲骰", "擲骰紀錄", "快速公式"],
  },
  shop: {
    title: "商店",
    summary: "商店商品與價格管理的入口占位。",
    sections: ["商品管理", "價格設定", "購買紀錄"],
  },
  "public-info": {
    title: "公開資訊",
    summary: "管理玩家可見場景、公告與線索的入口占位。",
    sections: ["目前場景", "公開公告", "公開線索"],
  },
  audio: {
    title: "音樂",
    summary: "音樂頁 MVP 只保留骨架，後續階段再接入音樂控制。",
    sections: ["背景音樂", "即時音效", "播放狀態"],
  },
};

export function renderDmPage(pageId, state) {
  const page = dmPageContent[pageId] || dmPageContent.overview;
  const characterCount = Array.isArray(state.characters) ? state.characters.length : 0;
  const monsterCount = Array.isArray(state.monsters) ? state.monsters.length : 0;

  if (pageId === "players") {
    return `
      <section class="dm-page-card" aria-labelledby="active-page-title">
        <div class="dm-page-heading">
          <p class="eyebrow">DM 端 · 玩家管理</p>
          <h2 id="active-page-title">玩家</h2>
          <p class="placeholder">新增、選擇、編輯、刪除角色，並管理同一份角色狀態與資產。</p>
        </div>
        ${renderCharacterEditor(state, { includeAssets: true, title: "玩家角色管理" })}
      </section>
    `;
  }

  return `
    <section class="dm-page-card" aria-labelledby="active-page-title">
      <div class="dm-page-heading">
        <p class="eyebrow">DM 端 · 管理骨架</p>
        <h2 id="active-page-title">${page.title}</h2>
        <p class="placeholder">${page.summary}</p>
      </div>
      <div class="dm-section-grid" aria-label="${page.title}管理區塊">
        ${page.sections
          .map(
            (section) => `
              <article class="dm-section-card">
                <span>${section}</span>
                <small>占位</small>
              </article>
            `,
          )
          .join("")}
      </div>
      <div class="state-card" aria-label="DM 端狀態">
        <span><strong>目前頁面：</strong>${page.title}</span>
        <span><strong>玩家數：</strong>${characterCount}</span>
        <span><strong>怪物數：</strong>${monsterCount}</span>
        <span><strong>恐懼點：</strong>${state.session.fear}</span>
        <span><strong>希望池：</strong>${state.session.hopePool}</span>
      </div>
    </section>
  `;
}
