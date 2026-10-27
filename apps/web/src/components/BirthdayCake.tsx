import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  Color,
  ExtrudeGeometry,
  Group,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  PointLight,
  Shape,
} from "three";
import { BIRTHDAY_CAKE_POSITION, BIRTHDAY_STAGE } from "@museum/shared";
import { useGameStore } from "../store/gameStore";

export function birthdayElapsed() {
  const game = useGameStore.getState();
  return Math.max(
    0,
    (Date.now() + game.serverClockOffset - game.birthdayStartedAt) / 1000,
  );
}
const smooth = (value: number) => {
  const t = MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};
const candles = [
  [-0.2, 0.08],
  [0.2, 0.08],
  [-0.23, -0.16],
  [0, -0.22],
  [0.23, -0.16],
] as const;

function Candle({ x, z, index }: { x: number; z: number; index: number }) {
  const flame = useRef<Group>(null);
  const smoke = useRef<Mesh>(null);
  useFrame(({ clock }) => {
    const stage = useGameStore.getState().birthdayStage,
      t = birthdayElapsed();
    const ignition = smooth((t - index * 0.16) / 0.35);
    const extinguish = 1 - smooth((t - index * 0.12) / 0.42);
    const amount =
      stage === BIRTHDAY_STAGE.candlesLit
        ? ignition
        : stage === BIRTHDAY_STAGE.candlesBlown
          ? extinguish
          : 0;
    if (flame.current) {
      flame.current.visible = amount > 0.001;
      const flutter = Math.sin(clock.elapsedTime * 17 + index * 2) * 0.12;
      flame.current.scale.setScalar(amount);
      flame.current.scale.y = amount * (1.45 + flutter);
      flame.current.rotation.z =
        stage === 2 ? -0.9 * (1 - extinguish) : flutter * 0.5;
    }
    if (smoke.current) {
      const age = t - index * 0.12;
      smoke.current.visible = stage === 2 && age > 0.2 && age < 1.8;
      smoke.current.position.set(
        x + Math.sin(age * 2 + index) * 0.045,
        1.65 + age * 0.25,
        z + age * 0.06,
      );
      smoke.current.scale.set(
        0.025 + age * 0.045,
        0.07 + age * 0.09,
        0.025 + age * 0.04,
      );
      (smoke.current.material as MeshBasicMaterial).opacity =
        0.25 * (1 - smooth(age / 1.8));
    }
  });
  return (
    <>
      <group position={[x, 1.48, z]}>
        <mesh castShadow>
          <cylinderGeometry args={[0.013, 0.015, 0.2, 10]} />
          <meshStandardMaterial color="#e7b9c6" roughness={0.45} />
        </mesh>
        <mesh position={[0, 0.11, 0]}>
          <cylinderGeometry args={[0.003, 0.003, 0.035, 6]} />
          <meshStandardMaterial color="#342820" />
        </mesh>
        <group ref={flame} position={[0, 0.14, 0]}>
          <mesh>
            <sphereGeometry args={[0.024, 12, 10]} />
            <meshBasicMaterial color="#ffaf3f" toneMapped={false} />
          </mesh>
          <mesh position={[0, -0.005, 0.001]} scale={0.55}>
            <sphereGeometry args={[0.025, 10, 8]} />
            <meshBasicMaterial color="#fff2bf" toneMapped={false} />
          </mesh>
        </group>
      </group>
      <mesh ref={smoke}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshBasicMaterial
          color="#d3cfc9"
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>
    </>
  );
}

function CakeSlice({
  index,
  geometry,
}: {
  index: number;
  geometry: ExtrudeGeometry;
}) {
  const ref = useRef<Group>(null);
  const angle = (index * Math.PI) / 5,
    mid = angle + Math.PI / 10;
  useFrame(() => {
    if (!ref.current) return;
    const stage = useGameStore.getState().birthdayStage,
      t = birthdayElapsed();
    const cut = stage >= 3 ? smooth((t - 0.9) / 1.4) : 0;
    const served = stage === 4 ? smooth((t - index * 0.19) / 2) : 0;
    const spread = stage === 4 ? 0.035 + served * 0.84 : cut * 0.035;
    ref.current.position.set(
      Math.sin(mid) * spread,
      1.065 + Math.sin(served * Math.PI) * 0.3 - served * 0.025,
      Math.cos(mid) * spread,
    );
    ref.current.scale.setScalar(1 - served * 0.2);
  });
  return (
    <group ref={ref} rotation={[0, angle, 0]}>
      <mesh geometry={geometry} scale={[1, 0.13, 1]} castShadow receiveShadow>
        <meshStandardMaterial color="#d9a06d" roughness={0.9} />
      </mesh>
      <mesh geometry={geometry} position={[0, 0.13, 0]} scale={[1, 0.035, 1]}>
        <meshStandardMaterial color="#b5677f" roughness={0.65} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[0, 0.165, 0]}
        scale={[1, 0.115, 1]}
        castShadow
      >
        <meshStandardMaterial color="#e5b783" roughness={0.85} />
      </mesh>
      <mesh
        geometry={geometry}
        position={[0, 0.28, 0]}
        scale={[1.015, 0.045, 1.015]}
        castShadow
      >
        <meshStandardMaterial color="#fff0e6" roughness={0.5} />
      </mesh>
      <mesh
        position={[
          Math.sin(Math.PI / 10) * 0.34,
          0.34,
          Math.cos(Math.PI / 10) * 0.34,
        ]}
        scale={[1, 0.65, 1]}
      >
        <sphereGeometry args={[0.035, 12, 8]} />
        <meshStandardMaterial color="#f1c1cd" roughness={0.55} />
      </mesh>
    </group>
  );
}

