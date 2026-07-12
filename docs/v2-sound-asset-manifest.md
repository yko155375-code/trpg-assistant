# TRPG Assistant v2 Sound Asset Manifest Specification

This document describes the planned asset manifest schema for TRPG Assistant v2 sounds. It is a specification only. No runtime JSON manifest or audio asset file is created by this document.

## Canonical Values

### Sound ID Format

Use:

```text
<domain>.<event>[.<variant>]
```

`variant` is optional, so both two-segment and three-segment sound ids are legal. Existing sound ids should not be renamed without a compatibility reason.

### Legal Categories

```text
ui, system, gameplay, dice, shop, inventory, combat, magic, reward, penalty,
quest, mystery, dungeon, monster, horror, weather, ambient, bgm, stinger
```

### Legal Layers

```text
bgm, sfx, ambient
```

### Overlap Rules

Use `overlapMode` plus `maxVoices`; do not use a boolean `overlap` field.

| overlapMode | Meaning | maxVoices rule |
|---|---|---:|
| `none` | No overlap for the same sound id. | `1` |
| `limited` | A small capped overlap is allowed. | Positive integer. |
| `full` | Overlap is allowed for burst sounds but still capped. | Positive integer. |

## Planned Manifest Record Shape

```json
{
  "id": "ui.click.soft",
  "label": "UI soft click",
  "category": "ui",
  "layer": "sfx",
  "defaultVolume": 0.16,
  "priority": 20,
  "overlapMode": "none",
  "maxVoices": 1,
  "loop": false,
  "duckBgm": false,
  "duckAmount": 0,
  "cooldownMs": 80,
  "phase": "phase1",
  "assetStatus": "planned",
  "tags": ["ui", "click", "short"],
  "license": "tbd",
  "source": "tbd",
  "notes": "No file path is listed until a real asset exists."
}
```

No file path should be listed until the asset exists. Do not pretend an audio file is ready.

## Field Rules

| Field | Required | Rule |
|---|---|---|
| `id` | yes | Must match a Sound Event Map id. |
| `label` | yes | Human-readable label. |
| `category` | yes | Must use the canonical lowercase category list. |
| `layer` | yes | Must be `bgm`, `sfx`, or `ambient`. |
| `defaultVolume` | yes | Number from 0 to 1. |
| `priority` | yes | Integer from 0 to 100. |
| `overlapMode` | yes | `none`, `limited`, or `full`. |
| `maxVoices` | yes | Positive integer. |
| `loop` | yes | Boolean. |
| `duckBgm` | yes | Boolean. |
| `duckAmount` | yes | Number from 0 to 1. |
| `cooldownMs` | yes | Non-negative integer. |
| `phase` | yes | One of `phase0` through `phase7`, or `backlog`. |
| `assetStatus` | yes | `missing`, `planned`, or `ready`. |
| `tags` | optional | Search and organization tags. |
| `license` | optional | License state or reference. |
| `source` | optional | `free`, `paid`, `self-made`, or `tbd`. |
| `notes` | optional | Implementation notes. |

## Asset Status Values

| assetStatus | Meaning |
|---|---|
| `missing` | Needed, but not sourced or designed yet. |
| `planned` | Planned in the design and ready for sourcing. |
| `ready` | Real audio exists and has licensing notes. |

Current status for all entries is `planned` because no audio files are included in this spec branch.

## Manifest Coverage Table

