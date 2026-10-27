# Art, character and media handoff

## Included environment assets

Original architectural geometry, furniture, stylized botanical dressing, procedural plaster and metal materials, and a small original environment-lighting capture are included. Marble and wood use local Poly Haven color, OpenGL normal and roughness maps. See `apps/web/public/materials/LICENSE.md` for CC0 provenance. No runtime request to Poly Haven is needed.

This is an architectural environment pass, not a fully scanned photorealistic scene. Plants/flowers and furniture are lightweight authored geometry. There are no baked lightmaps, planar reflections, or production-quality botanical GLBs yet. The water uses an environment reflection, not a live mirror of the museum.

## Included human characters

Four local GLBs are active: the user-supplied Shubhangi, Kushal and guest-girl models, plus the previously installed Standing Man guest. See [SELECTED-AVATARS.md](SELECTED-AVATARS.md) for filenames, embedded source metadata, size and motion limitations. Attribution is available at `/models/credits.html`.

The three new files have embedded textures but no authored skeletons or clips. The app adds a local runtime skeleton and smooth skin weights, allowing procedural walking, running, sitting and celebration movements. Standing Man retains its original skeleton. The generated rigs are approximate, especially around clothing and the long dress. Shubhangi's preview uses the local GLB instead of the old Sketchfab embed. Original files remain intact; Kushal's pavement is cropped from cloned geometry at runtime.

Additional models belong in `apps/web/public/models/` and must be registered in `apps/web/src/config/avatars.ts`. Use self-contained GLBs with embedded textures. The procedural motion builder requires the expected bones. The three supplied scans first pass through their configured `scanRig` profile; other static models need a matching rig profile or an authored skeleton before enabling procedural motion.

## Photos, letters and videos

Edit `apps/web/src/config/exhibits.ts`; rendering components do not need changes.

- The 15 photos in `memories/` fill `story-01` through `story-15`; the 15 in `shubhangi-pictures/` fill `her-01` through `her-15`.
- Run `python3 scripts/import-photos.py` on macOS to regenerate the JPEGs and thumbnails using `sips`. Originals stay unchanged. Photos follow the timestamp in each pasted filename; these timestamps are used only for ordering, not displayed as dates taken.
- `apps/web/src/config/gallery-photos.json` records the source-to-exhibit mapping. Browser-ready images live in `apps/web/public/media/`, with 512px thumbnails in `media/thumbs/` and full images capped at 1800px. The four HEIC originals are converted to JPEG.
- HEIC conversion needs access to the macOS decoder outside the agent sandbox. The importer validates decoded pixels before replacing images, rejecting entirely black output even when dimensions are valid. Content-hash query strings refresh browser and texture caches when an image changes.
- Each exhibit has ID, room, title, caption, date, full image URL, thumbnail, media type, position, rotation, frame style, frame dimensions, interaction point and placeholder flag. Special entries handle letters, film selection and the final gift.
- For a generated slot, add an override **after** the exhibit array is populated, for example:

```ts
const first = exhibits.find(exhibit => exhibit.id === "story-01")!;
Object.assign(first, {
  title: "[Your real title]",
  date: "[Your date]",
  caption: "[Your own caption]",
  image: "/media/story-01.webp",
  thumbnail: "/media/thumbs/story-01.webp",
  placeholder: false,
});
```

Use 384–512px thumbnails (ideally under 80 KB), full photos around 1600–2048px (under 500 KB), and keep both URLs separate. Thumbnails mount only within 24 m. Full photos load only in the viewer. Frames preserve the photograph's aspect ratio without cropping. Failed image loads leave a frame or explanatory message rather than crashing the scene.

`videos` contains three editable playlist entries, including the birthday film. Set a URL to an H.264/AAC MP4 for broad compatibility, or a browser-compatible WebM. Cross-origin video hosts must allow CORS for the WebGL projection; signed media URLs are supported when the host allows this origin. Native controls provide play/pause, scrubbing, volume and fullscreen where the browser supports them. Nothing downloads until the film viewer opens. Choosing a film replaces the active video. Theater playback reuses that native element as a texture on the large screen; there is only one media stream per visitor. **Playback is local, not synchronized between visitors.**

Replace bracketed letter and final-surprise text with your words. No personal facts or memories have been invented. The tribute room has separate portrait, appreciation letter and achievements slots.

## Private content

Nothing has been uploaded, published, or configured for public hosting. Anything placed in Vite's `public/` becomes publicly downloadable if you deploy that site. For private deployment, protect the site AND media with authentication, private invitation access and short-lived signed URLs before adding personal content. URL expiry/refresh is not implemented; this is still a content-integration task. The current shared Colyseus room has no invitation/auth gate.