function Confetti() {
  const ref = useRef<InstancedMesh>(null);
  const dummy = useMemo(() => new Object3D(), []);
  useEffect(() => {
    const colors = ["#c99c57", "#df94a7", "#f9e5bd", "#93ac9b"];
    for (let i = 0; i < 100; i++)
      ref.current?.setColorAt(i, new Color(colors[i % 4]));
    if (ref.current?.instanceColor)
      ref.current.instanceColor.needsUpdate = true;
  }, []);
  useFrame(() => {
    if (!ref.current) return;
    const t = birthdayElapsed(),
      stage = useGameStore.getState().birthdayStage;
    ref.current.visible = stage === 4 && t < 5.2;
    if (!ref.current.visible) return;
    for (let i = 0; i < 100; i++) {
      const a = i * 2.399,
        age = Math.max(0, t - (i % 7) * 0.06);
      const radius = 0.2 + age * (0.45 + (i % 5) * 0.13);
      dummy.position.set(
        Math.sin(a) * radius,
        2.5 + age * 1.2 - age * age * 0.5 + (i % 9) * 0.09,
        Math.cos(a) * radius,
      );
      dummy.rotation.set(age * 3 + i, age * 2, age + i);
      dummy.scale.setScalar(dummy.position.y > 0.08 ? 1 - smooth(t - 4.2) : 0);
      dummy.updateMatrix();
      ref.current.setMatrixAt(i, dummy.matrix);
    }
    ref.current.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh
      ref={ref}
      args={[undefined, undefined, 100]}
      frustumCulled={false}
    >
      <planeGeometry args={[0.055, 0.025]} />
      <meshStandardMaterial side={2} roughness={0.5} />
    </instancedMesh>
  );
}

export function BirthdayCake() {
  const knife = useRef<Group>(null),
    candleGroup = useRef<Group>(null),
    light = useRef<PointLight>(null);
  const geometry = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    for (let i = 0; i <= 16; i++) {
      const a = ((i / 16) * Math.PI) / 5;
      shape.lineTo(Math.sin(a) * 0.42, -Math.cos(a) * 0.42);
    }
    shape.closePath();
    const geometry = new ExtrudeGeometry(shape, {
      depth: 1,
      bevelEnabled: false,
      steps: 1,
    });
    geometry.rotateX(-Math.PI / 2);
    return geometry;
  }, []);
  useEffect(() => () => geometry.dispose(), [geometry]);
  useFrame(() => {
    const stage = useGameStore.getState().birthdayStage,
      t = birthdayElapsed();
    if (candleGroup.current) {
      const remove = stage >= 3 ? (stage === 3 ? smooth(t / 0.6) : 1) : 0;
      candleGroup.current.position.y = remove * 0.35;
      candleGroup.current.scale.setScalar(1 - remove);
    }
    if (light.current)
      light.current.intensity =
        stage === 1
          ? smooth(t / 0.9) * 1.5
          : stage === 2
            ? (1 - smooth(t / 0.7)) * 1.5
            : 0;
    if (knife.current) {
      // Lift, carry across the cake, cut through, then return to the tabletop.
      const active = stage === 3 && t < 3.2;
      const lift = active
        ? smooth(t / 0.55) * (1 - smooth((t - 2.5) / 0.7))
        : 0;
      const chop = active
        ? smooth((t - 0.9) / 0.6) * (1 - smooth((t - 1.7) / 0.55))
        : 0;
      knife.current.position.set(
        0.78 * (1 - lift),
        1.07 + lift * 0.68 - chop * 0.44,
        0.15 * (1 - lift),
      );
      knife.current.rotation.set(0, 0.15 * (1 - lift), -lift * 0.08);
    }
  });
  return (
    <group position={[...BIRTHDAY_CAKE_POSITION]}>
      <mesh position={[0, 0.48, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.25, 0.4, 0.94, 32]} />
        <meshStandardMaterial color="#655044" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.99, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.2, 1.2, 0.08, 64]} />
        <meshStandardMaterial color="#c5a57c" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.95, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.17, 0.015, 8, 64]} />
        <meshStandardMaterial
          color="#b18b57"
          metalness={0.7}
          roughness={0.25}
        />
      </mesh>
      <mesh position={[0, 1.045, 0]} receiveShadow>
        <cylinderGeometry args={[0.48, 0.48, 0.025, 48]} />
        <meshStandardMaterial color="#f8eee0" roughness={0.25} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <CakeSlice key={i} index={i} geometry={geometry} />
      ))}
      <group ref={candleGroup}>
        {candles.map(([x, z], i) => (
          <Candle key={i} x={x} z={z} index={i} />
        ))}
      </group>
      <pointLight
        ref={light}
        position={[0, 1.8, 0]}
        color="#ffc379"
        intensity={0}
        distance={4}
        decay={2}
      />
      <group ref={knife}>
        <mesh castShadow>
          <boxGeometry args={[0.025, 0.08, 0.46]} />
          <meshStandardMaterial
            color="#e1e2e3"
            metalness={0.95}
            roughness={0.17}
          />
        </mesh>
        <mesh position={[0, 0, 0.32]} castShadow>
          <boxGeometry args={[0.04, 0.055, 0.2]} />
          <meshStandardMaterial color="#5b3730" roughness={0.4} />
        </mesh>
      </group>
      {Array.from({ length: 10 }, (_, i) => {
        const a = (i * Math.PI) / 5 + Math.PI / 10;
        return (
          <mesh
            key={i}
            position={[Math.sin(a) * 0.94, 1.045, Math.cos(a) * 0.94]}
            receiveShadow
          >
            <cylinderGeometry args={[0.19, 0.17, 0.025, 32]} />
            <meshStandardMaterial color="#f4eee6" roughness={0.25} />
          </mesh>
        );
      })}
      <Confetti />
    </group>
  );
}
