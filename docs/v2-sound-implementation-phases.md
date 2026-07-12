# TRPG Assistant v2 Sound Implementation Phases

This document schedules the sound system implementation without adding code, audio files, or runtime manifests. Every sound id named here must exist in both:

- `docs/v2-sound-event-map.md`
- `docs/v2-sound-asset-manifest.md`

## Phase 0: Schema And UX Foundation

Goal: lock the naming, category, layer, overlap, manifest, and settings vocabulary before any runtime code or assets are added.

Deliverables:

- Sound Event Map
- Sound Asset Manifest Specification
- Implementation Phases
- Sound settings UX draft in a future branch

Validation requirements:

- Every Sound Event Map id has exactly one matching row in the Manifest Coverage Table.
- Every category uses the legal lowercase category list.
- Every layer is one of `bgm`, `sfx`, or `ambient`.
- Every `overlapMode` is `none`, `limited`, or `full`.
- Every sound id has exactly one phase value.
- There are no duplicate sound ids.
- There are no orphan sound ids.
- Phase references must not mention ids missing from the event map or manifest.

Phase 0 does not implement sound playback.

## Phase 1: UI / System / Dice / Shop Basics

Goal: implement the safest short sounds first.

Sound ids:

- `system.boot.start`
- `system.boot.ready`
- `system.save.success`
- `system.save.failed`
- `system.import.success`
- `system.export.success`
- `system.warning`
- `system.error`
- `system.confirm`
- `system.cancel`
- `ui.click.soft`
- `ui.hover.soft`
- `ui.page.switch`
- `ui.tab.switch`
- `ui.modal.open`
- `ui.modal.close`
- `ui.popup.open`
- `dice.roll.start`
- `dice.roll.success`
- `dice.roll.fail`
- `dice.natural20`
- `dice.natural1`
- `shop.buy.success`
- `shop.money.insufficient`

Implementation notes:

- UI sounds need cooldowns to prevent fatigue.
- Hover sounds must be optional or muted by default if they become annoying.
- Dice sounds must not break formula draft or quick roll behavior.
- Shop sounds must not interfere with purchase validation, money deduction, inventory writes, or transaction history.
- `?safe=1` must remain stable.

## Phase 2: Player Status And Inventory

Goal: add feedback for player state changes and inventory operations.

Sound ids:

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

Implementation notes:

- HP, stress, hope, and shield sounds should be triggered by actual state changes, not by render alone.
- Inventory sounds must work with the single add form, category stay behavior, quantity + / -, and batch delete flow.
- Character switching must not disturb current-character sticky UI.

## Phase 3: DM Manual BGM / SFX Control

Goal: expose and stabilize the existing audio layer split.

Sound ids:

- `dm.bgm.play`
- `dm.bgm.stop`
- `dm.sfx.play`

Implementation notes:

- BGM and SFX must stay as independent audio layers.
- Manual SFX playback must not stop, pause, replace, or reset the current BGM.
- BGM must not be destroyed by DM/player page re-render.
- Existing URL-based BGM/SFX behavior should not be expanded into a YouTube API rewrite in this phase.

## Phase 4: Combat / Magic / Quest / Horror Stingers

Goal: add high-impact gameplay stingers.

Sound ids:

- `player.buff.add`
- `player.debuff.add`
- `player.death`
- `player.revive`
- `dm.boss.intro`
- `dm.combat.start`
- `dm.combat.end`
- `dm.secret.reveal`
- `dm.puzzle.success`
- `dm.trap.trigger`
- `dm.horror.stinger`

Implementation notes:

- Important stingers may duck BGM.
- Stingers need cooldowns to prevent repeated accidental triggering.
- Boss intro should not overlap itself.
- Horror stingers should be reducible or disableable for accessibility.
- Monster natural 20 critical damage must not be affected.

## Phase 5: Ambient Layer

Goal: add ambient loops and weather events as a third layer separate from BGM and SFX.

Sound ids:

- `ambient.forest.loop`
- `ambient.cave.loop`
- `ambient.dungeon.loop`
- `ambient.town.loop`
- `ambient.tavern.loop`
- `ambient.rain.loop`
- `ambient.thunder.event`
- `ambient.campfire.loop`
- `ambient.ruins.loop`

Implementation notes:

- Loop ambience uses layer `ambient`.
- The thunder event is a short weather event, so its layer is `sfx` and category is `weather`.
- Ambient should be separately controllable from BGM.
- Multiple ambience combinations may be useful later, but should still respect max voice limits.
- Ambient playback must not be tied to render lifetimes.

## Phase 6: Sound Settings And Accessibility

Goal: let users control volume and reduce intrusive sounds.

Planned controls:

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

Implementation notes:

- Settings should persist in localStorage state when implemented.
- Export/import should preserve sound settings once they exist.
- Safe mode should avoid unexpected autoplay.

## Phase 7: Asset Library And Licensing

Goal: organize real assets and license records after behavior is stable.

Deliverables:

- Runtime sound manifest JSON in a future implementation branch
- License records
- Source notes
- Paid/free/self-made tracking
- Missing asset report

Validation requirements:

- Every ready asset must have a license/source note.
- File paths must only appear after assets exist.
- Missing assets must be reportable by sound id.

## Backlog Sound IDs

These ids are valid but not assigned to a concrete implementation phase yet:

- `ui.longpress`
- `ui.drag.start`
- `ui.drag.drop`
- `player.levelup`
- `dice.roll.loop`
- `dice.critical`
- `shop.sell.success`
- `shop.transaction.complete`
- `shop.transaction.failed`
- `dm.environment.event`

Backlog ids must still appear in both the event map and manifest coverage table. They are not duplicates of any phase assignment.

## Recommended Future Branch Order

```text
codex/v2-sound-event-manifest-foundation
codex/v2-sound-ui-system-dice-shop
codex/v2-sound-player-inventory-events
codex/v2-sound-dm-manual-layers
codex/v2-sound-combat-magic-stingers
codex/v2-sound-ambient-layer
codex/v2-sound-settings-accessibility
codex/v2-sound-assets-licensing
```
