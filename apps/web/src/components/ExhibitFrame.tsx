import { useTexture } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { Component, Suspense, useState, useRef, type ReactNode } from "react";
import { SRGBColorSpace } from "three";
import type { Exhibit } from "../config/exhibits";
import { useGameStore } from "../store/gameStore";
import { Label } from "../world/Label";
import { materials } from "../world/materials";

class MediaBoundary extends Component<
  { children: ReactNode },
  { failed: boolean }
> {
  override state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  override render() {
    return this.state.failed ? null : this.props.children;
  }
}
function Art({
  url,
  width,
  height,
}: {
  url: string;
  width: number;
  height: number;
}) {
  const texture = useTexture(url);
  texture.colorSpace = SRGBColorSpace;
  const aspect = texture.image.width / texture.image.height;
  const w = Math.min(width, height * aspect),
    h = w / aspect;
  return (
    <mesh position={[0, 0, 0.105]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  );
}
export function ExhibitFrame({ exhibit: e }: { exhibit: Exhibit }) {
  const [visible, setVisible] = useState(false);
  const nextCheck = useRef(0);
  const capture = import.meta.env.DEV && new URLSearchParams(location.search).has("capture");
  useFrame(({ clock, camera }) => {
    if (clock.elapsedTime >= nextCheck.current) {
      nextCheck.current = clock.elapsedTime + 0.5;
      const p = useGameStore.getState().localPosition;
      const x = capture ? camera.position.x : p[0], z = capture ? camera.position.z : p[2];
      const near = Math.hypot(x - e.position[0], z - e.position[2]) < (visible ? 27 : 24);
      if (near !== visible) setVisible(near);
    }
  });
  const [w, h] = e.size;
  const m = materials();
  return (
    <group position={e.position} rotation={[0, e.rotationY, 0]}>
      <mesh
        castShadow
        material={
          e.frameStyle === "brass"
            ? m.brass
            : e.frameStyle === "oak"
              ? m.wood
              : m.dark
        }
      >
        <boxGeometry args={[w + 0.16, h + 0.16, 0.16]} />
      </mesh>
      <mesh position={[0, 0, 0.085]}>
        <planeGeometry args={[w, h]} />
        <meshStandardMaterial color="#eee6d7" roughness={0.85} />
      </mesh>
      {visible && (
        <>
          <MediaBoundary>
            <Suspense fallback={null}>
              <Art url={e.thumbnail} width={w - 0.18} height={h - 0.18} />
            </Suspense>
          </MediaBoundary>
          <Label
            text={`${e.id.split("-").pop()?.toUpperCase()}  /  ${e.title}`}
            position={[0, -h / 2 - 0.25, 0.08]}
            width={Math.min(w, 2)}
            height={0.16}
            background="#e9e1d3"
          />
        </>
      )}
    </group>
  );
}
