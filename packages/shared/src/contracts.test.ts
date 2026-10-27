import { describe, expect, it } from "vitest";
import { clampToMuseum, sanitizeProfile, WORLD_BOUNDS } from "./contracts";

describe("shared multiplayer contracts", () => {
  it("sanitizes names and appearance values", () => {
    expect(
      sanitizeProfile({ displayName: "  Ava<script>  ", skinTone: "bad" }),
    ).toEqual({
      displayName: "Avascript",
      skinTone: "#c68668",
      outfitColor: "#7d3157",
      modelId: "visitor",
      hairStyle: "default",
      hairColor: "#30221d",
      outfit: "default",
      accessory: "none",
    });
  });

  it("clamps positions to the playable room", () => {
    expect(clampToMuseum(999, -999)).toEqual({
      x: WORLD_BOUNDS.maxX,
      z: WORLD_BOUNDS.minZ,
    });
  });
});