| id | category | layer | defaultVolume | priority | overlapMode | maxVoices | loop | duckBgm | cooldownMs | phase | assetStatus |
|---|---|---|---:|---:|---|---:|---|---|---:|---|---|
| `system.boot.start` | system | sfx | 0.45 | 50 | none | 1 | false | false | 1000 | phase1 | planned |
| `system.boot.ready` | system | sfx | 0.35 | 45 | none | 1 | false | false | 500 | phase1 | planned |
| `system.save.success` | system | sfx | 0.30 | 45 | none | 1 | false | false | 250 | phase1 | planned |
| `system.save.failed` | system | sfx | 0.35 | 60 | none | 1 | false | false | 500 | phase1 | planned |
| `system.import.success` | system | sfx | 0.35 | 45 | none | 1 | false | false | 500 | phase1 | planned |
| `system.export.success` | system | sfx | 0.30 | 45 | none | 1 | false | false | 500 | phase1 | planned |
| `system.warning` | system | sfx | 0.28 | 55 | limited | 2 | false | false | 800 | phase1 | planned |
| `system.error` | system | sfx | 0.38 | 70 | none | 1 | false | false | 1000 | phase1 | planned |
| `system.confirm` | ui | sfx | 0.25 | 35 | none | 1 | false | false | 200 | phase1 | planned |
| `system.cancel` | ui | sfx | 0.22 | 30 | none | 1 | false | false | 200 | phase1 | planned |
| `ui.click.soft` | ui | sfx | 0.16 | 20 | none | 1 | false | false | 80 | phase1 | planned |
| `ui.hover.soft` | ui | sfx | 0.10 | 10 | none | 1 | false | false | 160 | phase1 | planned |
| `ui.page.switch` | ui | sfx | 0.20 | 25 | limited | 2 | false | false | 120 | phase1 | planned |
| `ui.tab.switch` | ui | sfx | 0.18 | 25 | limited | 2 | false | false | 120 | phase1 | planned |
| `ui.longpress` | ui | sfx | 0.20 | 20 | limited | 2 | false | false | 200 | backlog | planned |
| `ui.drag.start` | ui | sfx | 0.20 | 20 | none | 1 | false | false | 120 | backlog | planned |
| `ui.drag.drop` | ui | sfx | 0.22 | 20 | none | 1 | false | false | 120 | backlog | planned |
| `ui.modal.open` | ui | sfx | 0.25 | 25 | none | 1 | false | false | 200 | phase1 | planned |
| `ui.modal.close` | ui | sfx | 0.22 | 25 | none | 1 | false | false | 200 | phase1 | planned |
| `ui.popup.open` | ui | sfx | 0.22 | 25 | limited | 2 | false | false | 250 | phase1 | planned |
| `player.character.switch` | gameplay | sfx | 0.30 | 35 | none | 1 | false | false | 250 | phase2 | planned |
| `player.hp.change` | gameplay | sfx | 0.30 | 35 | limited | 2 | false | false | 150 | phase2 | planned |
| `player.hp.damage` | combat | sfx | 0.45 | 60 | full | 4 | false | false | 120 | phase2 | planned |
| `player.hp.heal` | magic | sfx | 0.40 | 55 | full | 4 | false | false | 150 | phase2 | planned |
| `player.hp.zero` | combat | sfx | 0.50 | 75 | none | 1 | false | true | 1500 | phase2 | planned |
| `player.stress.increase` | gameplay | sfx | 0.30 | 40 | limited | 2 | false | false | 200 | phase2 | planned |
| `player.stress.decrease` | gameplay | sfx | 0.28 | 35 | limited | 2 | false | false | 200 | phase2 | planned |
| `player.hope.increase` | reward | sfx | 0.35 | 50 | full | 4 | false | false | 200 | phase2 | planned |
| `player.hope.decrease` | penalty | sfx | 0.32 | 45 | limited | 2 | false | false | 200 | phase2 | planned |
| `player.shield.increase` | combat | sfx | 0.40 | 50 | full | 4 | false | false | 150 | phase2 | planned |
| `player.shield.break` | combat | sfx | 0.45 | 60 | full | 4 | false | false | 150 | phase2 | planned |
| `player.buff.add` | magic | sfx | 0.35 | 50 | full | 4 | false | false | 250 | phase4 | planned |
| `player.debuff.add` | magic | sfx | 0.35 | 50 | full | 4 | false | false | 250 | phase4 | planned |
| `player.death` | combat | sfx | 0.50 | 85 | none | 1 | false | true | 2000 | phase4 | planned |
| `player.revive` | magic | sfx | 0.45 | 80 | none | 1 | false | true | 2000 | phase4 | planned |
| `player.levelup` | reward | sfx | 0.45 | 75 | none | 1 | false | true | 2000 | backlog | planned |
| `dice.roll.start` | dice | sfx | 0.30 | 40 | none | 1 | false | false | 120 | phase1 | planned |
| `dice.roll.loop` | dice | sfx | 0.28 | 35 | none | 1 | false | false | 0 | backlog | planned |
| `dice.roll.success` | dice | sfx | 0.30 | 45 | limited | 2 | false | false | 150 | phase1 | planned |
| `dice.roll.fail` | dice | sfx | 0.30 | 45 | limited | 2 | false | false | 150 | phase1 | planned |
| `dice.natural20` | reward | sfx | 0.55 | 90 | none | 1 | false | true | 2000 | phase1 | planned |
| `dice.natural1` | penalty | sfx | 0.45 | 80 | none | 1 | false | true | 2000 | phase1 | planned |
| `dice.critical` | reward | sfx | 0.55 | 85 | none | 1 | false | true | 2000 | backlog | planned |
| `shop.buy.success` | shop | sfx | 0.35 | 45 | full | 3 | false | false | 80 | phase1 | planned |
| `shop.sell.success` | shop | sfx | 0.35 | 45 | full | 3 | false | false | 80 | backlog | planned |
| `shop.money.insufficient` | shop | sfx | 0.35 | 55 | none | 1 | false | false | 500 | phase1 | planned |
| `shop.transaction.complete` | shop | sfx | 0.35 | 45 | none | 1 | false | false | 400 | backlog | planned |
| `shop.transaction.failed` | shop | sfx | 0.35 | 55 | none | 1 | false | false | 500 | backlog | planned |
| `inventory.item.add` | inventory | sfx | 0.28 | 35 | limited | 2 | false | false | 120 | phase2 | planned |
| `inventory.item.remove` | inventory | sfx | 0.28 | 35 | limited | 2 | false | false | 120 | phase2 | planned |
| `inventory.quantity.up` | inventory | sfx | 0.18 | 20 | limited | 2 | false | false | 80 | phase2 | planned |
| `inventory.quantity.down` | inventory | sfx | 0.18 | 20 | limited | 2 | false | false | 80 | phase2 | planned |
| `dm.bgm.play` | system | sfx | 0.25 | 25 | none | 1 | false | false | 300 | phase3 | planned |
| `dm.bgm.stop` | system | sfx | 0.25 | 25 | none | 1 | false | false | 300 | phase3 | planned |
| `dm.sfx.play` | gameplay | sfx | 0.40 | 50 | full | 6 | false | false | 0 | phase3 | planned |
| `dm.boss.intro` | combat | sfx | 0.70 | 95 | none | 1 | false | true | 3000 | phase4 | planned |
| `dm.combat.start` | combat | sfx | 0.60 | 85 | none | 1 | false | true | 2000 | phase4 | planned |
| `dm.combat.end` | combat | sfx | 0.55 | 80 | none | 1 | false | true | 2000 | phase4 | planned |
| `dm.secret.reveal` | mystery | sfx | 0.45 | 70 | limited | 2 | false | true | 1000 | phase4 | planned |
| `dm.puzzle.success` | quest | sfx | 0.45 | 70 | none | 1 | false | true | 1000 | phase4 | planned |
| `dm.trap.trigger` | dungeon | sfx | 0.65 | 85 | full | 4 | false | true | 800 | phase4 | planned |
| `dm.horror.stinger` | horror | sfx | 0.55 | 90 | limited | 2 | false | true | 3000 | phase4 | planned |
| `dm.environment.event` | dungeon | sfx | 0.45 | 60 | full | 4 | false | false | 500 | backlog | planned |
| `ambient.forest.loop` | ambient | ambient | 0.32 | 35 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.cave.loop` | ambient | ambient | 0.30 | 35 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.dungeon.loop` | ambient | ambient | 0.30 | 35 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.town.loop` | ambient | ambient | 0.28 | 35 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.tavern.loop` | ambient | ambient | 0.28 | 35 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.rain.loop` | weather | ambient | 0.34 | 40 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.thunder.event` | weather | sfx | 0.55 | 70 | limited | 2 | false | true | 3000 | phase5 | planned |
| `ambient.campfire.loop` | ambient | ambient | 0.26 | 30 | none | 1 | true | false | 0 | phase5 | planned |
| `ambient.ruins.loop` | ambient | ambient | 0.30 | 35 | none | 1 | true | false | 0 | phase5 | planned |

## Folder Plan

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
    monster/
    horror/
    weather/
    ambient/
    bgm/
    sfx/
    stinger/
    raw/
    licenses/
```

## Asset Source Guidance

| Source type | Best fit |
|---|---|
| Free assets | UI clicks, page flips, coins, doors, fire, rain, basic ambience. |
| Paid assets | Boss intro, battle cues, horror stingers, high-quality magic, monster roars, long ambience loops. |
| Self-made assets | TRPG Assistant boot identity, save seal, dice signature sounds, hope/stress/shield cues, DM secret reveal. |

License records should eventually live under `assets/sound/licenses/`, but no license files are created in this spec branch.
