# Remaining Limitations — Chaos Engine Labs Prototype

- Host game service is simulated (simulated ACK and 503). No real game-server integration.
- No live AI model is called; asset suggestions are static data.
- No real asset binary bundling in ZIP beyond manifest metadata; referenced binaries are described, not embedded.
- **Persona-based adaptation is not implemented.** General config toggles (skipEnabled, reducedMotion, playbackSpeed, trajectoryType, openingStyle, chestColorHex, arcHeightPx, effectIntensity) adjust geometry and playback parameters but do not adapt the interaction's timing, guidance, or presentation for specific player personas.
- No real asset binary bundling in ZIP beyond manifest metadata; referenced binaries are described, not embedded.
- FBX support is limited to inspection/import metadata; no conversion pipeline.
- Asset upload inspection is demonstration data only; no live file parsing, MIME/size validation, or binary storage is implemented.
- ZIP package export/import is implemented with real archive parsing, but asset binaries are not embedded (metadata-only references). Only stored compression is supported. Asset reference guidance is included in the exported ZIP to distinguish included binaries, metadata-only entries, and external dependencies.
- Cross-engine portability requires an engine adapter not included.
- Analytics is specified, not implemented.
- Community feedback is demonstrational; no moderation or persistence backend.
- Unity/Unreal SDKs are future (not available).
- Some inspector inputs are inert (unsupported properties are shown but not wired) — documented as not functional.
- No automated test suite existed; verification is manual plus TypeScript/build.
- Version history entries are demo data.
- Persistence is browser-local only (localStorage); no cloud sync or multi-user collaboration.
