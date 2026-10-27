import { readFileSync } from "node:fs";
import { expect, test, vi } from "vitest";
import { AnimationMixer, Box3, SkinnedMesh, Vector3, type AnimationClip, type Object3D } from "three";
import { avatarAssets } from "../apps/web/src/config/avatars";
import { removeScanGround } from "../apps/web/src/components/scanGeometry";
import { rigStaticAvatar } from "../apps/web/src/components/rigStaticAvatar";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  createVisitorMotion,
  normalizeVisitorModel,
  visitorTravelSpeed,
} from "../apps/web/src/components/visitorMotion";

vi.stubGlobal(
  "ProgressEvent",
  class {
    constructor(_type: string, data: object) {
      Object.assign(this, data);
    }
  },
);
async function loadGeometry(filename: string) {
  const bytes = readFileSync(`apps/web/public/models/${filename}`);
  const length = bytes.readUInt32LE(12);
  const json = JSON.parse(bytes.subarray(20, 20 + length).toString());
  const bin = bytes.subarray(28 + length);
  // Geometry/rig validation in Node; textures are verified in the browser.
  json.buffers = [
    {
      byteLength: bin.length,
      uri: `data:application/octet-stream;base64,${bin.toString("base64")}`,
    },
  ];
  delete json.images;
  delete json.textures;
  json.materials = [];
  for (const mesh of json.meshes)
    for (const primitive of mesh.primitives) delete primitive.material;
  const { scene } = await new GLTFLoader().parseAsync(
    JSON.stringify(json),
    "",
  );
  return scene;
}

function checkFootContact(model: Object3D, clips: AnimationClip[]) {
  const feet = new Map<string, Object3D>();
  model.traverse((object) => {
    for (const side of ["Left", "Right"])
      if (object.name.replace(/^mixamorig:?/, "").replace(/_\d+$/, "") === `${side}Foot`)
        feet.set(side, object);
  });
  const rest = new Map([...feet].map(([side, foot]) => [side, foot.getWorldPosition(new Vector3())]));
  const mixer = new AnimationMixer(model);
  for (const name of ["Walk", "Run"]) {
    const clip = clips.find((clip) => clip.name === name)!;
    const speed = visitorTravelSpeed(clip)!;
    expect(speed).toBeGreaterThan(0.5);
    const action = mixer.clipAction(clip).reset().play();
    for (const [side, foot] of feet) {
      const start = side === "Left" ? 0 : 0.5;
      const contacts = [0.06, 0.17, 0.31].map((phase) => {
        const time = (start + phase) * clip.duration;
        action.time = time;
        mixer.update(0);
        model.updateMatrixWorld(true);
        const point = foot.getWorldPosition(new Vector3());
        expect(Math.abs(point.y - rest.get(side)!.y), `${name} ${side} sole height`).toBeLessThan(0.006);
        // Simulate the exact forward travel used by Avatar's cadence mapping.
        point.z += time * speed;
        return point;
      });
      expect(contacts[0]!.distanceTo(contacts[2]!), `${name} ${side} planted foot drift`).toBeLessThan(0.008);
      const stance = name === "Walk" ? 0.6 : 0.42;
      action.time = ((start + stance + (1 - stance) / 2) % 1) * clip.duration;
      mixer.update(0);
      model.updateMatrixWorld(true);
      expect(foot.getWorldPosition(new Vector3()).y - rest.get(side)!.y, `${name} toe clearance`).toBeGreaterThan(0.035);
    }
    for (const track of clip.tracks) {
      const width = track.getValueSize();
      for (let i = 0; i < width; i++)
        expect(track.values[i]).toBeCloseTo(track.values[track.values.length - width + i]!, 5);
    }
    mixer.stopAllAction();
  }
  mixer.uncacheRoot(model);
  model.updateMatrixWorld(true);
}

