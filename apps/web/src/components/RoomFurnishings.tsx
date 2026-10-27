import { Suspense } from "react";
import { useTexture } from "@react-three/drei";
import { SRGBColorSpace, Vector2 } from "three";
import { galleryFurnishings } from "@museum/shared";
import { Block } from "../world/Architecture";
import { Label } from "../world/Label";
import { materials } from "../world/materials";
import galleryPhotos from "../config/gallery";

const vesselProfile = [
  [0, 0], [0.17, 0], [0.23, 0.08], [0.26, 0.24], [0.18, 0.43],
  [0.09, 0.58], [0.09, 0.7], [0.065, 0.7], [0.065, 0.58],
  [0.15, 0.43], [0.23, 0.24], [0.2, 0.08], [0.14, 0.03], [0, 0.03],
].map(([x, y]) => new Vector2(x, y));

function Sculpture({ ceramic }: { ceramic: boolean }) {
  return <group>
    <Block position={[0, 0.055, 0]} size={[1.08, 0.11, 1.08]} material="dark" />
    <Block position={[0, 0.55, 0]} size={[0.98, 0.94, 0.98]} color="#e5e0d5" />
    <Block position={[0, 1.045, 0]} size={[1.03, 0.05, 1.03]} material="stone" />
    {ceramic ? <group position={[0, 1.075, 0]} scale={1.2}>
      <mesh castShadow receiveShadow>
        <latheGeometry args={[vesselProfile, 48]} />
        <meshStandardMaterial color="#dfd5c3" roughness={0.7} />
      </mesh>
    </group> : <group position={[0, 1.65, 0]} rotation={[0.16, 0.45, 0]} scale={[1, 1.25, 1]}>
      <mesh material={materials().brass} castShadow>
        <torusKnotGeometry args={[0.31, 0.055, 96, 12, 2, 3]} />
      </mesh>
      <mesh position={[0, -0.39, 0]} material={materials().brass}>
        <cylinderGeometry args={[0.025, 0.025, 0.18, 8]} />
      </mesh>
    </group>}
    {[1, -1].map((side) => <Label key={side} text={ceramic ? "VESSEL / Ceramic study" : "CONTINUUM / Bronze study"}
      position={[0, 0.87, side * 0.497]} rotation={side < 0 ? Math.PI : 0}
      width={0.78} height={0.13} background="#eee9df" color="#514b41" />)}
  </group>;
}

function PhotoPrint({ url }: { url: string }) {
  const texture = useTexture(url);
  texture.colorSpace = SRGBColorSpace;
  const aspect = texture.image.width / texture.image.height;
  const width = Math.min(0.61, 0.72 * aspect), height = width / aspect;
  return <group rotation={[-Math.PI / 2, 0, 0]}>
    <mesh receiveShadow>
      <planeGeometry args={[width + 0.09, height + 0.09]} />
      <meshStandardMaterial color="#f5efe3" roughness={0.9} />
    </mesh>
    <mesh position={[0, 0, 0.002]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  </group>;
}

function GlassPanel({ position, size }: {
  position: [number, number, number]; size: [number, number];
}) {
  return <mesh position={position}>
    <planeGeometry args={size} />
    <meshStandardMaterial color="#dae8e4" transparent opacity={0.13}
      roughness={0.12} metalness={0.12} depthWrite={false} side={2} />
  </mesh>;
}

function DisplayCase({ room, wall = false }: { room: "her" | "story"; wall?: boolean }) {
  const width = wall ? 2.9 : 3.2, depth = wall ? 0.8 : 1.3;
  const base = wall ? 0.95 : 1.05, glassHeight = wall ? 0.55 : 0.65;
  const photos = galleryPhotos[room].slice(wall ? 3 : 0, wall ? 6 : 3);
  return <group>
    <Block position={[0, 0.065, 0]} size={[width - 0.2, 0.13, depth - 0.14]} material="dark" />
    <Block position={[0, base / 2, 0]} size={[width - 0.12, base - 0.12, depth - 0.1]} color="#dbd5c9" />
    <Block position={[0, base, 0]} size={[width, 0.08, depth]} material="wood" />
    <Block position={[0, base + 0.045, 0]} size={[width - 0.12, 0.015, depth - 0.12]} color="#e9e3d6" />
    {photos.map((photo, i) => <group key={photo.thumbnail}
      position={[(i - 1) * (wall ? 0.84 : 0.94), base + 0.062, 0]}
      rotation={[0, (i - 1) * 0.05, 0]} scale={wall ? 0.75 : 1}>
      <Suspense fallback={null}><PhotoPrint url={photo.thumbnail} /></Suspense>
    </group>)}
    {[-1, 1].map((sign) => <group key={sign}>
      <GlassPanel position={[0, base + glassHeight / 2, sign * depth / 2]} size={[width, glassHeight]} />
      <group position={[sign * width / 2, base + glassHeight / 2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <GlassPanel position={[0, 0, 0]} size={[depth, glassHeight]} />
      </group>
      {[-1, 1].map((end) => <Block key={end}
        position={[sign * width / 2, base + glassHeight / 2, end * depth / 2]}
        size={[0.025, glassHeight, 0.025]} material="brass" />)}
      <Block position={[0, base + glassHeight, sign * depth / 2]} size={[width, 0.022, 0.022]} material="brass" />
      <Block position={[sign * width / 2, base + glassHeight, 0]} size={[0.022, 0.022, depth]} material="brass" />
    </group>)}
    <group position={[0, base + glassHeight, 0]} rotation={[-Math.PI / 2, 0, 0]}>
      <GlassPanel position={[0, 0, 0]} size={[width, depth]} />
    </group>
    <Label text={room === "story" ? "OUR STORY / Photographs" : "PORTRAITS / Photographs"}
      position={[0, base - 0.2, depth / 2 - 0.035]} width={2.3} height={0.14}
      background="#ebe5d9" color="#514b41" />
  </group>;
}

/** Museum vitrines and sculptural objects; no lounge furniture or rugs. */
export function RoomFurnishings() {
  return <group>
    {galleryFurnishings.map((item) => <group key={item.id} position={[item.position[0], 0, item.position[2]]}>
      {item.id.endsWith("bronze-plinth") && <Sculpture ceramic={false} />}
      {item.id.endsWith("ceramic-plinth") && <Sculpture ceramic />}
      {item.id.endsWith("display-case") && <DisplayCase room={item.id.startsWith("her") ? "her" : "story"} />}
      {item.id.endsWith("wall-case") && <group rotation={[0, Math.sign(item.position[0]) * Math.PI / 2, 0]}>
        <DisplayCase room={item.id.startsWith("her") ? "her" : "story"} wall />
      </group>}
    </group>)}
  </group>;
}
