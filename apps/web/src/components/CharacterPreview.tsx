import { Canvas } from "@react-three/fiber";
import { Suspense } from "react";
import { ContactShadows, OrbitControls } from "@react-three/drei";
import type { AvatarProfile } from "@museum/shared";
import { Avatar } from "./Avatar";

export default function CharacterPreview({
  profile,
}: {
  profile: AvatarProfile;
}) {
  // Development-only motion review without entering a password-protected role.
  const motion = import.meta.env.DEV
    ? new URLSearchParams(location.search).get("previewMotion")
    : null;
  return (
    <div
      className="standing-character"
      aria-label={`Standing 3D preview of ${profile.modelId === "shubhangi" ? "Shubhangi" : profile.modelId === "kushal" ? "Kushal" : "a guest character"}`}
    >
      <Canvas
        camera={{ position: [0, 1, 3.7], fov: 31 }}
        dpr={[1, 1.5]}
        shadows
      >
        <ambientLight intensity={1.5} />
        <hemisphereLight args={["#f7f5ef", "#8b9589", 1.3]} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={3}
          color="#fff2e5"
          castShadow
        />
        <directionalLight
          position={[-3, 2, -2]}
          intensity={2}
          color="#e3ebe6"
        />
        <Suspense fallback={null}>
          <group position={[0, 0.9, 0]} rotation={[0, Math.PI - 0.18, 0]}>
            <Avatar
              {...profile}
              local
              moving={motion === "walk" || motion === "run"}
              running={motion === "run"}
              seated={motion === "sit"}
            />
          </group>
          <ContactShadows
            position={[0, 0.015, 0]}
            opacity={0.28}
            scale={5}
            blur={2.6}
            far={3}
            frames={1}
          />
        </Suspense>
        <OrbitControls
          target={[0, 0.85, 0]}
          enablePan={false}
          enableZoom={false}
          minPolarAngle={Math.PI * 0.35}
          maxPolarAngle={Math.PI * 0.55}
        />
      </Canvas>
    </div>
  );
}
