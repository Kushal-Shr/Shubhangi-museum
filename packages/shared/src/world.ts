import {
  BIRTHDAY_CAKE_POSITION,
  museumPoint,
  MUSEUM_SCALE,
} from "./contracts.js";
export type Point3 = [number, number, number];
export type RoomId = "plaza" | "lobby" | "story" | "her" | "birthday";
export interface WorldBox {
  id: string;
  position: Point3;
  size: Point3;
  material: "stone" | "plaster" | "wood" | "dark" | "glass";
}
export const SPAWN: Point3 = [0, 0.92, 18];
export const rooms: {
  id: RoomId;
  title: string;
  number: string;
  bounds: [number, number, number, number];
  description: string;
}[] = [
  {
    id: "plaza",
    title: "The Garden",
    number: "·",
    bounds: [-35, 35, 10, 37],
    description: "Take a walk, or stay a while.",
  },
  {
    id: "lobby",
    title: "Museum of Us",
    number: "·",
    bounds: [-3, 3, -4, 10],
    description:
      "Our Story is on the left, The Girl Behind It All is on the right, and the birthday cake is straight ahead.",
  },
  {
    id: "story",
    title: "Our Story",
    number: "01",
    bounds: [-17, -3, -4, 10],
    description: "Some of our favorite memories, together.",
  },
  {
    id: "her",
    title: "The Girl Behind It All",
    number: "02",
    bounds: [3, 17, -4, 10],
    description: "A few of my favorite photos of you.",
  },
  {
    id: "birthday",
    title: "Shubhangi’s Birthday",
    number: "03",
    bounds: [-7, 7, -18, -4],
    description: "Make a wish. I hope it comes true.",
  },
];
for (const room of rooms)
  if (room.id !== "plaza") {
    const [left, right, back, front] = room.bounds;
    room.bounds = [
      left * MUSEUM_SCALE,
      right * MUSEUM_SCALE,
      10 + (back - 10) * MUSEUM_SCALE,
      10 + (front - 10) * MUSEUM_SCALE,
    ];
  }
export function roomAt(x: number, z: number) {
  return (
    rooms.find(
      (r) =>
        x >= r.bounds[0] &&
        x <= r.bounds[1] &&
        z >= r.bounds[2] &&
        z <= r.bounds[3],
    ) ?? rooms[0]!
  );
}
const box = (
  id: string,
  x: number,
  y: number,
  z: number,
  w: number,
  h: number,
  d: number,
  material: WorldBox["material"] = "plaster",
): WorldBox => ({ id, position: [x, y, z], size: [w, h, d], material });

// Two 14 × 14 m photo salons and a 14 × 14 m celebration room.
// The only circulation space is the six-metre-wide entrance hall.
export const walls: WorldBox[] = [
  ...[-1, 1].flatMap((side) => [
    box(`outer-${side}`, side * 17, 2.3, 3, 0.32, 4.6, 14),
    box(`gallery-back-${side}`, side * 10, 2.3, -4, 14, 4.6, 0.32),
    box(`gallery-front-${side}`, side * 10, 2.3, 10, 14, 4.6, 0.32),
    box(`hall-front-${side}`, side * 3, 2.3, 7.5, 0.32, 4.6, 5),
    box(`hall-back-${side}`, side * 3, 2.3, -1.5, 0.32, 4.6, 5),
    box(`gallery-portal-${side}`, side * 3, 4, 3, 0.32, 1.2, 4),
    box(`birthday-side-${side}`, side * 7, 2.3, -11, 0.32, 4.6, 14),
    box(`birthday-shoulder-${side}`, side * 4.5, 2.3, -4, 5, 4.6, 0.32),
    box(`entry-pier-${side}`, side * 2.5, 2.3, 10, 1, 4.6, 0.4, "stone"),
    box(`open-door-${side}`, side * 2.1, 1.6, 11, 0.1, 3.2, 2, "glass"),
  ]),
  box("birthday-back", 0, 2.3, -18, 14, 4.6, 0.32),
  box("birthday-portal", 0, 4, -4, 4, 1.2, 0.32),
  box("entrance-lintel", 0, 4, 10, 4, 1.2, 0.4, "stone"),
];
for (const wall of walls) {
  wall.position = museumPoint(wall.position);
  wall.size = [
    wall.size[0] * MUSEUM_SCALE,
    wall.size[1],
    wall.size[2] * MUSEUM_SCALE,
  ];
}
export const benches = [
  [-10, 4],
  [10, 4],
  [-10, 20],
  [10, 20],
].map(([x, z]) => {
  const p = z! < 10 ? museumPoint([x!, 0, z!]) : [x!, 0, z!];
  return [p[0]!, p[2]!] as const;
});
export const seats: { id: string; x: number; z: number }[] = [];
export const planters = [
  [-4, 14],
  [4, 14],
  [-5.8, -5.3],
  [5.8, -5.3],
  [-29, 18],
  [29, 18],
] as const;
for (const p of planters as unknown as [number, number][])
  if (p[1] < 10) {
    const q = museumPoint([p[0], 0, p[1]]);
    p[0] = q[0];
    p[1] = q[2];
  }
export const flowerPositions: Point3[] = [
  [-5.5, 0, -17],
  [5.5, 0, -17],
];
for (let i = 0; i < flowerPositions.length; i++)
  flowerPositions[i] = museumPoint(flowerPositions[i]!);
