import { CuboidCollider, RigidBody } from "@react-three/rapier";
import { Environment, Sky, Instances, Instance } from "@react-three/drei";
import { Architecture, Block } from "../world/Architecture";
import { BackSide } from "three";
import {
  benches,
  galleryFurnishings,
  museumPoint,
  flowerPositions,
  obstacles,
  planters,
  rooms,
  walls,
  type Point3,
} from "@museum/shared";
import { exhibits } from "../config/exhibits";
import { useGameStore } from "../store/gameStore";
import { Label } from "../world/Label";
import { materials } from "../world/materials";
import { GardenLandscape } from "./GardenLandscape";
import { ExhibitFrame } from "./ExhibitFrame";
import { PinkDecor, ExteriorDetails } from "./PinkDecor";
import { BirthdayCake } from "./BirthdayCake";
import { RoomFurnishings } from "./RoomFurnishings";
function Bench({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <Block position={[0, 0.48, 0]} size={[3.6, 0.22, 1.1]} material="wood" />
      {z >= 10 && <Block position={[0, 0.64, 0]} size={[3.25, 0.14, 0.9]} color="#b8aa9c" />}
      {[-1.3, 1.3].map((x) => (
        <Block
          key={x}
          position={[x, 0.23, 0]}
          size={[0.14, 0.46, 0.85]}
          material="brass"
        />
      ))}
    </group>
  );
}
function Plant({
  x,
  z,
  tall = false,
}: {
  x: number;
  z: number;
  tall?: boolean;
}) {
  return (
    <group position={[x, 0, z]}>
      <mesh castShadow material={materials().stone} position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.58, 0.4, 1.1, 20]} />
      </mesh>
      <mesh material={materials().wood} position={[0, tall ? 2.6 : 1.5, 0]}>
        <cylinderGeometry args={[0.045, 0.095, tall ? 3.4 : 1.8, 8]} />
      </mesh>
      <Instances frames={2} limit={52} material={materials().leaf} castShadow>
        <sphereGeometry args={[1, 8, 5]} />
        {Array.from({ length: tall ? 26 : 16 }, (_, i) => {
          const a = i * 2.399;
          const radius = tall ? 1.25 : 0.6;
          const x = Math.cos(a) * radius * (0.4 + (i % 4) * 0.18),
            y = (tall ? 3.3 : 1.5) + (i % 7) * 0.17,
            z = Math.sin(a) * radius * (0.4 + (i % 4) * 0.18);
          return [
            <Instance
              key={`${i}-a`}
              position={[x, y, z]}
              rotation={[Math.sin(a) * 0.5, a, 0.25]}
              scale={[tall ? 0.65 : 0.38, 0.075, tall ? 0.4 : 0.19]}
            />,
            <Instance
              key={`${i}-b`}
              position={[x + 0.16, y + 0.15, z + 0.2]}
              rotation={[0.3, a + 0.7, 0.5]}
              scale={[tall ? 0.5 : 0.28, 0.06, tall ? 0.3 : 0.14]}
            />,
          ];
        })}
      </Instances>
    </group>
  );
}
function Flowers({ position }: { position: Point3 }) {
  return (
    <group position={position}>
      <mesh material={materials().brass} position={[0, 0.35, 0]}>
        <cylinderGeometry args={[0.22, 0.3, 0.7, 16]} />
      </mesh>
      <Instances frames={2} limit={9} material={materials().leaf}>
        <cylinderGeometry args={[0.012, 0.012, 0.5, 5]} />
        {Array.from({ length: 9 }, (_, i) => (
          <Instance
            key={i}
            position={[
              Math.sin(i * 2.4) * 0.3,
              0.55 + (i % 3) * 0.12,
              Math.cos(i * 2.4) * 0.3,
            ]}
          />
        ))}
      </Instances>
      <Instances frames={2} limit={45}>
        <sphereGeometry args={[1, 7, 5]} />
        <meshStandardMaterial roughness={0.8} />
        {Array.from({ length: 45 }, (_, k) => {
          const i = Math.floor(k / 5),
            j = k % 5;
          return (
            <Instance
              key={k}
              color={i % 2 ? "#efd4bf" : "#b9787b"}
              position={[
                Math.sin(i * 2.4) * 0.3 + Math.sin(j * 1.26) * 0.09,
                0.8 + (i % 3) * 0.12,
                Math.cos(i * 2.4) * 0.3 + Math.cos(j * 1.26) * 0.09,
              ]}
              scale={[0.12, 0.06, 0.12]}
              rotation={[j * 0.3, 0, j]}
            />
          );
        })}
      </Instances>
    </group>
  );
}

