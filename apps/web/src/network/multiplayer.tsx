import {
  ROOM_NAME,
  type BirthdayAction,
  type MovementMessage,
  type PlayerSnapshot,
  type VisitorRole,
} from "@museum/shared";
import { Client, type Room } from "colyseus.js";
import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";

let activeRoom: Room | null = null;
export function requestSeat(id: string) {
  if (activeRoom?.connection.isOpen) activeRoom.send("seat", id);
}

export function sendMovement(message: MovementMessage) {
  if (activeRoom?.connection.isOpen) activeRoom.send("move", message);
}

export function requestBirthdayAction(action: BirthdayAction) {
  if (activeRoom?.connection.isOpen) activeRoom.send("birthday-action", action);
}

function endpoint() {
  if (import.meta.env.VITE_SERVER_URL)
    return String(import.meta.env.VITE_SERVER_URL);
  const protocol = location.protocol === "https:" ? "wss" : "ws";
  return `${protocol}://${location.hostname}:2567`;
}

function readPlayers(state: unknown): PlayerSnapshot[] {
  const snapshots: PlayerSnapshot[] = [];
  const players = (
    state as {
      players?: {
        forEach: (
          callback: (value: Record<string, unknown>, key: string) => void,
        ) => void;
      };
    }
  ).players;
  players?.forEach((player, id) => {
    snapshots.push({
      id,
      role: ["host", "girlfriend"].includes(String(player.role))
        ? (player.role as VisitorRole)
        : "guest",
      displayName: String(player.displayName ?? "Guest"),
      skinTone: String(player.skinTone ?? "#c68668"),
      outfitColor: String(player.outfitColor ?? "#7d3157"),
      modelId: String(player.modelId ?? "visitor"),
      hairStyle: String(player.hairStyle ?? "default"),
      hairColor: String(player.hairColor ?? "#30221d"),
      outfit: String(player.outfit ?? "default"),
      accessory: String(player.accessory ?? "none"),
      seatId: String(player.seatId ?? ""),
      x: Number(player.x ?? 0),
      y: Number(player.y ?? 1),
      z: Number(player.z ?? 12),
      rotation: Number(player.rotation ?? 0),
    });
  });
  return snapshots;
}

