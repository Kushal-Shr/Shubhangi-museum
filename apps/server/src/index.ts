import { createServer } from "node:http";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { ROOM_NAME } from "@museum/shared";
import { MuseumRoom } from "./MuseumRoom.js";

const port = Number(process.env.PORT ?? 2567);
const httpServer = createServer((request, response) => {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify({ status: "ok", service: "museum-of-us" }));
});

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define(ROOM_NAME, MuseumRoom);

await gameServer.listen(port, "0.0.0.0");
console.log(`Museum multiplayer server listening on http://0.0.0.0:${port}`);

const shutdown = async () => {
  await gameServer.gracefullyShutdown();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
