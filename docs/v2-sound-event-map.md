# TRPG Assistant v2 Sound Event Map

本文件定義 TRPG Assistant v2 的音效事件清單與 sound id 命名。此文件只做規劃，不代表已實作。

## 設計原則

- BGM：持續背景音樂，單一主要播放層。
- SFX：短音效，可一次性疊加。
- Ambient：可循環環境聲，應與 BGM 分開管理。
- UI 類音效短、輕、低音量，不應造成疲勞。
- Gameplay 類音效可更明確，重要事件可暫時壓低 BGM。
- 所有事件應以 sound id 觸發，不直接綁定檔名。

## 命名規則

```text
<domain>.<event>.<variant>
```

範例：

- `ui.click.soft`
- `system.save.success`
- `dice.natural20.heroic`
- `player.hp.zero`
- `shop.buy.success`
- `dm.boss.intro`

## System Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `system.boot.start` | 開啟網站 | 柔和魔法啟動、紙張展開 | 1.5-3s | 45% | 否 | SFX | System |
| `system.boot.ready` | 完成啟動 | 低亮度鐘聲、書頁落定 | 0.8-1.5s | 35% | 否 | SFX | System |
| `system.save.success` | 存檔成功 | 羽毛筆完成、封蠟 | 0.4-0.9s | 30% | 否 | SFX | System |
| `system.save.failed` | 存檔失敗 | 低沉破裂、短警示 | 0.4-0.9s | 35% | 否 | SFX | System |
| `system.import.success` | JSON 匯入成功 | 卷軸展開、印章落下 | 0.8-1.5s | 35% | 否 | SFX | System |
| `system.export.success` | JSON 匯出成功 | 紙張收束、封蠟 | 0.6-1.2s | 30% | 否 | SFX | System |
| `system.warning` | Warning | 低音木鈴、暗色提示 | 0.25-0.6s | 28% | 限制 | SFX | System |
| `system.error` | Error | 低沉破裂、暗色鐘聲 | 0.4-1s | 38% | 否 | SFX | System |
| `system.confirm` | Confirm | 明亮小印章 | 0.15-0.35s | 25% | 否 | SFX | UI |
| `system.cancel` | Cancel | 低沉退回、紙張收起 | 0.15-0.35s | 22% | 否 | SFX | UI |

## UI Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `ui.click.soft` | 一般 click | 皮革、木質、墨筆點擊 | 60-120ms | 12-18% | 否 | SFX | UI |
| `ui.hover.soft` | Hover | 很輕的紙面摩擦或空氣感 | 40-90ms | 8-12% | 否 | SFX | UI |
| `ui.page.switch` | 切換頁面 | 羊皮紙翻頁 | 120-300ms | 20% | 限制 | SFX | UI |
| `ui.tab.switch` | 切換 Tab | 輕木扣聲、紙張滑動 | 100-240ms | 18% | 限制 | SFX | UI |
| `ui.longpress` | Long click | 低摩擦、皮革拉動 | 0.2-0.5s | 20% | 限制 | SFX | UI |
| `ui.drag.start` | 拖曳開始 | 皮革拉起 | 0.2-0.4s | 20% | 否 | SFX | UI |
| `ui.drag.drop` | 拖曳放開 | 木面放下、紙張落定 | 0.2-0.5s | 22% | 否 | SFX | UI |
| `ui.modal.open` | Modal 開啟 | 卷軸展開 | 0.25-0.6s | 25% | 否 | SFX | UI |
| `ui.modal.close` | Modal 關閉 | 卷軸收起 | 0.2-0.5s | 22% | 否 | SFX | UI |
| `ui.popup.open` | Popup | 小符文彈出 | 0.15-0.4s | 22% | 限制 | SFX | UI |

## Player Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `player.character.switch` | 切換角色 | 角色牌翻面、短魔法閃光 | 0.3-0.7s | 30% | 否 | SFX | Gameplay |
| `player.hp.change` | HP 改變 | 心跳、皮革碰撞 | 0.25-0.6s | 30% | 限制 | SFX | Gameplay |
| `player.hp.damage` | 受到傷害 | 肉身衝擊、低鼓 | 0.5-1.2s | 45% | 可 | SFX | Combat |
| `player.hp.heal` | 治療 | 溫暖魔法、氣息回流 | 0.8-2s | 40% | 可 | SFX | Magic |
| `player.hp.zero` | HP 歸零 | 低鼓、破裂、風聲抽離 | 1.5-3s | 50% | 否 | SFX | Combat |
| `player.stress.increase` | 壓力增加 | 緊繃弦音 | 0.3-0.9s | 30% | 限制 | SFX | Gameplay |
| `player.stress.decrease` | 壓力減少 | 放鬆吐息、低弦釋放 | 0.3-0.9s | 28% | 限制 | SFX | Gameplay |
| `player.hope.increase` | 希望增加 | 明亮星光、小和弦 | 0.4-1.2s | 35% | 可 | SFX | Reward |
| `player.hope.decrease` | 希望減少 | 失落低鈴、光點熄滅 | 0.4-1.2s | 32% | 限制 | SFX | Penalty |
| `player.shield.increase` | 護盾增加 | 金屬護符、符文亮起 | 0.4-1.2s | 40% | 可 | SFX | Combat |
| `player.shield.break` | 護盾破裂 | 玻璃、金屬裂響 | 0.5-1.4s | 45% | 可 | SFX | Combat |
| `player.buff.add` | Buff | 升起魔紋 | 0.6-1.5s | 35% | 可 | SFX | Magic |
| `player.debuff.add` | Debuff | 腐蝕低語、暗色符文 | 0.6-1.5s | 35% | 可 | SFX | Magic |
| `player.death` | 死亡 | 沉重低鼓、空氣抽離 | 2-4s | 50% | 否 | SFX | Combat |
| `player.revive` | 復活 | 暖光、呼吸回歸 | 2-4s | 45% | 否 | SFX | Magic |
| `player.levelup` | 升級 | 章節完成、光輝和弦 | 2-4s | 45% | 否 | SFX | Reward |

