# Museum of Us — V2 implementation

## Inspection and retained architecture
The existing React/Vite client uses R3F + Rapier, a Zustand input/profile store, lazy scene loading, and Colyseus 0.16 (10 visitors, 20 Hz patches, reconnect). Reuse this stack, keyboard/touch controls and room lifecycle. Replace the single sealed room, DOM-backed photo surfaces, primitive human geometry and fixed camera bounds. There are five SVG artworks, no human GLBs, no photography, no video files and no licensed scanned material maps.

## Layout (metres, north = negative Z)
Exterior plaza: Z 10–36. Museum: X -26–26, Z -48–10. Central 10 m promenade links every room without teleporting or reconnecting. Left: story (-8–10), cinema (-28–-8), tribute (-48–-28). Right: main collection (-28–10) with three exhibition bays, birthday (-48–-28). Wide portals in each partition keep circulation accessible; all floors are step-free. A glass entrance, roof lights, stone piers and timber fins create architectural depth. No ornamental staircase blocks the accessible route.

## Milestones
1. Shared layout, collision geometry, outdoor spawn, portal navigation and camera occlusion.
2. PBR procedural stone/wood, golden-hour light, glazing, gardens, furniture, room-specific dressing.
3. Licensed humanoid asset specification + GLB skeleton cloning, crossfaded animation, capability-based customization and network appearance. Until supplied, use explicitly identified visitor markers, never geometric humans.
4. Data-driven 18 story + 48 main + 14 tribute + 6 birthday photo holders; on-demand full media, theater playlist, letters and finale. Personal text remains editable placeholders.
5. Room guide, quality presets, mobile controls, error recovery, accessibility and verification.

## Asset strategy
Use original deterministic procedural textures as fallbacks plus locally downloaded CC0 Poly Haven Marble 01 and Wood Floor color/normal/roughness maps. These are PBR materials, with no baked lightmaps. Media remains local placeholder art; no personal content upload or publishing. User-provided licensed models and optimized media can be configured without changing rendering logic. Adobe Mixamo is a possible signed-in source; see ASSETS.md for exact requirements and licensing references. Do not copy an unattributed model or pretend the marker is a realistic avatar.
