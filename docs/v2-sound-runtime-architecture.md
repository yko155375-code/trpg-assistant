# TRPG Assistant v2 Sound Runtime Architecture

This document defines the future runtime architecture for the TRPG Assistant v2 sound system. It is a specification only. It does not add JavaScript, JSON runtime manifests, audio files, or UI event wiring.

The goal is to prevent future implementations from scattering direct `new Audio()` calls, hard-coded filenames, autoplay behavior, or page-render-bound audio elements throughout the app.

## 1. Architecture Overview

The runtime should be organized around one top-level singleton:

```text
AudioManager
??? BGM Manager
??? SFX Pool
??? UI SFX Pool
??? Ambient Manager
??? Ducking Controller
??? Priority Controller
??? Audio Settings
??? Browser Unlock Controller
??? Asset Cache
??? Diagnostics
```

### Component Responsibilities

| Component | Responsibility | Singleton |
|---|---|---|
| AudioManager | Public facade for `play(id)`, `stop(layer)`, settings, diagnostics, and layer routing. | Yes |
| BGM Manager | Owns the single main BGM voice, crossfade, pause/resume, stop, and active BGM state. | Yes |
| SFX Pool | Manages gameplay and manual SFX voices with overlap, priority, cooldown, and release rules. | Yes |
| UI SFX Pool | Small dedicated pool for short UI sounds so UI clicks cannot consume gameplay SFX capacity. | Yes |
| Ambient Manager | Owns looping ambience voices and the max simultaneous ambient layer policy. | Yes |
| Ducking Controller | Applies temporary BGM volume reduction for high-impact stingers. | Yes |
| Priority Controller | Decides whether a new voice can start, should be dropped, or may replace a lower-priority voice. | Yes |
| Audio Settings | Reads persistent volume/accessibility settings and exposes runtime effective volume values. | Yes |
| Browser Unlock Controller | Tracks whether browser audio is unlocked by user gesture and handles blocked play requests. | Yes |
| Asset Cache | Loads, decodes, retains, and evicts sound assets without blocking core app features. | Yes |
| Diagnostics | Records debug counters and last errors for DM/developer diagnostics. | Yes |

The singleton boundary matters: BGM, SFX, and Ambient playback must not be recreated by DM/player page re-render.

## 2. Layer Definitions

Legal layer values:

```text
bgm, sfx, ambient
```

### BGM

- Allows one active primary BGM in stable playback state.
- Continues when switching DM/player pages or DM tabs.
- Supports play, pause, resume, stop, and track switching.
- Track switching should support fade out / fade in.
- Must not be destroyed by render or DOM replacement.
- Does not belong inside a rendered DM music card.

#### BGM Crossfade Voice Limit

- Stable playback has exactly one active primary BGM voice.
- During crossfade, two BGM voices may temporarily exist:
  - outgoing voice
  - incoming voice
- After crossfade completes, the outgoing voice must be released.
- The BGM voice limit is 2 at any time.
- A third BGM voice must never accumulate.
- If a new track-change request arrives during an active crossfade, the BGM Manager must cancel or take over the existing transition instead of stacking another transition.

### SFX

- Uses voice pools.
- Must not stop, pause, replace, or reset BGM.
- Must support `overlapMode`, `maxVoices`, `priority`, and `cooldownMs`.
- Releases the voice after playback completes.
- May include UI, gameplay, shop, dice, combat, magic, horror, and manual DM SFX.

### Ambient

- Separate from BGM.
- May loop.
- Can allow a small number of simultaneous layers, for example rain plus campfire.
- Must have a maximum ambient layer count.
- Stopping ambient must not affect BGM.
- Ambient playback must not be tied to rendered DOM lifetime.

## 3. Singleton And Lifecycle

- `AudioManager` is created once after app boot.
- It is not attached to any DOM subtree that can re-render.
- DM/player page switching must not recreate the manager.
- DM tab switching must not recreate BGM or Ambient voices.
- `?safe=1` must not autoplay any sound.
- On page close/unload, the manager may release all runtime voices.

### Runtime Memory State

These values belong in runtime memory only:

- Current BGM audio element or buffer source.
- Current playback position, unless a future feature explicitly persists it.
- Active SFX voice instances.
- Active Ambient voice instances.
- Cooldown timestamps.
- Current ducking envelope.
- Browser unlock state.
- Loaded/decoded asset cache entries.
- Diagnostics counters.

