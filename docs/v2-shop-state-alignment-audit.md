# TRPG Assistant v2 商店與資產 State 對齊盤點報告

本報告依據 `docs/v2-shop-item-schema.md`，盤點目前 `main` 上 v2 的 shop、asset、character state 與購買流程。此分支只記錄現況與後續最小方案，不修改程式、資料格式、normalize、UI 或 localStorage。

## 摘要

目前實作可正常完成「目前角色購買、扣款、扣庫存、加入簡易資產清單、寫入簡易購買紀錄」，但資料仍是 MVP 格式：

- `state.shop.items[]` 同時扮演 ItemDefinition 與 ShopListing。
- 玩家資產直接放在 `characters[].assets`，物品／裝備／消耗品都是字串陣列。
- `assets.money` 已是總把數的整數真值，`assets.gold` 是箱／袋／把的同步鏡像。
- `shop.purchaseLog[]` 已有購買快照，但欄位不足以成為完整 TransactionRecord。
- `normalizeState()` 已有安全 fallback，但會先把部分資產陣列限制為字串，未來直接寫入 inventory object 會有被丟棄的風險。
- `selectedCharacterId` 與 `currentCharacterId` 在 normalize 後會同步；多數功能實際透過 `getCurrentCharacter()` 讀 `currentCharacterId`，不是直接讀 `selectedCharacterId`。

因此最安全策略是先建立「相容 normalize 層」，保留所有舊欄位，再逐步讓購買流程雙寫新格式；不應立刻替換 localStorage 結構或重寫商店 UI。

## 一、目前實際 State 位置盤點

### 1. 商店資料

- **檔案**：`v2/modules/state.js`
- **函式／物件**：`createDefaultState()`、`normalizeState()`
- **目前位置**：`state.shop`
- **目前欄位**：
  - `shop.items: []`
  - `shop.purchaseLog: []`
- **normalize 行為**：`normalizeState()` 先用 `recordArray()` 過濾，再交給 `normalizeShop()`。
- **對齊狀態**：部分對齊。已有商品清單與購買紀錄容器，但沒有 `itemDefinitions`／`listings` 分層，也沒有 shop schema version。

### 2. 商品資料

- **檔案**：`v2/modules/shop.js`
- **函式／物件**：`normalizeShopItem()`、`normalizeShop()`、`addShopItem()`、`updateShopItem()`
- **目前位置**：`state.shop.items[]`
- **目前欄位**：
  - `id`
  - `name`
  - `type`：`物品`／`裝備`／`消耗品`
  - `price`
  - `stock`
  - `description`
- **對齊狀態**：未完整對齊。
  - 同一筆資料混合物品本體與販售資訊。
  - 缺少 ItemDefinition 的 `category`、`tier`、`tags`、`stackable`、`consumable`、`equippable`、`slot`、`effects`、`notes`。
  - 缺少 ShopListing 的 `itemId`、`nameSnapshot`、`maxStock`、`available`、`rarity`、`tags`、`sortOrder`、`restockRule`、`notes`。

### 3. 價格資料

- **檔案**：`v2/modules/shop.js`、`v2/modules/assets.js`
- **函式／物件**：`normalizeShopItem()`、`formatGold()`、`goldToHandfuls()`、`normalizeGoldFromHandfuls()`
- **目前位置**：`state.shop.items[].price`
- **目前格式**：非負 Number，UI 與購買流程視為「把」。
- **目前防呆**：`Math.max(0, toNumber(item.price))`，但沒有 `Math.trunc()`，理論上仍可保存小數。
- **對齊狀態**：高度接近目標。目標 schema 建議以整數總把數為真值；現況只差保證整數與明確 MoneyAmount 契約。

### 4. 玩家金錢／資產

- **檔案**：`v2/modules/assets.js`、`v2/modules/characters.js`
- **函式／物件**：`normalizeAssets()`、`normalizeGold()`、`updateCharacterMoney()`、`updateCharacterGold()`
- **目前位置**：`state.characters[].assets`
- **目前欄位**：
  - `money`：總把數
  - `gold: { chests, bags, handfuls }`
  - `items: string[]`
  - `equipment: string[]`
  - `consumables: string[]`
- **同步規則**：`normalizeAssets()` 由 `gold` 或舊 `money` 推導標準 gold，再將 `money` 回寫為總把數。
- **對齊狀態**：金錢大致對齊；PlayerAsset 未對齊。
  - 沒有獨立 `characterId`（因 assets 內嵌於 character）。
  - 沒有正式 `inventory: PlayerInventoryItem[]` 與 asset `notes`。
  - `equipment` 現為字串陣列，不是 PlayerInventoryItem。

