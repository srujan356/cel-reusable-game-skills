# Chaos Engine Labs — Assignment Handoff

This document supports the Product Designer take-home assignment. It is documentation only: it does not change the prototype UI or add features.

## A. Research-to-product traceability

The four researched games are treated as **publicly observable interaction references**, not as the source of fabricated user research. No interviews, participant data, or measured study results are claimed. Observations below are design-level pattern notes.

| Game | Observed interaction pattern | Reusable interaction | Primary bucket |
|---|---|---|---|
| Royal Match | Tapping a target selects it and lifts it; invalid placement shakes and tints red | Tap selection / invalid-move rejection | Input & Selection / Feedback & Validation |
| Royal Match | Clearing a cluster resolves board state and spawns upgraded pieces | Cluster resolution / tile merge | Gameplay Resolution |
| Royal Match | End-of-level victory or failure with continue/revive choice | Stage outcome and recovery | Outcomes & Recovery |
| Brain Puzzle | Hint hand appears after idle time and traces a path between source and target | Idle hint spline | Guidance & Assistance |
| Brain Puzzle | Reward chest opens with a reveal and collects to a wallet | Reward Reveal | Rewards & Collection |
| Wordscapes | Dragging letters into slots with hover feedback and snap | Spatial drag & drop / tap selection | Input & Selection |
| Wordscapes | Streak meter fills and unlocks milestone badges | Combo streak thermometer | Progression & State |
| Tile Explorer | Swiping tiles to merge into higher tiers with impact burst | Tile merge tier-up | Gameplay Resolution |
| Tile Explorer | Booster spotlight highlights a valid target after inactivity | Booster target spotlight | Guidance & Assistance |
| Tile Explorer | Unlocking a new level node animates progression | Level node unlock | Progression & State |

Grouping logic: raw game moments were abstracted into **interaction primitives** (trigger, response, state) that do not depend on a specific game's art or rules. Each primitive was assigned to one of the seven primary buckets by its dominant responsibility. Reward Reveal sits in **Rewards & Collection** because its core responsibility is presenting an already-earned reward and requesting authoritative collection; it does not decide eligibility.

The seven primary buckets remain intact in the prototype's Skill Library filter and are represented by `PRIMARY_BUCKETS` in `src/data/mockData.ts`.

## B. Reward Reveal deep dive

### Problem and use case
Reward Reveal addresses the moment after a player earns a reward: the game must present it clearly, animate it, and credit it only through host authority. Reusing this interaction avoids re-implementing opening, reveal, trajectory, and collection handshakes per project.

### Components and assets
Seven component slots (`src/types/platform.ts` `ComponentSlotId`):
1. Reward Container — primary interactive container (chest, gift box, crate, card).
2. Container Body — lower hull that stays grounded.
3. Lid / Opening Element — separable lid or animation-driven upper element.
4. Reward Item — typed payload (coins, flowers, candies, cookies, chocolates).
5. Reveal Effect — optional particle emitter.
6. Audio — optional synchronized SFX.
7. Collection Destination — target wallet/inventory anchor.

### Triggers
Player input (On Tap, Double Tap, Long Press, etc.) or host game events (Reward Earned, Level Completed, etc.), selectable in the Playground trigger composer. Default: On Tap on the reward container.

### Response actions
Transform (Move, Rotate, Scale), Motion (Straight/Arc/Bezier/Wave), Animation (Play/Pause/Resume/Speed), Appearance, Visibility, Object (Spawn/Remove/Replace/Duplicate), Effects (Particle Burst/Trail/Confetti/Sparkles), Audio, and Game Integration (Request Collection, Send Event, Request Host-State Change). These are conceptually distinct from triggers and components.

### Connections and sequence
Closed → On Tap → Open Reward Container (composite: Open Lid → Reveal Rewards → Fly to Wallet) → Request Collection → Completed or Error. Connections can be edited and deleted independently; deleting a node removes its connections.

