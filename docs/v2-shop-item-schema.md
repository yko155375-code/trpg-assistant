# TRPG Assistant v2 商店品項與玩家資產資料格式規格

本文件定義 TRPG Assistant v2 商店商品、玩家資產、購買紀錄與未來匯出／匯入所使用的資料格式。這是資料契約規格，不代表本階段已實作 migration、匯出／匯入或新版商店 UI。

## 一、目前設計目標

商店與資產資料格式必須支援：

- DM 建立、編輯、上下架與刪除商品。
- 玩家查看目前可購買的商品。
- 玩家以 `state.ui.selectedCharacterId` 指向的目前角色購買。
- 購買時扣除目前角色的金錢。
- 購買完成後，物品進入目前角色的資產／背包。
- 商品庫存、最大庫存與未來補貨規則。
- 依階級、類型、稀有度與標籤進行篩選。
- 未來可安全匯出／匯入資料。
- 未來 schema 變更時可執行可追蹤的 migration。

設計原則：

1. 「物品是什麼」與「商店如何販售」分離。
2. 金錢運算只使用非負整數，不使用浮點數。
3. 玩家背包保留購買當下的名稱快照，避免商品改名後歷史資料失真。
4. 所有持久資料都有穩定 `id`，不可使用陣列 index 當識別碼。
5. 缺少新欄位的舊資料必須能由 normalize／migration 補齊，不得造成啟動失敗或全黑。

## 二、核心資料模型

以下型別使用 TypeScript 風格表示，但 v2 第一階段仍可用原生 JavaScript object 儲存。

### 1. ItemDefinition

`ItemDefinition` 是物品本體定義，回答「這是什麼東西」。同一個物品可以被不同商店以不同價格、庫存或販售條件上架。

```ts
type ItemDefinition = {
  id: string;
  name: string;
  category: ItemCategory;
  tier: 0 | 1 | 2 | 3 | 4;
  description: string;
  tags: string[];
  stackable: boolean;
  consumable: boolean;
  equippable: boolean;
  slot: string | null;
  effects: ItemEffect[];
  notes: string;
};

type ItemEffect = {
  type: string;
  value?: number | string | boolean;
  target?: string;
  description?: string;
};
```

欄位規則：

- `id`：全域穩定 ID，例如 `item-iron-sword` 或 UUID。
- `name`：目前正式名稱。
- `category`：固定分類代碼，見「商店分類建議」。
- `tier`：物品本身的階級。
- `description`：玩家可見說明。
- `tags`：搜尋與篩選用標籤，例如 `近戰`、`火焰`、`單手`。
- `stackable`：是否可在背包中合併數量。
- `consumable`：使用後是否通常會消耗數量。
- `equippable`：是否可裝備。
- `slot`：裝備槽，例如 `main-hand`、`off-hand`、`armor`；不可裝備時為 `null`。
- `effects`：結構化效果。未知或純敘事效果可只填 `description`。
- `notes`：DM 或資料維護備註；是否顯示給玩家由 UI 決定。

### 2. ShopListing

`ShopListing` 是商店販售項目，回答「這間商店如何販售這個物品」。它引用 `ItemDefinition`，但保留名稱快照以提高歷史相容性。

```ts
type ShopListing = {
  id: string;
  itemId: string;
  nameSnapshot: string;
  price: MoneyAmount;
  stock: number | null;
  maxStock: number | null;
  available: boolean;
  rarity: string;
  tags: string[];
  sortOrder: number;
  restockRule: RestockRule | null;
  notes: string;
};

type RestockRule = {
  type: "manual" | "session" | "daily" | "custom";
  amount?: number;
  description?: string;
};
```

欄位規則：

- `id`：販售項目的穩定 ID。
- `itemId`：對應 `ItemDefinition.id`。
- `nameSnapshot`：建立或最後同步販售項目時的名稱快照。
- `price`：整數金額，建議格式見下一節。
- `stock`：目前庫存；`null` 表示不限量。
- `maxStock`：最大庫存；`null` 表示未限制或不適用。
- `available`：DM 可直接控制是否上架。
- `rarity`：稀有度代碼，例如 `common`、`uncommon`、`rare`、`legendary`。
- `tags`：商店層級標籤，例如 `本週特價`、`黑市`。
- `sortOrder`：穩定排序數字。
- `restockRule`：未來補貨規則；MVP 可為 `null` 或 `manual`。
- `notes`：販售備註，不取代物品本體說明。

### 3. Price / Money

#### 方案 A：分欄保存

```json
{ "boxes": 1, "bags": 2, "handfuls": 3 }
```

優點：

- 與 UI 顯示一致。
- 人工閱讀直覺。

缺點：

