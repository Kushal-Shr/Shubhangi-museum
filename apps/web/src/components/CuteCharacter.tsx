import { useRef, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { Group, MathUtils } from "three";
import {
  BIRTHDAY_STAGE_DURATION,
  roomAt,
  type AvatarProfile,
} from "@museum/shared";
import { useGameStore } from "../store/gameStore";

export function Bow({ color = "#e77ca6" }: { color?: string }) {
  return (
    <group>
      {[-1, 1].map((side) => (
        <mesh
          key={side}
          position={[side * 0.085, 0, 0]}
          rotation={[0, 0, side * 0.3]}
          scale={[0.105, 0.075, 0.045]}
        >
          <sphereGeometry args={[1, 16, 12]} />
          <meshStandardMaterial color={color} roughness={0.48} />
        </mesh>
      ))}
      <mesh scale={[0.045, 0.05, 0.045]}>
        <sphereGeometry args={[1, 12, 10]} />
        <meshStandardMaterial color={color} roughness={0.5} />
      </mesh>
    </group>
  );
}
function SoftPart({
  position,
  scale,
  color,
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color={color} roughness={0.64} />
    </mesh>
  );
}
export function CuteCharacter(
  props: AvatarProfile & {
    moving?: boolean;
    running?: boolean;
    local?: boolean;
    playerId?: string;
    motion?: MutableRefObject<boolean>;
  },
) {
  const girl = props.modelId === "shubhangi";
  const root = useRef<Group>(null),
    head = useRef<Group>(null);
  const leftArm = useRef<Group>(null),
    rightArm = useRef<Group>(null);
  const leftLeg = useRef<Group>(null),
    rightLeg = useRef<Group>(null);
  const skin = girl ? "#f3cdbb" : props.skinTone,
    hair = girl ? "#49302e" : "#473638";
  const outfit = girl ? "#d989a8" : "#b49b91";
  useFrame(({ clock }, delta) => {
    const game = useGameStore.getState(),
      elapsed = Math.max(
        0,
        (Date.now() + game.serverClockOffset - game.birthdayStartedAt) / 1000,
      );
    const actor =
      game.birthdayActorId === (props.local ? game.sessionId : props.playerId);
    const duration = (BIRTHDAY_STAGE_DURATION[game.birthdayStage] ?? 0) / 1000;
    const participant = props.local
      ? game.localPosition
      : (() => {
          const p = game.players.find((p) => p.id === props.playerId);
          return p ? [p.x, p.y, p.z] : null;
        })();
    const party =
      game.birthdayStage === 4 &&
      participant &&
      roomAt(participant[0]!, participant[2]!).id === "birthday" &&
      !(props.motion?.current ?? props.moving);
    const acting = (actor || party) && elapsed < duration;
    const moving = !acting && (props.motion?.current ?? props.moving);
    const gait = Math.sin(clock.elapsedTime * (props.running ? 12 : 8));
    const envelope = acting ? Math.sin((Math.PI * elapsed) / duration) ** 2 : 0;
    if (root.current) {
      root.current.position.y =
        -0.9 +
        (moving
          ? Math.abs(gait) * 0.022
          : Math.sin(clock.elapsedTime * 1.7) * 0.004);
      root.current.rotation.x = game.birthdayStage === 2 ? envelope * 0.12 : 0;
    }
    if (head.current)
      head.current.rotation.z = Math.sin(clock.elapsedTime * 0.9) * 0.022;
    for (const [ref, side] of [
      [leftLeg, -1],
      [rightLeg, 1],
    ] as const)
      if (ref.current)
        ref.current.rotation.x = MathUtils.damp(
          ref.current.rotation.x,
          moving ? gait * 0.38 * side : 0,
          12,
          delta,
        );
    for (const [ref, side] of [
      [leftArm, -1],
      [rightArm, 1],
    ] as const)
      if (ref.current) {
        let angle = moving
          ? -gait * 0.32 * side
          : 0.03 * Math.sin(clock.elapsedTime * 1.5);
        if (acting && game.birthdayStage === 3 && side === 1)
          angle = -envelope * 0.9;
        if (acting && game.birthdayStage === 4) angle = -envelope * 2.5;
        ref.current.rotation.x = MathUtils.damp(
          ref.current.rotation.x,
          angle,
          12,
          delta,
        );
      }
  });
  return (
    <group ref={root} position={[0, -0.9, 0]} rotation={[0, Math.PI, 0]}>
      {[
        [-0.115, leftLeg],
        [0.115, rightLeg],
      ].map(([x, ref], i) => (
        <group
          key={i}
          ref={ref as typeof leftLeg}
          position={[x as number, 0.58, 0]}
        >
          <SoftPart
            position={[0, -0.2, 0]}
            scale={[0.075, 0.25, 0.08]}
            color={girl ? "#fff8f2" : "#6d6573"}
          />
          <SoftPart
            position={[0, -0.48, 0.035]}
            scale={[0.095, 0.075, 0.15]}
            color={girl ? "#943d60" : "#f8ece5"}
          />
          {girl && (
            <SoftPart
              position={[0, -0.43, 0.08]}
              scale={[0.096, 0.016, 0.05]}
              color="#f4b9cd"
            />
          )}
        </group>
      ))}
      <SoftPart
        position={[0, 0.91, 0]}
        scale={[0.2, 0.28, 0.13]}
        color={outfit}
      />
      {girl ? (
        <>
          <mesh position={[0, 0.61, 0]} castShadow>
            <cylinderGeometry args={[0.15, 0.31, 0.34, 40]} />
            <meshStandardMaterial color={outfit} roughness={0.65} />
          </mesh>
          <mesh position={[0, 0.45, 0]} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.29, 0.025, 8, 40]} />
            <meshStandardMaterial color="#fff1ec" />
          </mesh>
          {Array.from({ length: 12 }, (_, i) => (
            <SoftPart
              key={i}
              position={[
                Math.sin((i * Math.PI) / 6) * 0.29,
                0.46,
                Math.cos((i * Math.PI) / 6) * 0.29,
              ]}
              scale={[0.045, 0.035, 0.045]}
              color="#fff0ee"
            />
          ))}
          <group position={[0, 0.8, 0.15]} scale={0.7}>
            <Bow color="#cf648e" />
          </group>
          <SoftPart
            position={[-0.065, 1.08, 0.11]}
            scale={[0.08, 0.035, 0.06]}
            color="#fff6ef"
          />
          <SoftPart
            position={[0.065, 1.08, 0.11]}
            scale={[0.08, 0.035, 0.06]}
            color="#fff6ef"
          />
        </>
      ) : (
        <SoftPart
          position={[0, 0.63, 0]}
          scale={[0.19, 0.14, 0.12]}
          color="#6d6573"
        />
      )}
      {[
        [-0.23, leftArm],
        [0.23, rightArm],
      ].map(([x, ref], i) => (
        <group
          key={i}
          ref={ref as typeof leftArm}
          position={[x as number, 1.05, 0]}
          rotation={[0, 0, i ? -0.1 : 0.1]}
        >
          <SoftPart
            position={[0, -0.06, 0]}
            scale={[0.085, 0.12, 0.09]}
            color={outfit}
          />
          <SoftPart
            position={[0, -0.25, 0]}
            scale={[0.053, 0.18, 0.057]}
            color={skin}
          />
          <SoftPart
            position={[0, -0.4, 0]}
            scale={[0.06, 0.065, 0.055]}
            color={skin}
          />
        </group>
      ))}
      <group ref={head} position={[0, 1.35, 0]}>
        {girl && (
          <>
            <SoftPart
              position={[0, -0.09, -0.12]}
              scale={[0.265, 0.36, 0.16]}
              color={hair}
            />
            {[-1, 1].map((side) => (
              <group key={side}>
                <SoftPart
                  position={[side * 0.22, -0.22, -0.03]}
                  scale={[0.09, 0.27, 0.1]}
                  color={hair}
                />
                <SoftPart
                  position={[side * 0.255, -0.37, -0.01]}
                  scale={[0.085, 0.12, 0.09]}
                  color={hair}
                />
              </group>
            ))}
          </>
        )}
        <SoftPart
          position={[0, 0, 0]}
          scale={[0.235, 0.255, 0.215]}
          color={skin}
        />
        <SoftPart
          position={[0, 0.13, -0.045]}
          scale={[0.247, 0.15, 0.2]}
          color={hair}
        />
        {[-1, 1].map((side) => (
          <group key={side}>
            <SoftPart
              position={[side * 0.23, -0.02, 0]}
              scale={[0.045, 0.065, 0.04]}
              color={skin}
            />
            <SoftPart
              position={[side * 0.086, 0.006, 0.196]}
              scale={[girl ? 0.037 : 0.027, girl ? 0.051 : 0.034, 0.014]}
              color="#382b34"
            />
            <SoftPart
              position={[side * 0.077, 0.025, 0.209]}
              scale={[0.011, 0.014, 0.006]}
              color="#fff9ee"
            />
            {girl && (
              <SoftPart
                position={[side * 0.145, -0.063, 0.177]}
                scale={[0.043, 0.017, 0.009]}
                color="#e7a0ad"
              />
            )}
            <SoftPart
              position={[side * 0.08, 0.088, 0.19]}
              scale={[0.047, 0.009, 0.008]}
              color={hair}
            />
          </group>
        ))}
        <SoftPart
          position={[0, -0.046, 0.212]}
          scale={[0.018, 0.02, 0.016]}
          color={skin}
        />
        <mesh position={[0, -0.11, 0.19]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.027, 0.005, 6, 16, Math.PI]} />
          <meshStandardMaterial color="#a95c70" />
        </mesh>
        {girl && (
          <>
            {[-0.14, -0.06, 0.04, 0.13].map((x, i) => (
              <SoftPart
                key={i}
                position={[x, 0.14 - i * 0.01, 0.135]}
                scale={[0.065, 0.11, 0.075]}
                color={hair}
              />
            ))}
            <group
              position={[-0.2, 0.22, 0.09]}
              rotation={[0, 0, 0.35]}
              scale={1.05}
            >
              <Bow />
            </group>
          </>
        )}
      </group>
    </group>
  );
}
