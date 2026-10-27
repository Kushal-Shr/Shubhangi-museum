export const ROOM_NAME = "museum";
export const ROOM_MAX_CLIENTS = 10;
export const PLAYER_MAX_SPEED = 6.5;
export type VisitorRole = "host" | "girlfriend" | "guest";
export const ROLE_MODELS = {
  host: "kushal",
  girlfriend: "shubhangi",
  guest: "guest-female",
} as const;
export function canBirthdayAction(role: VisitorRole, action: BirthdayAction) {
  if (action === "blow" || action === "cut") return role === "girlfriend";
  if (action === "light" || action === "reset") return role === "host";
  return role === "host" || role === "girlfriend";
}
export const WORLD_BOUNDS = {
  minX: -34,
  maxX: 34,
  minZ: -53,
  maxZ: 35,
} as const;

export interface AvatarProfile {
  displayName: string;
  skinTone: string;
  outfitColor: string;
  modelId: string;
  hairStyle: string;
  hairColor: string;
  outfit: string;
  accessory: string;
}

export interface MovementMessage {
  x: number;
  y: number;
  z: number;
  rotation: number;
  sequence: number;
}

export const MUSEUM_SCALE = 1.2;
export function museumPoint([x, y, z]: [number, number, number]): [
  number,
  number,
  number,
] {
  return [x * MUSEUM_SCALE, y, 10 + (z - 10) * MUSEUM_SCALE];
}
export const BIRTHDAY_CAKE_POSITION = [0, 0, -15.2] as const;
export const BIRTHDAY_INTERACTION_RADIUS = 2.35;
// Minimum time before the next action; shared with the animation timeline.
export const BIRTHDAY_STAGE_DURATION = [0, 1400, 1800, 3200, 5200] as const;
export const BIRTHDAY_STAGE = {
  waiting: 0,
  candlesLit: 1,
  candlesBlown: 2,
  cakeCut: 3,
  served: 4,
} as const;
export type BirthdayStage =
  (typeof BIRTHDAY_STAGE)[keyof typeof BIRTHDAY_STAGE];
export type BirthdayAction = "light" | "blow" | "cut" | "serve" | "reset";

export function nextBirthdayAction(stage: number): BirthdayAction {
  if (stage === BIRTHDAY_STAGE.waiting) return "light";
  if (stage === BIRTHDAY_STAGE.candlesLit) return "blow";
  if (stage === BIRTHDAY_STAGE.candlesBlown) return "cut";
  if (stage === BIRTHDAY_STAGE.cakeCut) return "serve";
  return "reset";
}

export interface PlayerSnapshot extends AvatarProfile {
  role: VisitorRole;
  id: string;
  seatId: string;
  x: number;
  y: number;
  z: number;
  rotation: number;
}

export function sanitizeProfile(input: Partial<AvatarProfile>): AvatarProfile {
  const displayName =
    String(input.displayName ?? "Guest")
      .replace(/[^a-zA-Z0-9 '\-]/g, "")
      .trim()
      .slice(0, 20) || "Guest";

  const safeHex = (value: unknown, fallback: string) =>
    /^#[0-9a-fA-F]{6}$/.test(String(value)) ? String(value) : fallback;

  const safeId = (value: unknown, fallback: string) =>
    typeof value === "string" && /^[a-z0-9_-]{1,40}$/.test(value)
      ? value
      : fallback;

  return {
    displayName,
    skinTone: safeHex(input.skinTone, "#c68668"),
    outfitColor: safeHex(input.outfitColor, "#7d3157"),
    modelId: safeId(input.modelId, "visitor"),
    hairStyle: safeId(input.hairStyle, "default"),
    hairColor: safeHex(input.hairColor, "#30221d"),
    outfit: safeId(input.outfit, "default"),
    accessory: safeId(input.accessory, "none"),
  };
}

export function clampToMuseum(x: number, z: number) {
  return {
    x: Math.min(WORLD_BOUNDS.maxX, Math.max(WORLD_BOUNDS.minX, x)),
    z: Math.min(WORLD_BOUNDS.maxZ, Math.max(WORLD_BOUNDS.minZ, z)),
  };
}
