import { Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
/** Opt-in local diagnostic overlay. No metrics are sent anywhere. */
export function SceneDiagnostics() {
  const label = useRef<HTMLOutputElement>(null);
  const sample = useRef({ elapsed: 0, frames: 0 });
  useFrame(({ gl }, delta) => {
    if (document.hidden) return;
    sample.current.elapsed += delta;
    sample.current.frames++;
    if (sample.current.elapsed >= 2 && label.current) {
      label.current.textContent = `${Math.round(sample.current.frames / sample.current.elapsed)} fps · ${gl.info.render.calls} draws · ${Math.round(gl.info.render.triangles / 1000)}k triangles · DPR ${gl.getPixelRatio().toFixed(2)}`;
      sample.current = { elapsed: 0, frames: 0 };
    }
  });
  return <Html fullscreen style={{ pointerEvents: 'none' }}><output ref={label} style={{position:'absolute',bottom:16,right:16,background:'#14261ee8',color:'#fff',padding:10,font:'12px monospace'}}>Measuring scene…</output></Html>;
}
