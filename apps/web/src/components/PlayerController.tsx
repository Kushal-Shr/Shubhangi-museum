import {
  CapsuleCollider,
  RigidBody,
  type RapierRigidBody,
} from "@react-three/rapier";
import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useRef } from "react";
import { Box3, MathUtils, Ray, Vector3 } from "three";
import {
  BIRTHDAY_CAKE_POSITION,
  BIRTHDAY_STAGE_DURATION,
  obstacles,
  seats,
  SPAWN,
  WORLD_BOUNDS,
} from "@museum/shared";
import { exhibits, type Exhibit } from "../config/exhibits";
import { sendMovement } from "../network/multiplayer";
import { useGameStore, useInputStore } from "../store/gameStore";
import { Avatar } from "./Avatar";
const target = new Vector3(),
  desired = new Vector3(),
  direction = new Vector3(),
  hit = new Vector3(),
  ray = new Ray();
const occluders = obstacles.map(
  (b) =>
    new Box3(
      new Vector3(...b.position)
        .sub(new Vector3(...b.size).multiplyScalar(0.5))
        .addScalar(-0.12),
      new Vector3(...b.position)
        .add(new Vector3(...b.size).multiplyScalar(0.5))
        .addScalar(0.12),
    ),
);
const seatExhibits: Exhibit[] = seats.map((s) => ({
  id: s.id,
  seatId: s.id,
  type: "seat",
  room: "birthday",
  title: "Take a seat",
  caption: "",
  image: "",
  thumbnail: "",
  placeholder: false,
  position: [s.x, 0, s.z],
  interactionPoint: [s.x, 0, s.z + 1.3],
  rotationY: 0,
  frameStyle: "oak",
  size: [1, 1],
}));
const interactables = [...exhibits, ...seatExhibits];
export function PlayerController() {
  const body = useRef<RapierRigidBody>(null),
    rotation = useRef(0),
    angle = useRef(0),
    pitch = useRef(-0.04),
    sequence = useRef(0),
    lastSent = useRef(0),
    lastNearby = useRef<string | null>(null),
    dragging = useRef(false),
    initialized = useRef(false),
    velocity = useRef({ x: 0, z: 0 }),
    animationSpeed = useRef(0),
    previousMotionPosition = useRef<Vector3 | null>(null),
    lookTarget = useRef(new Vector3());
  const { camera, gl } = useThree();
  const profile = useGameStore((s) => s.profile);
  const correction = useGameStore((s) => s.correction);
  const seatId = useGameStore((s) => s.seatId);
  useEffect(() => {
    if (correction) {
      body.current?.setTranslation(
        { x: correction[0], y: correction[1], z: correction[2] },
        true,
      );
      body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true);
      velocity.current = { x: 0, z: 0 };
    }
  }, [correction]);
  useEffect(() => {
    const element = gl.domElement;
    const down = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && e.button === 0) dragging.current = true;
    };
    const up = () => {
      dragging.current = false;
    };
    const move = (e: PointerEvent) => {
      if (e.pointerType === "mouse" && dragging.current)
        useInputStore.getState().addLook(e.movementX, e.movementY);
    };
    element.addEventListener("pointerdown", down);
    window.addEventListener("pointerup", up);
    window.addEventListener("pointermove", move);
    window.addEventListener("blur", up);
    return () => {
      element.removeEventListener("pointerdown", down);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointermove", move);
      window.removeEventListener("blur", up);
    };
  }, [gl]);
  useFrame((_, delta) => {
    const rb = body.current;
    if (!rb) return;
    delta = Math.min(delta, 0.05);
    const input = useInputStore.getState(),
      game = useGameStore.getState(),
      look = input.consumeLook();
    const acting =
      game.birthdayActorId === game.sessionId &&
      Date.now() + game.serverClockOffset - game.birthdayStartedAt <
        (BIRTHDAY_STAGE_DURATION[game.birthdayStage] ?? 0);
    const birthdayFocus = game.birthdayFocus || acting;
    const blocked = !!game.activeExhibit || game.mapOpen || birthdayFocus;
    if (!blocked) {
      angle.current -= look.x * 0.004;
      pitch.current = MathUtils.clamp(
        pitch.current + look.y * 0.0025,
        -0.06,
        0.7,
      );
    }
    const moving =
      !blocked &&
      !game.seatId &&
      Math.abs(input.forward) + Math.abs(input.right) > 0.05;
    // Human walking/jogging pace keeps travel and anatomical stride in sync.
    const speed = input.running ? 3.4 : 1.65;
    const length = Math.max(1, Math.hypot(input.forward, input.right)),
      forward = moving ? input.forward / length : 0,
      right = moving ? input.right / length : 0;
    const vx =
        (-Math.sin(angle.current) * forward + Math.cos(angle.current) * right) *
        speed,
      vz =
        (-Math.cos(angle.current) * forward - Math.sin(angle.current) * right) *
        speed;
    const blend = 1 - Math.exp(-delta * (moving ? 14 : 22));
    velocity.current.x = MathUtils.lerp(velocity.current.x, vx, blend);
    velocity.current.z = MathUtils.lerp(velocity.current.z, vz, blend);
    if (blocked || game.seatId) velocity.current = { x: 0, z: 0 };
    rb.setLinvel(
      {
        x: velocity.current.x,
        y: game.seatId ? 0 : rb.linvel().y,
        z: velocity.current.z,
      },
      true,
    );
    if (moving) {
      const desiredRotation = Math.atan2(-vx, -vz);
      rotation.current +=
        Math.atan2(
          Math.sin(desiredRotation - rotation.current),
          Math.cos(desiredRotation - rotation.current),
        ) *
        (1 - Math.exp(-delta * 12));
    }
    if (game.seatId) rotation.current = 0;
    if (birthdayFocus) {
      const pos = rb.translation();
      const desiredRotation = Math.atan2(
        pos.x - BIRTHDAY_CAKE_POSITION[0],
        pos.z - BIRTHDAY_CAKE_POSITION[2],
      );
      rotation.current +=
        Math.atan2(
          Math.sin(desiredRotation - rotation.current),
          Math.cos(desiredRotation - rotation.current),
        ) *
        (1 - Math.exp(-delta * 8));
    }
    rb.setRotation(
      {
        x: 0,
        y: Math.sin(rotation.current / 2),
        z: 0,
        w: Math.cos(rotation.current / 2),
      },
      true,
    );
    const pos = rb.translation();
    const lastPosition = previousMotionPosition.current;
    const travelSpeed = lastPosition
      ? Math.hypot(pos.x - lastPosition.x, pos.z - lastPosition.z) / Math.max(delta, 0.001)
      : 0;
    animationSpeed.current = MathUtils.lerp(
      animationSpeed.current,
      travelSpeed > 8 ? 0 : travelSpeed,
      1 - Math.exp(-delta * 18),
    );
    if (!lastPosition) previousMotionPosition.current = new Vector3(pos.x, pos.y, pos.z);
    else lastPosition.set(pos.x, pos.y, pos.z);
    if (
      pos.y < -0.5 ||
      pos.x < WORLD_BOUNDS.minX ||
      pos.x > WORLD_BOUNDS.maxX ||
      pos.z < WORLD_BOUNDS.minZ ||
      pos.z > WORLD_BOUNDS.maxZ
    ) {
      rb.setTranslation(
        {
          x: MathUtils.clamp(pos.x, WORLD_BOUNDS.minX, WORLD_BOUNDS.maxX),
          y: 0.92,
          z: MathUtils.clamp(pos.z, WORLD_BOUNDS.minZ, WORLD_BOUNDS.maxZ),
        },
        true,
      );
    }
    target.set(pos.x, pos.y + 0.65, pos.z);
    desired.set(
      pos.x + Math.sin(angle.current) * Math.cos(pitch.current) * 4.8,
      pos.y + 1.05 + Math.sin(pitch.current) * 4.8,
      pos.z + Math.cos(angle.current) * Math.cos(pitch.current) * 4.8,
    );
    if (birthdayFocus) {
      const dx = pos.x - BIRTHDAY_CAKE_POSITION[0],
        dz = pos.z - BIRTHDAY_CAKE_POSITION[2];
      const length = Math.max(0.1, Math.hypot(dx, dz));
      target.set(BIRTHDAY_CAKE_POSITION[0], 1.35, BIRTHDAY_CAKE_POSITION[2]);
      // An offset shoulder view keeps the cake and the visitor's gesture visible.
      desired.set(
        target.x + (dx / length) * 3.4 + (dz / length) * 0.9,
        2.65,
        target.z + (dz / length) * 3.4 - (dx / length) * 0.9,
      );
    }
    direction.copy(desired).sub(target);
    let distance = direction.length();
    direction.normalize();
    ray.set(target, direction);
    for (const box of occluders) {
      if (box.containsPoint(target)) continue;
      const intersect = ray.intersectBox(box, hit);
      if (intersect)
        distance = Math.min(
          distance,
          Math.max(0.35, target.distanceTo(intersect) - 0.15),
        );
    }
    desired.copy(target).addScaledVector(direction, distance);
    if (!initialized.current) camera.position.copy(desired);
    else camera.position.lerp(desired, 1 - Math.exp(-delta * 10));
    // Sweep the interpolated camera as well, including around corners.
    direction.copy(camera.position).sub(target);
    const cameraDistance = direction.length();
    ray.set(target, direction.normalize());
    for (const box of occluders) {
      if (box.containsPoint(target)) continue;
      if (ray.intersectBox(box, hit) && target.distanceTo(hit) < cameraDistance)
        camera.position
          .copy(target)
          .addScaledVector(
            direction,
            Math.max(0.3, target.distanceTo(hit) - 0.15),
          );
    }
    if (!initialized.current) lookTarget.current.copy(target);
    else lookTarget.current.lerp(target, 1 - Math.exp(-delta * 14));
    camera.lookAt(lookTarget.current);
    initialized.current = true;
    const now = performance.now();
    if (now - lastSent.current >= 50) {
      lastSent.current = now;
      if (
        Math.hypot(
          pos.x - game.localPosition[0],
          pos.z - game.localPosition[2],
        ) > 0.02
      )
        game.setLocalPosition([pos.x, pos.y, pos.z]);
      sendMovement({
        x: pos.x,
        y: pos.y,
        z: pos.z,
        rotation: rotation.current,
        sequence: sequence.current++,
      });
      let nearest: Exhibit | null = null,
        nearestDistance = 1.9;
      if (!game.seatId)
        for (const e of interactables) {
          const d = Math.hypot(
            pos.x - e.interactionPoint[0],
            pos.z - e.interactionPoint[2],
          );
          if (d < nearestDistance) {
            nearest = e;
            nearestDistance = d;
          }
        }
      if ((nearest?.id ?? null) !== lastNearby.current) {
        lastNearby.current = nearest?.id ?? null;
        game.setNearbyExhibit(nearest);
      }
    }
  });
  const moving = useInputStore(
    (s) => Math.abs(s.forward) + Math.abs(s.right) > 0.05,
  );
  const running = useInputStore((s) => s.running);
  const modal = useGameStore(
    (s) => !!s.activeExhibit || s.mapOpen || s.birthdayFocus,
  );
  return (
    <RigidBody
      ref={body}
      position={SPAWN}
      type={seatId ? "kinematicPosition" : "dynamic"}
      colliders={false}
      enabledRotations={[false, true, false]}
      linearDamping={0}
      angularDamping={10}
      friction={0}
      canSleep={false}
      ccd
    >
      <CapsuleCollider args={[0.52, 0.36]} sensor={!!seatId} />
      <Avatar
        {...profile}
        moving={moving && !modal && !seatId}
        running={running}
        speed={animationSpeed}
        seated={!!seatId}
        local
      />
    </RigidBody>
  );
}
