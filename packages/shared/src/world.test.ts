import { describe, expect, it } from "vitest";
import {
  movementBlocked,
  obstacles,
  roomAt,
  rooms,
  segmentHitsBox,
  SPAWN,
} from "./world";
import {
  BIRTHDAY_CAKE_POSITION,
  BIRTHDAY_INTERACTION_RADIUS,
  museumPoint,
} from "./contracts";

describe("intimate three-room museum", () => {
  it("has only three themed rooms, each smaller than the original wings", () => {
    const galleries = rooms.filter((r) => !["plaza", "lobby"].includes(r.id));
    expect(galleries.map((r) => r.id)).toEqual(["story", "her", "birthday"]);
    for (const r of galleries) {
      expect(
        (r.bounds[1] - r.bounds[0]) * (r.bounds[3] - r.bounds[2]),
      ).toBeCloseTo(282.24);
    }
  });
  it("connects the entrance, both photo rooms, and birthday room", () => {
    expect(roomAt(SPAWN[0], SPAWN[2]).id).toBe("plaza");
    expect(movementBlocked(0, 18, 0, 3)).toBe(false);
    expect(movementBlocked(0, 3, -6, 3)).toBe(false);
    expect(movementBlocked(0, 3, 6, 3)).toBe(false);
    expect(movementBlocked(0, 3, 0, -8.9)).toBe(false);
    expect(roomAt(-6, 3).id).toBe("story");
    expect(roomAt(6, 3).id).toBe("her");
    expect(roomAt(0, -8).id).toBe("birthday");
  });
  it("keeps walls, benches, the pool, and cake table solid", () => {
    for (const [ax, az, bx, bz] of [
      [2, -1, 4, -1],
      [-10, -3, -10, -5],
      [0, -9, 0, -13],
      [-10, 2, -10, 6],
      [-13, 22, -13, 33],
    ]) {
      const a = az! < 10 ? museumPoint([ax!, 0, az!]) : [ax!, 0, az!];
      const b = bz! < 10 ? museumPoint([bx!, 0, bz!]) : [bx!, 0, bz!];
      expect(movementBlocked(a[0]!, a[2]!, b[0]!, b[2]!)).toBe(true);
    }
  });
  it("lets guests reach the smaller cake from every side", () => {
    for (let i = 0; i < 10; i++) {
      const a = (i * Math.PI) / 5;
      const x = BIRTHDAY_CAKE_POSITION[0] + Math.sin(a) * 2.15;
      const z = BIRTHDAY_CAKE_POSITION[2] + Math.cos(a) * 2.15;
      expect(Math.hypot(x, z - BIRTHDAY_CAKE_POSITION[2])).toBeLessThan(
        BIRTHDAY_INTERACTION_RADIUS,
      );
      expect(obstacles.some((b) => segmentHitsBox(x, z, x, z, b, 0.36))).toBe(
        false,
      );
    }
  });
});
