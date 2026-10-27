import { Instance, Instances } from "@react-three/drei";
import { Block } from "../world/Architecture";
import { gardenTrees } from "@museum/shared";

const trees = Array.from({ length: 24 }, (_, i) => ({
  x: i < 16 ? (i % 2 ? 1 : -1) * (39 + (i % 3) * 2) : -35 + (i - 16) * 10,
  z: i < 16 ? 36 - Math.floor(i / 2) * 12 : -57,
  height: 5.8 + Math.sin(i * 3) * 1.2,
}));
trees.push(
  ...gardenTrees.map(([x, z], i) => ({ x, z, height: 4.4 + (i % 3) * 0.35 })),
);
/** Deterministic, batched planting outside the walkable footprint. */
export function GardenLandscape() {
  return (
    <group>
      <Block
        position={[0, -0.005, -38.5]}
        size={[68, 0.04, 29]}
        color="#9cae94"
      />
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            position={[side * 28, 0.005, -13]}
            size={[12, 0.05, 45]}
            color="#9cae94"
          />
          <Block
            position={[side * 24, 0.035, -16]}
            size={[3.5, 0.05, 55]}
            color="#f1e2df"
          />
          <Block
            position={[side * 31, 0.09, -14]}
            size={[2, 0.2, 56]}
            color="#839377"
          />
          <Block
            position={[side * 14, 0.025, -29]}
            size={[12, 0.05, 6]}
            color="#e0d1cd"
          />
        </group>
      ))}
      <Block position={[0, 0.025, -35]} size={[51, 0.05, 3]} color="#f1e2df" />
      <Block position={[0, 0.03, -40]} size={[3.2, 0.06, 22]} color="#f1e2df" />
      <Block position={[14, 0.015, 26]} size={[12, 0.04, 12]} color="#f2dedf" />
      <Instances frames={2} limit={240}>
        <sphereGeometry args={[1, 8, 6]} />
        <meshStandardMaterial roughness={0.9} />
        {Array.from({ length: 240 }, (_, i) => (
          <Instance
            key={i}
            position={[
              (i % 2 ? 1 : -1) * (30.7 + (i % 5) * 0.12),
              0.42 + (i % 3) * 0.1,
              10 - Math.floor(i / 2) * 0.48,
            ]}
            scale={[0.22, 0.18, 0.23]}
            color={["#edaac6", "#f4d4e2", "#c57c9d"][i % 3]}
          />
        ))}
      </Instances>
      <Instances frames={2} limit={48} castShadow>
        <cylinderGeometry args={[0.13, 0.26, 1, 7]} />
        <meshStandardMaterial color="#655544" roughness={1} />
        {trees.map((tree, i) => (
          <Instance
            key={i}
            position={[tree.x, tree.height / 2, tree.z]}
            scale={[1, tree.height, 1]}
          />
        ))}
      </Instances>
      <Instances frames={2} limit={720} castShadow receiveShadow>
        <sphereGeometry args={[1, 16, 12]} />
        <meshStandardMaterial roughness={0.95} />
        {trees.flatMap((tree, i) =>
          Array.from({ length: 15 }, (_, j) => {
            const a = j * 2.399,
              r = Math.sqrt(j / 15) * 2.6;
            return (
              <Instance
                key={`${i}-${j}`}
                color={["#e4a9c2", "#f3c7d9", "#cd8aab"][j % 3]}
                position={[
                  tree.x + Math.cos(a) * r,
                  tree.height + 0.6 + Math.sin(j * 1.7) * 0.9,
                  tree.z + Math.sin(a) * r,
                ]}
                scale={[1.6, 1.1 + (j % 3) * 0.15, 1.4]}
              />
            );
          }),
        )}
      </Instances>
      {[-1, 1].map((side) => (
        <group key={side}>
          <Block
            position={[side * 31, 0.06, 22]}
            size={[5, 0.24, 25]}
            color="#768567"
          />
          <Block
            position={[side * 31, 0.03, 22]}
            size={[5.35, 0.12, 25.35]}
            material="stone"
          />
        </group>
      ))}
      <Instances frames={2} limit={400}>
        <coneGeometry args={[0.065, 0.7, 4]} />
        <meshStandardMaterial roughness={1} />
        {Array.from({ length: 400 }, (_, i) => {
          const side = i % 2 ? 1 : -1;
          return (
            <Instance
              key={i}
              color={i % 5 ? "#919876" : "#c6b391"}
              position={[
                side * (29.1 + ((i * 17) % 37) / 10),
                0.35,
                10.4 + ((i * 7) % 238) / 10,
              ]}
              rotation={[Math.sin(i) * 0.18, i, Math.cos(i) * 0.25]}
              scale={[1, 0.65 + (i % 7) / 10, 1]}
            />
          );
        })}
      </Instances>
    </group>
  );
}