- 每次比較、扣款、加總前都必須正規化。
- 容易出現 `{ "bags": 10 }`、負數欄位或不同表示卻同值的資料。
- migration、排序與購買驗證較複雜。

#### 方案 B：統一保存為 handfuls

```ts
type MoneyAmount = {
  handfuls: number;
};
```

或在現有相容階段直接保存整數：

```json
{ "price": 123 }
```

換算規則：

- 1 袋 = 10 把。
- 1 箱 = 10 袋 = 100 把。
- 總把數 = `boxes * 100 + bags * 10 + handfuls`。

#### 建議方案

建議以「非負整數 handfuls」作為唯一計算真值。為了與現有 v2 `assets.money` 和商品單一數字價格相容，實作階段可先沿用：

```ts
type MoneyAmount = number; // 代表總把數
```

若未來需要顯式物件，再 migration 成：

```json
{ "handfuls": 123 }
```

理由：

- 扣款、比較、排序、加總與交易紀錄都只需處理一個整數。
- 不會產生 10 袋與 1 箱兩種不同資料表示。
- 舊版單一 `money`／`price` 數字可直接視為把數，migration 成本最低。
- 可完全避免浮點誤差；所有輸入必須取整並 clamp 到 `>= 0`。

UI 顯示時才轉成箱／袋／把：

```js
const boxes = Math.floor(totalHandfuls / 100);
const bags = Math.floor((totalHandfuls % 100) / 10);
const handfuls = totalHandfuls % 10;
```

例如 `123` 顯示為 `1箱 2袋 3把`。UI 修改箱／袋／把後，再換算回總把數保存。

### 4. PlayerInventoryItem

`PlayerInventoryItem` 是某位角色實際持有的物品實例或堆疊。

```ts
type PlayerInventoryItem = {
  id: string;
  itemId: string;
  nameSnapshot: string;
  quantity: number;
  acquiredFrom: string;
  acquiredAt: string;
  equipped: boolean;
  slot: string | null;
  notes: string;
  customData: Record<string, unknown>;
};
```

欄位規則：

- `id`：玩家持有項目的穩定 ID；即使 `itemId` 相同也不可直接共用。
- `itemId`：來源 `ItemDefinition.id`。
- `nameSnapshot`：取得當下的名稱。
- `quantity`：正整數；不可低於 1。可堆疊物品才合併。
- `acquiredFrom`：來源，例如 `shop:<listingId>`、`loot`、`manual`。
- `acquiredAt`：ISO 8601 時間。
- `equipped`：是否已裝備。
- `slot`：目前裝備槽；未裝備為 `null`。
- `notes`：此角色持有實例的備註。
- `customData`：未來耐久、充能、自訂名稱等擴充資料；預設 `{}`。

### 5. PlayerAsset

```ts
type PlayerAsset = {
  characterId: string;
  money: MoneyAmount;
  inventory: PlayerInventoryItem[];
  equipment: PlayerInventoryItem[];
  notes: string;
};
```

欄位規則：

- `characterId`：對應角色 ID。
- `money`：總把數，不可低於 0。
- `inventory`：未裝備或一般持有物品。
- `equipment`：已裝備物品。若實作採單一 inventory，也可由 `equipped` 衍生，但資料契約必須選定單一真值，避免同一物品重複存兩份。
- `notes`：玩家資產備註。

建議未來正式實作時以 `inventory` 為單一真值，`equipment` 可作為相容欄位或衍生 view；在 schema 定稿前不得讓同一 `PlayerInventoryItem.id` 同時存在兩個陣列。

### 6. TransactionRecord

```ts
type TransactionRecord = {
  id: string;
  type: "purchase" | "refund" | "grant" | "remove";
  characterId: string;
  shopListingId: string | null;
  itemId: string;
  itemNameSnapshot: string;
  price: MoneyAmount;
  quantity: number;
  createdAt: string;
  notes: string;
};
```

欄位規則：

- `id`：交易穩定 ID。
- `type`：交易類型。
- `characterId`：交易角色。
- `shopListingId`：非商店交易可為 `null`。
- `itemId`：物品定義 ID。
- `itemNameSnapshot`：交易當下名稱。
- `price`：本次交易總價，以總把數保存。
- `quantity`：正整數。
- `createdAt`：ISO 8601 時間。
- `notes`：交易備註、失敗後補登原因等。

## 三、商店分類建議

```ts
type ItemCategory =
  | "weapon"
  | "armor"
  | "consumable"
  | "tool"
  | "magic"
  | "service"
  | "material"
  | "misc";
```

