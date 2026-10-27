import { Instance, Instances } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import type { Group } from "three";
import { Block } from "../world/Architecture";
import { Label } from "../world/Label";
import { Bow } from "./CuteCharacter";

function Puff({
  position,
  scale,
  color = "#fff6ef",
}: {
  position: [number, number, number];
  scale: [number, number, number];
  color?: string;
}) {
  return (
    <mesh position={position} scale={scale} castShadow>
      <sphereGeometry args={[1, 20, 14]} />
      <meshStandardMaterial color={color} roughness={0.58} />
    </mesh>
  );
}
/** Small fan-art keepsake: white face, yellow nose, whiskers and a pink bow. */
export function KittyKeepsake() {
  return (
    <group>
      <Puff position={[0, 0.43, 0]} scale={[0.3, 0.35, 0.22]} color="#e994b5" />
      <Puff position={[0, 0.83, 0.02]} scale={[0.43, 0.34, 0.27]} />
      {[-1, 1].map((side) => (
        <group key={side}>
          <mesh
            position={[side * 0.29, 1.08, 0.015]}
            rotation={[0, 0, side * -0.3]}
            castShadow
          >
            <coneGeometry args={[0.145, 0.27, 3]} />
            <meshStandardMaterial color="#fff6ef" />
          </mesh>
          <Puff
            position={[side * 0.16, 0.83, 0.277]}
            scale={[0.025, 0.04, 0.012]}
            color="#372c35"
          />
          <Puff position={[side * 0.19, 0.14, 0.08]} scale={[0.14, 0.1, 0.2]} />
          <Puff position={[side * 0.31, 0.47, 0.04]} scale={[0.1, 0.18, 0.1]} />
          {[-1, 0, 1].map((i) => (
            <mesh
              key={i}
              position={[side * 0.36, 0.79 + i * 0.075, 0.225]}
              rotation={[0, 0, side * i * 0.16]}
            >
              <boxGeometry args={[0.16, 0.011, 0.008]} />
              <meshStandardMaterial color="#4b3940" />
            </mesh>
          ))}
        </group>
      ))}
      <Puff
        position={[0, 0.76, 0.292]}
        scale={[0.04, 0.027, 0.012]}
        color="#e6bd51"
      />
      <group
        position={[-0.29, 1.02, 0.25]}
        rotation={[0, 0, 0.15]}
        scale={1.35}
      >
        <Bow color="#e57ca6" />
      </group>
    </group>
  );
}
function Gift({
  x,
  z,
  size,
  color,
}: {
  x: number;
  z: number;
  size: number;
  color: string;
}) {
  return (
    <group position={[x, 0.82, z]}>
      <Block
        position={[0, size / 2, 0]}
        size={[size, size, size]}
        color={color}
      />
      <Block
        position={[0, size + 0.025, 0]}
        size={[size + 0.06, 0.07, size + 0.06]}
        color={color}
      />
      <Block
        position={[0, size / 2, 0.005]}
        size={[0.07, size + 0.1, size + 0.08]}
        color="#fff3e5"
      />
      <Block
        position={[0, size / 2, 0]}
        size={[size + 0.08, size + 0.1, 0.07]}
        color="#fff3e5"
      />
      <group position={[0, size + 0.12, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <Bow color="#f9e8dc" />
      </group>
    </group>
  );
}
function BalloonCluster({
  x,
  z,
  offset = 0,
}: {
  x: number;
  z: number;
  offset?: number;
}) {
  const ref = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (ref.current)
      ref.current.rotation.z =
        Math.sin(clock.elapsedTime * 0.7 + offset) * 0.028;
  });
  return (
    <group ref={ref} position={[x, 0, z]}>
      {[0, 1, 2, 3, 4].map((i) => (
        <group
          key={i}
          position={[
            Math.sin(i * 2.4) * 0.4,
            2.55 + (i % 3) * 0.28,
            Math.cos(i * 2.4) * 0.25,
          ]}
        >
          <mesh scale={[0.27, 0.34, 0.27]} castShadow>
            <sphereGeometry args={[1, 20, 14]} />
            <meshStandardMaterial
              color={["#cb879f", "#f4eee4", "#c5a66d", "#95a08c"][i % 4]}
              metalness={i === 2 ? 0.55 : 0.05}
              roughness={0.28}
            />
          </mesh>
          <mesh position={[0, -1.1, 0]}>
            <cylinderGeometry args={[0.003, 0.003, 1.7, 4]} />
            <meshStandardMaterial color="#f5e2d8" />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 0.08, 0]}>
        <sphereGeometry args={[0.13, 12, 8]} />
        <meshStandardMaterial color="#cfa26d" metalness={0.5} roughness={0.3} />
      </mesh>
    </group>
  );
}
export function PinkDecor() {
  return (
    <group>
      {/* A rug anchors the gathering area without adding collision obstacles. */}
      <mesh position={[0, 0.045, -15.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.5, 64]} />
        <meshStandardMaterial color="#cdb6ae" roughness={1} />
      </mesh>
      <mesh position={[0, 0.05, -15.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.35, 3.4, 64]} />
        <meshStandardMaterial color="#e0b77f" roughness={0.6} />
      </mesh>
      <Instances frames={2} limit={64} castShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial roughness={0.3} metalness={0.12} />
        {Array.from({ length: 48 }, (_, i) => {
          const a = (i / 47) * Math.PI;
          return (
            <Instance
              key={i}
              position={[
                Math.cos(a) * 3.4,
                1.6 + Math.sin(a) * 2.5,
                -21.7 + (i % 2) * 0.2,
              ]}
              scale={[0.28 + (i % 3) * 0.045, 0.32 + (i % 3) * 0.045, 0.3]}
              color={["#c987a0", "#ebe4da", "#f7f2e9", "#b89e6d"][i % 4]}
            />
          );
        })}
        {Array.from({ length: 12 }, (_, i) => (
          <Instance
            key={"leg-" + i}
            position={[
              (i % 2 ? 1 : -1) * 3.4,
              0.25 + Math.floor(i / 2) * 0.24,
              -21.7,
            ]}
            scale={[0.3, 0.3, 0.3]}
            color={i % 3 ? "#e9e1d7" : "#b4bea9"}
          />
        ))}
      </Instances>
      <Block
        position={[0, 3.13, -21.32]}
        size={[6.2, 1, 0.06]}
        color="#e8ded7"
      />
      <Block
        position={[0, 0.55, -21.5]}
        size={[1.5, 1.1, 1.2]}
        color="#d8cfc4"
      />
      <group position={[0, 1.1, -21.5]}>
        <KittyKeepsake />
      </group>
      <Label
        text="For you, Shubhangi"
        position={[0, 0.65, -20.88]}
        width={1.35}
        height={0.16}
        serif
        color="#96566f"
      />
      <BalloonCluster x={-7} z={-10} />
      <BalloonCluster x={7} z={-10} offset={2} />
      <Block
        position={[-6, 0.49, -14]}
        size={[2.6, 0.98, 1.2]}
        color="#bfae9f"
      />
      <Block
        position={[-6, 1.02, -14]}
        size={[2.7, 0.08, 1.3]}
        color="#fff0e7"
      />
      <Label
        text="HELP YOURSELF"
        position={[-6, 0.65, -13.38]}
        width={2}
        height={0.18}
        color="#925169"
      />
      {Array.from({ length: 9 }, (_, i) => (
        <group
          key={i}
          position={[
            -6.8 + (i % 3) * 0.8,
            1.13,
            -14.3 + Math.floor(i / 3) * 0.3,
          ]}
        >
          <mesh>
            <cylinderGeometry args={[0.09, 0.07, 0.14, 12]} />
            <meshStandardMaterial color="#c9a478" />
          </mesh>
          <Puff
            position={[0, 0.1, 0]}
            scale={[0.105, 0.085, 0.105]}
            color={i % 2 ? "#f5b9d2" : "#fff3e8"}
          />
          <Puff
            position={[0, 0.18, 0]}
            scale={[0.025, 0.025, 0.025]}
            color="#bb4e79"
          />
        </group>
      ))}
      <Block position={[6, 0.4, -14]} size={[2.5, 0.8, 1.6]} color="#b8aa9b" />
      <Gift x={5.3} z={-14} size={0.6} color="#c8899f" />
      <Gift x={6.2} z={-14.3} size={0.8} color="#d9d4c8" />
      <Gift x={6.8} z={-13.8} size={0.4} color="#d9b783" />
      <Label
        text="FOR SHUBHANGI"
        position={[6, 0.45, -13.18]}
        width={2}
        height={0.18}
        color="#925169"
      />
      {[-5.8, 5.8].map((x) => (
        <group key={x} position={[x, 0, -19]}>
          <Block position={[0, 0.4, 0]} size={[3, 0.8, 1.1]} color="#b4aa9e" />
          <Block
            position={[0, 0.97, -0.4]}
            size={[3, 0.6, 0.25]}
            color="#cbc1b5"
          />
          {[-1.25, 1.25].map((side) => (
            <Block
              key={side}
              position={[side, 0.75, 0]}
              size={[0.35, 0.7, 1.1]}
              color="#b4aa9e"
            />
          ))}
          <Puff
            position={[-0.65, 0.91, -0.1]}
            scale={[0.3, 0.28, 0.12]}
            color="#fff0e6"
          />
          <Puff
            position={[0.65, 0.91, -0.1]}
            scale={[0.3, 0.28, 0.12]}
            color="#c77b9a"
          />
        </group>
      ))}
      {/* Draped lights are emissive geometry instead of dozens of costly lights. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Instances frames={2} limit={18}>
            <sphereGeometry args={[0.045, 8, 6]} />
            <meshBasicMaterial color="#fff0bd" />
            {Array.from({ length: 18 }, (_, i) => (
              <Instance
                key={i}
                position={[
                  side * (0.4 + i * 0.43),
                  4.3 - Math.sin((i / 17) * Math.PI) * 0.4,
                  -17.5,
                ]}
              />
            ))}
          </Instances>
        </group>
      ))}
    </group>
  );
}
export function ExteriorDetails() {
  return (
    <group>
      <Instances frames={2} limit={320} castShadow>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial roughness={0.8} />
        {Array.from({ length: 320 }, (_, i) => {
          const front = i < 200,
            side = i % 2 ? 1 : -1;
          const x = front
            ? side * (5.5 + (Math.floor(i / 2) % 25) * 0.53)
            : 14 + Math.sin(i * 2.399) * (3.7 + (i % 4) * 0.2);
          const z = front
            ? 11.1 + Math.sin(i * 2.399) * 0.3
            : 26 + Math.cos(i * 2.399) * (3.7 + (i % 4) * 0.2);
          return (
            <Instance
              key={i}
              position={[x, front ? 0.92 : 0.36, z]}
              scale={[0.18, 0.16, 0.18]}
              color={
                i % 4 === 0
                  ? "#829473"
                  : i % 4 === 1
                    ? "#d394ac"
                    : ["#e9e0d4", "#aeb99f"][i % 2]
              }
            />
          );
        })}
      </Instances>
      {/* Framed facade panels and rose-gold pilasters give the larger building a finished face. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          {[6, 10, 14, 18].map((x) => (
            <group key={x}>
              <Block
                position={[side * x, 2.25, 10.23]}
                size={[2.8, 3.7, 0.06]}
                color="#d7d0c5"
              />
              <Block
                position={[side * x, 2.25, 10.29]}
                size={[2.4, 3.3, 0.04]}
                color="#eee9df"
              />
              <group position={[side * x, 3.6, 10.35]} scale={1.5}>
                <Bow color="#c87d9f" />
              </group>
            </group>
          ))}
          {[4.2, 8, 12, 16, 20.1].map((x) => (
            <Block
              key={x}
              position={[side * x, 2.3, 10.38]}
              size={[0.13, 4.6, 0.18]}
              material="brass"
            />
          ))}
          <Block
            position={[side * 12, 0.5, 11.1]}
            size={[14, 0.6, 1.1]}
            color="#c8bdb0"
          />
        </group>
      ))}
      <Block
        position={[0, 4.78, 10.35]}
        size={[41.2, 0.24, 0.6]}
        color="#e8e1d6"
      />
      {/* Pergola beside the rear garden path. */}
      {[-2.5, 2.5].flatMap((x) =>
        [-32.5, -37.5].map((z) => (
          <Block
            key={x + ":" + z}
            position={[x, 1.6, z]}
            size={[0.18, 3.2, 0.18]}
            color="#d8d0c3"
          />
        )),
      )}
      <Block
        position={[0, 3.25, -35]}
        size={[5.5, 0.15, 5.5]}
        color="#aa927f"
      />
      <Instances frames={2} limit={60}>
        <sphereGeometry args={[1, 12, 8]} />
        <meshStandardMaterial roughness={0.8} />
        {Array.from({ length: 60 }, (_, i) => (
          <Instance
            key={i}
            position={[
              -2.5 + (i % 15) * 0.36,
              3.32 - (Math.floor(i / 15) % 2) * 0.32,
              -32.5 - Math.floor(i / 30) * 5,
            ]}
            scale={[0.2, 0.3 + (i % 3) * 0.12, 0.2]}
            color={i % 3 ? "#c98aa3" : "#94a28b"}
          />
        ))}
      </Instances>
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={i}
          position={[-2.6 + i * 0.74, 3.4, -35]}
          size={[0.12, 0.18, 6]}
          material="wood"
        />
      ))}
      <Label
        text="Sit with me"
        position={[0, 2.8, -32.3]}
        width={3.5}
        height={0.35}
        serif
        color="#a2647b"
      />
      {[-14, 14].map((x) => (
        <group key={x} position={[x, 0, -34]}>
          <Block
            position={[0, 0.48, 0]}
            size={[3.6, 0.96, 1.15]}
            color="#a99f92"
          />
          <Block
            position={[0, 1.1, -0.45]}
            size={[3.6, 0.5, 0.15]}
            color="#c9bfb2"
          />
        </group>
      ))}
      <Block position={[14, 0.45, 26]} size={[3, 0.9, 2]} color="#b3a89b" />
      <Block
        position={[14, 0.93, 26]}
        size={[3.15, 0.1, 2.15]}
        color="#fff0e6"
      />
      <Label
        text="KUSHAL & SHUBHANGI"
        position={[14, 0.48, 27.04]}
        width={2.5}
        height={0.22}
        color="#8f566e"
        serif
      />
      <group position={[14, 1, 26]}>
        <mesh position={[0, 0.2, 0]}>
          <cylinderGeometry args={[0.16, 0.12, 0.4, 16]} />
          <meshStandardMaterial color="#fff0e8" />
        </mesh>
        {Array.from({ length: 7 }, (_, i) => (
          <Puff
            key={i}
            position={[
              Math.sin(i * 2.4) * 0.2,
              0.5 + (i % 2) * 0.1,
              Math.cos(i * 2.4) * 0.2,
            ]}
            scale={[0.12, 0.1, 0.12]}
            color={i % 2 ? "#e6a3c0" : "#f7dce8"}
          />
        ))}
        {[-0.9, 0.9].map((x) => (
          <mesh key={x} position={[x, 0.08, 0.2]}>
            <cylinderGeometry args={[0.1, 0.08, 0.16, 16]} />
            <meshStandardMaterial color="#f4e8de" />
          </mesh>
        ))}
      </group>
      {/* Lily pads and a sculptural fountain finish the reflecting pool. */}
      {Array.from({ length: 9 }, (_, i) => (
        <mesh
          key={i}
          position={[-18 + (i % 3) * 2, 0.35, 26 + Math.floor(i / 3) * 1.7]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <circleGeometry args={[0.35 + (i % 2) * 0.15, 24]} />
          <meshStandardMaterial color="#80957b" />
        </mesh>
      ))}
      <group position={[-10, 0.35, 28]}>
        <mesh position={[0, 0.3, 0]}>
          <cylinderGeometry args={[0.6, 0.75, 0.6, 32]} />
          <meshStandardMaterial color="#eed2d7" roughness={0.35} />
        </mesh>
        <mesh position={[0, 0.75, 0]}>
          <sphereGeometry args={[0.4, 24, 16]} />
          <meshStandardMaterial
            color="#dcabc1"
            metalness={0.35}
            roughness={0.2}
          />
        </mesh>
        <mesh position={[0, 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <torusGeometry args={[1.1, 0.02, 8, 64]} />
          <meshStandardMaterial color="#b1c7be" transparent opacity={0.6} />
        </mesh>
      </group>
      {/* The playable perimeter has a visible garden wall and railings. */}
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            position={[side * 34.8, 0.35, -9]}
            size={[0.3, 0.7, 90]}
            color="#e1c5c8"
          />
          <Block
            position={[side * 34.8, 1.2, -9]}
            size={[0.08, 0.07, 90]}
            material="brass"
          />
          {Array.from({ length: 31 }, (_, i) => (
            <Block
              key={i}
              position={[side * 34.8, 0.85, 35 - i * 2.9]}
              size={[0.07, 1.1, 0.07]}
              material="brass"
            />
          ))}
        </group>
      ))}
      {[-53.8, 35.8].map((z) => (
        <Block
          key={z}
          position={[0, 0.4, z]}
          size={[70, 0.8, 0.3]}
          color="#e1c5c8"
        />
      ))}
      {[-24, 24].flatMap((x) =>
        [-40, -28, -16, -4, 8, 20, 32].map((z) => (
          <group key={x + ":" + z} position={[x, 0, z]}>
            <Block
              position={[0, 0.8, 0]}
              size={[0.08, 1.6, 0.08]}
              material="brass"
            />
            <mesh position={[0, 1.65, 0]}>
              <sphereGeometry args={[0.17, 12, 10]} />
              <meshStandardMaterial
                color="#fff0d5"
                emissive="#ffd6a7"
                emissiveIntensity={0.5}
              />
            </mesh>
          </group>
        )),
      )}
    </group>
  );
}