### 5. 玩家背包／inventory

- **檔案**：`v2/modules/state.js`、`v2/modules/assets.js`、`v2/modules/characters.js`
- **函式／物件**：`sanitizeCharacter()`、`normalizeAssets()`、`addAssetEntry()`、`updateAssetEntry()`、`deleteAssetEntry()`
- **目前位置**：主要使用：
  - `characters[].assets.items: string[]`
  - `characters[].assets.equipment: string[]`
  - `characters[].assets.consumables: string[]`
- **特殊現況**：`sanitizeCharacter()` 會建立 `assets.inventory` 並限制為 `string[]`，但 `normalizeAssets()` 回傳時沒有保留 `inventory`，因此 inventory 不是目前穩定持久欄位。
- **對齊狀態**：未對齊 PlayerInventoryItem。
  - 缺 `id`、`itemId`、`nameSnapshot`、`quantity`、`acquiredFrom`、`acquiredAt`、`equipped`、`slot`、`notes`、`customData`。
  - 使用陣列 index 編輯／刪除條目，無穩定 item instance ID。
  - 購買同品項只追加名稱，不合併 quantity。

### 6. 角色資料

- **檔案**：`v2/modules/characters.js`
- **函式／物件**：`normalizeCharacter()`、`normalizeCharacters()`、`createCharacter()`、`updateCharacter()`
- **目前位置**：`state.characters[]`
- **目前欄位**：
  - `id`
  - `name`
  - `color`
  - `notes`
  - `stats`
  - `attributes`
  - `assets`
  - `conditions`
  - `buffs`
  - `debuffs`
- **對齊狀態**：角色容器足以承載目前資產，但與目標 PlayerAsset 的獨立型別尚未明確分層。

### 7. selectedCharacterId

- **檔案**：`v2/modules/state.js`、`v2/modules/characters.js`、`v2/app.js`
- **函式／物件**：`createDefaultState()`、`normalizeState()`、`getCurrentCharacter()`、`selectCharacter()`、app 的 `[data-character-select]` change handler
- **目前位置**：
  - `state.ui.selectedCharacterId`
  - `state.ui.currentCharacterId`
- **實際規則**：
  - `normalizeState()` 優先讀 `currentCharacterId`，其次 `selectedCharacterId`，再 fallback 第一名角色。
  - normalize 後兩個欄位都寫成同一個 ID。
  - `getCurrentCharacter()` 實際讀 `state.ui.currentCharacterId`。
  - `selectCharacter()` 先更新 `currentCharacterId`，接著 `saveState()`／`normalizeState()` 才同步 `selectedCharacterId`。
- **對齊狀態**：行為上共用同一角色，但存在雙欄位耦合。目標 schema 指定 `selectedCharacterId`，後續應先相容同步，不可立即刪除 `currentCharacterId`。

### 8. 購買流程

- **檔案**：`v2/modules/shop.js`、`v2/app.js`
- **函式／物件**：`purchaseShopItem()`、app 中 `data-action="purchase-shop-item"`
- **目前流程**：
  1. `normalizeShop(state.shop)`。
  2. 依 item ID 找 `shop.items[]`。
  3. `getCurrentCharacter(state)` 取得目前角色。
  4. 檢查角色、商品、庫存、金錢。
  5. 依中文 `type` 映射到 `items`／`equipment`／`consumables`。
  6. 扣 `assets.money`，同步 `assets.gold`。
  7. 將 `item.name` 字串追加到資產陣列。
  8. 商品 `stock - 1`。
  9. 在 `purchaseLog` 前端加入簡易紀錄，最多保留 100 筆。
  10. app 的 `updateState()` 呼叫 `saveState()`，整份 state normalize 後寫入 localStorage。
- **目前購買紀錄欄位**：
  - `id`
  - `characterName`
  - `itemName`
  - `price`
  - `time`
- **對齊狀態**：流程順序大致正確，但未對齊 PlayerInventoryItem 與 TransactionRecord，也未檢查 `available`、`quantity`、`stock === null`。

### 9. normalizeState 目前處理欄位

