import { useFrame } from "@react-three/fiber";
import { useRef } from "react";
import { Group, MathUtils, Vector3 } from "three";
import type { PlayerSnapshot } from "@museum/shared";
import { useGameStore } from "../store/gameStore";
import { Avatar } from "./Avatar";

function RemoteAvatar({ player }: { player: PlayerSnapshot }) {
  const group = useRef<Group>(null);
  const spawn = useRef<[number, number, number]>([player.x, player.y, player.z]);
  const facing = useRef<[number, number, number]>([0, player.rotation, 0]);
  const target = useRef(new Vector3(player.x, player.y, player.z));
  const motion = useRef(false);
  const speed = useRef(0);
  const previous = useRef(new Vector3(player.x, player.y, player.z));

  useFrame((_, delta) => {
    if (!group.current) return;
    target.current.set(player.x, player.y, player.z);
    previous.current.copy(group.current.position);
    group.current.position.lerp(target.current, 1 - Math.exp(-delta * 12));
    group.current.rotation.y +=
      Math.atan2(
        Math.sin(player.rotation - group.current.rotation.y),
        Math.cos(player.rotation - group.current.rotation.y),
      ) *
      (1 - Math.exp(-delta * 12));
    const travelSpeed = Math.hypot(
      previous.current.x - group.current.position.x,
      previous.current.z - group.current.position.z,
    ) / Math.max(delta, 0.001);
    speed.current = MathUtils.lerp(speed.current, Math.min(travelSpeed, 5.5), 1 - Math.exp(-delta * 10));
    motion.current = speed.current > 0.08;
  });

  return (
    <group
      ref={group}
      position={spawn.current}
      rotation={facing.current}
    >
      <Avatar
        {...player}
        playerId={player.id}
        motion={motion}
        speed={speed}
        seated={!!player.seatId}
      />
    </group>
  );
}

export function RemotePlayers() {
  const sessionId = useGameStore((state) => state.sessionId);
  const players = useGameStore((state) => state.players);
  return players
    .filter((player) => player.id !== sessionId)
    .map((player) => <RemoteAvatar key={player.id} player={player} />);
}
