import {
  AnimationClip,
  Bone,
  Box3,
  MathUtils,
  SkinnedMesh,
  Quaternion,
  QuaternionKeyframeTrack,
  Vector3,
  VectorKeyframeTrack,
  type KeyframeTrack,
  type Object3D,
} from "three";

const travelSpeeds = new WeakMap<AnimationClip, number>();
export const visitorTravelSpeed = (clip: AnimationClip) => travelSpeeds.get(clip);

// One cycle contains two steps. During stance the foot travels backwards at
// constant speed, cancelling the player's forward travel. The swing returns it
// with matching endpoint velocity and a soft lift, avoiding a snap at contact.
function footPath(cycle: number, reach: number, stance: number, clearance: number) {
  const t = ((cycle % 1) + 1) % 1;
  if (t <= stance) return { z: reach * (1 - 2 * t / stance), lift: 0 };
  const s = (t - stance) / (1 - stance);
  const tangent = -2 * reach * (1 - stance) / stance;
  return {
    z: -reach + 2 * reach * (3 * s * s - 2 * s ** 3)
      + tangent * (2 * s ** 3 - 3 * s * s + s),
    lift: clearance * Math.sin(Math.PI * s) ** 2,
  };
}

export function normalizeVisitorModel(model: Object3D, height: number) {
  // Update all bones and bind inverses before Box3 measures a cloned FBX skin.
  model.updateMatrixWorld(true);
  model.traverse((object) => {
    if (object instanceof SkinnedMesh) object.computeBoundingBox();
  });
  const box = new Box3().setFromObject(model);
  const scale = height / Math.max(0.01, box.getSize(new Vector3()).y);
  const center = box.getCenter(new Vector3());
  model.scale.multiplyScalar(scale);
  // Scan exports may sit far from their origin. Center the body over the player
  // collider as well as grounding its feet, retaining the source orientation.
  model.position.set(
    (model.position.x - center.x) * scale,
    (model.position.y - box.min.y) * scale,
    (model.position.z - center.z) * scale,
  );
  model.updateMatrixWorld(true);
}

/** In-place motion authored for the downloaded visitor rigs.
 * Derive axes from the bind pose because their FBX exports use different root
 * rotations, units and optional Mixamo name prefixes. Never share mutable bones.
 */
