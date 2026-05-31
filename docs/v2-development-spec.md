# TRPG Assistant v2 開發規格

目標：在同一個 repo 建立 `/v2/` 新版，舊版根目錄先不動。舊版目前有多個 v40-v60 補丁檔，v2 要用乾淨架構重做。

新版入口：

* 舊版：`/trpg-assistant/`
* 新版測試：`/trpg-assistant/v2/`

技術限制：

* 不用 React
* 不用 Vite
* 不用 npm build
* 不接 Supabase
* 不做登入、PIN、權限
* 不加轉場、動畫、特效
* 第一階段只用 HTML / CSS / 原生 JS / ES Modules / localStorage

v2 建議結構：

* `v2/index.html`
* `v2/styles.css`
* `v2/app.js`
* `v2/modules/state.js`
* `v2/modules/storage.js`
* `v2/modules/router.js`
* `v2/modules/player-view.js`
* `v2/modules/dm-view.js`
* `v2/modules/characters.js`
* `v2/modules/assets.js`
* `v2/modules/shop.js`
* `v2/modules/dice.js`
* `v2/modules/monsters.js`
* `v2/modules/public-info.js`
* `v2/modules/audio.js`

使用基準：

* 玩家端：手機優先。
* DM 端：電腦 / 平板優先。

玩家端規格：

* 5 頁：角色 / 資產 / 擲骰 / 商店 / 公開資訊。
* 手機使用底部分頁列。
* 玩家可自行選角色。
* 不做身份驗證。
* 玩家可改角色狀態與資產。
* 修改後自動存入 localStorage。
* 每頁只處理自己的功能，不要互相擠在同一長頁。

DM 端規格：

* 7 頁：總覽 / 玩家 / 怪物 / 骰子 / 商店 / 公開資訊 / 音樂。
* 桌機和平板使用左側側邊欄。
* DM 手機版使用漢堡選單。
* 音樂頁 MVP 只做骨架。

資料模型：

* 採分層 state。
* `meta`：版本、更新時間。
* `session`：場景、公開資訊、GM 筆記、恐懼點、希望池。
* `characters[]`：角色資料。
* `characters[].stats`：HP、壓力、希望、閃避等。
* `characters[].attributes`：六屬性。
* `characters[].assets`：金錢、物品、裝備、消耗品。
* `characters[].conditions`：異常狀態。
* `monsters[]`：怪物。
* `shop.items[]`：商品。
* `shop.purchaseLog[]`：購買紀錄。
* `rolls[]`：擲骰紀錄。
* `audio`：音樂狀態。
* `ui`：目前模式、目前角色、玩家分頁、DM 分頁。

開發階段：

1. 建立 v2 基礎架構：入口、樣式、app、state、storage、router、空白骨架。
2. 完成玩家手機端 5 頁與底部分頁。
3. 完成 DM 端 7 頁、桌機側邊欄、手機漢堡選單。
4. 補核心功能：玩家、資產、擲骰、商店、怪物、公開資訊。
5. 響應式檢查：390px、430px、768px、1024px、1366px。

禁止事項：

* 不要修改舊版根目錄主流程。
* 不要新增 v61、v62 這種補丁檔。
* 不要把轉場、動畫、特效放進 MVP。
* 不要一次做完所有階段。
* 每次只做指定階段。

每次任務完成後回報：

1. 修改檔案
2. 新增檔案
3. 是否動到舊版
4. 如何打開測試
5. localStorage 是否正常
6. 手機檢查結果
7. 桌機 / 平板檢查結果
8. console 是否有錯誤
9. 下一步建議
