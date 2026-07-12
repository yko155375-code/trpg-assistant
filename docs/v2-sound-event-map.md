# TRPG Assistant v2 Sound Event Map

This document defines the canonical sound event ids for TRPG Assistant v2. It is a planning document only; it does not imply that any runtime manifest, JavaScript, or audio files already exist.

## Canonical Rules

### Sound ID Format

Use:

```text
<domain>.<event>[.<variant>]
```

Rules:

- `variant` is optional.
- Two-segment ids such as `dm.sfx` are legal when the event is already specific enough.
- Three-segment ids such as `ui.click.soft` are legal when a variant clarifies intent.
- Existing sound ids must not be renamed without a compatibility reason.
- Sound ids must be unique across the whole event map.

### Legal Categories

Only these lowercase category values are valid:

```text
ui, system, gameplay, dice, shop, inventory, combat, magic, reward, penalty,
quest, mystery, dungeon, monster, horror, weather, ambient, bgm, stinger
```

### Legal Layers

Only these lowercase layer values are valid:

```text
bgm, sfx, ambient
```

Do not use mixed layer values or category names as layer values.

### Overlap Rules

Use `overlapMode` plus `maxVoices`:

| overlapMode | Meaning | maxVoices rule |
|---|---|---:|
| `none` | The same sound must not overlap itself. | `1` |
| `limited` | Limited overlap is allowed. | Positive integer, usually `2-4`. |
| `full` | Overlap is allowed for burst sounds, but still capped. | Positive integer, usually `4-8`. |

Boolean `overlap` is not part of the specification.

## Sound Events