export function MultiplayerSession() {
  const entered = useGameStore((state) => state.entered);
  const profile = useGameStore((state) => state.profile);

  useEffect(() => {
    if (!entered) return;
    let disposed = false;
    let room: Room | null = null;
    const client = new Client(endpoint());

    const attachRoom = (joinedRoom: Room) => {
      const store = useGameStore.getState();
      room = joinedRoom;
      activeRoom = joinedRoom;
      joinedRoom.onMessage(
        "clock-sync",
        (payload: { sentAt: number; serverAt: number }) => {
          useGameStore
            .getState()
            .setClockOffset(
              payload.serverAt - (payload.sentAt + Date.now()) / 2,
            );
        },
      );
      joinedRoom.send("clock-sync", Date.now());
      store.setSession(joinedRoom.sessionId);
      store.setConnection("connected");
      store.setPlayers(readPlayers(joinedRoom.state));
      const initialState = joinedRoom.state as unknown as {
        birthdayStage?: number;
        birthdayLastActor?: string;
        birthdayStartedAt?: number;
        birthdayActorId?: string;
      };
      store.setBirthdayState(
        Number(initialState.birthdayStage ?? 0),
        String(initialState.birthdayLastActor ?? ""),
        Number(initialState.birthdayStartedAt ?? 0),
        String(initialState.birthdayActorId ?? ""),
      );
      joinedRoom.onMessage("correction", (position: [number, number, number]) =>
        useGameStore.getState().setCorrection(position),
      );
      joinedRoom.onMessage(
        "seated",
        (payload: { seatId: string; position: [number, number, number] }) => {
          useGameStore.getState().setSeat(payload.seatId);
          useGameStore.getState().setCorrection(payload.position);
        },
      );
      joinedRoom.onMessage("seat-busy", () =>
        useGameStore
          .getState()
          .setConnection(
            "connected",
            "That seat is occupied. Choose another seat.",
          ),
      );
      joinedRoom.onMessage(
        "birthday-event",
        (payload: {
          action: BirthdayAction;
          actor: string;
          stage: number;
          startedAt: number;
          actorId: string;
        }) => {
          const labels: Record<BirthdayAction, string> = {
            light: "lit the candles",
            blow: "blew out the candles",
            cut: "cut the cake",
            serve: "served cake to everyone",
            reset: "set up another celebration",
          };
          const game = useGameStore.getState();
          game.setBirthdayState(
            payload.stage,
            payload.actor,
            payload.startedAt,
            payload.actorId,
          );
          game.setBirthdayMessage(
            `${payload.actor} ${labels[payload.action]}.`,
          );
          window.setTimeout(() => {
            if (useGameStore.getState().birthdayStartedAt === payload.startedAt)
              useGameStore.getState().setBirthdayMessage("");
          }, 4200);
        },
      );
      joinedRoom.onMessage("birthday-denied", (message: string) =>
        useGameStore.getState().setBirthdayMessage(message),
      );
      let restored = false;
      joinedRoom.onStateChange((state) => {
        const snapshots = readPlayers(state);
        useGameStore.getState().setPlayers(snapshots);
        const birthday = state as unknown as {
          birthdayStage?: number;
          birthdayLastActor?: string;
          birthdayStartedAt?: number;
          birthdayActorId?: string;
        };
        useGameStore
          .getState()
          .setBirthdayState(
            Number(birthday.birthdayStage ?? 0),
            String(birthday.birthdayLastActor ?? ""),
            Number(birthday.birthdayStartedAt ?? 0),
            String(birthday.birthdayActorId ?? ""),
          );
        const self = snapshots.find((p) => p.id === joinedRoom.sessionId);
        if (self) useGameStore.getState().setPortal(self.role, "");
        if (self && !restored) {
          restored = true;
          useGameStore.getState().setSeat(self.seatId);
          useGameStore.getState().setCorrection([self.x, self.y, self.z]);
        }
      });
      joinedRoom.onError((code, message) => {
        useGameStore.getState().setConnection("error", `${message} (${code})`);
      });
      joinedRoom.onLeave((code) => {
        if (disposed || code === 1000) return;
        const token = joinedRoom.reconnectionToken;
        useGameStore
          .getState()
          .setConnection("reconnecting", "Restoring your visit…");
        void (async () => {
          for (let attempt = 0; attempt < 3 && !disposed; attempt += 1) {
            await new Promise((resolve) =>
              setTimeout(resolve, 600 * (attempt + 1)),
            );
            try {
              const reconnectedRoom = await client.reconnect(token);
              if (disposed) {
                await reconnectedRoom.leave();
                return;
              }
              attachRoom(reconnectedRoom);
              return;
            } catch {
              // Retry within the server's ten-second reconnection window.
            }
          }
          if (!disposed) {
            useGameStore
              .getState()
              .setConnection("error", "Connection lost. Refresh to rejoin.");
          }
        })();
      });
    };

    const connect = async () => {
      const store = useGameStore.getState();
      store.setConnection("connecting", "Joining the gallery…");
      try {
        const joinedRoom = await client.joinOrCreate(ROOM_NAME, {
          ...profile,
          role: store.portalRole,
          password: store.portalPassword,
        });
        if (disposed) {
          await joinedRoom.leave();
          return;
        }
        attachRoom(joinedRoom);
      } catch (error) {
        if (!disposed) {
          const message =
            error instanceof Error
              ? error.message
              : "Could not reach the museum server.";
          store.returnToEntrance(message);
        }
      }
    };

    void connect();
    return () => {
      disposed = true;
      activeRoom = null;
      useGameStore.getState().setSession(null);
      useGameStore.getState().setPlayers([]);
      if (room) void room.leave();
    };
  }, [entered, profile]);

  return null;
}