## Dice Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `dice.roll.start` | 開始擲骰 | 骰子入手、木盤聲 | 0.25-0.5s | 30% | 否 | SFX | Dice |
| `dice.roll.loop` | 骰子滾動 | 骰子滾動循環 | 0.5-2s | 28% | 否 | SFX | Dice |
| `dice.roll.success` | 普通成功 | 小亮音、木盤停下 | 0.4-0.9s | 30% | 限制 | SFX | Dice |
| `dice.roll.fail` | 普通失敗 | 低木聲、骰子停歪 | 0.4-0.9s | 30% | 限制 | SFX | Dice |
| `dice.natural20` | Natural 20 | 金屬亮響、勝利短句 | 1.5-3s | 55% | 否 | SFX | Reward |
| `dice.natural1` | Natural 1 | 低音滑落、失誤聲 | 1-2s | 45% | 否 | SFX | Penalty |
| `dice.critical` | Critical | 強烈金屬和弦、低鼓 | 1.5-3s | 55% | 否 | SFX | Reward |

## Shop And Inventory Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `shop.buy.success` | 購買成功 | 錢幣、布袋、帳簿 | 0.3-0.9s | 35% | 可 | SFX | Shop |
| `shop.sell.success` | 販賣成功 | 錢幣回收、帳簿記錄 | 0.3-0.9s | 35% | 可 | SFX | Shop |
| `shop.money.insufficient` | 金錢不足 | 空錢袋、低提示 | 0.4-0.8s | 35% | 否 | SFX | Shop |
| `shop.transaction.complete` | 完成交易 | 封印章 | 0.5-1s | 35% | 否 | SFX | Shop |
| `shop.transaction.failed` | 交易失敗 | 帳簿劃掉 | 0.5-1s | 35% | 否 | SFX | Shop |
| `inventory.item.add` | 新增資產 | 放入背包 | 0.3-0.8s | 28% | 限制 | SFX | Inventory |
| `inventory.item.remove` | 刪除資產 | 取出、丟棄 | 0.3-0.8s | 28% | 限制 | SFX | Inventory |
| `inventory.quantity.up` | 數量增加 | 小錢幣或道具疊加 | 80-180ms | 18% | 限制 | SFX | Inventory |
| `inventory.quantity.down` | 數量減少 | 小道具取下 | 80-180ms | 18% | 限制 | SFX | Inventory |

## DM Events

| Sound ID | 事件 | 風格 | 長度 | 建議音量 | 可重疊 | Layer | 分類 |
|---|---|---|---:|---:|---|---|---|
| `dm.bgm.play` | 播放 BGM | 唱針落下、淡入 | 0.5-1.5s | 25% | 否 | SFX | System |
| `dm.bgm.stop` | 停止 BGM | 唱針抬起、淡出 | 0.5-1.5s | 25% | 否 | SFX | System |
| `dm.sfx.play` | 播放 SFX | 依內容觸發 | 0.2-6s | 40-70% | 可 | SFX | Gameplay |
| `dm.boss.intro` | Boss 登場 | 低鼓、遠雷、銅管衝擊 | 4-8s | 70% | 否 | SFX | Combat |
| `dm.combat.start` | 戰鬥開始 | 戰鼓啟動 | 2-5s | 60% | 否 | SFX | Combat |
| `dm.combat.end` | 戰鬥結束 | 勝利收束、戰鼓停止 | 2-5s | 55% | 否 | SFX | Combat |
| `dm.secret.reveal` | 秘密事件 | 低語、紙頁暗翻 | 1-3s | 45% | 可 | SFX | Mystery |
| `dm.puzzle.success` | 解謎成功 | 鎖開、符文亮起 | 1-3s | 45% | 否 | SFX | Quest |
| `dm.trap.trigger` | 陷阱 | 機關、尖刺、斷裂 | 0.5-2s | 65% | 可 | SFX | Dungeon |
| `dm.horror.stinger` | 恐怖事件 | 反向弦樂、低語、心跳 | 2-6s | 55% | 限制 | SFX | Horror |
| `dm.environment.event` | 環境事件 | 風、雨、火、門、遠獸 | 1-8s | 35-60% | 可 | Ambient/SFX | Ambient |

