# V2 verification record

## Automated checks run successfully

- `npm run typecheck`: client application and Vite config are now explicitly checked, as well as server and shared code. The former client command only checked its empty solution tsconfig.
- `npm test`: seven shared-contract/layout tests. Covers safe appearance defaults, bounds, outdoor spawn, all six wing portals, promenade route, wall/furniture/pool rejection, safe standing positions and collection circulation.
- `npm run build`: shared JS/declarations, server output, and Vite production bundle.
- Compiled server starts with `PORT=2569 npm start -w @museum/server`. Fixed an existing production failure caused by the shared package exporting uncompiled TypeScript with unresolved `.js` imports.
- `node scripts/physics-smoke.mjs`: real Rapier capsule simulation traverses garden, entrance, every themed wing and collection bays. Sustained movement into walls and benches is stopped. The continuous floor supports the capsule.
- `npm run test:multiplayer` against the local Colyseus server: two actual WebSocket clients share a room; appearance fields propagate, movement follows routes through every wing, seated pose/standing synchronize, an attempted thin-wall crossing is corrected, and reconnection restores the same session.

The WebSocket test controls network clients, not browser cameras. The Rapier test simulates the same body and collider dimensions, not pointer/touch events.

## Browser observations

In Brave, the welcome screen, outdoor scene, entrance, promenade and collection rendered. Checked the updated materials and thumbnail surfaces, visitor marker, connection status, guide dialog and live position indicator. Fixed SVG images lacking intrinsic dimensions (black GPU textures) and corrected excessive lighting during visual review. Browser console showed no application errors in these checks; Rapier emits its upstream initialization deprecation warning.

At a 390 × 844 viewport, checked the welcome layout, compact HUD, visible joystick/look regions and guide accessibility structure. Added a height-constrained scrolling welcome screen so the entry button remains reachable on short screens. Restored the normal desktop viewport afterward.

## Still requires manual verification / real assets

- Real-human GLB appearance, animation blending, material/mesh variants and seated pose: **no human assets supplied**. Network customization fields and loader code are implemented, not visually validated with a production character.
- Real video decoding, audio, fullscreen and large-screen video texture: **no video supplied**. Empty-playlist/error states are implemented; native playback must be checked with the actual files and target browsers. No synchronized playback is claimed.
- Complete photo/letter/finale interaction tour with final content, including keyboard/touch focus, actual signed URLs and their expiration.
- Sustained real-device touch movement, orientation changes, iOS Safari memory/audio behavior, browser camera behavior at every corner, and a 3–10 visitor visual load test. Responsive layout checks are not a substitute for testing physical phones.
- Actual FPS/GPU timings have not been benchmarked. No 60 FPS claim is made.

## Performance constraints

The lazy 3D chunk is about 3.32 MB minified / 1.13 MB gzip, including Three.js, Rapier/WASM integration and avatar loaders. Vite warns about its size. It is deferred until museum entry but remains the main cold-load cost. Marble/wood maps are locally hosted 1k JPEGs. Floor slabs, timber tiles and leaves are instanced. Only nearby thumbnails and labels mount; full photos and films load on demand. The environment capture runs once, and only the sun casts a shadow map. Light quality disables sun shadows and caps DPR; Balanced uses 1024px shadows; High uses 2048px shadows and higher DPR.

Remaining costs: six non-shadowed gallery lights, individual photo-frame meshes, local signage textures, botanical/flower geometry, and a thumbnail cache that grows as rooms are visited. Structural geometry stays loaded to avoid gaps in collisions and circulation; this implementation does not unload whole rooms. Compressed KTX2 textures, baked lighting, model LODs and shared video playback are future work.
