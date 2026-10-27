# Museum of Us — V2

A connected multiplayer museum built on the original React/TypeScript, React Three Fiber, Rapier, Zustand and Colyseus architecture.

Start in the cherry-blossom garden, walk through the pink and rose-gold entrance, and explore **Memories of Us**, **All About Her**, and **Happy Birthday**. Each room is 16.8 × 16.8 metres with a 4.6-metre ceiling. The two photo rooms hold 15 photographs each. The decorated birthday room includes a balloon arch, gifts, a dessert table, lounge seating and a small Hello Kitty keepsake.

The entrance shows standing 3D characters. His private portal keeps the existing male character, hers has a cute pink-dress character, and guests choose simple characters. See [the pink edition and private invitations](docs/PINK-CELEBRATION.md) for links, server password setup and action permissions.

## Run

Node.js 20 or newer:

```bash
npm install
npm run dev
```

Client: `http://localhost:5173` (Vite selects the next port if occupied). Colyseus: `ws://localhost:2567`. `npm run dev:web` / `npm run dev:server` start each separately. The root dev command also watches the shared collision/layout package.

```bash
npm run typecheck
npm test
npm run build
node scripts/physics-smoke.mjs
# With the server running:
npm run test:multiplayer
# Built production server:
npm start -w @museum/server
```

For another local server port use `PORT=2569`; set `VITE_SERVER_URL=ws://localhost:2569` when running/building the client. For deployment set it to the server's secure `wss://` endpoint. On the same Wi-Fi, open Vite's Network URL from a phone; the client uses that hostname on port 2567 by default.

## What's implemented

- Three compact rooms with skylights, architectural trim, furniture, a garden and a reflecting pool.
- Local CC0 marble/wood PBR maps, warm sunlight, environment-lit metal/glass, gallery lighting and three graphics presets.
- Exactly 30 photo holders: 15 shared memories and 15 portraits of her, plus letters and films. The birthday room has no photo grid.
- A smaller cake on a 2.4-metre table, animated ignition, extinguishing flames, smoke, knife cutting, layered slices moving to ten plates, falling confetti and character gestures.
- Shared server timestamps keep celebration animations aligned for guests and late joiners. Proximity, sequence and animation-duration checks prevent skipped steps.
- Optional microphone blowing with a quiet calibration step, a breath meter, sensitivity controls and an explicit button fallback. Audio is analysed locally, never recorded, played through speakers or transmitted. The stream stops on cancellation, completion, timeout, leaving the cake, hiding the page or disconnecting.
- Film viewers in the memories and birthday rooms; playback is personal to each visitor.
- Real Colyseus sessions for up to 10 visitors, smooth remote movement, synchronized appearance/seating, reconnection, speed validation and shared swept wall/furniture checks.
- Improved controller with analog touch movement, WASD/arrows, Shift running, drag camera, E/tap interactions, modal input lock and camera obstacle checks.
- Live standing previews retain his existing male GLB, give her a cute pink-dress character, and offer basic guest characters. Movement and celebration gestures run independently for each visitor.

For candle blowing, tap **Enable microphone**, allow access, stay quiet during calibration, then blow toward the device microphone for about half a second. Browser microphone access requires HTTPS (localhost also works); a plain HTTP Wi-Fi address can use the button fallback. Loud broadband background noise may also trigger detection, so choose a quiet spot and adjust sensitivity as needed.

Run `npm run test:celebration` for photo placement and signal-detection checks, and `npm run test:avatars` for both character rigs. Actual microphone sensitivity and visual quality still need a physical-device check.

## Content and next steps

- [Asset and media handoff](docs/ASSETS.md): exact human GLB specification, legal sourcing references, material credits, photo/video replacement and private-content guidance.
- [Implementation plan](docs/IMPLEMENTATION.md): inspected foundations and layout decisions.
- [Verification record](docs/VERIFICATION.md): tests actually run, browser observations, remaining manual checks and performance limits.

Edit exhibits in `apps/web/src/config/exhibits.ts`, human assets in `apps/web/src/config/avatars.ts`, and shared architecture/colliders in `packages/shared/src/world.ts`. Personal content is still editable placeholder material. Nothing has been uploaded or published. Add your selected media, then check the experience and microphone on the devices your guests will use.

Private roles require separate server-validated passwords: only the host can light candles and only the girlfriend can blow and cut them. The guest entrance remains open for friends to explore. These role passwords do not restrict guests from viewing the gallery media. The existing Colyseus 0.16 dependency line was retained.