- **檔案**：`v2/modules/state.js`、`v2/modules/shop.js`、`v2/modules/characters.js`、`v2/modules/assets.js`
- **函式／物件**：`normalizeState()` 與其呼叫的 normalize functions
- **已處理**：
  - 非 object state fallback。
  - `meta`、`session`、`audio`、`ui` object fallback。
  - `characters`、`monsters`、`encounters`、`rolls` 陣列 fallback。
  - 角色 stats、attributes、assets、conditions、buffs、debuffs。
  - `assets.money` 與 `assets.gold` 同步。
  - `assets.items`、`equipment`、`consumables` 陣列 fallback。
  - `shop.items` 與 `purchaseLog` 陣列 fallback。
  - 商品 `id`、`name`、`type`、`price`、`stock`、`description`。
  - 無效目前角色 ID fallback 第一名角色。
  - `rollFormulaDrafts`、`rollEdgeMode`、critical damage UI flag。
- **尚未處理**：
  - state `schemaVersion`。
  - ItemDefinition／ShopListing 分層。
  - 新 listing 欄位預設值。
  - PlayerInventoryItem object normalize。
  - 完整 TransactionRecord normalize。
  - 單筆壞商品／壞 inventory item 的隔離或錯誤標記。

## 二、目前格式 vs 目標 Schema 差異表

| 模型 | 現有欄位／格式 | 目標欄位 | 已存在 | 需要 migration | 舊欄位可先保留 | 風險 | 建議順序 |
|---|---|---|---|---|---|---|---|
| ItemDefinition | `shop.items[].id/name/type/description`；與販售資料混合 | `id, name, category, tier, description, tags, stackable, consumable, equippable, slot, effects, notes` | 部分 | 是 | 是，保留 `name/type/description` | 高 | 先由 normalize 產生相容 definition，不刪舊 item |
| ShopListing | `shop.items[].id/price/stock`；同一筆含商品本體 | `id, itemId, nameSnapshot, price, stock, maxStock, available, rarity, tags, sortOrder, restockRule, notes` | 部分 | 是 | 是，舊 `shop.items` 可作 legacy listings | 高 | ItemDefinition 相容層之後處理 |
| Price / Money | `item.price: number`；`assets.money: number`；另有 `assets.gold` | 整數總把數 MoneyAmount，UI 顯示箱袋把 | 大致是 | 低度 | 是 | 低 | 先補 `Math.trunc` 與明確 normalize，維持 money 真值 |
| PlayerInventoryItem | `items/equipment/consumables: string[]` | `id, itemId, nameSnapshot, quantity, acquiredFrom, acquiredAt, equipped, slot, notes, customData` | 否 | 是 | 必須保留字串陣列 | 高 | 新增 `inventory[]` 並雙寫，暫不刪舊陣列 |
| PlayerAsset | 內嵌 `character.assets`：`money/gold/items/equipment/consumables` | `characterId, money, inventory, equipment, notes` | 部分 | 是 | 是 | 中 | 先保留內嵌位置，只補 `inventory/notes`，不抽離 state |
| TransactionRecord | `purchaseLog`: `id, characterName, itemName, price, time` | `id, type, characterId, shopListingId, itemId, itemNameSnapshot, price, quantity, createdAt, notes` | 部分 | 是 | 是 | 中 | 購買流程 branch 雙寫新欄位，render 相容兩種格式 |

### 補充風險

- **高風險：inventory object 被轉成字串或丟失**。`sanitizeCharacter()` 與 `normalizeAssets()` 現在以字串陣列為前提，不能直接把 object 寫入現有 `items`。
- **高風險：拆分 shop items 時 ID 關係斷裂**。現有 item ID 同時是商品與 listing ID，migration 必須明確產生並保存 `itemId`。
- **中風險：雙目前角色欄位**。購買實際讀 `currentCharacterId`；文件目標寫 `selectedCharacterId`。在移除舊欄位前必須保持 normalize 同步。
- **中風險：purchaseLog 顯示假設舊欄位**。直接改成 TransactionRecord 會讓目前 UI 的 `characterName/itemName/time` 變成 undefined。
- **低風險：金錢**。現有整數把數方向正確，只需補強整數化與單一真值約定。

## 三、最小安全對齊方案

### 原則

1. 保留現有 `shop.items`、`assets.items/equipment/consumables`、簡易 purchaseLog 欄位。
2. 第一階段只新增欄位與 normalize，不改 UI 與購買行為。
3. 不直接移動 `characters[].assets` 到新的頂層 state。
4. 不直接把現有字串陣列改成 object 陣列。
5. 所有新格式都要能由舊格式推導，且 normalize 必須可重複執行。
6. 壞的單筆商品／資產條目應 fallback，不可讓整份 state 啟動失敗。

### 建議相容結構

第一步可在不破壞現況下增加：