- `weapon`：主武器、副武器、遠程武器與攻擊用裝備。
- `armor`：護甲、盾牌與主要防禦裝備。
- `consumable`：藥水、食物、卷軸、彈藥等會消耗數量的物品。
- `tool`：工具組、繩索、照明、探索與職業用工具。
- `magic`：不適合歸入一般武器／護甲的魔法物品、護符與奇物。
- `service`：住宿、治療、鑑定、交通、情報等非實體服務。
- `material`：製作材料、素材、礦石、草藥與任務收集物。
- `misc`：暫時無法歸類的其他物品；不應成為預設濫用分類。

UI 顯示可中文化，但 state 中保存固定英文代碼，避免匯出／匯入與篩選因顯示文案變動而失效。

## 四、階級 / tier 規則

- `0`：普通／劇情物。一般用品、服務、任務物或不參與戰力階級的物品。
- `1`：初階。新角色與初期冒險可取得。
- `2`：中階。角色成長後的常規升級品。
- `3`：高階。需要較高 campaign 進度或特殊條件。
- `4`：稀有／傳奇。劇情核心、傳奇或高度受限物品。

規則：

- 玩家端可依 campaign 階段設定允許顯示的 tier 集合，例如 `[0, 1, 2]`。
- DM 可透過 `ShopListing.available` 覆寫個別販售項目是否上架。
- `available = false` 時即使 tier 已開放也不可購買。
- 未來可依 `tier`、`category`、`rarity`、`tags` 組合篩選。
- tier 是物品定義的一部分；商店若需要特殊販售限制，應使用 listing 的 `available` 或 tags，不應竄改物品 tier。

## 五、購買流程資料規則

購買必須以單一不可分割的 state 更新完成，避免扣款成功但物品或紀錄未寫入。

1. 讀取 `state.ui.selectedCharacterId`。
2. 找到對應 character 與 player asset；找不到則中止並顯示「請先選擇目前角色」。
3. 取得 `ShopListing`，檢查 `available === true`。
4. 檢查庫存：`stock === null` 表示不限量，否則必須 `stock >= quantity`。
5. 將單價與角色金錢轉成總把數，檢查 `money >= price * quantity`。
6. 扣除角色 money；結果不得低於 0。
7. 若庫存有限，執行 `stock - quantity`；結果不得低於 0。
8. 寫入或合併 `PlayerInventoryItem`：只有 `stackable` 且可安全合併時增加 quantity，否則建立新實例 ID。
9. 寫入 `TransactionRecord`，保留角色、listing、item、名稱快照、實付總價、數量與時間。
10. 對完整 next state 執行 normalize／validate，然後一次 save state。

任何檢查失敗時不得扣款、扣庫存、加入背包或寫入成功交易紀錄。

## 六、匯出 / 匯入前置規則

未來匯出封裝格式建議：

```ts
type V2ExportPackage = {
  schemaVersion: number;
  exportedAt: string;
  appVersion: string;
  state: unknown;
  checksum?: string;
};
```

- `schemaVersion`：資料格式版本，驅動 migration。
- `exportedAt`：ISO 8601 匯出時間。
- `appVersion`：產生匯出檔的應用版本／label。
- `state`：完整或明確宣告的部分 state。
- `checksum`：可選，用於偵測檔案損壞，不作為安全簽章。

現在不實作匯出／匯入，因為 ItemDefinition、ShopListing、PlayerAsset、TransactionRecord 與 money 單一真值尚未在程式中完成 migration。若先做匯出，會把暫時格式固化並增加後續相容負擔。應先定稿 schema、normalize 與 migration，再提供匯入驗證和錯誤回復。

## 七、向下相容與 migration 規則

1. 欄位變更時先標記 deprecated，不立即刪除舊欄位。
2. `normalizeState` 必須為缺失欄位補上安全預設值。
3. 單一壞商品、角色資產或交易紀錄不得造成整站全黑；無法修復的單筆資料應隔離並回報。
4. 舊商品至少要能由 `{ id, name, type, price, stock, description }` 轉成 ItemDefinition 與 ShopListing。
5. 舊 `type` 應透過明確 mapping 轉成 `category`，未知值轉 `misc` 並保留原值於 tags 或 notes。
6. 舊單一數字 `price`、`assets.money` 必須視為總把數，不得改變實際購買力。
7. 舊 `{ chests, bags, handfuls }` 或 `{ boxes, bags, handfuls }` 必須先換算成總把數。
8. migration 必須是版本化且可重複測試的純資料轉換，不應依賴 DOM。
9. migration 完成前保留原始資料備份；失敗時交由 boot guard／安全模式處理，不自動刪除。
10. `schemaVersion` 每次破壞性格式變更才遞增，並提供逐版 migration，例如 `v1 -> v2 -> v3`。

建議舊商品轉換：