for (const asset of avatarAssets.filter((asset) => asset.scanRig)) {
  test(`${asset.id}: generated skin deforms in every movement state`, async () => {
    const source = await loadGeometry(asset.url.replace("/models/", ""));
    if (asset.scanGroundPlane) removeScanGround(source, asset.scanGroundPlane);
    normalizeVisitorModel(source, asset.height);
    const rig = rigStaticAvatar(source, asset.height, asset.scanRig!);
    if (asset.id === "kushal") {
      rig.traverse((object) => {
        if (!(object instanceof SkinnedMesh)) return;
        const p = object.geometry.getAttribute("position");
        const indices = object.geometry.getAttribute("skinIndex");
        const weights = object.geometry.getAttribute("skinWeight");
        let torsoArmWeight = 0;
        for (let i = 0; i < p.count; i++) {
          if (Math.abs(p.getX(i)) > asset.height * 0.12
            || p.getY(i) > asset.height * 0.61 || p.getY(i) < asset.height * 0.45) continue;
          for (let j = 0; j < 4; j++) {
            const name = object.skeleton.bones[indices.getComponent(i, j)]!.name;
            if (/Arm|Hand/.test(name)) torsoArmWeight = Math.max(torsoArmWeight, weights.getComponent(i, j));
          }
        }
        expect(torsoArmWeight, "shirt hem must not follow the arms").toBe(0);
      });
      // The old generic pivots sat outside this scan's arms. Check each joint
      // against the actual arm cross-section before any pose changes are applied.
      for (const side of ["Left", "Right"]) for (const joint of ["ForeArm", "Hand"]) {
        const center = rig.getObjectByName(`${side}${joint}`)!.getWorldPosition(new Vector3());
        const xs: number[] = [];
        rig.traverse((object) => {
          if (!(object instanceof SkinnedMesh)) return;
          const positions = object.geometry.getAttribute("position");
          for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i), y = positions.getY(i);
            if (Math.sign(x) === Math.sign(center.x) && Math.abs(x) > asset.height * 0.16
              && Math.abs(y - center.y) < asset.height * 0.008) xs.push(Math.abs(x));
          }
        });
        expect(xs.length).toBeGreaterThan(0);
        const min = xs.reduce((a, b) => Math.min(a, b), Infinity);
        const max = xs.reduce((a, b) => Math.max(a, b), -Infinity);
        expect(Math.abs(center.x), `${side}${joint} inside arm`).toBeGreaterThan(min);
        expect(Math.abs(center.x), `${side}${joint} inside arm`).toBeLessThan(max);
      }
    }
    const clips = createVisitorMotion(rig, asset.scanRig === "dress");
    checkFootContact(rig, clips);
    const meshes: SkinnedMesh[] = [];
    rig.traverse((o) => { if (o instanceof SkinnedMesh) meshes.push(o); });
    expect(meshes.length).toBeGreaterThan(0);
    let maxWeightError = 0;
    for (const mesh of meshes) {
      const weights = mesh.geometry.getAttribute("skinWeight");
      for (let i = 0; i < weights.count; i++) {
        const sum = weights.getX(i) + weights.getY(i) + weights.getZ(i) + weights.getW(i);
        maxWeightError = Math.max(maxWeightError, Math.abs(1 - sum));
      }
    }
    expect(maxWeightError).toBeLessThan(0.00001);
    rig.updateMatrixWorld(true);
    const samples = meshes.flatMap((mesh) => {
      const result: { mesh: SkinnedMesh; index: number; rest: Vector3 }[] = [];
      for (let index = 0; index < mesh.geometry.getAttribute("position").count; index += 101)
        result.push({ mesh, index, rest: mesh.getVertexPosition(index, new Vector3()) });
      return result;
    });
    const mixer = new AnimationMixer(rig);
    for (const name of ["Walk", "Run", "Sit", "Light", "Blow", "Cut", "Celebrate"]) {
      mixer.stopAllAction();
      const clip = clips.find((c) => c.name === name)!;
      mixer.clipAction(clip).reset().play();
      mixer.update(clip.duration * 0.25);
      rig.updateMatrixWorld(true);
      let maxMovement = 0;
      let lowerMovement = 0;
      for (const sample of samples) {
        const point = sample.mesh.getVertexPosition(sample.index, new Vector3());
        expect(point.toArray().every(Number.isFinite)).toBe(true);
        const distance = point.distanceTo(sample.rest);
        maxMovement = Math.max(maxMovement, distance);
        if (sample.rest.y < asset.height * 0.3) lowerMovement = Math.max(lowerMovement, distance);
      }
      expect(maxMovement, name).toBeGreaterThan(0.02);
      if (name === "Walk" || name === "Run") expect(lowerMovement, name).toBeGreaterThan(0.04);
    }
    mixer.stopAllAction();
    // Creating/animating a rig must never add bones or skinning to the cached asset.
    let originalSkins = 0;
    source.traverse((o) => { if (o instanceof SkinnedMesh) originalSkins++; });
    expect(originalSkins).toBe(0);
  });
}