export function createVisitorMotion(model: Object3D, longDress = false): AnimationClip[] {
  const bones = new Map<string, Bone>();
  model.traverse((object) => {
    if (object instanceof Bone)
      bones.set(
        object.name.replace(/^mixamorig:?/, "").replace(/_\d+$/, ""),
        object,
      );
  });
  const bone = (name: string) => {
    const found = bones.get(name);
    if (!found) throw new Error(`Visitor rig is missing ${name}`);
    return found;
  };
  model.updateMatrixWorld(true);
  // Lower the exported T-pose arms while retaining the original hand/finger pose.
  for (const side of ["Left", "Right"]) {
    const arm = bone(`${side}Arm`),
      forearm = bone(`${side}ForeArm`);
    const direction = forearm
      .getWorldPosition(new Vector3())
      .sub(arm.getWorldPosition(new Vector3()))
      .normalize();
    const target = new Vector3(
      side === "Left" ? 0.14 : -0.14,
      -1,
      0.03,
    ).normalize();
    const world = arm.getWorldQuaternion(new Quaternion());
    const parent = arm.parent!.getWorldQuaternion(new Quaternion());
    arm.quaternion.copy(
      parent
        .invert()
        .multiply(
          new Quaternion()
            .setFromUnitVectors(direction, target)
            .multiply(world),
        ),
    );
    model.updateMatrixWorld(true);
  }
  if (model.userData.scanRig === "casual-man") {
    // The scan's elbows flare outward independently of its upper arms. Lower
    // the forearms too, without adding an axial twist to the scanned palms.
    for (const side of ["Left", "Right"]) {
      const forearm = bone(`${side}ForeArm`);
      const direction = bone(`${side}Hand`).getWorldPosition(new Vector3())
        .sub(forearm.getWorldPosition(new Vector3())).normalize();
      const target = new Vector3(side === "Left" ? 0.08 : -0.08, -1, 0.08).normalize();
      const world = forearm.getWorldQuaternion(new Quaternion());
      forearm.quaternion.copy(forearm.parent!.getWorldQuaternion(new Quaternion()).invert()
        .multiply(new Quaternion().setFromUnitVectors(direction, target)).multiply(world));
      model.updateMatrixWorld(true);
    }
  }
  const names = [
    "Spine",
    ...(bones.has("Chest") ? ["Chest"] : bones.has("Spine2") ? ["Spine2"] : []),
    "Head",
    "LeftArm",
    "RightArm",
    "LeftForeArm",
    "RightForeArm",
    "LeftUpLeg",
    "RightUpLeg",
    "LeftLeg",
    "RightLeg",
    "LeftFoot",
    "RightFoot",
  ];
  const joints = names.map((name) => {
    const object = bone(name);
    const inverse = object
      .parent!.getWorldQuaternion(new Quaternion())
      .invert();
    return {
      name,
      object,
      rest: object.quaternion.clone(),
      axis: new Vector3(1, 0, 0).applyQuaternion(inverse).normalize(),
      twistAxis: new Vector3(0, 1, 0).applyQuaternion(inverse).normalize(),
      rollAxis: new Vector3(0, 0, 1).applyQuaternion(inverse).normalize(),
    };
  });
  const hips = bone("Hips"),
    hipRest = hips.position.clone();
  const hipOrigin = hips.parent!.worldToLocal(new Vector3());
  const hipUp = hips.parent!.worldToLocal(new Vector3(0, 1, 0)).sub(hipOrigin);
  const legs = Object.fromEntries(["Left", "Right"].map((side) => {
    const hip = bone(`${side}UpLeg`).getWorldPosition(new Vector3());
    const knee = bone(`${side}Leg`).getWorldPosition(new Vector3());
    const ankle = bone(`${side}Foot`).getWorldPosition(new Vector3());
    const upper = knee.clone().sub(hip), lower = ankle.clone().sub(knee);
    const upperAngle = Math.atan2(-upper.z, -upper.y);
    return [side, {
      upper: Math.hypot(upper.y, upper.z), lower: Math.hypot(lower.y, lower.z),
      restY: ankle.y - hip.y, restZ: ankle.z - hip.z,
      upperAngle, kneeAngle: Math.atan2(-lower.z, -lower.y) - upperAngle,
    }];
  }));
  const legLength = Math.min(...Object.values(legs).map((leg) => leg.upper + leg.lower));
  return (
    ["Idle", "Walk", "Run", "Sit", "Light", "Blow", "Cut", "Celebrate"] as const
  ).map((state) => {
    const duration =
      state === "Run"
        ? 0.68
        : state === "Walk"
          ? 1
          : state === "Light"
            ? 1.4
            : state === "Blow"
              ? 1.8
              : state === "Cut"
                ? 3.2
                : state === "Celebrate"
                  ? 5.2
                  : 3.6;
    const moving = state === "Walk" || state === "Run";
    const run = state === "Run",
      sit = state === "Sit";
    const stance = run ? 0.42 : 0.6;
    const reach = legLength * (run ? 0.50 : 0.38) * (longDress ? 0.82 : 1);
    const hipOffset = (phase: number) => sit ? -0.43 : moving
      ? legLength * (run ? -0.18 : -0.10) + Math.cos(phase * 2) * (run ? 0.025 : 0.009)
      : Math.sin(phase) * 0.002;
    // Sample densely enough to retain the contact trajectory after quaternion
    // interpolation, without solving IK or allocating vectors each render frame.
    const times = Array.from({ length: 81 }, (_, i) => (i * duration) / 80);
    const tracks: KeyframeTrack[] = joints.map(
      ({ name, object, rest, axis, twistAxis, rollAxis }) => {
        const values = times.flatMap((time) => {
          const phase = (time / duration) * Math.PI * 2;
          const stride = Math.sin(
            phase + (name.startsWith("Right") ? Math.PI : 0),
          );
          let angle = 0;
          if (moving && /(?:UpLeg|Leg|Foot)$/.test(name)) {
            const side = name.startsWith("Right") ? "Right" : "Left";
            const leg = legs[side]!;
            const foot = footPath(time / duration + (side === "Right" ? 0.5 : 0),
              reach, stance, legLength * (run ? 0.23 : 0.095) * (longDress ? 0.75 : 1));
            const y = leg.restY + foot.lift - hipOffset(phase);
            const z = leg.restZ + foot.z;
            const distance = MathUtils.clamp(Math.hypot(y, z), 0.01, leg.upper + leg.lower - 0.0001);
            const upper = Math.atan2(-z, -y) - Math.acos(MathUtils.clamp(
              (leg.upper ** 2 + distance ** 2 - leg.lower ** 2) / (2 * leg.upper * distance), -1, 1));
            const knee = Math.PI - Math.acos(MathUtils.clamp(
              (leg.upper ** 2 + leg.lower ** 2 - distance ** 2) / (2 * leg.upper * leg.lower), -1, 1));
            const hipAngle = upper - leg.upperAngle;
            const kneeAngle = knee - leg.kneeAngle;
            // Ankle compensation keeps the sole level as the knee bends.
            angle = name.endsWith("UpLeg") ? hipAngle : name.endsWith("Leg")
              ? kneeAngle : -hipAngle - kneeAngle;
          } else if (name.endsWith("UpLeg"))
            angle = sit ? -1.48 : 0;
          else if (name.endsWith("Leg"))
            angle = sit
              ? 1.48
              : 0;
          else if (name.endsWith("ForeArm"))
            angle = run ? -0.95 + stride * 0.12 : sit ? -0.6 : -0.18 + (moving ? stride * 0.06 : 0);
          else if (name.endsWith("Arm"))
            angle = sit
              ? -0.22
              : moving
                ? Math.cos(phase + (name.startsWith("Right") ? Math.PI : 0)) * (run ? 0.48 : 0.24)
                : Math.sin(phase) * 0.018;
          else if (name === "Spine")
            angle = run ? 0.065 : Math.sin(phase) * 0.008;
          else if (name === "Head") angle = run ? -0.045 : Math.sin(phase + 0.4) * 0.008;
          // Smoothly enter/leave celebration gestures on each independent rig.
          const envelope = Math.sin((Math.PI * time) / duration) ** 2;
          if (state === "Blow") {
            if (name === "Spine") angle = 0.26 * envelope;
            if (name === "Head") angle = 0.15 * envelope;
          }
          if (state === "Light" || state === "Cut") {
            if (name === "RightArm") angle = -0.9 * envelope;
            if (name === "RightForeArm") angle = -0.45 - 0.4 * envelope;
            if (name === "Spine") angle = 0.12 * envelope;
            if (state === "Cut" && name === "RightArm")
              angle += 0.22 * Math.sin(phase * 2) * envelope;
          }
          if (state === "Celebrate") {
            if (name.endsWith("Arm") && !name.endsWith("ForeArm"))
              angle = -2.4 * envelope;
            if (name.endsWith("ForeArm"))
              angle = -0.45 - 0.3 * Math.sin(phase * 4) * envelope;
            if (name === "Spine") angle = Math.sin(phase * 3) * 0.05 * envelope;
          }
          const rotation = new Quaternion().setFromAxisAngle(axis, angle);
          if (moving && ["Spine", "Chest", "Spine2", "Head"].includes(name)) {
            // Small shoulder counter-rotation; the head absorbs most of it so
            // the gaze stays steady. Keep the pelvis square for planted feet.
            const amount = name === "Head" ? -0.7 : name === "Spine" ? 0.55 : 0.45;
            rotation.premultiply(new Quaternion().setFromAxisAngle(twistAxis,
              Math.cos(phase) * (run ? 0.12 : 0.07) * amount));
            rotation.premultiply(new Quaternion().setFromAxisAngle(rollAxis,
              Math.sin(phase) * 0.018 * amount));
          }
          return rotation.multiply(rest).toArray();
        });
        return new QuaternionKeyframeTrack(
          `${object.name}.quaternion`,
          times,
          values,
        );
      },
    );
    tracks.push(
      new VectorKeyframeTrack(
        `${hips.name}.position`,
        times,
        times.flatMap((time) => {
          const phase = (time / duration) * Math.PI * 2;
          const offset = hipOffset(phase);
          return hipRest.clone().addScaledVector(hipUp, offset).toArray();
        }),
      ),
    );
    const clip = new AnimationClip(state, duration, tracks);
    if (moving) travelSpeeds.set(clip, 2 * reach / stance / duration);
    return clip;
  });
}
