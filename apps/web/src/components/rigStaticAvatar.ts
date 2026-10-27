import {
  Bone, Float32BufferAttribute, Group, MathUtils, Mesh, Skeleton, SkinnedMesh,
  Uint16BufferAttribute, Vector3, type Object3D,
} from "three";

export type ScanRig = "dress" | "casual-man" | "hoodie";

/** Anatomical landmarks measured against the three supplied, normalized scans.
 * This creates real GPU skinning; the cached GLBs and their textures stay intact.
 */
export function rigStaticAvatar(source: Object3D, height: number, kind: ScanRig): Group {
  const dress = kind === "dress";
  const man = kind === "casual-man";
  const rig = new Group();
  rig.name = "MuseumScanRig";
  rig.userData.scanRig = kind;
  const bones: Bone[] = [];
  const positions: Vector3[] = [];
  const ids = new Map<string, number>();
  const add = (name: string, parent: string | null, x: number, y: number, z = 0) => {
    const bone = new Bone();
    bone.name = name;
    const position = new Vector3(x, y, z).multiplyScalar(height);
    bone.position.copy(position);
    if (parent) {
      const index = ids.get(parent)!;
      bone.position.sub(positions[index]!);
      bones[index]!.add(bone);
    } else rig.add(bone);
    ids.set(name, bones.length);
    bones.push(bone);
    positions.push(position);
  };
  add("Hips", null, 0, 0.53);
  add("Spine", "Hips", 0, 0.61);
  add("Chest", "Spine", 0, 0.74);
  add("Neck", "Chest", 0, 0.81);
  add("Head", "Neck", 0, 0.85);
  for (const [side, sign] of [["Left", 1], ["Right", -1]] as const) {
    // The cropped male scan is narrower than the original generic A-pose.
    // Fit joints inside its actual sleeves, elbows and wrists; pivots outside
    // the surface cause the arms to orbit and pinch when lowered.
    add(`${side}Arm`, "Chest", sign * 0.105, man ? 0.785 : 0.77, man ? -0.025 : 0);
    add(`${side}ForeArm`, `${side}Arm`, sign * (dress ? 0.135 : man ? 0.195 : 0.19), dress ? 0.65 : man ? 0.64 : 0.66, man ? -0.025 : 0);
    add(`${side}Hand`, `${side}ForeArm`, sign * (dress ? 0.145 : man ? 0.28 : 0.275), dress ? 0.53 : man ? 0.56 : 0.55);
    add(`${side}UpLeg`, "Hips", sign * 0.065, 0.52);
    add(`${side}Leg`, `${side}UpLeg`, sign * 0.065, 0.285);
    add(`${side}Foot`, `${side}Leg`, sign * 0.065, 0.045);
    add(`${side}Toe`, `${side}Foot`, sign * 0.065, 0.025, 0.07);
  }
  rig.updateMatrixWorld(true);
  const skeleton = new Skeleton(bones);
  skeleton.calculateInverses();
  source.updateMatrixWorld(true);
  const meshes: Mesh[] = [];
  source.traverse((object) => { if (object instanceof Mesh) meshes.push(object); });
  const smooth = MathUtils.smoothstep;
  const armSegments = Object.fromEntries(["Left", "Right"].map((side) => {
    const shoulder = positions[ids.get(`${side}Arm`)!]!.clone().divideScalar(height);
    const elbow = positions[ids.get(`${side}ForeArm`)!]!.clone().divideScalar(height);
    const wrist = positions[ids.get(`${side}Hand`)!]!.clone().divideScalar(height);
    return [side, { shoulder, elbow, upper: elbow.clone().sub(shoulder), lower: wrist.sub(elbow) }];
  }));
  const vertex = new Vector3();
  const addWeight = (weights: Map<number, number>, name: string, weight: number) => {
    if (weight > 0.00001) {
      const id = ids.get(name)!;
      weights.set(id, (weights.get(id) ?? 0) + weight);
    }
  };
  for (const mesh of meshes) {
    const geometry = mesh.geometry.clone().applyMatrix4(mesh.matrixWorld);
    const position = geometry.getAttribute("position");
    const indices = new Uint16Array(position.count * 4);
    const weights = new Float32Array(position.count * 4);
    for (let i = 0; i < position.count; i++) {
      const x = position.getX(i) / height;
      const y = position.getY(i) / height;
      const z = position.getZ(i) / height;
      const influences = new Map<number, number>();
      const side = x >= 0 ? "Left" : "Right";
      const armX = Math.abs(x);
      // Follow the diagonal male arms: a fixed x cutoff also captures the
      // shirt hem and cargo pockets, pulling them up whenever an elbow bends.
      const armCenter = y >= 0.64
        ? MathUtils.lerp(0.105, 0.195, MathUtils.clamp((0.785 - y) / 0.145, 0, 1))
        : MathUtils.lerp(0.195, 0.28, MathUtils.clamp((0.64 - y) / 0.08, 0, 1));
      const arm = smooth(armX, dress ? 0.10 : man ? armCenter - 0.055 : 0.105,
        dress ? 0.145 : man ? armCenter - 0.02 : 0.17)
        * smooth(y, dress ? 0.47 : 0.38, dress ? 0.51 : 0.46) * (1 - smooth(y, 0.755, 0.81))
        * (1 - smooth(Math.abs(z), 0.10, 0.16));
      // Smooth transitions avoid seams at knees, waist, shoulders and the neck.
      const lowerBody = 1 - smooth(y, 0.49, 0.59);
      const lower = (1 - arm) * lowerBody;
      // Anchor the pelvis instead of assigning the waistband to two thighs.
      // The center of a long skirt follows the hips more than the separate legs.
      const pelvis = smooth(y, 0.44, 0.55);
      const cloth = dress ? (1 - smooth(armX, 0.035, 0.11)) * smooth(y, 0.08, 0.2) * 0.35 : 0;
      const hipWeight = Math.max(pelvis, cloth);
      addWeight(influences, "Hips", lower * hipWeight);
      const left = smooth(x, dress ? -0.065 : -0.018, dress ? 0.065 : 0.018);
      for (const [side, share] of [["Left", left], ["Right", 1 - left]] as const) {
        const thigh = smooth(y, 0.24, 0.34);
        const foot = 1 - smooth(y, 0.045, 0.095);
        const legWeight = lower * (1 - hipWeight) * share;
        addWeight(influences, `${side}UpLeg`, legWeight * thigh);
        addWeight(influences, `${side}Leg`, legWeight * (1 - thigh) * (1 - foot));
        addWeight(influences, `${side}Foot`, legWeight * (1 - thigh) * foot);
      }
      // Arm envelopes follow the source A-pose (or the dress's relaxed pose).
      const segment = armSegments[side]!;
      const upperProgress = vertex.set(x, y, z).sub(segment.shoulder).dot(segment.upper) / segment.upper.lengthSq();
      const lowerProgress = vertex.set(x, y, z).sub(segment.elbow).dot(segment.lower) / segment.lower.lengthSq();
      const elbow = 1 - smooth(upperProgress, 0.78, 1.18);
      const wrist = smooth(lowerProgress, 0.78, 1.08);
      addWeight(influences, `${side}Arm`, arm * elbow);
      addWeight(influences, `${side}ForeArm`, arm * (1 - elbow) * (1 - wrist));
      addWeight(influences, `${side}Hand`, arm * (1 - elbow) * wrist);
      const torso = (1 - lowerBody) * (1 - arm);
      const head = smooth(y, 0.78, 0.84);
      const chest = smooth(y, 0.64, 0.73);
      addWeight(influences, "Head", torso * head);
      addWeight(influences, "Chest", torso * (1 - head) * chest);
      addWeight(influences, "Spine", torso * (1 - head) * (1 - chest));
      const strongest = [...influences].sort((a, b) => b[1] - a[1]).slice(0, 4);
      const total = strongest.reduce((sum, [, weight]) => sum + weight, 0);
      strongest.forEach(([index, weight], j) => {
        indices[i * 4 + j] = index;
        weights[i * 4 + j] = weight / total;
      });
    }
    geometry.setAttribute("skinIndex", new Uint16BufferAttribute(indices, 4));
    geometry.setAttribute("skinWeight", new Float32BufferAttribute(weights, 4));
    const skinned = new SkinnedMesh(geometry, mesh.material);
    skinned.name = mesh.name;
    skinned.castShadow = skinned.receiveShadow = true;
    // Bounds change with the pose; avoid clipping limbs with the static scan bounds.
    skinned.frustumCulled = false;
    rig.add(skinned);
    skinned.bind(skeleton);
  }
  rig.updateMatrixWorld(true);
  return rig;
}
