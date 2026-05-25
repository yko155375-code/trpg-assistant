# 跑團輔助工具 Codex 工作規範

## 專案目標

這是一款跑團輔助工具，用於支援 DND / 匕首之心 / 自訂奇幻世界觀的劇本管理、角色資料、怪物資料、地圖節點、遭遇設計與主持人流程輔助。

目前專案名稱是「蹦滋噶滋蹦小隊」。此專案是手機優先的靜態 PWA，使用 Supabase 作為共享雲端狀態儲存。

## 目前穩定版本

- App version: `v0.1.4 穩定同步版`
- Public state room: `main`
- Supabase table: `public.rooms`
- Browser storage key: `trpg-assistant-state-v24`

每次修改使用者看得到的行為時，必須同步更新：

- `index.html` 的可見版本標籤
- 被修改檔案的 script query，例如 `sync-fix.js?v=...` 或 `app.js?v=...`
- `sw.js` 的 `cacheName`

## 主要檔案

- `index.html`: app shell、可見版本標籤、script 載入順序。
- `app.js`: 主要 app 邏輯、render、骰子工具、狀態修改。
- `sync-fix.js`: 雲端同步保護、可靠儲存與拉取流程。
- `styles.css`: 手機與桌面 responsive UI。
- `sw.js`: service worker 快取清單與快取版本。
- `manifest.webmanifest`: PWA metadata。
- `assets/`: icon 與場景圖。

## 工作原則

- 優先維持現有功能穩定，不做無關重構。
- 每次修改前先說明問題、影響範圍、預期修改檔案。
- 優先產出小型、可審查的 diff。
- 不要刪除既有世界觀資料、角色資料、怪物資料或劇本資料，除非任務明確要求。
- 若發現資料結構混亂，先提出整理方案，不要直接大改 schema。
- UI 修改要兼顧桌面與手機版，手機版優先。
- 所有新功能都要保留給 DM 手動覆寫的空間，不要假設 AI 判斷一定正確。
- 保留繁體中文 UI。
- 不要移除 DM / 玩家模式，除非任務明確要求。
- 不要把 Supabase service-role key 或 secret key 放進前端或 repo。
- Supabase publishable key 可以出現在前端。
- 修改同步行為時，優先改 `sync-fix.js`，並以雙分頁測試思考：A 分頁編輯，B 分頁應在短時間內更新。

## 測試與驗證

請依專案實際技術棧執行最小可行驗證：

- 若是 Node / React / Next 專案，優先嘗試：
  - `npm run lint`
  - `npm run test`
  - `npm run build`
- 此專案目前是靜態 PWA，沒有固定 build step。若沒有 package scripts，請至少確認：
  - public/static page 能載入。
  - 版本標籤可見。
  - `index.html` scripts 指向正確版本。
  - `sw.js` cache name 已更新。
  - 新增/刪除玩家不會幾秒後復原。
  - 輸入框 focus 時不會被雲端同步覆蓋。
  - 若修改 Supabase schema 或 policy，要用 SQL 查詢驗證並檢查 RLS 影響。
- 若測試無法執行，請明確說明原因與應執行的驗證指令。

## 自動化審查重點

每次自動掃描時檢查：

- 是否有明顯 bug、型別錯誤、壞掉的 import。
- 劇本、角色、怪物、地圖資料是否有重複欄位或結構不一致。
- 是否有硬編碼規則，導致未來難以支援不同 TRPG 系統。
- 是否有 UI/UX 流程會讓 DM 操作成本過高。
- 是否有安全風險，例如 API key、私密資料、玩家個資被寫入 repo。
- 是否有可以拆成小任務的優化項目。

## 版本規則

- Patch fix: `v0.1.x`
- Small feature: `v0.2`
- Larger stable release: `v1.0`

## 已知限制

- Netlify 可能因免費用量限制暫停公開站台。
- 若 Netlify 被暫停，GitHub 仍保有最新程式，但公開網址無法提供最新版本，直到恢復 hosting 或改用其他 hosting。
- 本機 Windows 環境可能沒有 Git。除非 `git` 指令實際可用且 commit 成功，否則不要聲稱已完成本機 commit。

## 自動化工作方式

- 優先從 Git branch 或乾淨 worktree 工作。
- 保持 diff 小而聚焦。
- 除非任務要求，不要重寫整個 app。
- 同步修正優先改 `sync-fix.js`。
- shell / version / script 載入修正優先改 `index.html`。
- 每次完成都要附上修改檔案與驗證結果。

## 輸出格式

每次回報請使用：

1. 本次掃描範圍
2. 發現的問題
3. 優先級：P0 / P1 / P2 / P3
4. 建議修法
5. 已修改檔案或建議修改檔案
6. 驗證結果
