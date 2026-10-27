import { Client, Room, ServerError, type AuthContext } from "@colyseus/core";
import {
  BIRTHDAY_CAKE_POSITION,
  BIRTHDAY_INTERACTION_RADIUS,
  BIRTHDAY_STAGE_DURATION,
  BIRTHDAY_STAGE,
  canBirthdayAction,
  ROLE_MODELS,
  type VisitorRole,
  clampToMuseum,
  movementBlocked,
  seats,
  SPAWN,
  PLAYER_MAX_SPEED,
  ROOM_MAX_CLIENTS,
  sanitizeProfile,
  type AvatarProfile,
  type BirthdayAction,
  type MovementMessage,
} from "@museum/shared";
import { MuseumState, NetworkPlayer } from "./schema.js";
import { authenticatePortal } from "./access.js";

export class MuseumRoom extends Room<MuseumState> {
  override onAuth(
    _client: Client,
    options: { role?: unknown; password?: unknown },
    context: AuthContext,
  ) {
    return {
      role: authenticatePortal(options, String(context.ip ?? "unknown")),
    };
  }
  override maxClients = ROOM_MAX_CLIENTS;
  override state = new MuseumState();

  override onCreate() {
    this.setPatchRate(50);
    this.onMessage("clock-sync", (client, sentAt: unknown) => {
      if (typeof sentAt === "number" && Number.isFinite(sentAt))
        client.send("clock-sync", { sentAt, serverAt: Date.now() });
    });
    this.onMessage<MovementMessage>("move", (client, message) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || player.seatId) return;
      if (!this.isValidMovement(message, player)) {
        if (
          message &&
          Number.isInteger(message.sequence) &&
          message.sequence > player.lastSequence
        ) {
          player.lastSequence = message.sequence;
          client.send("correction", [player.x, player.y, player.z]);
        }
        return;
      }

      const position = clampToMuseum(message.x, message.z);
      player.x = position.x;
      player.y = Math.min(2, Math.max(0.75, message.y));
      player.z = position.z;
      player.rotation = message.rotation;
      player.lastSequence = message.sequence;
      player.lastUpdateAt = Date.now();
    });
    this.onMessage("seat", (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || typeof message !== "string") return;
      if (message === "" && player.seatId) {
        const seat = seats.find((s) => s.id === player.seatId);
        if (!seat) return;
        player.x = seat.x;
        player.y = 0.92;
        player.z = seat.z + 1.55;
        player.seatId = "";
      } else {
        const seat = seats.find((s) => s.id === message);
        if (
          !seat ||
          player.seatId ||
          Math.hypot(player.x - seat.x, player.z - (seat.z + 1.3)) > 2
        )
          return;
        if (
          Array.from(this.state.players.values()).some(
            (p) => p.seatId === seat.id,
          )
        ) {
          client.send("seat-busy");
          return;
        }
        player.x = seat.x;
        player.y = 0.92;
        player.z = seat.z;
        player.rotation = 0;
        player.seatId = seat.id;
      }
      player.lastUpdateAt = Date.now();
      client.send("seated", {
        seatId: player.seatId,
        position: [player.x, player.y, player.z],
      });
    });
    this.onMessage("birthday-action", (client, message: unknown) => {
      const player = this.state.players.get(client.sessionId);
      if (!player || typeof message !== "string") return;
      const action = message as BirthdayAction;
      if (!canBirthdayAction(player.role as VisitorRole, action)) {
        client.send(
          "birthday-denied",
          "It’s Kushal’s or Shubhangi’s turn to do this.",
        );
        return;
      }
      if (
        !["light", "blow", "cut", "serve", "reset"].includes(action) ||
        Math.hypot(
          player.x - BIRTHDAY_CAKE_POSITION[0],
          player.z - BIRTHDAY_CAKE_POSITION[2],
        ) > BIRTHDAY_INTERACTION_RADIUS
      )
        return;
      const expected: Record<BirthdayAction, number> = {
        light: BIRTHDAY_STAGE.waiting,
        blow: BIRTHDAY_STAGE.candlesLit,
        cut: BIRTHDAY_STAGE.candlesBlown,
        serve: BIRTHDAY_STAGE.cakeCut,
        reset: BIRTHDAY_STAGE.served,
      };
      if (this.state.birthdayStage !== expected[action]) return;
      const now = Date.now();
      if (
        now - this.state.birthdayStartedAt <
        (BIRTHDAY_STAGE_DURATION[this.state.birthdayStage] ?? 0)
      )
        return;
      this.state.birthdayStage =
        action === "reset"
          ? BIRTHDAY_STAGE.waiting
          : this.state.birthdayStage + 1;
      this.state.birthdayLastActor = player.displayName;
      this.state.birthdayActorId = client.sessionId;
      this.state.birthdayStartedAt = now;
      this.broadcast("birthday-event", {
        action,
        actor: player.displayName,
        stage: this.state.birthdayStage,
        actorId: client.sessionId,
        startedAt: now,
      });
    });
  }

  override onJoin(client: Client, options: Partial<AvatarProfile>) {
    const profile = sanitizeProfile(options);
    const role = (client.auth?.role as VisitorRole) ?? "guest";
    if (
      role !== "guest" &&
      Array.from(this.state.players.values()).some((p) => p.role === role)
    )
      throw new ServerError(
        409,
        "This private entrance is already in use. Close the other tab or wait for it to reconnect.",
      );
    profile.modelId =
      role === "guest" && options.modelId === "guest-male"
        ? "guest-male"
        : ROLE_MODELS[role];
    if (role === "host") profile.displayName = "Kushal";
    if (role === "girlfriend") profile.displayName = "Shubhangi";
    const player = new NetworkPlayer();
    Object.assign(player, profile, {
      role,
      x: SPAWN[0],
      y: SPAWN[1],
      z: SPAWN[2],
    });
    this.state.players.set(client.sessionId, player);
  }

  override async onLeave(client: Client, consented: boolean) {
    if (!consented) {
      try {
        await this.allowReconnection(client, 10);
        return;
      } catch {
        // Reconnection window expired; remove the stale avatar below.
      }
    }
    this.state.players.delete(client.sessionId);
  }

  private isValidMovement(message: MovementMessage, player: NetworkPlayer) {
    if (
      !message ||
      !Number.isFinite(message.x) ||
      !Number.isFinite(message.y) ||
      !Number.isFinite(message.z) ||
      !Number.isFinite(message.rotation) ||
      !Number.isInteger(message.sequence) ||
      message.sequence <= player.lastSequence
    ) {
      return false;
    }

    const elapsedSeconds = Math.max(
      0.05,
      (Date.now() - player.lastUpdateAt) / 1000,
    );
    const distance = Math.hypot(message.x - player.x, message.z - player.z);
    return (
      distance <= PLAYER_MAX_SPEED * Math.min(elapsedSeconds, 0.5) + 0.4 &&
      !movementBlocked(player.x, player.z, message.x, message.z)
    );
  }
}
