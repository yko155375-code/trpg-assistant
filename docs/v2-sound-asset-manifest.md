# TRPG Assistant v2 Sound Asset Manifest

本文件定義音效素材 manifest 的欄位、分類、預設值與素材管理規則。此文件只做規劃，不代表已實作。

## Manifest 目標

音效不應散落在程式各處硬編檔名。所有音效應先進入 manifest，再由事件 sound id 觸發。

## 建議資料格式

```json
{
  "id": "ui.click.soft",
  "label": "UI soft click",
  "category": "ui",
  "layer": "sfx",
  "file": "assets/sound/ui/ui_click_soft_01.webm",
  "fallbackFile": "assets/sound/ui/ui_click_soft_01.mp3",
  "durationMs": 100,
  "volume": 0.16,
  "priority": 20,
  "overlap": false,
  "maxVoices": 1,
  "loop": false,
  "duckBgm": false,
  "duckAmount": 0,
  "cooldownMs": 80,
  "tags": ["ui", "click", "short"],
  "license": "custom-or-library",
  "source": "self-made",
  "notes": "Short parchment UI click."
}
```

## 欄位說明

| 欄位 | 必填 | 說明 |
|---|---|---|
| `id` | 是 | sound id，需與 event map 對應 |
| `label` | 是 | 人類可讀名稱 |
| `category` | 是 | 主分類，如 ui, dice, shop |
| `layer` | 是 | `bgm`, `sfx`, `ambient` |
| `file` | 是 | 主要音檔 |
| `fallbackFile` | 否 | 備用格式 |
| `durationMs` | 建議 | 估計長度 |
| `volume` | 是 | 0 到 1 |
| `priority` | 是 | 0 到 100，越高越重要 |
| `overlap` | 是 | 是否允許重疊播放 |
| `maxVoices` | 是 | 同一 sound id 最大同時播放數 |
| `loop` | 是 | 是否循環 |
| `duckBgm` | 是 | 是否壓低 BGM |
| `duckAmount` | 否 | BGM 壓低比例 |
| `cooldownMs` | 建議 | 防止 UI spam |
| `tags` | 建議 | 搜尋與管理用 |
| `license` | 是 | 授權來源 |
| `source` | 是 | free, paid, self-made |
| `notes` | 否 | 備註 |

## 分類表

| Category | 用途 | 建議來源 |
|---|---|---|
| `ui` | click, hover, tab, modal | 自製或免費 |
| `system` | boot, save, error, import, export | 自製優先 |
| `dice` | dice roll, success, fail, crit | 自製優先 |
| `combat` | damage, death, boss, battle | 付費或自製 |
| `magic` | heal, buff, debuff, spell | 付費或自製 |
| `inventory` | item add/remove, quantity | 免費或自製 |
| `shop` | buy, sell, money | 免費或自製 |
| `quest` | clue, puzzle, objective | 付費或自製 |
| `dungeon` | trap, door, lock, chain | 免費或付費 |
| `town` | tavern, market, crowd | 免費或付費 |
| `monster` | roar, undead, beast | 付費建議 |
| `horror` | stinger, whisper, heartbeat | 付費或自製 |
| `weather` | rain, thunder, wind | 免費可用 |
| `ambient` | forest, cave, city, campfire | 付費建議 |
| `bgm` | background music | 使用者 URL 或授權素材 |
| `stingers` | boss, reveal, battle transition | 付費或自製 |

## 建議資料夾

```text
assets/
  sound/
    ui/
    system/
    dice/
    combat/
    magic/
    inventory/
    shop/
    quest/
    dungeon/
    town/
    monster/
    horror/
    weather/
    ambient/
    bgm/
    sfx/
    stingers/
    raw/
    licenses/
```

## 命名規則

```text
<category>_<event>_<variant>_<index>.<ext>
```

範例：

- `ui_click_soft_01.webm`
- `dice_natural20_heroic_01.webm`
- `shop_buy_success_coins_01.webm`
- `combat_boss_intro_lowdrum_01.webm`

## 音量預設

| 類型 | 預設音量 | 備註 |
|---|---:|---|
| UI | 0.12-0.22 | 最低，避免疲勞 |
| System | 0.25-0.4 | 不應壓過 BGM |
| Dice | 0.28-0.55 | crit 可較高 |
| Gameplay | 0.3-0.55 | 依重要性調整 |
| Boss / Stinger | 0.55-0.75 | 可 duck BGM |
| Ambient | 0.2-0.45 | 長時間播放要低 |
| BGM | 0.35-0.6 | 由使用者控制 |

## 重疊規則

| 類型 | overlap | maxVoices | cooldown |
|---|---|---:|---:|
| UI click | false | 1 | 60-100ms |
| Hover | false | 1 | 120-200ms |
| Dice roll loop | false | 1 | 0 |
| Damage | true | 3 | 120ms |
| Shop coins | true | 3 | 80ms |
| SFX manual trigger | true | 4-8 | 0 |
| Boss intro | false | 1 | 3000ms |
| Horror stinger | limited | 1-2 | 3000ms |
| Ambient | false | 1 per category | 0 |

## BGM Ducking 規則

| 事件 | duckBgm | duckAmount | 建議 |
|---|---|---:|---|
| Natural 20 | true | 0.25 | 短暫壓低 |
| Death | true | 0.35 | 2-4 秒 |
| Boss intro | true | 0.5 | 4-8 秒 |
| Horror stinger | true | 0.35 | 2-6 秒 |
| UI click | false | 0 | 不 duck |
| Shop buy | false | 0 | 不 duck |
| Ambient | false | 0 | Ambient 自身要低音量 |

## 免費 / 付費 / 自製建議

### 適合免費素材

- UI click
- 翻頁
- 錢幣
- 門
- 鎖
- 火焰
- 雨聲
- 風聲
- 基礎城鎮環境音

### 建議付費購買

- Boss intro
- 戰鬥開始 / 結束
- 恐怖 stinger
- 高品質魔法
- 怪物吼聲
- 長循環 ambient
- 地城深層環境音

### 建議自己製作

- TRPG Assistant 品牌啟動音
- 存檔封蠟聲
- 骰子專屬聲
- 希望 / 壓力 / 護盾獨特提示
- DM 秘密事件聲
- 角色切換牌面聲

## 授權紀錄

所有外部素材應在 `assets/sound/licenses/` 建立來源紀錄，至少包含：

- 檔名
- 原始來源 URL
- 授權條款
- 是否可商用
- 是否需署名
- 下載日期
- 修改紀錄