export const celebrationProps: WorldBox[] = [
  box("dessert-table", -6, 0.5, -14, 2.6, 1, 1.2, "wood"),
  box("gift-display", 6, 0.4, -14, 2.5, 0.8, 1.6, "wood"),
  box("kitty-plinth", 0, 0.55, -21.5, 1.5, 1.1, 1.2, "stone"),
  box("love-seat", -5.8, 0.5, -19, 3, 1, 1.1, "wood"),
  box("love-seat-right", 5.8, 0.5, -19, 3, 1, 1.1, "wood"),
];
// World-space furniture footprints shared by rendering, physics and the server.
// Keep the gallery entrance and the perimeter photo-viewing aisle open.
export const galleryFurnishings: WorldBox[] = [-1, 1].flatMap((side) => {
  const room = side < 0 ? "story" : "her";
  const x = side * 12;
  return [
    box(`${room}-display-case`, x, 0.85, 5.1, 3.2, 1.7, 1.3, "wood"),
    box(`${room}-bronze-plinth`, x - 3, 0.54, 6.2, 1.08, 1.08, 1.08, "stone"),
    box(`${room}-ceramic-plinth`, x + 3, 0.54, 6.2, 1.08, 1.08, 1.08, "stone"),
    box(`${room}-wall-case`, side * 4.27, 0.75, -3, 0.8, 1.5, 2.9, "wood"),
    box(`${room}-plant`, side * 7.1, 0.4, 6.5, 0.75, 0.8, 0.75, "stone"),
  ];
});
export const gardenTrees = [
  ...[-1, 1].flatMap((side) =>
    [-45, -33, -21, -9, 3].map((z) => [side * 29, z] as const),
  ),
  ...[-22, -11, 0, 11, 22].map((x) => [x, -47] as const),
];
export const gardenStructures: WorldBox[] = [
  ...[-1, 1].map((side) =>
    box(
      `front-flower-bed-${side}`,
      side * 12,
      0.4,
      11.1,
      14,
      0.8,
      1.1,
      "stone",
    ),
  ),
  ...gardenTrees.map(([x, z], i) =>
    box(`cherry-trunk-${i}`, x, 1.7, z, 0.5, 3.4, 0.5, "wood"),
  ),
  ...[-2.5, 2.5].flatMap((x) =>
    [-32.5, -37.5].map((z) =>
      box(`gazebo-${x}-${z}`, x, 1.6, z, 0.18, 3.2, 0.18, "stone"),
    ),
  ),
  box("garden-love-bench", -14, 0.48, -34, 3.6, 0.96, 1.15, "wood"),
  box("garden-love-bench-2", 14, 0.48, -34, 3.6, 0.96, 1.15, "wood"),
  box("picnic-table", 14, 0.45, 26, 3, 0.9, 2, "wood"),
];
export const furniture: WorldBox[] = [
  ...galleryFurnishings,
  ...celebrationProps,
  ...gardenStructures,
  ...[-25, 25].flatMap((x) =>
    [14, 22, 31].map((z) =>
      box(`garden-${x}-${z}`, x, 0.2, z, 6, 0.4, 5, "stone"),
    ),
  ),
  ...flowerPositions.map(([x, , z], i) =>
    box(`flowers-${i}`, x, 0.55, z, 0.55, 1.1, 0.55, "stone"),
  ),
  box(
    "birthday-table",
    BIRTHDAY_CAKE_POSITION[0],
    0.5,
    BIRTHDAY_CAKE_POSITION[2],
    2.4,
    1,
    2.4,
    "wood",
  ),
  box("pool", -13, 0.2, 28, 15, 0.4, 8, "stone"),
  ...benches.map(([x, z], i) =>
    box(`bench-${i}`, x, 0.48, z, 3.6, 0.96, 1.15, "wood"),
  ),
  ...planters.map(([x, z], i) =>
    box(`planter-${i}`, x, 0.65, z, 1.2, 1.3, 1.2, "stone"),
  ),
];
export const obstacles = [...walls, ...furniture];
/** Swept XZ segment against expanded boxes: prevents crossing thin walls between packets. */
export function segmentHitsBox(
  ax: number,
  az: number,
  bx: number,
  bz: number,
  b: WorldBox,
  radius = 0.32,
) {
  if (b.position[1] - b.size[1] / 2 > 1.9) return false;
  let lo = 0,
    hi = 1;
  for (const [a, d, c, h] of [
    [ax, bx - ax, b.position[0], b.size[0] / 2 + radius],
    [az, bz - az, b.position[2], b.size[2] / 2 + radius],
  ]) {
    if (Math.abs(d!) < 1e-8) {
      if (a! < c! - h! || a! > c! + h!) return false;
    } else {
      let t1 = (c! - h! - a!) / d!,
        t2 = (c! + h! - a!) / d!;
      if (t1 > t2) [t1, t2] = [t2, t1];
      lo = Math.max(lo, t1);
      hi = Math.min(hi, t2);
      if (lo > hi) return false;
    }
  }
  return true;
}
export function movementBlocked(
  ax: number,
  az: number,
  bx: number,
  bz: number,
) {
  return obstacles.some((b) => segmentHitsBox(ax, az, bx, bz, b));
}
