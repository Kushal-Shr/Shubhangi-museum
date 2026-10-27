import assert from "node:assert/strict";
import RAPIER from "@dimforge/rapier3d-compat";
import {
  obstacles,
  SPAWN,
  museumPoint,
} from "../packages/shared/dist/index.js";
await RAPIER.init();
const world = new RAPIER.World({ x: 0, y: -20, z: 0 });
world.timestep = 1 / 60;
world.createCollider(
  RAPIER.ColliderDesc.cuboid(35, 0.1, 45).setTranslation(0, -0.12, -9),
);
for (const b of obstacles)
  world.createCollider(
    RAPIER.ColliderDesc.cuboid(...b.size.map((v) => v / 2)).setTranslation(
      ...b.position,
    ),
  );
const body = world.createRigidBody(
  RAPIER.RigidBodyDesc.dynamic()
    .setTranslation(...SPAWN)
    .enabledRotations(false, true, false)
    .setCcdEnabled(true),
);
world.createCollider(
  RAPIER.ColliderDesc.capsule(0.52, 0.36).setFriction(0),
  body,
);
function walk(x, z, raw = false) {
  if (z < 10 && !raw) {
    const point = museumPoint([x, 0, z]);
    x = point[0];
    z = point[2];
  }
  for (let frame = 0; frame < 3600; frame++) {
    const p = body.translation(),
      dx = x - p.x,
      dz = z - p.z,
      d = Math.hypot(dx, dz);
    if (d < 0.08) return;
    body.setLinvel(
      { x: (dx / d) * 3.25, y: body.linvel().y, z: (dz / d) * 3.25 },
      true,
    );
    world.step();
  }
  throw new Error(
    `Physics route blocked: ${JSON.stringify(body.translation())} -> ${x},${z}`,
  );
}
walk(0, 3);
walk(0, 18, true);
walk(21.2, 18, true);
walk(21.2, 8, true);
walk(24, 8, true);
walk(24, -35, true);
walk(0, -35, true);
walk(-24, -35, true);
walk(-24, 8, true);
walk(-21.2, 8, true);
walk(-21.2, 18, true);
walk(0, 18, true);
walk(0, 3);
walk(-6, 3);
walk(-6, 0);
walk(-14, 0);
walk(-6, 0);
walk(-6, 3);
walk(6, 3);
walk(6, 0);
walk(14, 0);
walk(6, 0);
walk(6, 3);
walk(0, 3);
walk(0, -8.9);
// Circle the celebration table without colliding with it.
walk(3, -8.9);
walk(3, -13);
walk(-3, -13);
walk(-3, -8.9);
walk(0, -8.9);
walk(0, 3);
walk(6, 3);
walk(6, -1);
// Holding movement into a partition must stop the capsule.
for (let f = 0; f < 180; f++) {
  body.setLinvel({ x: -3.25, y: body.linvel().y, z: 0 }, true);
  world.step();
}
assert.ok(body.translation().x > 3.5, "capsule crossed the wall");
walk(6, 0);
walk(10, 0);
for (let f = 0; f < 180; f++) {
  body.setLinvel({ x: 0, y: body.linvel().y, z: 3.25 }, true);
  world.step();
}
assert.ok(body.translation().z < 3.2, "capsule crossed the bench");
assert.ok(
  body.translation().y > 0.75 && body.translation().y < 1,
  "capsule should rest on the continuous floor",
);
world.free();
console.log(
  "PASS: real Rapier capsule traverses exterior, all three rooms, smaller cake table; walls and benches stop movement.",
);