### Persistent App State

These values may be written to app state:

- Volume settings.
- Mute/accessibility flags.
- User sound preferences.
- Future sound manifest selection metadata if needed.

### Values Not To Persist By Default

Do not write these into localStorage unless a future branch explicitly scopes the feature:

- Active voice objects.
- Audio element references.
- Decoded audio buffers.
- Current transient SFX queue.
- Temporary ducking state.
- Browser unlock state.
- Current playback position when not needed for persistence.

## 4. Browser Audio Unlock

Browser audio should unlock only after a user gesture:

- `click`
- `pointerdown`
- `keydown`

Rules:

- Do not force audio playback during boot.
- Do not autoplay before unlock.
- Safe mode must not trigger audio automatically.
- A blocked play request should either be dropped safely or queued only when the caller explicitly allows deferred playback.
- UI hover sounds should not be queued before unlock.
- Critical user-triggered sounds can be retried after unlock if the original action is still relevant.

### Deferred Playback Queue

- The default behavior is no queue: blocked play requests are dropped safely.
- Short operation sounds must not be queued, including UI click, hover, tab, quantity, and other rapid feedback cues.
- A request may enter the deferred queue only when the caller explicitly sets `allowDeferredPlayback`.
- The deferred queue limit is 3 requests.
- Each deferred request has a default TTL of 1500ms.
- Requests older than their TTL are discarded.
- After unlock, only requests that still have gameplay or UI context should be played.
- Deferred requests with the same sound id are deduplicated; keep only the newest request.
- Safe mode must not create a deferred queue.
- Failure of a deferred sound must never affect the original operation.

Mobile notes:

- iOS Safari often requires playback to begin directly inside a trusted user gesture.
- Android Chrome can pause or suspend WebAudio/audio elements in background tabs.
- Unlock should be lightweight and should not play a loud audible cue.
- Unlock failure must never block the original app action.

## 5. Voice Pool

### UI Pool

- Recommended size: 4 voices.
- Low priority.
- Short cooldown.
- Must not allow large stacking.
- Best for click, hover, tab, modal, confirm, and cancel sounds.

### General SFX Pool

- Recommended size: 8 voices.
- Can be reduced on low-performance devices.
- Recycles a voice after playback ends.
- Handles dice, shop, inventory, player, magic, and normal DM SFX.

### Stinger Pool

- Recommended size: 2 voices.
- High priority.
- Used for Boss, Horror, death, critical, and combat transitions.
- Must not allow unlimited Boss/Horror overlap.

### Voice Acquisition

When a sound request arrives:

1. Resolve the sound id in the manifest.
2. Check browser unlock and autoplay policy.
3. Check `cooldownMs` for the sound id.
4. Check per-id `overlapMode` and `maxVoices`.
5. Check the target pool capacity.
6. Apply priority replacement rules if the pool is full.
7. Start playback if a voice is available.

### Voice Recycling

- A voice returns to its pool when playback ends, errors, or is stopped.
- Erroring voices should be cleaned up and reported to diagnostics.
- Looping ambience and BGM are managed by their layer manager rather than recycled like one-shot SFX.

### Pool Full Policy

- If the pool is full and the new sound has lower or equal priority, drop the new sound by default.
- If the new sound has higher priority, the Priority Controller may stop the lowest-priority replaceable voice.
- UI sounds must not replace stingers.
- Boss and Horror stingers must not be replaced by low-priority UI or hover sounds.

### `maxVoices` And Global Pool Limit

`maxVoices` is a per-sound-id cap. The pool size is a global cap. Both must pass:

```text
actualAllowedVoices = min(soundId.maxVoices, availablePoolCapacity)
```

## 6. Priority Rules

Priority is an integer from 0 to 100.

| Range | Use |
|---:|---|
| 0-19 | Hover and tiny UI feedback. |
| 20-39 | Normal UI and inventory. |
| 40-59 | General gameplay, shop, dice. |
| 60-79 | Combat, death, critical. |
| 80-100 | Boss, horror, system critical. |

Rules:

- When a pool is full, a high-priority sound may replace a lower-priority replaceable voice.
- At the same priority, keep the earlier voice by default and drop the new request.
- UI click must not replace Boss stinger.
- System save error can have higher priority than ordinary UI.
- Hover sounds should always be low priority and disposable.
- Critical diagnostics should record dropped sounds but not interrupt app behavior.