```js
state.meta.schemaVersion = 1;
state.shop.itemDefinitions = [];
state.shop.listings = [];
character.assets.inventory = [];
character.assets.notes = "";
```

但舊欄位仍保留：

```js
state.shop.items = [];
character.assets.items = [];
character.assets.equipment = [];
character.assets.consumables = [];
```

normalize 建議：

- 若只有舊 `shop.items`，為每筆建立相容 ItemDefinition 與 ShopListing。
- `listing.id` 暫時可沿用舊 item ID，`itemId` 使用可重現的 `item-${legacyId}`。
- 若只有舊字串資產，不要立刻移除；可以在 migration 明確執行時建立 inventory snapshot。
- `money` 保持總把數真值，`gold` 繼續作 UI 鏡像。
- purchaseLog 先補新欄位，同時保留 `characterName/itemName/time`，直到 UI 已切換。
- `currentCharacterId` 與 `selectedCharacterId` 繼續雙向 normalize 成同一值。

### 購買流程後續雙寫

normalize 穩定後，購買流程再逐步改為：

1. 以 selected/current 相容 resolver 取得角色。
2. 讀 listing 與 definition；舊 item 則走相容 adapter。
3. 扣現有 `assets.money` 並同步 gold。
4. 寫入新 `assets.inventory[]`。
5. 在過渡期同步寫入舊 `items/equipment/consumables` 字串陣列，確保現有資產 UI 不消失。
6. 寫入完整 TransactionRecord，同時保留舊顯示欄位。
7. 扣 listing stock；同步舊 item stock。
8. 一次 `saveState()`。

這個策略避免同一 branch 同時重寫 schema、購買流程與 UI。

## 四、建議實作階段

### 1. `codex/v2-shop-state-normalize`

只做 state schema 與 normalize：

- 新增 `meta.schemaVersion`。
- 補 ShopListing／ItemDefinition 相容欄位或相容集合。
- 補 `assets.inventory`、`assets.notes` 安全預設值。
- 補 purchaseLog 新欄位 normalize。
- 保留所有舊欄位與現有 UI。
- 加入舊資料、缺欄位、壞單筆資料的純函式測試。

不改購買流程，不改 UI。

### 2. `codex/v2-shop-purchase-flow-align`

只做購買流程：

- 使用 selected/current 相容 resolver。
- 檢查 listing `available`、stock、money。
- 寫入 PlayerInventoryItem。
- 過渡期雙寫舊資產字串陣列。
- 寫入完整 TransactionRecord 與舊顯示快照。
- 維持單次 state update。

不改 DM 商品編輯 UI。

### 3. `codex/v2-shop-item-editor-align`

只做 DM 商品欄位對齊：

- 編輯 category、tier、available、rarity、tags 等已正規化欄位。
- 維持現有 compact 管理方式。
- 不做大幅視覺重排。

### 4. `codex/v2-shop-compact-ui-after-schema`

最後才做商店 UI：

- 玩家 listing 顯示與篩選。
- DM 管理列排版。
- inventory 與交易紀錄顯示新欄位。
- 響應式壓縮。

不在此之前做匯出／匯入。

## 五、明確禁止下一步直接做的事

目前不應直接：

- 做一鍵匯出／匯入。
- 大改玩家或 DM 商店 UI。
- 重寫整個 `shop.js`。
- 直接替換 localStorage 中的完整 state。
- 刪除 `shop.items`、`assets.items`、`assets.equipment`、`assets.consumables`。
- 把現有字串陣列原地改成 object 陣列。
- 未先寫 normalize 就讓購買流程輸出新格式。
- 未提供相容 render 就把 purchaseLog 換成完整 TransactionRecord。
- 立即刪除 `currentCharacterId` 或只保留 `selectedCharacterId`。
- 同一 branch 同時修改 state、購買流程、DM editor、玩家商店與匯入工具。
- 以 UI 隱藏代替資料 migration。
- 遇到舊資料錯誤時自動清空 localStorage。

## 六、下一個 Branch 建議

建議下一個 branch：

```text
codex/v2-shop-state-normalize
```

目標只做：

- 增加 schemaVersion 與新欄位安全預設。
- 建立舊 ShopItem 到 ItemDefinition／ShopListing 的相容 normalize。
- 建立 PlayerInventoryItem／TransactionRecord 的 normalize 骨架。
- 保留舊欄位、購買流程與 UI 原樣。
- 驗證舊 localStorage 不丟商品、不丟角色資產、不造成全黑。

這是風險最低、也最能為後續購買流程對齊建立穩定地基的步驟。
