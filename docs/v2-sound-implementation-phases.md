# TRPG Assistant v2 Sound Implementation Phases

本文件規劃完整音效系統的分階段實作順序。此文件只做規劃，不代表已實作。

## 不變前提

- 已有 BGM Layer。
- 已有 SFX Layer。
- 不應破壞現有 DM 音樂 URL 播放。
- 不應破壞資料保存、JSON 匯出 / 匯入、商店交易歷史。
- 音效應可關閉。
- 音量應可調整。
- 使用者未互動前不可強制播放音訊。

## Phase 0：資料與 UX 規格

目標：先定義資料與觸發規則，不寫實際音效觸發。

產出：

- Sound Event Map
- Sound Asset Manifest
- Sound Setting UX draft
- 音效授權紀錄格式

驗收：

- 每個音效事件有 sound id。
- 每個 sound id 有分類、音量、重疊規則。
- 可以判斷哪些是 UI / Gameplay / Ambient。

## Phase 1：UI / System / Dice / Shop 短音效

目標：建立最低風險的短音效層。

範圍：

- `ui.click.soft`
- `ui.tab.switch`
- `ui.modal.open`
- `ui.modal.close`
- `system.save.success`
- `system.save.failed`
- `system.import.success`
- `system.export.success`
- `dice.roll.start`
- `dice.roll.success`
- `dice.roll.fail`
- `dice.natural20`
- `dice.natural1`
- `shop.buy.success`
- `shop.money.insufficient`

設計要求：

- 所有 UI 音效都有 cooldown。
- 不可讓 hover 音效過度觸發。
- Dice 音效不得影響 formula draft。
- Shop 音效不得影響購買扣款或交易歷史。

驗收：

- 音效開關可用。
- 主音量 / UI 音量 / SFX 音量可調。
- 存檔失敗時不會因音效失敗而黑屏。
- `?safe=1` 仍可用。

## Phase 2：玩家狀態與資產音效

目標：讓玩家常用狀態有清楚但不吵的回饋。

範圍：

- `player.character.switch`
- `player.hp.change`
- `player.hp.damage`
- `player.hp.heal`
- `player.hp.zero`
- `player.stress.increase`
- `player.stress.decrease`
- `player.hope.increase`
- `player.hope.decrease`
- `player.shield.increase`
- `player.shield.break`
- `inventory.item.add`
- `inventory.item.remove`
- `inventory.quantity.up`
- `inventory.quantity.down`

設計要求：

- HP / stress / hope / shield 不改數值規則。
- 音效只能反映成功後的 state change。
- 批次刪除資產時只播放一次彙總音，不要每個 item 連播。
- 切換角色時取消 pending UI 狀態不應額外爆音。

驗收：

- 玩家面板「喚醒」未受影響。
- 希望 / 護盾進度條未受影響。
- 角色進階設定 sticky 未受影響。
- 玩家資產分類停留與 quantity + / - 未受影響。

## Phase 3：DM Manual SFX Trigger

目標：讓 DM 能從音樂 / 音效清單手動播放 SFX，且不影響 BGM。

範圍：

- DM 音樂項目 playbackType 已有 `bgm` / `sfx`。
- 強化 SFX 項目 metadata：
  - category
  - suggestedVolume
  - tags
  - scene
  - cooldown

設計要求：

- SFX 播放不停止 BGM。
- SFX 播放不改 BGM current state。
- SFX 播放完自動釋放。
- 可限制同時播放數。

驗收：

- 播放 BGM 後切換玩家頁不中斷。
- 播放 SFX 時 BGM 不停止、不暫停、不被取代。
- DM 分頁切換不銷毀 BGM。

## Phase 4：Combat / Magic / Monster / Horror Stingers

目標：加入高辨識度 gameplay stinger。

範圍：

- `dm.boss.intro`
- `dm.combat.start`
- `dm.combat.end`
- `dm.trap.trigger`
- `dm.horror.stinger`
- `player.death`
- `player.revive`
- `player.buff.add`
- `player.debuff.add`

設計要求：

- 高優先級 stinger 可 duck BGM。
- 同一類 stinger 需要 cooldown。
- Boss intro 不可重疊。
- Horror stinger 不可頻繁連發。

驗收：

- BGM duck 後會恢復。
- SFX pool 不會累積無效 audio。
- 怪物自然 20 關鍵傷害不受影響。
- 商店與資產功能不受影響。

## Phase 5：Ambient Layer

目標：正式建立第三層 Ambient。

範圍：

- forest
- cave
- dungeon
- town
- tavern
- rain
- thunder
- campfire
- ruins

設計要求：

- Ambient 與 BGM 分開。
- Ambient 可 loop。
- Ambient 可淡入淡出。
- Ambient 音量獨立。
- DM 可停止 Ambient，不影響 BGM。
- Ambient 可同時允許少量組合，例如 rain + campfire，但要有最大層數。

驗收：

- BGM / SFX / Ambient 三層互不破壞。
- 手機瀏覽器不會因多層音訊卡死。
- 切換玩家 / DM / 分頁 Ambient 不被 render 銷毀。

## Phase 6：Sound Settings And Accessibility

目標：讓音效系統可被玩家控制，避免干擾。

設定項：

- Master Volume
- BGM Volume
- SFX Volume
- UI Volume
- Ambient Volume
- Mute All
- Reduce Stingers
- Disable Hover Sounds
- Disable Horror Sounds
- Audio Test Button

設計要求：

- 設定需保存到 localStorage state。
- 匯出 / 匯入應包含音效設定。
- safe mode 不應自動播放任何聲音。

驗收：

- 靜音後沒有任何 SFX。
- BGM 可單獨關閉。
- UI 音效可單獨關閉。
- 恐怖音效可單獨關閉。

## Phase 7：Asset Library And Licensing

目標：建立可維護的素材庫。

內容：

- sound manifest JSON
- license records
- source notes
- paid/free/self-made 標記
- missing asset report

驗收：

- 每個音檔可追溯來源。
- 可辨識商用限制。
- 可替換音檔而不改事件 id。

## 建議開發順序

1. Phase 0：文件與 manifest 草案
2. Phase 1：UI / System / Dice / Shop
3. Phase 2：Player / Inventory
4. Phase 3：DM Manual SFX
5. Phase 4：Combat / Magic / Horror
6. Phase 5：Ambient
7. Phase 6：Settings / Accessibility
8. Phase 7：Licensing cleanup

## 第一個可實作分支建議

```text
codex/v2-sound-event-manifest-foundation
```

只做：

- sound event registry
- manifest default schema
- settings default / normalize
- no actual autoplay
- no asset files yet

