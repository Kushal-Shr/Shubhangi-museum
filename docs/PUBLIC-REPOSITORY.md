# Publishing the source

Run `python3 scripts/export-public.py` from the project folder. It creates
`public-release/`, an isolated source copy without the parent repository's history.
The exporter refuses to overwrite an existing release folder.

Publish that folder, not the enclosing Projects repository. Initialize a new Git
repository inside public-release before staging files. Review `git status` before
committing. Never use `git add -f` for ignored private files.

The export excludes environment files (except empty examples), personal photo
originals, generated photos and thumbnails, their metadata, downloaded character
models, local caches and build output. Public copies use placeholder gallery art
and the procedural character fallback. The working museum keeps its local assets.

Names and birthday wording intentionally remain in the public source. This is a
source-only release, not an anonymized version of the app.

## Hosting the personalized museum

A Git-connected deployment from the public repository will not contain your
photos or downloaded models. Supply those separately in a private build process,
or deploy the personalized museum from a private repository. Set the two role
passwords only in the server host's environment settings.

Ignoring photos in Git does not protect photos served by a deployed website.
The current role passwords control birthday actions, not access to media URLs.

Local gallery metadata is optional: `apps/web/src/config/gallery-photos.json`.
The photo importer writes it when you prepare your own photo collection.

The exporter checks for local credential values and common token signatures, but
this is not a guarantee against every possible secret format. Review the exported
files before publishing. If secrets were ever pushed elsewhere, ignoring them
does not erase that history; revoke exposed credentials.
