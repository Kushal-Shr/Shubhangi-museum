import {
  sanitizeProfile,
  SPAWN,
  type AvatarProfile,
  type PlayerSnapshot,
  type VisitorRole,
} from "@museum/shared";
import { create } from "zustand";
import type { Exhibit } from "../config/exhibits";
import { avatarAssets } from "../config/avatars";

const DEFAULT_PROFILE: AvatarProfile = {
  displayName: "",
  skinTone: "#c68668",
  outfitColor: "#7d3157",
  modelId: "guest-female",
  hairStyle: "default",
  hairColor: "#30221d",
  outfit: "default",
  accessory: "none",
};

function loadProfile(): AvatarProfile {
  try {
    const saved = localStorage.getItem("museum-avatar");
    if (!saved) return DEFAULT_PROFILE;
    const profile = sanitizeProfile(JSON.parse(saved));
    // Migrate the old marker-only profile to a real character.
    if (!avatarAssets.some((asset) => asset.id === profile.modelId))
      profile.modelId = DEFAULT_PROFILE.modelId;
    return profile;
  } catch {
    return DEFAULT_PROFILE;
  }
}

type ConnectionStatus =
  | "idle"
  | "connecting"
  | "connected"
  | "reconnecting"
  | "error";

interface GameState {
  portalRole: VisitorRole;
  portalPassword: string;
  setPortal: (role: VisitorRole, password: string) => void;
  returnToEntrance: (message: string) => void;
  videoElement: HTMLVideoElement | null;
  setVideoElement: (element: HTMLVideoElement | null) => void;
  entered: boolean;
  quality: "low" | "balanced" | "high";
  setQuality: (quality: "low" | "balanced" | "high") => void;
  seatId: string;
  setSeat: (seatId: string) => void;
  correction: [number, number, number] | null;
  setCorrection: (position: [number, number, number]) => void;
  mapOpen: boolean;
  setMapOpen: (open: boolean) => void;
  profile: AvatarProfile;
  connectionStatus: ConnectionStatus;
  connectionMessage: string;
  sessionId: string | null;
  players: PlayerSnapshot[];
  birthdayStage: number;
  birthdayLastActor: string;
  birthdayMessage: string;
  birthdayActorId: string;
  birthdayFocus: boolean;
  setBirthdayFocus: (focus: boolean) => void;
  birthdayStartedAt: number;
  serverClockOffset: number;
  setClockOffset: (offset: number) => void;
  localPosition: [number, number, number];
  nearbyExhibit: Exhibit | null;
  activeExhibit: Exhibit | null;
  setProfile: (profile: AvatarProfile) => void;
  enter: () => void;
  setConnection: (status: ConnectionStatus, message?: string) => void;
  setSession: (sessionId: string | null) => void;
  setPlayers: (players: PlayerSnapshot[]) => void;
  setBirthdayState: (
    stage: number,
    actor?: string,
    startedAt?: number,
    actorId?: string,
  ) => void;
  setBirthdayMessage: (message: string) => void;
  setLocalPosition: (position: [number, number, number]) => void;
  setNearbyExhibit: (exhibit: Exhibit | null) => void;
  openExhibit: (exhibit: Exhibit) => void;
  closeExhibit: () => void;
}

export const useGameStore = create<GameState>((set, get) => ({
  portalRole: "guest",
  portalPassword: "",
  setPortal: (portalRole, portalPassword) =>
    set({ portalRole, portalPassword }),
  returnToEntrance: (connectionMessage) =>
    set({
      entered: false,
      connectionStatus: "idle",
      connectionMessage,
      portalPassword: "",
    }),
  videoElement: null,
  setVideoElement: (videoElement) => {
    const old = get().videoElement;
    if (old && old !== videoElement) old.pause();
    set({ videoElement });
  },
  entered: false,
  quality: matchMedia("(pointer: coarse)").matches ? "low" : "balanced",
  setQuality: (quality) => set({ quality }),
  seatId: "",
  setSeat: (seatId) => set({ seatId }),
  correction: null,
  setCorrection: (correction) => set({ correction }),
  mapOpen: false,
  setMapOpen: (mapOpen) => set({ mapOpen }),
  profile: loadProfile(),
  connectionStatus: "idle",
  connectionMessage: "",
  sessionId: null,
  players: [],
  birthdayStage: 0,
  birthdayLastActor: "",
  birthdayMessage: "",
  birthdayActorId: "",
  birthdayFocus: false,
  setBirthdayFocus: (birthdayFocus) => set({ birthdayFocus }),
  birthdayStartedAt: 0,
  serverClockOffset: 0,
  setClockOffset: (serverClockOffset) => set({ serverClockOffset }),
  localPosition: [...SPAWN],
  nearbyExhibit: null,
  activeExhibit: null,
  setProfile: (profile) => {
    try {
      localStorage.setItem("museum-avatar", JSON.stringify(profile));
    } catch {
      /* Private browsing may deny storage. */
    }
    set({ profile });
  },
  enter: () => {
    if (get().profile.displayName.trim()) set({ entered: true });
  },
  setConnection: (connectionStatus, connectionMessage = "") =>
    set({ connectionStatus, connectionMessage }),
  setSession: (sessionId) => set({ sessionId }),
  setPlayers: (players) => set({ players }),
  setBirthdayState: (
    birthdayStage,
    birthdayLastActor = "",
    birthdayStartedAt = 0,
    birthdayActorId = "",
  ) =>
    set({
      birthdayStage,
      birthdayLastActor,
      birthdayStartedAt,
      birthdayActorId,
    }),
  setBirthdayMessage: (birthdayMessage) => set({ birthdayMessage }),
  setLocalPosition: (localPosition) => set({ localPosition }),
  setNearbyExhibit: (nearbyExhibit) => set({ nearbyExhibit }),
  openExhibit: (activeExhibit) => set({ activeExhibit }),
  closeExhibit: () => set({ activeExhibit: null }),
}));

interface InputState {
  forward: number;
  right: number;
  running: boolean;
  lookX: number;
  lookY: number;
  setMove: (forward: number, right: number) => void;
  setRunning: (running: boolean) => void;
  addLook: (x: number, y: number) => void;
  consumeLook: () => { x: number; y: number };
}

export const useInputStore = create<InputState>((set, get) => ({
  forward: 0,
  right: 0,
  running: false,
  lookX: 0,
  lookY: 0,
  setMove: (forward, right) => set({ forward, right }),
  setRunning: (running) => set({ running }),
  addLook: (x, y) =>
    set((state) => ({ lookX: state.lookX + x, lookY: state.lookY + y })),
  consumeLook: () => {
    const { lookX: x, lookY: y } = get();
    set({ lookX: 0, lookY: 0 });
    return { x, y };
  },
}));