for (const [id, height] of [
  ["male", 1.78],
  ["female", 1.68],
  ["guest-male", 1.8],
] as const) {
  test(`${id}: downloaded rig normalizes, animates and clones independently`, async () => {
    const filename =
      id === "guest-male" ? "guest-male.glb" : `visitor-${id}.glb`;
    const scene = await loadGeometry(filename);
    const model = clone(scene),
      other = clone(scene);
    normalizeVisitorModel(model, height);
    const box = new Box3().setFromObject(model);
    expect(box.getSize(new Vector3()).y).toBeCloseTo(height, 3);
    expect(box.min.y).toBeCloseTo(0, 3);
    let otherLeg: Object3D | undefined;
    other.traverse((object) => {
      if (/LeftUpLeg/.test(object.name)) otherLeg = object;
    });
    expect(otherLeg).toBeDefined();
    const original = otherLeg!.quaternion.clone();
    const clips = createVisitorMotion(model);
    checkFootContact(model, clips);
    expect(clips.map((clip) => clip.name)).toEqual([
      "Idle",
      "Walk",
      "Run",
      "Sit",
      "Light",
      "Blow",
      "Cut",
      "Celebrate",
    ]);
    const mixer = new AnimationMixer(model);
    for (let replay = 0; replay < 2; replay++) {
      for (const clip of clips) {
        mixer.stopAllAction();
        mixer.clipAction(clip).play();
        mixer.update(clip.duration * 0.25);
        model.updateMatrixWorld(true);
        model.traverse((object) => {
          expect(object.matrixWorld.elements.every(Number.isFinite)).toBe(true);
        });
      }
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
    }
    expect(otherLeg!.quaternion.equals(original)).toBe(true);
  });
}

for (const asset of avatarAssets) {
  test(`${asset.id}: active file loads and centers on the player collider`, async () => {
    expect(asset.generated).not.toBe(true);
    const scene = await loadGeometry(asset.url.replace("/models/", ""));
    // An independently cloned copy must remain unchanged by normalization.
    const originalBox = new Box3().setFromObject(scene);
    const model = clone(scene);
    if (asset.scanGroundPlane) removeScanGround(model, asset.scanGroundPlane);
    normalizeVisitorModel(model, asset.height);
    const box = new Box3().setFromObject(model);
    const size = box.getSize(new Vector3());
    const center = box.getCenter(new Vector3());
    expect(size.y).toBeCloseTo(asset.height, 3);
    expect(size.x).toBeGreaterThan(0.1);
    expect(size.z).toBeGreaterThan(0.1);
    if (asset.id === "kushal") {
      // The supplied scan includes a broad floor patch. Only the person remains.
      expect(size.x).toBeLessThan(1.6);
      expect(size.z).toBeLessThan(0.8);
    }
    expect(box.min.y).toBeCloseTo(0, 3);
    expect(center.x).toBeCloseTo(0, 3);
    expect(center.z).toBeCloseTo(0, 3);
    expect(new Box3().setFromObject(scene).equals(originalBox)).toBe(true);
    normalizeVisitorModel(model, asset.height);
    expect(new Box3().setFromObject(model).min.distanceTo(box.min)).toBeLessThan(0.001);
  });
}
