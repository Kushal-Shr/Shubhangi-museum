# Installed museum characters

The user supplied three local GLBs after the original Sketchfab links proved non-downloadable. These files are now used both for the welcome previews and for local/remote museum avatars. Their embedded metadata identifies different source characters from the initial requests; the uploaded files are the active choices.

| Role | Local file in `apps/web/public/models/` | Embedded source attribution | Motion |
|---|---|---|---|
| Shubhangi | `shubhangi.glb` | [Realistic Girl in Dress](https://sketchfab.com/3d-models/realistic-girl-in-dress-2ca79a0fb64844ccadd6cf35c6cc1843) by 120320 | Runtime skeleton and procedural motion |
| Kushal | `kushal.glb` | [Asian Guy](https://sketchfab.com/3d-models/asian-guy-030fa3fd4bba4139969665b610fa451a) by thuberchs | Runtime skeleton and procedural motion |
| Guest girl | `guest_female.glb` | [Asian girl in hoodie](https://sketchfab.com/3d-models/asian-girl-in-hoodie-b0a5f0d645644a1c9555e1f10954744f) by florahhs | Runtime skeleton and procedural motion |
| Guest guy | `guest-male.glb` | [Standing Man](https://sketchfab.com/3d-models/standing-man-8401da7cb2564fc08681836cbeff39bc) by zhuoyi0904 | Rigged, procedural motion |

The guest-girl filename uses an underscore (`guest_female.glb`); the application profile ID remains `guest-female`. No manual rename is needed. Private roles remain enforced by the server: Kushal uses `kushal`, Shubhangi uses `shubhangi`.

The supplied three models include embedded textures but no skins/skeletons or animation clips. The app now builds an anatomical skeleton and smooth skin weights for each supplied model at load time. Their limbs articulate for idle, walking, running, sitting and birthday gestures; the long dress uses reduced leg swing. This is an approximate local rig, not an artist-authored rig or cloth simulation, so extreme poses may distort clothing. Their original files remain unchanged. Kushal’s scan also contains pavement: a source-specific tilted clipping plane removes that ground from cloned runtime geometry before the character is scaled. This trims the lowest triangles near the shoe soles as well. Sizes are approximately 57.7 MB (Shubhangi), 29 MB (Kushal), and 36.6 MB (guest girl), so initial downloads can be noticeable on slow connections.

All models are independently cloned, normalized to human height, grounded, and centered over their player collider. Standing Man uses its existing skeleton. The three supplied scans use `rigStaticAvatar.ts` with model-specific landmarks and the same procedural animation builder. The walk/run builder solves knees from foot trajectories, compensates ankle rotation to keep soles level, and adds subtle shoulder rotation and relaxed elbow motion. Elbow weights follow the arm segments; the waistband follows the pelvis, with gentler influence through the middle of the long skirt. Step cadence uses each rig's stride distance and measured travel speed, and walk/run transitions preserve step phase. Walking is 1.65 m/s and jogging is 3.4 m/s; remote visitors switch to running above 2.6 m/s. Cached source meshes and their textures remain unchanged. Attribution in `/models/credits.html` reflects the supplied files' embedded metadata.

Shubhangi's welcome screen now renders her local GLB instead of the previously supplied Yanin iframe. No Sketchfab embed or external viewer is needed for any active character.

Validation: `npm run test:avatars` loads all four active files and checks dimensions, ground contact, horizontal centering, idempotent normalization, and clone independence. Existing rig-animation checks remain in the same suite.

Animation verification: the avatar suite checks normalized skin weights and actual skinned vertex displacement for walking, running, sitting and every celebration gesture. It also checks sole height, planted-foot drift, swing clearance, and matching loop endpoints on all six supported rigs. Ground contact assumes the museum's flat floor; turns and animation crossfades can still introduce some sliding. Development-only preview URLs accept `previewMotion=walk`, `run` or `sit` for visual review.
