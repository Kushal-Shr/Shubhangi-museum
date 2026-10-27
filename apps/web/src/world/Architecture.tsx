import { createInstances } from '@react-three/drei';
import type { ReactNode } from 'react';
import { MeshStandardMaterial } from 'three';
import type { Point3 } from '@museum/shared';
import { materials } from './materials';

const kinds = ['stone', 'wood', 'plaster', 'dark', 'brass', 'rose', 'leaf', 'color'] as const;
const batches = Object.fromEntries(kinds.map((kind) => [kind, createInstances()]));
const painted = new MeshStandardMaterial({ color: '#ffffff', roughness: 0.88 });
/** One static GPU batch per finish, including blocks nested in furniture groups. */
export function Architecture({ children }: { children: ReactNode }) {
  const palette = materials();
  return kinds.reduceRight<ReactNode>((content, kind) => {
    const [Batch] = batches[kind]!;
    return <Batch limit={512} frames={2} material={kind === 'color' ? painted : palette[kind]} castShadow receiveShadow frustumCulled={false}>
      <boxGeometry args={[1, 1, 1]} />{content}
    </Batch>;
  }, children);
}
export function Block({ position, size, material = 'stone', color }: {
  position: Point3; size: Point3; material?: keyof ReturnType<typeof materials>; color?: string;
}) {
  // Transparent architectural glazing needs independent depth sorting.
  if (material === 'glass' && !color) return <mesh position={position} scale={size} material={materials().glass}><boxGeometry /></mesh>;
  const [, Instance] = batches[color ? 'color' : material]!;
  return <Instance position={position} scale={size} color={color ?? '#ffffff'} />;
}
