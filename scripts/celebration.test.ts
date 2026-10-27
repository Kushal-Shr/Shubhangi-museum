import { expect, test } from "vitest";
import {
  BreathDetector,
  breathFeatures,
} from "../apps/web/src/audio/breathDetector";
import { exhibits } from "../apps/web/src/config/exhibits";
import {
  obstacles,
  roomAt,
  segmentHitsBox,
} from "../packages/shared/src/world";

test("fifteen photos per gallery, no birthday photo grid; every frame is reachable", () => {
  expect(
    exhibits.filter((e) => e.type === "photo" && e.room === "story"),
  ).toHaveLength(15);
  expect(
    exhibits.filter((e) => e.type === "photo" && e.room === "her"),
  ).toHaveLength(15);
  expect(
    exhibits.filter((e) => e.type === "photo" && e.room === "birthday"),
  ).toHaveLength(0);
  for (const exhibit of exhibits) {
    const [x, , z] = exhibit.interactionPoint;
    expect(roomAt(x, z).id, exhibit.id).toBe(exhibit.room);
    expect(
      obstacles.some((b) => segmentHitsBox(x, z, x, z, b, 0.36)),
      exhibit.id,
    ).toBe(false);
    for (const other of exhibits) {
      if (other.id === exhibit.id || other.rotationY !== exhibit.rotationY)
        continue;
      const along = Math.abs(Math.cos(exhibit.rotationY)) > 0.5 ? 0 : 2;
      const normal = along === 0 ? 2 : 0;
      if (Math.abs(other.position[normal] - exhibit.position[normal]) > 0.1)
        continue;
      expect(
        Math.abs(other.position[along] - exhibit.position[along]),
        exhibit.id + " overlaps " + other.id,
      ).toBeGreaterThan((exhibit.size[0] + other.size[0]) / 2 + 0.15);
    }
  }
});

const quiet = { rms: 0.003, flatness: 0.2, crossings: 0.1 };
const breath = { rms: 0.09, flatness: 0.35, crossings: 0.25 };
function calibrated() {
  const detector = new BreathDetector(0);
  for (let t = 0; t < 1000; t += 20) detector.update(t, quiet);
  return detector;
}
test("calibrates first and triggers only once on a sustained broadband breath", () => {
  const detector = calibrated();
  let triggers = 0;
  for (let t = 1000; t < 3000; t += 20)
    if (detector.update(t, breath).detected) triggers++;
  expect(triggers).toBe(1);
});
test("silence, a short clap, and a loud tonal sound do not extinguish candles", () => {
  for (const sound of [quiet, { rms: 0.3, flatness: 0.001, crossings: 0.05 }]) {
    const detector = calibrated();
    for (let t = 1000; t < 3000; t += 20)
      expect(detector.update(t, sound).detected).toBe(false);
  }
  const detector = calibrated();
  for (let t = 1000; t < 3000; t += 20)
    expect(detector.update(t, t < 1120 ? breath : quiet).detected).toBe(false);
});
test("signal analysis distinguishes broad noise from a tonal spectrum", () => {
  const samples = Float32Array.from(
    { length: 2048 },
    (_, i) => ((i % 7) - 3) * 0.04,
  );
  const noise = breathFeatures(samples, new Float32Array(1024).fill(-45));
  const toneBins = new Float32Array(1024).fill(-110);
  toneBins[20] = -10;
  const tone = breathFeatures(samples, toneBins);
  expect(noise.rms).toBeGreaterThan(0.04);
  expect(noise.flatness).toBeGreaterThan(0.9);
  expect(tone.flatness).toBeLessThan(0.01);
});