export function GalleryEnvironment() {
  const quality = useGameStore((s) => s.quality);
  return (
    <Architecture>
      <color attach="background" args={["#dfe6e1"]} />
      <fog attach="fog" args={["#dfe6e1", 45, 125]} />
      <Sky sunPosition={[-70, 22, 45]} turbidity={3.5} rayleigh={0.7} />
      <hemisphereLight args={["#e8eee7", "#7e806c", 0.85]} />
      <ambientLight intensity={0.16} />
      <directionalLight
        position={[-25, 28, 22]}
        intensity={2.1}
        color="#ffe5c5"
        castShadow={quality !== "low"}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-38}
        shadow-camera-right={38}
        shadow-camera-top={40}
        shadow-camera-bottom={-40}
        shadow-camera-far={110}
        shadow-normalBias={0.06}
      />
      <Environment resolution={64} frames={1} environmentIntensity={0.55}>
        <mesh scale={100}>
          <sphereGeometry args={[1, 16, 12]} />
          <meshBasicMaterial color="#d9d0bc" side={BackSide} />
        </mesh>
        <mesh position={[0, 25, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[60, 80]} />
          <meshBasicMaterial color="#fff0d5" side={2} />
        </mesh>
      </Environment>
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[35, 0.1, 45]} position={[0, -0.12, -9]} />
        {obstacles.map((b) => (
          <CuboidCollider
            key={b.id}
            position={b.position}
            args={[b.size[0] / 2, b.size[1] / 2, b.size[2] / 2]}
          />
        ))}
        {[
          [0, -54, 70, 0.4],
          [0, 36, 70, 0.4],
          [-35, -9, 0.4, 90],
          [35, -9, 0.4, 90],
        ].map(([x, z, w, d], i) => (
          <CuboidCollider
            key={i}
            args={[w! / 2, 2, d! / 2]}
            position={[x!, 2, z!]}
          />
        ))}
      </RigidBody>
      <Block position={[0, -0.22, -9]} size={[150, 0.3, 160]} color="#a5ac90" />
      <Block position={[0, -0.08, -9]} size={[69, 0.12, 88]} color="#c8c2b7" />
      <GardenLandscape />
      {Array.from({ length: 8 }, (_, i) => (
        <Block
          key={i}
          position={[0, -0.005, 12 + i * 3]}
          size={[5.2, 0.08, 2.92]}
          material="stone"
        />
      ))}
      {rooms
        .filter((r) => r.id !== "plaza")
        .map((r) => {
          const [left, right, back, front] = r.bounds;
          const cx = (left + right) / 2,
            cz = (back + front) / 2;
          return (
            <group key={r.id}>
              <Block
                position={[cx, 0, cz]}
                size={[right - left, 0.04, front - back]}
                material={r.id === "lobby" ? "stone" : "wood"}
              />
              {[-1, 1].map((side) => (
                <Block
                  key={side}
                  position={[cx + side * ((right - left) / 4 + 0.5), 4.72, cz]}
                  size={[(right - left) / 2 - 1, 0.2, front - back + 0.2]}
                  material="plaster"
                />
              ))}
              {/* A glazed ceiling strip catches the sky without exposing the whole room. */}
              <Block
                position={[cx, 4.72, cz]}
                size={[2, 0.035, front - back + 0.2]}
                material="glass"
              />
              {r.id !== "lobby" && (
                <>
                  <Block
                    position={[cx, 4.25, cz]}
                    size={[9, 0.08, 0.1]}
                    material="brass"
                  />
                  <pointLight
                    position={[cx, 3.8, cz]}
                    color={r.id === "birthday" ? "#ffd1ab" : "#ffe5c2"}
                    intensity={quality === "low" ? 22 : 32}
                    distance={15}
                    decay={2}
                  />
                  {[-3, 0, 3].map((dx) => (
                    <mesh key={dx} position={[cx + dx, 4.15, cz]}>
                      <cylinderGeometry args={[0.1, 0.1, 0.2, 12]} />
                      <meshStandardMaterial
                        color="#aa8754"
                        metalness={0.6}
                        roughness={0.3}
                      />
                    </mesh>
                  ))}
                </>
              )}
            </group>
          );
        })}
      {walls.map((b) => (
        <group key={b.id}>
          <Block position={b.position} size={b.size} material={b.material} />
          {b.material === "plaster" && b.size[1] > 4 && (
            <>
              <Block
                position={[b.position[0], 0.12, b.position[2]]}
                size={[b.size[0] + 0.05, 0.24, b.size[2] + 0.05]}
                material="wood"
              />
              <Block
                position={[b.position[0], 4.4, b.position[2]]}
                size={[b.size[0] + 0.08, 0.12, b.size[2] + 0.08]}
                material="stone"
              />
            </>
          )}
        </group>
      ))}
      <Block
        position={museumPoint([0, 2.25, -17.8])}
        size={[16.3, 4.3, 0.025]}
        color="#e6dfd3"
      />
      <Block
        position={museumPoint([0, 4.9, 10.7])}
        size={[12, 0.22, 3.5]}
        material="stone"
      />
      <Label
        text="MUSEUM OF US"
        position={museumPoint([0, 4.05, 10.25])}
        width={5}
        height={0.5}
        serif
      />
      <Label
        text="FOR YOUR BIRTHDAY, SHUBHANGI"
        position={museumPoint([0, 3.55, 10.26])}
        width={3.4}
        height={0.18}
      />
      <Label
        text="01 · OUR STORY"
        position={museumPoint([-2.8, 3.8, 3])}
        rotation={Math.PI / 2}
        width={3.5}
        height={0.25}
      />
      <Label
        text="02 · THE GIRL BEHIND IT ALL"
        position={museumPoint([2.8, 3.8, 3])}
        rotation={-Math.PI / 2}
        width={3.5}
        height={0.25}
      />
      <Label
        text="03 · SHUBHANGI’S BIRTHDAY"
        position={museumPoint([0, 3.8, -3.8])}
        width={3.5}
        height={0.25}
      />
      <Label
        text="Our Story"
        position={museumPoint([-10, 3.7, -3.76])}
        width={6}
        height={0.45}
        serif
      />
      <Label
        text="The Girl Behind It All"
        position={museumPoint([10, 3.8, -3.76])}
        width={6.5}
        height={0.4}
        serif
      />
      <Label
        text="Happy birthday, Shubhangi"
        position={[0, 3.35, -21.15]}
        width={6}
        height={0.48}
        serif
        color="#705347"
      />
      <Label
        text="I’M SO GLAD I GET TO LOVE YOU."
        position={[0, 2.9, -21.14]}
        width={4.5}
        height={0.2}
      />
      {benches.map(([x, z]) => (
        <Bench key={x + ":" + z} x={x} z={z} />
      ))}
      <RoomFurnishings />
      {galleryFurnishings.filter((item) => item.id.endsWith("plant")).map((item) => (
        <group key={item.id} position={[item.position[0], 0, item.position[2]]} scale={0.6}>
          <Plant x={0} z={0} />
        </group>
      ))}
      {planters.map(([x, z]) => (
        <Plant key={x + ":" + z} x={x} z={z} tall={Math.abs(x) > 27} />
      ))}
      {exhibits.map((e) => (
        <ExhibitFrame key={e.id} exhibit={e} />
      ))}
      <BirthdayCake />
      <PinkDecor />
      <ExteriorDetails />
      {flowerPositions.map((p) => (
        <Flowers key={p.join()} position={p} />
      ))}
      <Block position={[-13, 0.16, 28]} size={[15, 0.32, 8]} />
      <mesh position={[-13, 0.33, 28]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[14.5, 7.5]} />
        <meshStandardMaterial
          color="#46625d"
          metalness={0.68}
          roughness={0.14}
        />
      </mesh>
      {[14, 22, 31].flatMap((z) =>
        [-1, 1].map((side) => (
          <group key={side + ":" + z} position={[side * 25, 0, z]}>
            <Block position={[0, 0.2, 0]} size={[6, 0.4, 5]} color="#8b9c7d" />
            <Plant x={0} z={0} tall />
          </group>
        )),
      )}
    </Architecture>
  );
}