### Inputs and outputs
Inputs: `hostRewardId`, `rewardItemType`, `rewardAmount`, `reducedMotion`. Outputs: `onOpeningStarted`, `onRewardRevealed`, `onCollectionRequested`, `onSkipped`. Requires: Schema 1.1+, GLB/FBX container, clip or lid pivot, host reward interface.

### State transitions
Closed → Opening → Revealed → Collecting → Completed | Interrupted | Error. Skip can fast-forward Opening/Revealed to Collecting and snap Collecting to end without a duplicate request. Retry uses the same idempotency key.

### Edge cases
Repeated taps (debounced), skip during opening/collection, missing opening animation, missing reward asset, invalid quantity, missing destination (graceful fallback), host collection failure (simulated 503), interrupted interaction (app backgrounded), reduced motion.

### Compatibility and constraints
Container must provide either a verified opening clip or a separable lid with valid hinge pivot. Reward item must permit instanced spawning (1–50). Incompatible assets cannot be silently assigned: the replacement picker filters by `compatibleSlots`, and validation blocks publication on missing required slots.

### Prototype vs. real integration
The prototype simulates the host service (simulated ACK/503). The interface labels this as "Simulated". A real game-server integration requires an engine adapter and host authority implementation.

## C. Analytics and success metrics

Analytics specification only — no analytics SDK is integrated in the prototype.

### Events
| Event | Purpose | Key properties | Product decision supported |
|---|---|---|---|
| skill_viewed | Measure discovery interest | skillId, source, bucket | Which skills to feature |
| skill_imported | Measure adoption intent | skillId, version, projectId | Funnel to Playground |
| asset_imported | Measure asset pipeline usage | format, slot, inspectionStatus | Supported format investment |
| asset_role_confirmed | Measure creator confirmation | assetId, role, aiConfidence | AI suggestion quality |
| asset_replaced | Measure adaptation | fromAsset, toAsset, slot | Variant demand |
| action_property_changed | Measure configurability use | nodeId, property, value | Which properties matter |
| connection_modified | Measure composition edits | from, to, flowType | Graph UX improvements |
| preview_started | Measure preview usage | scenario, reducedMotion | Preview value |
| preview_completed | Measure successful runs | duration, skipUsed | Flow health |
| preview_failed | Measure failure reasons | reason, scenario | Fix prioritization |
| skill_exported | Measure export success | format, assetCount, licensesOk | Export readiness |
| skill_forked | Measure reuse/sharing | sourceSkill, author | Community growth |

### Metrics
- Skill reuse rate = (skills imported or forked) / (skill views).
- Time to adapt a skill = median time from import to first successful preview.
- Skill creation completion rate = exports with all required slots valid / started adaptations.
- Preview success rate = preview_completed / preview_started.
- Export success rate = successful exports / export attempts.
- Asset compatibility failure rate = incompatible import attempts / total imports.

Preview simulation metrics must be reported separately from production game metrics; simulated host ACKs are not real credits.

## D. Product, Engineering and LiveOps feedback loop

1. Collect interaction and reuse signals (views, imports, property changes, preview outcomes, exports, forks).
2. Identify recurring failures and friction (preview_failed reasons, compatibility failures, export blocks).
3. Separate skill-definition problems from asset, runtime, and game-integration problems using the event properties above.
4. Create actionable feedback for Product, Engineering, and LiveOps (backlog items with evidence).
5. Prioritize and update skill definitions (versioned releases).
6. Validate improvements through subsequent usage (compare metrics before/after).

This production feedback infrastructure is not claimed to exist in the prototype; Community view demonstrates the concept only.

## E. AI usage and boundaries

