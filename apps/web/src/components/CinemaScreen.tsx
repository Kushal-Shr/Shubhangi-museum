import { useEffect, useMemo, useState } from "react";
import { SRGBColorSpace, VideoTexture } from "three";
import { useGameStore } from "../store/gameStore";
import { Label } from "../world/Label";
/** Reuses the viewer's native video element; no second stream or background download. */
export function CinemaScreen() {
  const element = useGameStore((s) => s.videoElement);
  const [aspect, setAspect] = useState(16 / 9);
  useEffect(() => {
    if (!element) return;
    const update = () =>
      setAspect(element.videoWidth / Math.max(1, element.videoHeight) || 16 / 9);
    update();
    element.addEventListener("loadedmetadata", update);
    return () => element.removeEventListener("loadedmetadata", update);
  }, [element]);
  const width = Math.min(10, 4.3 * aspect);
  const texture = useMemo(() => {
    if (!element) return null;
    const t = new VideoTexture(element);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [element]);
  useEffect(() => () => texture?.dispose(), [texture]);
  return (
    <>
      {texture && (
        <mesh position={[-15.5, 3.4, -27.57]}>
          <planeGeometry args={[10, 4.3]} />
          <meshBasicMaterial color="#111111" />
        </mesh>
      )}
      <mesh position={[-15.5, 3.4, -27.55]}>
        <planeGeometry args={texture ? [width, width / aspect] : [10, 4.3]} />
        {texture ? (
          <meshBasicMaterial map={texture} toneMapped={false} />
        ) : (
          <meshStandardMaterial
            color="#d8c6a7"
            emissive="#ac9474"
            emissiveIntensity={0.2}
          />
        )}
      </mesh>
      {!texture && (
        <>
          <Label
            text="THE SCREENING ROOM"
            position={[-15.5, 3.7, -27.5]}
            width={8}
            height={0.5}
          />
          <Label
            text="A private cinema · Take a seat and choose a film"
            position={[-15.5, 2.8, -27.5]}
            width={8}
            height={0.3}
          />
        </>
      )}
    </>
  );
}
