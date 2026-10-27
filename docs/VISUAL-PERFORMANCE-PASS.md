# Visual and performance pass — 2026-10-23

The invitation now uses a locally captured view of the actual museum, an evergreen/ivory palette, visual character selection, responsive layouts and reduced-motion support. Character thumbnails retain the source model credits. The scene adds a stone approach, brass edging, batched perimeter planting, revised daylight, soft character grounding and calmer gallery overlays. Approved character GLBs remain unchanged.

## Rendering and movement

- Static architecture is batched by material using independent instance contexts; painted blocks use instance colors. Transparent glazing remains separate for depth sorting. Physical colliders remain unchanged.
- Static floor, plant and flower instances upload their transforms for two initialization frames instead of every frame. Petals and stems are instanced.
- Exhibit proximity checks run twice per second with separate enter/exit distances, avoiding repeated state checks and edge flickering.
- Closed maps no longer subscribe to position updates. Visitor counts subscribe to the count rather than the full movement list. Stationary local positions do not notify the store repeatedly.
- Physics uses an interpolated 60 Hz step. Acceleration, stopping, camera targeting and remote motion use time-based smoothing. Camera collision sweeps remain enabled. Modals stop movement immediately.
- Rendering resolution adapts to sustained frame rate within the selected quality cap; the interface retains Light/Balanced/High choices. 3D code preloads when the entry button is focused or hovered.
- Development-only `?perf` displays local frame/draw metrics; `?capture` provides the architectural camera used for the static invitation cover. No analytics are transmitted.

## Verification

On this computer in Brave, at the garden spawn with Balanced settings, the baseline measured 858 draw calls at about 120 fps, DPR 1.0. After batching and adding the landscape, the comparable sample measured 320 calls at about 117 fps, DPR 1.0 (about 63% fewer draws). This measures renderer work, not a promised FPS improvement across devices. New planting increased visible triangle count from roughly 77k to 123k. Walking samples ran around 116–120 fps; DPR ranged 1.0–1.5. Other devices and populated personal media can behave differently.

Validated the desktop invitation, a 390 px iframe viewport and scrollable mobile form, both character selection controls, walking through the entrance and west gallery doorway, collision with the reception desk, the museum guide and artwork loading. The final browser session had no console errors. The phone-width test verifies responsive layout, not physical-device touch/GPU performance.

Passed: typecheck, production build, shared tests (7), downloaded-avatar rig tests (2), real Rapier collision smoke test and two-client multiplayer/reconnection smoke test. Vite continues to report the existing large 3D chunk; it is lazy-loaded separately from the invitation.
