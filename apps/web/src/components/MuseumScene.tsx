import { PerformanceMonitor, Loader } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Suspense, useState } from "react";
import { GalleryEnvironment } from "./GalleryEnvironment";
import { PlayerController } from "./PlayerController";
import { RemotePlayers } from "./RemotePlayers";

import { SceneDiagnostics } from "./SceneDiagnostics";
import { useGameStore } from "../store/gameStore";

export function MuseumScene() {
  const capture =
    import.meta.env.DEV && new URLSearchParams(location.search).has("capture");
  const view = new URLSearchParams(location.search).get("capture");
  const galleryX = view === "story" ? -12 : view === "her" ? 12 : null;
  const capturePosition: [number, number, number] =
    galleryX !== null ? [galleryX + 5.5, 2.8, -4.5] : view === "birthday"
      ? [5.5, 3.1, -8]
      : view === "garden"
        ? [28, 15, -15]
        : [31, 13, 41];
  const captureTarget: [number, number, number] =
    galleryX !== null ? [galleryX, 1.25, 4.5] : view === "birthday"
      ? [0, 1.9, -18]
      : view === "garden"
        ? [0, 1, -35]
        : [0, 2.8, 7];
  const quality = useGameStore((s) => s.quality);
  const [factor, setFactor] = useState(0.6);
  const maxDpr = quality === "low" ? 1 : quality === "high" ? 1.8 : 1.5;
  const dpr = Math.min(window.devicePixelRatio, maxDpr, 0.75 + factor);
  return (
    <div className="museum-canvas" aria-label="Interactive 3D museum">
      <Canvas
        shadows={quality !== "low"}
        dpr={dpr}
        camera={{
          fov: capture ? 48 : 52,
          near: 0.1,
          far: 180,
          position: capture ? capturePosition : [0, 3, 31],
        }}
        onCreated={({ camera }) => {
          if (capture) camera.lookAt(...captureTarget);
        }}
        gl={{ antialias: true, powerPreference: "high-performance" }}
      >
        <Suspense fallback={null}>
          <Physics gravity={[0, -20, 0]} timeStep={1 / 60} interpolate>
            <GalleryEnvironment />
            {!capture && (
              <>
                <PlayerController />
                <RemotePlayers />
              </>
            )}
          </Physics>
          <PerformanceMonitor
            bounds={() => [45, 58]}
            flipflops={3}
            factor={0.6}
            onChange={({ factor }) => setFactor(Math.round(factor * 10) / 10)}
            onFallback={() => setFactor(0.25)}
          />
          {import.meta.env.DEV &&
            new URLSearchParams(location.search).has("perf") && (
              <SceneDiagnostics />
            )}
        </Suspense>
      </Canvas>
      <Loader
        containerStyles={{ background: "#172a24" }}
        innerStyles={{ background: "#3b5144", width: 220, height: 2 }}
        barStyles={{ background: "#d7b778" }}
        dataStyles={{ color: "#f6ead8", fontFamily: "Georgia, serif" }}
      />
    </div>
  );
}
