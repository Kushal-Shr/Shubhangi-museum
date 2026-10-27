import { useEffect, useMemo } from "react";
import { CanvasTexture, SRGBColorSpace } from "three";
import type { Point3 } from "@museum/shared";
/** Local canvas typography keeps signage inside WebGL and avoids 100 DOM overlays. */
export function Label({
  text,
  position = [0, 0, 0],
  rotation = 0,
  width = 3,
  height = 0.5,
  color = "#544939",
  background,
  serif = false,
}: {
  text: string;
  position?: Point3;
  rotation?: number;
  width?: number;
  height?: number;
  color?: string;
  background?: string;
  serif?: boolean;
}) {
  const texture = useMemo(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = Math.max(64, Math.round((1024 * height) / width));
    const ctx = canvas.getContext("2d")!;
    if (background) {
      ctx.fillStyle = background;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    ctx.fillStyle = color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `${serif ? "normal" : "500"} ${Math.round(canvas.height * 0.56)}px ${serif ? "Georgia" : "Arial"}`;
    ctx.fillText(text, 512, canvas.height * 0.52, 970);
    const t = new CanvasTexture(canvas);
    t.colorSpace = SRGBColorSpace;
    return t;
  }, [text, width, height, color, background, serif]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh position={position} rotation={[0, rotation, 0]}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial
        map={texture}
        transparent={!background}
        depthWrite={!!background}
        toneMapped={false}
      />
    </mesh>
  );
}