## 7. Cooldown And Overlap Rules

The runtime must use the manifest fields:

- `overlapMode`: `none`, `limited`, `full`
- `maxVoices`
- `cooldownMs`

Rules:

- Cooldown is tracked by sound id.
- `none`: the same sound id cannot overlap itself; `maxVoices` must be 1.
- `limited`: same-id overlap is capped by `maxVoices`.
- `full`: same-id overlap is allowed, but still capped by `maxVoices` and the global pool.
- UI hover needs a longer cooldown than click.
- Repeated UI actions should not create audible machine-gun effects.
- Batch delete assets should play one summary sound, not one sound per deleted item.
- Failed cooldown checks should silently drop the sound and must not block the user action.

## 8. BGM Ducking

Manifest fields:

- `duckBgm`
- `duckAmount`

Runtime envelope fields:

- `attackMs`
- `holdMs`
- `releaseMs`

Recommended rule:

```text
duckFactor = 1 - activeDuckAmount
```

When multiple duck requests overlap:

- Use the maximum active `duckAmount`.
- Do not sum amounts until BGM becomes silent.
- Each duck request keeps its own timing envelope.
- BGM volume must recover after the last active duck ends.

Allowed duck sources:

- Boss intro.
- Death.
- Horror stinger.
- Major critical/reward stingers if approved later.

Not recommended for duck:

- UI click.
- Hover.
- Shop coins.
- Normal inventory sounds.

If the user changes BGM volume during duck:

- Store the new user BGM volume immediately.
- Continue applying the duck factor on top of the new user value.
- When duck ends, recover to the new user BGM volume, not the old value.

## 9. Volume Model

Final volume is calculated by layer.

BGM:

```text
finalBgmVolume =
  masterVolume
  * bgmVolume
  * assetDefaultVolume
  * duckFactor
```

UI SFX:

```text
finalUiVolume =
  masterVolume
  * uiVolume
  * assetDefaultVolume
```

General SFX / Stinger:

```text
finalSfxVolume =
  masterVolume
  * sfxVolume
  * assetDefaultVolume
```

Ambient:

```text
finalAmbientVolume =
  masterVolume
  * ambientVolume
  * assetDefaultVolume
```

Rules:

- `duckFactor` applies only to BGM.
- SFX, UI SFX, and Ambient do not apply BGM `duckFactor` by default.
- If `muteAll` is true, every layer's final volume is 0.
- All final volume values must be clamped to the 0-1 range.

Settings:

| Setting | Range | Applies to |
|---|---:|---|
| `masterVolume` | 0-1 | All sound. |
| `bgmVolume` | 0-1 | BGM layer. |
| `sfxVolume` | 0-1 | General SFX and stingers. |
| `uiVolume` | 0-1 | UI SFX pool. |
| `ambientVolume` | 0-1 | Ambient layer. |
| `muteAll` | boolean | Forces effective volume to 0. |
| `reduceStingers` | boolean | Lowers or suppresses high-impact stingers. |
| `disableHoverSounds` | boolean | Prevents hover sound playback. |
| `disableHorrorSounds` | boolean | Prevents or reduces horror cues. |

Layer volume mapping:

- `bgm` uses `bgmVolume`.
- `ambient` uses `ambientVolume`.
- UI category sounds use `uiVolume`.
- Other `sfx` sounds use `sfxVolume`.

## 10. Asset Cache And Preload

### Preload Candidates

Phase 1 short sounds may preload after browser unlock or when the user enables sound:

- UI click/tab/modal.
- System save success/failure.
- Dice start/success/fail.
- Shop buy/money insufficient.

### Lazy Load Candidates

- Boss and horror stingers.
- Ambient loops.
- Long BGM.
- Rare combat or monster sounds.

### Failure Rules

- A single file load failure must not black-screen the app.
- Missing assets should increment diagnostics and fail silently for the user.
- If fallback audio exists, try fallback once.
- Repeated failures should respect cooldown to avoid log spam.

### Cache Limits

- Keep short UI/System/Dice SFX in memory if small.
- Evict rare or large SFX when unused.
- Stream or lazily load BGM/Ambient rather than decoding everything at boot.
- Mobile devices should have lower cache and pool limits.
- Do not store large audio files in localStorage.

