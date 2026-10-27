import type { Point3, RoomId } from "@museum/shared";
import { museumPoint } from "@museum/shared";
import galleryPhotos from "./gallery";
export interface Exhibit {
  id: string;
  room: RoomId;
  title: string;
  date?: string;
  caption: string;
  type: "photo" | "video" | "letter" | "surprise" | "seat";
  image: string;
  thumbnail: string;
  videoUrl?: string;
  body?: string;
  seatId?: string;
  position: Point3;
  rotationY: number;
  interactionPoint: Point3;
  frameStyle: "brass" | "oak" | "floating";
  size: [number, number];
  placeholder: boolean;
}
const art = [
  "first-chapter",
  "little-things",
  "adventures",
  "laughter",
  "always",
];
function photo(
  room: RoomId,
  n: number,
  position: Point3,
  rotationY = 0,
  size: [number, number] = [1.9, 1.45],
): Exhibit {
  position = museumPoint(position);
  const collection = room === "story" ? galleryPhotos.story : room === "her" ? galleryPhotos.her : [];
  const uploaded = collection[n - 1];
  const image = uploaded?.image ?? `/art/${art[n % art.length]}.svg`;
  return {
    id: `${room}-${String(n).padStart(2, "0")}`,
    room,
    title: `${room === "her" ? "Portrait" : "Memory"} ${String(n).padStart(2, "0")}`,
    date: uploaded ? undefined : "Your date here",
    caption: uploaded
      ? ""
      : "A place for your photograph and the words that belong with it.",
    type: "photo",
    image,
    thumbnail: uploaded?.thumbnail ?? image,
    position,
    rotationY,
    size,
    frameStyle:
      room === "her" || room === "birthday"
        ? "brass"
        : room === "story"
          ? "oak"
          : "floating",
    placeholder: !uploaded,
    interactionPoint: [
      position[0] + Math.sin(rotationY) * 1.7,
      0,
      position[2] + Math.cos(rotationY) * 1.7,
    ],
  };
}
export const exhibits: Exhibit[] = [];
// Five photographs on each of three walls: exactly fifteen in each salon.
for (const room of ["story", "her"] as const) {
  const side = room === "story" ? -1 : 1;
  let n = 1;
  for (const z of [-2, 0.5, 3, 5.5, 8])
    exhibits.push(
      photo(
        room,
        n++,
        [side * 16.78, 2.25, z],
        (-side * Math.PI) / 2,
        [1.75, 1.4],
      ),
    );
  for (const x of [5, 7.5, 10, 12.5, 15]) {
    const hero = room === "her" && x === 10;
    const frame = photo(
      room,
      n++,
      [side * x, 2.25, -3.78],
      0,
      hero ? [1.9, 2.25] : [1.75, 1.4],
    );
    if (hero) frame.title = "The Girl Behind It All";
    exhibits.push(frame);
  }
  for (const x of [5, 7.5, 10, 12.5, 15])
    exhibits.push(
      photo(room, n++, [side * x, 2.25, 9.78], Math.PI, [1.75, 1.4]),
    );
}
export const videos = [
  {
    id: "film-01",
    title: "Kushal & Shubhangi",
    url: "",
    description: "Something for us to watch together, Shubhangi.",
  },
  {
    id: "film-02",
    title: "A favorite memory",
    url: "",
    description: "Shubhangi, I’m glad we have this to look back on.",
  },
  {
    id: "birthday-film",
    title: "Happy birthday, Shubhangi",
    url: "",
    description: "For Shubhangi, with love from Kushal.",
  },
];