- Deterministic asset inspection: mesh counts, skeleton/bone counts, clip names/durations, materials, textures, file size, dimensions, signature verification. These come from `extractedFacts` and are labeled "From file".
- AI semantic classification: category, confidence, possible component role, suggested tags, interaction classification, reasoning evidence. These are suggestions only, labeled "Unverified" / "Unverified".
- Creator confirmation required before any suggestion becomes authoritative (`creatorConfirmation.confirmedByCreator`).
- Evidence supporting suggestions: `reasoningEvidence` strings referencing detected meshes/bones/clips.
- Uncertainty and unsupported assets: ambiguity warnings (e.g., static crate) are surfaced; unsupported role leaves `compatibleSlots` empty.
- AI unavailable: deterministic facts still render; suggestions absent or low-confidence; creator can manually confirm role.

No live AI model is called by the current code; suggestions are static data in `src/data/mockData.ts`.

## F. Assumptions, trade-offs and cuts

- Assumption: designers have reusable interactions worth sharing. Not validated; stated as product hypothesis.
- Assumption: asset capabilities can be described through a reusable skill schema. Limits: engine-specific features may not map.
- Cross-engine portability is limited: a package is a transport format; running it needs an engine adapter.
- Dependency on actual runtime/engine adapters: host authority (eligibility, balances) is external.
- FBX support and arbitrary asset conversion are not promised: FBX is listed as an accepted format for inspection/import, but no conversion pipeline is implemented; unsupported or ambiguous assets are flagged rather than converted.
- Prototype prioritizes Reward Reveal because it exercises the full journey (discovery, assets, composition, preview, export) in one skill.
- Deliberately excluded: real game-server integration, real AI model calls, real ZIP asset binaries beyond metadata, user accounts, moderation, production analytics, Unity/Unreal SDKs (marked future).
- **Persona-based adaptation is not implemented in v1.1.1.** The config supplies general toggles (skipEnabled, reducedMotion, playbackSpeed, trajectoryType, openingStyle, chestColorHex, arcHeightPx, effectIntensity) that adjust geometry and playback parameters, but do not adapt the interaction's timing, guidance, or presentation for specific player personas (fast vs. slow, guided vs. independent, understated vs. elaborate feedback). This may be identified as a future extension.

Assumptions are hypotheses, not validated facts.

## H. Real skill package export/import

- Export creates a real downloadable ZIP (`reward-reveal-v1.1.1.zip`) containing `manifest.json` and `README.txt`.
- `manifest.json` includes schemaVersion 1.0, skill metadata, assets, components, nodes, connections, config, and a snapshot.
- Re-import reads the actual selected ZIP file (not localStorage) via `readZip()`.
- Re-import validates manifest schema and creates a new independent skill ID (e.g. `imported-reward-reveal-<timestamp>`).
- Original skill is preserved; modifying the imported skill does not modify the original.
- Asset binaries are not embedded (seeded assets are metadata-only; no binary store exists).
- Only the stored compression method is supported (matches our exporter).
- Malformed ZIPs are rejected with clear errors.

## G. Component Library

### Taxonomy
- Game Objects & Props: Treasure Chest, Container Body, Lid / Opening Element, Target Object, Draggable Object.
- Characters & Entities: Character.
- UI & Interaction Elements: Button, Game Tile, Interaction Target.
- Rewards & Collectibles: Reward Item.
- Visual & Audio Elements: Visual Effect, Audio Element.
- Runtime References: Collection Anchor.

### Definition vs instance
- `ComponentDefinition` is a reusable, immutable template.
- `ComponentInstance` is one independent use of a definition in a skill.
- `SkillComponentSlot` retains skill-specific slot requirements and asset assignment.
- Asset Library stores actual files; instances reference asset IDs without duplicating files.

### Reuse
- The same definition can be instantiated multiple times with independent IDs and overrides.
- Changing one instance or its assigned asset does not mutate other instances or the definition.

### Compatibility
- Capability truthfulness: no opening without clip/pivot; no color override without exposed parameter; no arbitrary animation without compatible clip.
- Collection Anchor is a runtime reference, not a file asset.

### Current vs future
- Implemented: browsing definitions, inspecting, adding instances, independent instance tracking.
- Not implemented: full visual scripting, unrestricted component system, runtime engine integration.