## 11. Codec And File Formats

Recommended:

- WebM / Opus first where supported.
- MP3 fallback.
- Short SFX can be decoded for low latency.
- Long BGM and Ambient should stream or be loaded on demand.
- Audio files should live in the repo, CDN, or public URL.
- Do not embed large audio data in localStorage.
- Do not assume every browser supports the same codec.

## 12. Error Handling

The runtime must handle:

- Playback failure.
- Network load failure.
- Unsupported audio format.
- Autoplay blocked.
- Pool exhausted.
- Manifest missing a sound id.
- Malformed manifest entry.
- Decode failure.

Rules:

- Record useful diagnostics.
- `console.warn` or `console.error` may be used for developer visibility.
- Never black-screen the app because of sound.
- Never clear state because of sound failure.
- Sound failure must not block original operations such as purchase, dice roll, save, import/export, or monster actions.
- Missing sound ids should be no-op failures unless diagnostics mode is active.

## 13. Settings Persistence

Persistent settings:

- `masterVolume`
- `bgmVolume`
- `sfxVolume`
- `uiVolume`
- `ambientVolume`
- `muteAll`
- Accessibility flags such as `reduceStingers`, `disableHoverSounds`, and `disableHorrorSounds`.

Requirements:

- `normalizeState` must provide defaults when these settings are implemented.
- JSON export/import must include these settings once they exist.
- Old data must remain compatible.
- Runtime voices, current audio elements, decoded buffers, cooldown maps, and active duck envelopes must not be persisted.

## 14. Diagnostics

Planned diagnostics:

- `audioUnlocked`
- `activeBgm`
- `activeAmbient`
- `activeVoices`
- `blockedPlayCount`
- `missingAssetCount`
- `lastAudioError`
- `droppedVoiceCount`
- `poolExhaustedCount`

Rules:

- Production player UI must not show technical diagnostics.
- Diagnostics can appear in a DM debug section or explicit development mode.
- Diagnostics must not become required for normal gameplay.
- This branch does not implement diagnostics.

## 15. Mobile Constraints

Mobile behavior to account for:

- iOS Safari requires user gesture unlock.
- Background tabs may pause audio.
- Low-performance devices should reduce voice pool size.
- Ambient simultaneous layer count should be small, for example 2.
- Page foreground restoration should reconcile runtime status without corrupting persistent state.
- Headphone/Bluetooth route changes may interrupt playback.
- Mobile browsers may reclaim decoded buffers; Asset Cache must tolerate reload.
- Avoid large preload batches on mobile.

## 16. Integration With Existing Systems

Future sound runtime work must protect:

- Existing BGM / SFX layer behavior.
- Data persistence hardening.
- JSON export/import.
- Player assets and quantity controls.
- Shop team transaction history.
- Dice rolling and formula draft.
- Monster natural 20 critical damage.
- Opening video.
- Safe mode.
- Boot guard.
- Player background posters.
- Current character shell.

Audio playback is an enhancement. It must not become a prerequisite for core app actions.

## 17. First Implementation Branch Boundary

Future branch:

```text
codex/v2-sound-event-manifest-foundation
```

Only allowed in that first implementation branch:

- Sound event registry.
- Manifest schema.
- AudioManager skeleton.
- Settings defaults / normalize.
- Diagnostics skeleton.

Not allowed in that first implementation branch:

- Wiring actual UI events.
- Adding audio files.
- Autoplay.
- Changing existing BGM / SFX playback behavior.
- Reworking DM music UI beyond what the skeleton strictly needs.
- Large refactors.
- New external dependencies.

The first branch should prove the architecture can exist safely before it makes audible sound.

## 18. Architecture Acceptance Criteria

- Component responsibilities do not overlap.
- Runtime state and persistent state are clearly separated.
- BGM, SFX, and Ambient lifecycles are clear.
- Pool, priority, cooldown, and overlap rules are clear.
- Ducking calculation and recovery are clear.
- BGM crossfade voice limit is clear.
- `duckFactor` applies only to BGM.
- Deferred queue has a limit, TTL, and deduplication rules.
- Browser Unlock behavior is clear.
- Mobile constraints are listed.
- Sound failures do not affect core app features.
- The first implementation branch boundary is narrow and practical.
- The document can directly guide `codex/v2-sound-event-manifest-foundation`.

