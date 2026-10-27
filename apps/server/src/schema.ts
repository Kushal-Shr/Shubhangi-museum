import { MapSchema, Schema, type } from "@colyseus/schema";

export class NetworkPlayer extends Schema {
  @type("string") role = "guest";
  @type("string") displayName = "Guest";
  @type("string") skinTone = "#c68668";
  @type("string") outfitColor = "#7d3157";
  @type("string") modelId = "visitor";
  @type("string") hairStyle = "default";
  @type("string") hairColor = "#30221d";
  @type("string") outfit = "default";
  @type("string") accessory = "none";
  @type("string") seatId = "";
  @type("number") x = 0;
  @type("number") y = 1;
  @type("number") z = 26;
  @type("number") rotation = 0;
  lastUpdateAt = Date.now();
  lastSequence = -1;
}

export class MuseumState extends Schema {
  @type({ map: NetworkPlayer }) players = new MapSchema<NetworkPlayer>();
  @type("uint8") birthdayStage = 0;
  @type("string") birthdayLastActor = "";
  @type("string") birthdayActorId = "";
  @type("number") birthdayStartedAt = 0;
}
