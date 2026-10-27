"""Create an isolated, source-only GitHub copy without personal assets or history."""
from pathlib import Path
import re
import shutil
import subprocess

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "public-release"
if DEST.exists():
    raise SystemExit("public-release already exists. Move it elsewhere before exporting again.")

# Explicitly allow source/config, documentation and shareable static art only.
roots = ("apps/web/src/", "apps/server/src/", "packages/shared/src/", "docs/", "scripts/",
         "apps/web/public/art/", "apps/web/public/materials/")
extensions = {".ts", ".tsx", ".css", ".json", ".md", ".py", ".mjs", ".svg", ".jpg", ".png", ".webp"}
special = {".gitignore", "README.md", "package.json", "package-lock.json", "tsconfig.base.json",
           "apps/web/index.html", "apps/web/vite.config.ts", "apps/web/public/models/credits.html"}
secrets = []
for env in (ROOT / "apps/server/.env.local", ROOT / "apps/web/.env.local", ROOT / ".env.local", ROOT / ".env"):
    if env.exists():
        for line in env.read_text().splitlines():
            key, sep, value = line.partition("=")
            value = value.strip().strip("\"'")
            if sep and re.search(r"PASSWORD|SECRET|TOKEN|API_KEY", key, re.I) and len(value) >= 8:
                secrets.append(value.encode())

candidates = []
for path in ROOT.rglob("*"):
    relative = path.relative_to(ROOT).as_posix()
    if not path.is_file() or path.is_symlink():
        continue
    if any(part in {"node_modules", "dist", ".git", "public-release", "__pycache__"} for part in path.relative_to(ROOT).parts):
        continue
    allowed = relative in special or (relative.startswith(roots) and path.suffix.lower() in extensions)
    allowed |= path.parent in {ROOT / "apps/web", ROOT / "apps/server", ROOT / "packages/shared"} and (
        path.name == "package.json" or path.name.startswith("tsconfig") or path.name == ".env.example")
    if not allowed:
        continue
    ignored = subprocess.run(["git", "check-ignore", "--quiet", "--", str(path)], cwd=ROOT).returncode == 0
    if ignored:
        continue
    data = path.read_bytes()
    if any(secret in data for secret in secrets):
        raise SystemExit(f"Export stopped: local credential found in {relative} (value withheld).")
    if re.search(rb"-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----|\b(?:ghp_|github_pat_|AKIA)[A-Za-z0-9_]{16,}", data):
        raise SystemExit(f"Export stopped: possible credential in {relative} (value withheld).")
    candidates.append((path, relative))

DEST.mkdir()
for path, relative in candidates:
    target = DEST / relative
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(path, target)

# Use the existing procedural fallback instead of requesting missing licensed models.
avatars = DEST / "apps/web/src/config/avatars.ts"
interface = avatars.read_text().split("/** Add licensed", 1)[0]
avatars.write_text(interface + "// Add your own licensed models locally.\nexport const avatarAssets: AvatarAsset[] = [];\n")
styles = DEST / "apps/web/src/styles.css"
styles.write_text(styles.read_text().replace("url('/museum-preview.jpg')", "linear-gradient(#243c32, #182a23)"))
print(f"Exported {len(candidates)} files to public-release. No Git history copied.")
print("Personal photos, photo metadata, credentials and downloaded character files are excluded.")