```js
const definition = {
  id: old.itemId || `item-${old.id}`,
  name: old.name || "未命名物品",
  category: mapLegacyType(old.type),
  tier: Number.isInteger(old.tier) ? old.tier : 0,
  description: old.description || "",
  tags: [],
  stackable: old.type === "消耗品",
  consumable: old.type === "消耗品",
  equippable: old.type === "裝備",
  slot: null,
  effects: [],
  notes: "",
};

const listing = {
  id: old.id,
  itemId: definition.id,
  nameSnapshot: definition.name,
  price: Math.max(0, Math.trunc(Number(old.price) || 0)),
  stock: old.stock == null ? null : Math.max(0, Math.trunc(Number(old.stock) || 0)),
  maxStock: null,
  available: true,
  rarity: "common",
  tags: [],
  sortOrder: 0,
  restockRule: null,
  notes: "",
};
```

## 八、範例 JSON

### 1. 武器商品

```json
{
  "itemDefinition": {
    "id": "item-iron-longsword",
    "name": "精製長劍",
    "category": "weapon",
    "tier": 1,
    "description": "平衡良好的單手長劍。",
    "tags": ["近戰", "單手", "物理"],
    "stackable": false,
    "consumable": false,
    "equippable": true,
    "slot": "main-hand",
    "effects": [
      {
        "type": "damage",
        "value": "d8",
        "target": "enemy",
        "description": "造成 d8 物理傷害。"
      }
    ],
    "notes": "初階武器示例"
  },
  "shopListing": {
    "id": "listing-town-smith-longsword",
    "itemId": "item-iron-longsword",
    "nameSnapshot": "精製長劍",
    "price": 125,
    "stock": 3,
    "maxStock": 3,
    "available": true,
    "rarity": "common",
    "tags": ["城鎮鐵匠"],
    "sortOrder": 10,
    "restockRule": {
      "type": "manual",
      "amount": 3,
      "description": "由 DM 手動補貨"
    },
    "notes": "UI 顯示價格：1箱 2袋 5把"
  }
}
```

### 2. 消耗品商品

```json
{
  "itemDefinition": {
    "id": "item-minor-healing-potion",
    "name": "微量治療藥水",
    "category": "consumable",
    "tier": 1,
    "description": "飲用後恢復少量生命。",
    "tags": ["藥水", "治療"],
    "stackable": true,
    "consumable": true,
    "equippable": false,
    "slot": null,
    "effects": [
      {
        "type": "heal",
        "value": "1d6",
        "target": "self",
        "description": "恢復 1d6 HP。"
      }
    ],
    "notes": ""
  },
  "shopListing": {
    "id": "listing-apothecary-minor-heal",
    "itemId": "item-minor-healing-potion",
    "nameSnapshot": "微量治療藥水",
    "price": 18,
    "stock": 8,
    "maxStock": 10,
    "available": true,
    "rarity": "common",
    "tags": ["藥房", "常備品"],
    "sortOrder": 20,
    "restockRule": {
      "type": "session",
      "amount": 2,
      "description": "每次新 session 最多補 2 瓶"
    },
    "notes": "UI 顯示價格：0箱 1袋 8把"
  }
}
```

### 3. 玩家購買後的 inventory item

```json
{
  "id": "inventory-char-aria-potion-001",
  "itemId": "item-minor-healing-potion",
  "nameSnapshot": "微量治療藥水",
  "quantity": 2,
  "acquiredFrom": "shop:listing-apothecary-minor-heal",
  "acquiredAt": "2026-06-20T04:30:00+08:00",
  "equipped": false,
  "slot": null,
  "notes": "村口藥房購入",
  "customData": {}
}
```

對應交易紀錄示例：

```json
{
  "id": "transaction-20260620-001",
  "type": "purchase",
  "characterId": "char-aria",
  "shopListingId": "listing-apothecary-minor-heal",
  "itemId": "item-minor-healing-potion",
  "itemNameSnapshot": "微量治療藥水",
  "price": 36,
  "quantity": 2,
  "createdAt": "2026-06-20T04:30:00+08:00",
  "notes": "單價 18 把，總價 36 把"
}
```

## 九、未來實作順序建議

1. 先盤點並整理現有 `shop` state 與 character asset state，列出舊欄位 mapping。
2. 再加入 `schemaVersion`、強化 `normalizeState`，並建立可測試的 migration。
3. 再讓 DM／玩家商店 UI 對齊 ItemDefinition 與 ShopListing。
4. 再穩定購買流程，確保扣款、庫存、背包與 TransactionRecord 是單次 state 更新。
5. 最後才做匯出／匯入、checksum、匯入預覽與錯誤回復。

每一階段應在獨立 `codex/<功能-label>` 分支完成並驗收，不應在同一任務同時重寫 schema、UI、購買流程與匯入工具。
