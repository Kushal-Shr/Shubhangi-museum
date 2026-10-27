"""Prepare the two supplied photo folders for the museum (macOS sips).

Run from any directory with: python3 scripts/import-photos.py
Originals remain unchanged. Output names match the existing exhibit IDs.
"""
import datetime
import hashlib
import json
from pathlib import Path
import re
import subprocess
import struct
import tempfile

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "apps/web/public/media"
MANIFEST = ROOT / "apps/web/src/config/gallery-photos.json"
COLLECTIONS = {"story": "memories", "her": "shubhangi-pictures"}
EXTENSIONS = {".png", ".jpg", ".jpeg", ".heic", ".heif"}


def ordering(path):
    match = re.search(r"(\d{4}-\d{2}-\d{2}) at (\d{1,2}\.\d{2}\.\d{2}) (AM|PM)", path.stem)
    if match:
        date = datetime.datetime.strptime(" ".join(match.groups()), "%Y-%m-%d %I.%M.%S %p")
        return (0, date.isoformat(), path.name)
    return (1, path.name.casefold(), path.name)


def sips(*args):
    return subprocess.run(["sips", *map(str, args)], check=True, capture_output=True, text=True).stdout


def dimensions(path):
    output = sips("-g", "pixelWidth", "-g", "pixelHeight", path)
    matches = [re.search(rf"{key}: (\d+)", output) for key in ("pixelWidth", "pixelHeight")]
    if not all(matches):
        raise ValueError(f"Image could not be decoded: {path}")
    return tuple(int(match.group(1)) for match in matches)


def check_pixels(path, scratch):
    """Reject decoder failures that still produce a valid, entirely black JPEG."""
    sample = scratch / "pixels.bmp"
    sips("-s", "format", "bmp", "-Z", "32", path, "--out", sample)
    data = sample.read_bytes()
    offset = struct.unpack_from("<I", data, 10)[0]
    width, height, planes, bits, compression = struct.unpack_from("<iiHHI", data, 18)
    if data[:2] != b"BM" or planes != 1 or bits not in (24, 32) or compression != 0:
        raise ValueError(f"Unsupported pixel-validation format: {path}")
    stride = ((width * bits + 31) // 32) * 4
    brightest = max(max(data[offset + y * stride + x * (bits // 8):
                            offset + y * stride + x * (bits // 8) + 3])
                     for y in range(abs(height)) for x in range(width))
    if brightest <= 4:
        raise ValueError(f"Conversion produced a black image: {path}. "
                         "HEIC decoding requires access to the macOS decoder outside the sandbox.")


def versioned_url(path):
    digest = hashlib.sha256(path.read_bytes()).hexdigest()[:12]
    return f"/media/{path.relative_to(OUTPUT).as_posix()}?v={digest}"


def main():
    collections = {}
    for room, folder in COLLECTIONS.items():
        sources = sorted((p for p in (ROOT / folder).iterdir()
                          if p.is_file() and p.suffix.lower() in EXTENSIONS), key=ordering)
        if len(sources) != 15:
            raise ValueError(f"{folder}: expected 15 photos, found {len(sources)}")
        collections[room] = sources
    OUTPUT.mkdir(parents=True, exist_ok=True)
    (OUTPUT / "thumbs").mkdir(exist_ok=True)
    manifest = {}
    for room, sources in collections.items():
        manifest[room] = []
        for index, source in enumerate(sources, 1):
            filename = f"{room}-{index:02}.jpg"
            full = OUTPUT / filename
            thumb = OUTPUT / "thumbs" / filename
            width, height = dimensions(source)
            with tempfile.TemporaryDirectory(prefix="museum-photo-") as directory:
                scratch = Path(directory)
                staged_full, staged_thumb = scratch / "full.jpg", scratch / "thumb.jpg"
                sips("-s", "format", "jpeg", "-s", "formatOptions", "82",
                     "-Z", min(1800, max(width, height)), source, "--out", staged_full)
                dimensions(staged_full)
                check_pixels(staged_full, scratch)
                sips("-s", "format", "jpeg", "-s", "formatOptions", "78",
                     "-Z", min(512, max(dimensions(staged_full))), staged_full, "--out", staged_thumb)
                check_pixels(staged_thumb, scratch)
                # Never replace a working gallery image with a failed decode.
                full.write_bytes(staged_full.read_bytes())
                thumb.write_bytes(staged_thumb.read_bytes())
            width, height = dimensions(full)
            manifest[room].append({
                "source": str(source.relative_to(ROOT)),
                "image": versioned_url(full),
                "thumbnail": versioned_url(thumb),
                "width": width, "height": height,
            })
        print(f"{room}: prepared {len(sources)} photos and thumbnails", flush=True)
    MANIFEST.write_text(json.dumps(manifest, indent=2) + "\n")
    print(f"Wrote {MANIFEST.relative_to(ROOT)}")


if __name__ == "__main__":
    main()
