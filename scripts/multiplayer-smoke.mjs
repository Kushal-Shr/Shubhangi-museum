import assert from "node:assert/strict";
import { loadEnvFile } from "node:process";
import { Client } from "colyseus.js";
import {
  BIRTHDAY_CAKE_POSITION,
  museumPoint,
} from "../packages/shared/dist/index.js";
try {
  loadEnvFile("apps/server/.env.local");
} catch {}
const endpoint = process.env.MUSEUM_TEST_SERVER ?? "ws://localhost:2567";
const hostPassword = process.env.MUSEUM_HOST_PASSWORD,
  girlPassword = process.env.MUSEUM_GIRLFRIEND_PASSWORD;
assert.ok(
  hostPassword && girlPassword,
  "Configure both private portal passwords before running this test.",
);
const pause = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function until(check, label) {
  for (let i = 0; i < 100; i++) {
    if (check()) return;
    await pause(50);
  }
  throw new Error("Timed out: " + label);
}
const visitors = [];
async function join(options) {
  const room = await new Client(endpoint).joinOrCreate("museum", options);
  visitors.push(room);
  for (const message of [
    "birthday-event",
    "birthday-denied",
    "seated",
    "seat-busy",
    "correction",
  ])
    room.onMessage(message, () => {});
  await until(() => room.state?.players?.get(room.sessionId), "initial state");
  return room;
}
const sequences = new Map();
async function walk(room, tx, tz) {
  const p = room.state.players.get(room.sessionId);
  let x = p.x,
    z = p.z;
  while (Math.hypot(tx - x, tz - z) > 0.01) {
    const d = Math.hypot(tx - x, tz - z),
      step = Math.min(0.29, d);
    x += ((tx - x) / d) * step;
    z += ((tz - z) / d) * step;
    const sequence = (sequences.get(room) ?? 0) + 1;
    sequences.set(room, sequence);
    room.send("move", { x, y: 0.92, z, rotation: 0, sequence });
    await pause(50);
  }
  await until(
    () =>
      Math.hypot(
        room.state.players.get(room.sessionId).x - tx,
        room.state.players.get(room.sessionId).z - tz,
      ) < 0.1,
    "movement",
  );
}
const oldPoint = (x, z) => {
  const p = museumPoint([x, 0, z]);
  return [p[0], p[2]];
};
try {
  for (const role of ["host", "girlfriend"]) {
    await assert.rejects(
      () =>
        new Client(endpoint).joinOrCreate("museum", {
          role,
          password: "incorrect-password",
          displayName: "Intruder",
        }),
      /password/i,
    );
  }
  const host = await join({
    role: "host",
    password: hostPassword,
    displayName: "QA Host",
    modelId: "shubhangi",
  });
  const girl = await join({
    role: "girlfriend",
    password: girlPassword,
    displayName: "QA Girl",
    modelId: "kushal",
  });
  const guest = await join({
    role: "guest",
    displayName: "QA Guest",
    modelId: "guest-male",
  });
  assert.equal(host.state.players.get(host.sessionId).modelId, "kushal");
  assert.equal(host.state.players.get(host.sessionId).displayName, "Kushal");
  assert.equal(girl.state.players.get(girl.sessionId).modelId, "shubhangi");
  assert.equal(girl.state.players.get(girl.sessionId).displayName, "Shubhangi");
  assert.equal(guest.state.players.get(guest.sessionId).modelId, "guest-male");
  assert.equal(guest.state.players.get(guest.sessionId).role, "guest");
  await assert.rejects(
    () =>
      new Client(endpoint).joinOrCreate("museum", {
        role: "girlfriend",
        password: girlPassword,
      }),
    /already in use/i,
  );
  // Visit the galleries before the celebration.
  await walk(host, ...oldPoint(0, 3));
  await walk(host, ...oldPoint(-6, 3));
  await walk(host, ...oldPoint(6, 3));
  await walk(host, ...oldPoint(0, 3));
  host.send("birthday-action", "light");
  await pause(180);
  assert.equal(
    host.state.birthdayStage,
    0,
    "host still needs to be near the cake",
  );
  for (const room of [host, girl, guest]) {
    await walk(room, 0, 1.6);
    await walk(room, 0, BIRTHDAY_CAKE_POSITION[2] + 2.1);
  }
  guest.send("birthday-action", "light");
  girl.send("birthday-action", "light");
  await pause(180);
  assert.equal(host.state.birthdayStage, 0, "only host can light");
  for (const [actor, action, stage, duration] of [
    [host, "light", 1, 1400],
    [girl, "blow", 2, 1800],
    [girl, "cut", 3, 3200],
    [host, "serve", 4, 5200],
    [host, "reset", 0, 0],
  ]) {
    actor.send("birthday-action", action);
    await until(() => guest.state.birthdayStage === stage, "shared " + action);
    assert.equal(guest.state.birthdayActorId, actor.sessionId);
    assert.ok(Math.abs(Date.now() - guest.state.birthdayStartedAt) < 1000);
    if (stage === 1) {
      girl.send("birthday-action", "blow");
      await pause(150);
      assert.equal(guest.state.birthdayStage, 1, "cannot interrupt lighting");
    }
    if (stage === 3) {
      const late = await join({ displayName: "Late guest" });
      assert.equal(late.state.birthdayStage, 3);
      assert.equal(late.state.birthdayStartedAt, guest.state.birthdayStartedAt);
    }
    await pause(duration + 150);
    if (stage === 1 || stage === 2) {
      const denied = stage === 1 ? "blow" : "cut";
      host.send("birthday-action", denied);
      guest.send("birthday-action", denied);
      await pause(160);
      assert.equal(
        guest.state.birthdayStage,
        stage,
        "only girlfriend can " + denied,
      );
    }
  }
  await walk(host, 0, 1.6);
  await walk(host, ...oldPoint(0, -1));
  await walk(host, ...oldPoint(2.4, -1));
  let corrected = null;
  host.onMessage("correction", (p) => {
    corrected = p;
  });
  await pause(220);
  const [x, z] = oldPoint(3.6, -1);
  host.send("move", {
    x,
    y: 0.92,
    z,
    rotation: 0,
    sequence: (sequences.get(host) ?? 0) + 1,
  });
  await until(() => corrected !== null, "wall correction");
  assert.ok(Math.abs(corrected[0] - 2.88) < 0.1);
  const token = girl.reconnectionToken,
    id = girl.sessionId;
  girl.connection.close();
  await pause(300);
  const restored = await new Client(endpoint).reconnect(token);
  visitors.push(restored);
  await until(() => restored.state?.players?.get(id), "reconnection");
  assert.equal(restored.state.players.get(id).role, "girlfriend");
  console.log(
    "PASS: private passwords, role-owned avatars, duplicate entrance rejection, three rooms, host-only lighting, girlfriend-only blowing/cutting, guest rejection, shared timelines, late joining, walls and role-preserving reconnection.",
  );
} finally {
  await Promise.all(
    visitors.filter((r) => r.connection.isOpen).map((r) => r.leave()),
  );
}