| Sound ID | Event | Style | Length | Default Volume | overlapMode | maxVoices | Layer | Category | Phase |
|---|---|---|---:|---:|---|---:|---|---|---|
| `system.boot.start` | Website opens | Soft magical boot, parchment unfolding | 1.5-3s | 0.45 | none | 1 | sfx | system | phase1 |
| `system.boot.ready` | Boot completed | Low bell, page settles | 0.8-1.5s | 0.35 | none | 1 | sfx | system | phase1 |
| `system.save.success` | Save succeeded | Quill finish, wax seal | 0.4-0.9s | 0.30 | none | 1 | sfx | system | phase1 |
| `system.save.failed` | Save failed | Low crack, short warning | 0.4-0.9s | 0.35 | none | 1 | sfx | system | phase1 |
| `system.import.success` | JSON import succeeded | Scroll accepted, soft chime | 0.8-1.5s | 0.35 | none | 1 | sfx | system | phase1 |
| `system.export.success` | JSON export succeeded | Parchment packed, seal tap | 0.6-1.2s | 0.30 | none | 1 | sfx | system | phase1 |
| `system.warning` | Warning | Low wood bell, dark prompt | 0.25-0.6s | 0.28 | limited | 2 | sfx | system | phase1 |
| `system.error` | Error | Low broken cue | 0.4-1s | 0.38 | none | 1 | sfx | system | phase1 |
| `system.confirm` | Confirm | Bright wax-stamp tap | 0.15-0.35s | 0.25 | none | 1 | sfx | ui | phase1 |
| `system.cancel` | Cancel | Low return tap | 0.15-0.35s | 0.22 | none | 1 | sfx | ui | phase1 |
| `ui.click.soft` | UI click | Leather, wood, ink tap | 60-120ms | 0.16 | none | 1 | sfx | ui | phase1 |
| `ui.hover.soft` | UI hover | Very light paper brush | 40-90ms | 0.10 | none | 1 | sfx | ui | phase1 |
| `ui.page.switch` | Page switch | Parchment page flip | 120-300ms | 0.20 | limited | 2 | sfx | ui | phase1 |
| `ui.tab.switch` | Tab switch | Small wooden latch | 100-240ms | 0.18 | limited | 2 | sfx | ui | phase1 |
| `ui.longpress` | Long click | Low leather hold | 0.2-0.5s | 0.20 | limited | 2 | sfx | ui | backlog |
| `ui.drag.start` | Drag starts | Leather pull | 0.2-0.4s | 0.20 | none | 1 | sfx | ui | backlog |
| `ui.drag.drop` | Drag drops | Wood/card placement | 0.2-0.5s | 0.22 | none | 1 | sfx | ui | backlog |
| `ui.modal.open` | Modal opens | Scroll unfolds | 0.25-0.6s | 0.25 | none | 1 | sfx | ui | phase1 |
| `ui.modal.close` | Modal closes | Scroll folds | 0.2-0.5s | 0.22 | none | 1 | sfx | ui | phase1 |
| `ui.popup.open` | Popup opens | Small paper pop | 0.15-0.4s | 0.22 | limited | 2 | sfx | ui | phase1 |
| `player.character.switch` | Current character changes | Character card flip, tiny magic glint | 0.3-0.7s | 0.30 | none | 1 | sfx | gameplay | phase2 |
| `player.hp.change` | HP changed | Heartbeat, leather impact | 0.25-0.6s | 0.30 | limited | 2 | sfx | gameplay | phase2 |
| `player.hp.damage` | Damage taken | Body impact, low drum | 0.5-1.2s | 0.45 | full | 4 | sfx | combat | phase2 |
| `player.hp.heal` | Healing | Warm magic breath | 0.8-2s | 0.40 | full | 4 | sfx | magic | phase2 |
| `player.hp.zero` | HP reaches zero | Low hit, breath leaves | 1.5-3s | 0.50 | none | 1 | sfx | combat | phase2 |
| `player.stress.increase` | Stress increases | Tension string | 0.3-0.9s | 0.30 | limited | 2 | sfx | gameplay | phase2 |
| `player.stress.decrease` | Stress decreases | Exhale, loosened string | 0.3-0.9s | 0.28 | limited | 2 | sfx | gameplay | phase2 |
| `player.hope.increase` | Hope increases | Bright star chime | 0.4-1.2s | 0.35 | full | 4 | sfx | reward | phase2 |
| `player.hope.decrease` | Hope decreases | Dim bell, falling tone | 0.4-1.2s | 0.32 | limited | 2 | sfx | penalty | phase2 |
| `player.shield.increase` | Shield increases | Metal charm, force shimmer | 0.4-1.2s | 0.40 | full | 4 | sfx | combat | phase2 |
| `player.shield.break` | Shield breaks | Glass/ward crack | 0.5-1.4s | 0.45 | full | 4 | sfx | combat | phase2 |
| `player.buff.add` | Buff applied | Rising rune | 0.6-1.5s | 0.35 | full | 4 | sfx | magic | phase4 |
| `player.debuff.add` | Debuff applied | Corrosive whisper | 0.6-1.5s | 0.35 | full | 4 | sfx | magic | phase4 |
| `player.death` | Character death | Heavy low drum, wind pulls away | 2-4s | 0.50 | none | 1 | sfx | combat | phase4 |
| `player.revive` | Character revived | Warm breath and light return | 2-4s | 0.45 | none | 1 | sfx | magic | phase4 |
| `player.levelup` | Level up | Chapter complete, bright chord | 2-4s | 0.45 | none | 1 | sfx | reward | backlog |
| `dice.roll.start` | Roll starts | Dice picked up and thrown | 0.25-0.5s | 0.30 | none | 1 | sfx | dice | phase1 |
| `dice.roll.loop` | Dice rolling | Dice in tray loop | 0.5-2s | 0.28 | none | 1 | sfx | dice | backlog |
| `dice.roll.success` | Roll succeeds | Small bright resolution | 0.4-0.9s | 0.30 | limited | 2 | sfx | dice | phase1 |
| `dice.roll.fail` | Roll fails | Low wooden falloff | 0.4-0.9s | 0.30 | limited | 2 | sfx | dice | phase1 |
| `dice.natural20` | Natural 20 | Golden strike, heroic lift | 1.5-3s | 0.55 | none | 1 | sfx | reward | phase1 |
| `dice.natural1` | Natural 1 | Low slide, mistake sting | 1-2s | 0.45 | none | 1 | sfx | penalty | phase1 |
| `dice.critical` | Critical result | Metallic bright impact | 1.5-3s | 0.55 | none | 1 | sfx | reward | backlog |
| `shop.buy.success` | Buy succeeded | Coins, cloth bag, ledger | 0.3-0.9s | 0.35 | full | 3 | sfx | shop | phase1 |
| `shop.sell.success` | Sell succeeded | Coins returned, ledger mark | 0.3-0.9s | 0.35 | full | 3 | sfx | shop | backlog |
| `shop.money.insufficient` | Not enough money | Empty pouch, low prompt | 0.4-0.8s | 0.35 | none | 1 | sfx | shop | phase1 |
| `shop.transaction.complete` | Transaction completed | Stamp on ledger | 0.5-1s | 0.35 | none | 1 | sfx | shop | backlog |
| `shop.transaction.failed` | Transaction failed | Ledger crossed out | 0.5-1s | 0.35 | none | 1 | sfx | shop | backlog |
| `inventory.item.add` | Asset added | Item placed into pack | 0.3-0.8s | 0.28 | limited | 2 | sfx | inventory | phase2 |
| `inventory.item.remove` | Asset removed | Item lifted away | 0.3-0.8s | 0.28 | limited | 2 | sfx | inventory | phase2 |
| `inventory.quantity.up` | Quantity increased | Coin/item tick up | 80-180ms | 0.18 | limited | 2 | sfx | inventory | phase2 |
| `inventory.quantity.down` | Quantity decreased | Coin/item tick down | 80-180ms | 0.18 | limited | 2 | sfx | inventory | phase2 |
| `dm.bgm.play` | BGM play command | Needle drop, gentle fade in | 0.5-1.5s | 0.25 | none | 1 | sfx | system | phase3 |
| `dm.bgm.stop` | BGM stop command | Needle lift, fade out | 0.5-1.5s | 0.25 | none | 1 | sfx | system | phase3 |
| `dm.sfx.play` | Manual SFX command | Depends on selected SFX | 0.2-6s | 0.40 | full | 6 | sfx | gameplay | phase3 |
| `dm.boss.intro` | Boss intro | Low drum, distant thunder, brass hit | 4-8s | 0.70 | none | 1 | sfx | combat | phase4 |
| `dm.combat.start` | Combat begins | War drum start | 2-5s | 0.60 | none | 1 | sfx | combat | phase4 |
| `dm.combat.end` | Combat ends | Battle release, victory close | 2-5s | 0.55 | none | 1 | sfx | combat | phase4 |
| `dm.secret.reveal` | Secret revealed | Whisper, hidden page turn | 1-3s | 0.45 | limited | 2 | sfx | mystery | phase4 |
| `dm.puzzle.success` | Puzzle solved | Lock opens, rune lights | 1-3s | 0.45 | none | 1 | sfx | quest | phase4 |
| `dm.trap.trigger` | Trap triggered | Mechanism snap, spike/chain | 0.5-2s | 0.65 | full | 4 | sfx | dungeon | phase4 |
| `dm.horror.stinger` | Horror stinger | Reverse strings, whisper, heartbeat | 2-6s | 0.55 | limited | 2 | sfx | horror | phase4 |
| `dm.environment.event` | One-shot environmental event | Door, distant beast, stone shift | 1-8s | 0.45 | full | 4 | sfx | dungeon | backlog |
| `ambient.forest.loop` | Forest ambience loop | Wind, leaves, distant life | loop | 0.32 | none | 1 | ambient | ambient | phase5 |
| `ambient.cave.loop` | Cave ambience loop | Drips, stone air, low room tone | loop | 0.30 | none | 1 | ambient | ambient | phase5 |
| `ambient.dungeon.loop` | Dungeon ambience loop | Stone, chains, far echoes | loop | 0.30 | none | 1 | ambient | ambient | phase5 |
| `ambient.town.loop` | Town ambience loop | Crowd bed, carts, distant bell | loop | 0.28 | none | 1 | ambient | ambient | phase5 |
| `ambient.tavern.loop` | Tavern ambience loop | Muffled crowd, cup, hearth | loop | 0.28 | none | 1 | ambient | ambient | phase5 |
| `ambient.rain.loop` | Rain ambience loop | Rain bed | loop | 0.34 | none | 1 | ambient | weather | phase5 |
| `ambient.thunder.event` | Thunder event | Short thunder strike | 1-5s | 0.55 | limited | 2 | sfx | weather | phase5 |
| `ambient.campfire.loop` | Campfire ambience loop | Fire crackle | loop | 0.26 | none | 1 | ambient | ambient | phase5 |
| `ambient.ruins.loop` | Ruins ambience loop | Wind through old stone | loop | 0.30 | none | 1 | ambient | ambient | phase5 |

## Backlog Policy

`backlog` means the sound id is valid and reserved, but it is not scheduled into a concrete implementation phase yet. Backlog ids must still appear in the manifest coverage table and must use legal category, layer, and overlap values.
