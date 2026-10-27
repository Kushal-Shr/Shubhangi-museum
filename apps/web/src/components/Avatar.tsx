import { Html, useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import {
  Component,
  Suspense,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
  type MutableRefObject,
} from "react";
import {
  AnimationMixer,
  CanvasTexture,
  Mesh,
  MeshStandardMaterial,
  SkinnedMesh,
  type Skeleton,
  type AnimationAction,
} from "three";
import { clone } from "three/examples/jsm/utils/SkeletonUtils.js";
import {
  BIRTHDAY_STAGE_DURATION,
  roomAt,
  type AvatarProfile,
} from "@museum/shared";
import { useGameStore } from "../store/gameStore";
import { CuteCharacter } from "./CuteCharacter";
import { avatarAssets, type AvatarAsset } from "../config/avatars";
import { createVisitorMotion, normalizeVisitorModel, visitorTravelSpeed } from "./visitorMotion";
import { removeScanGround } from "./scanGeometry";
import { rigStaticAvatar } from "./rigStaticAvatar";
interface AvatarProps extends AvatarProfile {
  playerId?: string;
  moving?: boolean;
  running?: boolean;
  seated?: boolean;
  local?: boolean;
  motion?: MutableRefObject<boolean>;
  speed?: MutableRefObject<number>;
}
class AvatarBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
function Human({ asset, ...profile }: AvatarProps & { asset: AvatarAsset }) {
  const gltf = useGLTF(asset.url);
  const model = useMemo(() => {
    const scene = clone(gltf.scene);
    scene.traverse((object) => {
      if (object instanceof Mesh) {
        object.castShadow = true;
        object.receiveShadow = true;
        const customize = (source: MeshStandardMaterial) => {
          const material = source.clone();
          if (asset.materials?.skin?.includes(source.name))
            material.color.set(profile.skinTone);
          if (asset.materials?.hair?.includes(source.name))
            material.color.set(profile.hairColor);
          if (asset.materials?.outfit?.includes(source.name))
            material.color.set(profile.outfitColor);
          return material;
        };
        object.material = Array.isArray(object.material)
          ? object.material.map((m) => customize(m as MeshStandardMaterial))
          : customize(object.material as MeshStandardMaterial);
      }
      for (const [prefix, selected] of [
        ["hair", profile.hairStyle],
        ["outfit", profile.outfit],
        ["accessory", profile.accessory],
      ]) {
        if (object.name.startsWith(`${prefix}__`))
          object.visible = object.name === `${prefix}__${selected}`;
      }
    });
    if (asset.scanGroundPlane) removeScanGround(scene, asset.scanGroundPlane);
    normalizeVisitorModel(scene, asset.height);
    if (asset.scanRig) {
      const rig = rigStaticAvatar(scene, asset.height, asset.scanRig);
      if (asset.scanGroundPlane) scene.traverse((o) => {
        if (o instanceof Mesh) o.geometry.dispose();
      });
      return rig;
    }
    return scene;
  }, [
    gltf.scene,
    asset,
    profile.skinTone,
    profile.outfitColor,
    profile.hairColor,
    profile.hairStyle,
    profile.outfit,
    profile.accessory,
  ]);
  const mixer = useMemo(() => new AnimationMixer(model), [model]);
  const clips = useMemo(
    () =>
      asset.proceduralMotion ? createVisitorMotion(model, asset.scanRig === "dress") : gltf.animations,
    [asset, model, gltf.animations],
  );
  const actions = useRef<Record<string, AnimationAction>>({});
  const active = useRef<AnimationAction | null>(null);
  useEffect(() => {
    // Recreate bindings after cleanup (including React StrictMode's effect replay).
    actions.current = Object.fromEntries(
      clips.map((clip) => [clip.name, mixer.clipAction(clip)]),
    );
    active.current = null;
    return () => {
      mixer.stopAllAction();
      mixer.uncacheRoot(model);
      actions.current = {};
      active.current = null;
    };
  }, [clips, mixer, model]);
  useFrame((_, delta) => {
    let moving = profile.motion?.current ?? profile.moving;
    if (profile.speed && profile.speed.current < 0.08) moving = false;
    const running = profile.running ?? ((profile.speed?.current ?? 0) > 2.6);
    const game = useGameStore.getState();
    const elapsed = Math.max(
      0,
      (Date.now() + game.serverClockOffset - game.birthdayStartedAt) / 1000,
    );
    const actor =
      game.birthdayActorId ===
      (profile.local ? game.sessionId : profile.playerId);
    if (
      actor &&
      elapsed < (BIRTHDAY_STAGE_DURATION[game.birthdayStage] ?? 0) / 1000
    )
      moving = false;
    const participant = profile.local
      ? game.localPosition
      : (() => {
          const p = game.players.find((p) => p.id === profile.playerId);
          return p ? [p.x, p.y, p.z] : null;
        })();
    const celebrating =
      game.birthdayStage === 4 &&
      participant &&
      roomAt(participant[0]!, participant[2]!).id === "birthday";
    const gesture =
      !moving &&
      (actor || celebrating) &&
      elapsed < (BIRTHDAY_STAGE_DURATION[game.birthdayStage] ?? 0) / 1000
        ? ["", "Light", "Blow", "Cut", "Celebrate"][game.birthdayStage]
        : "";
    const name =
      gesture && actions.current[gesture]
        ? gesture
        : profile.seated && asset.animations.sit
          ? asset.animations.sit
          : moving
            ? running
              ? (asset.animations.run ?? asset.animations.walk)
              : asset.animations.walk
            : asset.animations.idle;
    const next = actions.current[name];
    if (next && active.current !== next) {
      const previous = active.current;
      const preserveStep = previous && visitorTravelSpeed(previous.getClip()) && visitorTravelSpeed(next.getClip());
      const phase = preserveStep ? previous.time / previous.getClip().duration : 0;
      active.current?.fadeOut(0.22);
      next.reset().fadeIn(0.22).play();
      next.time = phase * next.getClip().duration;
      active.current = next;
    }
    // Match the step cadence to actual travel, including acceleration and walls.
    // Preview animations have no velocity input and play at their authored rate.
    const strideSpeed = next ? (visitorTravelSpeed(next.getClip()) ?? (running ? 3.5 : 1.65)) : 1;
    next?.setEffectiveTimeScale(
      moving && !gesture && !profile.seated && profile.speed
        ? Math.max(0.05, Math.min(3, profile.speed.current / strideSpeed))
        : 1,
    );
    mixer.update(Math.min(delta, 0.1));
    if (gesture && next && actions.current[gesture]) {
      next.time = elapsed;
      mixer.update(0);
    }
  });
  useEffect(
    () => () => {
      const skeletons = new Set<Skeleton>();
      model.traverse((o) => {
        if (o instanceof SkinnedMesh) skeletons.add(o.skeleton);
        if (o instanceof Mesh) {
          if (asset.scanGroundPlane || asset.scanRig) o.geometry.dispose();
          (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) =>
            m.dispose(),
          );
        }
      });
      skeletons.forEach((skeleton) => skeleton.dispose());
    },
    [mixer, model, asset],
  );
  return (
    <group position={[0, -0.9, 0]} rotation={[0, asset.rotationY, 0]}>
      <primitive object={model} />
    </group>
  );
}
function GroundShadow() {
  const map = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 64;
    const context = canvas.getContext("2d")!;
    const gradient = context.createRadialGradient(32, 32, 2, 32, 32, 31);
    gradient.addColorStop(0, "rgba(25,32,22,0.28)");
    gradient.addColorStop(0.45, "rgba(25,32,22,0.13)");
    gradient.addColorStop(1, "rgba(25,32,22,0)");
    context.fillStyle = gradient;
    context.fillRect(0, 0, 64, 64);
    return new CanvasTexture(canvas);
  }, []);
  useEffect(() => () => map.dispose(), [map]);
  return (
    <mesh position={[0, -0.83, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[1.05, 0.8]} />
      <meshBasicMaterial
        map={map}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
      />
    </mesh>
  );
}
/** Deliberately abstract visitor token until a licensed human asset is configured. */
function VisitorMarker({ outfitColor }: AvatarProps) {
  return (
    <group>
      <mesh position={[0, -0.86, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.29, 0.38, 32]} />
        <meshBasicMaterial color={outfitColor} side={2} />
      </mesh>
      <mesh position={[0, -0.4, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.4, 6, 12]} />
        <meshStandardMaterial color={outfitColor} roughness={0.65} />
      </mesh>
    </group>
  );
}
export function Avatar(props: AvatarProps) {
  const asset = avatarAssets.find((a) => a.id === props.modelId);
  const fallback = <VisitorMarker {...props} />;
  return (
    <group>
      {asset && !props.seated && <GroundShadow />}
      {asset ? (
        <AvatarBoundary key={asset.id} fallback={fallback}>
          <Suspense fallback={fallback}>
            {asset.generated ? (
              <CuteCharacter {...props} />
            ) : (
              <Human {...props} asset={asset} />
            )}
          </Suspense>
        </AvatarBoundary>
      ) : (
        fallback
      )}
      {!props.local && (
        <Html
          center
          position={[0, 1.2, 0]}
          distanceFactor={5}
          zIndexRange={[20, 0]}
        >
          <span className={`name-tag${props.local ? " local" : ""}`}>
            {props.displayName}
            {props.local ? " · you" : ""}
          </span>
        </Html>
      )}
    </group>
  );
}
