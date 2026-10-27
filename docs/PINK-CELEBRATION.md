# Birthday edition with blush accents

The museum has three 16.8 × 16.8 metre rooms, a warm ivory and stone facade, walnut, sage and brass finishes, and restrained blush accents. It includes 30 photo placeholders, gardens, flower beds, lanterns, a reflecting pool, a rear pergola and seating. The birthday room carries most of the pink through its balloon arch, small Hello Kitty fan-art keepsake, desserts, presents, lounge accents, rug and string lights.

The entrance uses local standing 3D previews labeled Kushal and Shubhangi. Guests choose a girl or guy. All four roles now use local GLBs, including the three new files supplied by the user. See [SELECTED-AVATARS.md](SELECTED-AVATARS.md) for current source attribution and the runtime animation setup and clothing limitations of the supplied models.

## Private invitations

- His entrance: `/?portal=him`
- Her entrance: `/?portal=her`
- Guest entrance: `/?portal=guests`

Two separate random passwords were generated in `apps/server/.env.local`, which is ignored by Git and read only by the server. Share only `MUSEUM_GIRLFRIEND_PASSWORD` with her. Replace either value with a password of at least 12 characters and restart the server to change it. For hosting, set the same variables on the server; never place them in the web app or VITE environment variables.

The server checks credentials, limits failed attempts, reserves each private role for one active session per room, assigns the permitted character, and preserves the role on reconnection. Passwords are not stored in browser local storage or synchronized player state. The guest entrance remains open for friends; the passwords protect the couple's roles, not access to the public guest gallery.

| Action | Him | Her | Guests |
|---|---|---|---|
| Light candles | Yes | No | No |
| Blow candles | No | Yes | No |
| Cut cake | No | Yes | No |
| Serve cake | Yes | Yes | No |
| Restart celebration | Yes | No | No |

Microphone blowing remains local and opt-in, with an explicit button alternative available only to her. No audio is recorded or transmitted.

## Checks

`npm run build`, `npm test`, `npm run test:celebration`, `npm run test:avatars`, `npm run test:physics`, and `npm run test:multiplayer`.

The multiplayer test reads the local server passwords without printing them. It verifies incorrect-password and duplicate-role rejection, forced avatar assignment, forbidden guest/host/girlfriend actions, animation sequencing, late joining and reconnection.

`node scripts/visual-review.mjs` uses an isolated headless Chrome profile to capture the local entrance, birthday room and gardens, check mobile layout, and enter as a guest. Actual microphone sensitivity and touch movement still need physical-device checks.

The final review passed without browser exceptions for the birthday room, exterior, rear garden, her phone layout, his standing preview and guest selection. Guest entry was verified with real browser typing events. The review caught and fixed balloon signage occlusion, mobile preview order and an HTML fallback cleanup error. Build, layout/media placement, avatar, collision and multiplayer permission checks passed. A separate scan confirmed that neither private password appears in the production client assets.
