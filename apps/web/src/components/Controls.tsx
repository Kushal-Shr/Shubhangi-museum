import { useEffect, useRef, useState } from "react";
import {
  BIRTHDAY_CAKE_POSITION,
  BIRTHDAY_INTERACTION_RADIUS,
} from "@museum/shared";
import { requestSeat } from "../network/multiplayer";
import { useGameStore, useInputStore } from "../store/gameStore";

import { BirthdayInteraction } from "./BirthdayInteraction";

const movementKeys = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
]);

export function KeyboardControls() {
  useEffect(() => {
    const pressed = new Set<string>();
    const update = () => {
      const forward =
        Number(pressed.has("KeyW") || pressed.has("ArrowUp")) -
        Number(pressed.has("KeyS") || pressed.has("ArrowDown"));
      const right =
        Number(pressed.has("KeyD") || pressed.has("ArrowRight")) -
        Number(pressed.has("KeyA") || pressed.has("ArrowLeft"));
      useInputStore.getState().setMove(forward, right);
      useInputStore
        .getState()
        .setRunning(pressed.has("ShiftLeft") || pressed.has("ShiftRight"));
    };
    const down = (event: KeyboardEvent) => {
      if (
        (event.target as HTMLElement)?.closest("input,textarea,select") ||
        useGameStore.getState().activeExhibit ||
        useGameStore.getState().mapOpen
      )
        return;
      if (movementKeys.has(event.code)) event.preventDefault();
      pressed.add(event.code);
      update();
    };
    const up = (event: KeyboardEvent) => {
      pressed.delete(event.code);
      update();
    };
    const clear = () => {
      pressed.clear();
      update();
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    window.addEventListener("blur", clear);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
      window.removeEventListener("blur", clear);
    };
  }, []);
  return null;
}

export function TouchControls() {
  const joystickPointer = useRef<number | null>(null);
  const joystickOrigin = useRef({ x: 0, y: 0 });
  const lookPointer = useRef<number | null>(null);
  const lastLook = useRef({ x: 0, y: 0 });
  const [thumb, setThumb] = useState({ x: 0, y: 0 });

  const endJoystick = (event: React.PointerEvent) => {
    if (event.pointerId !== joystickPointer.current) return;
    joystickPointer.current = null;
    setThumb({ x: 0, y: 0 });
    useInputStore.getState().setMove(0, 0);
    useInputStore.getState().setRunning(false);
  };

  return (
    <div className="touch-controls">
      <div
        className="joystick-zone"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          joystickPointer.current = event.pointerId;
          joystickOrigin.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== joystickPointer.current) return;
          const dx = event.clientX - joystickOrigin.current.x;
          const dy = event.clientY - joystickOrigin.current.y;
          const magnitude = Math.hypot(dx, dy);
          const scale = magnitude > 45 ? 45 / magnitude : 1;
          const x = dx * scale;
          const y = dy * scale;
          setThumb({ x, y });
          useInputStore.getState().setMove(-y / 45, x / 45);
          useInputStore.getState().setRunning(magnitude > 38);
        }}
        onPointerUp={endJoystick}
        onPointerCancel={endJoystick}
      >
        <div className="joystick-base">
          <div
            className="joystick-thumb"
            style={{ transform: `translate(${thumb.x}px, ${thumb.y}px)` }}
          />
        </div>
      </div>
      <div
        className="look-zone"
        aria-label="Drag to look around"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          lookPointer.current = event.pointerId;
          lastLook.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerMove={(event) => {
          if (event.pointerId !== lookPointer.current) return;
          useInputStore
            .getState()
            .addLook(
              (event.clientX - lastLook.current.x) * 1.25,
              (event.clientY - lastLook.current.y) * 1.25,
            );
          lastLook.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          if (event.pointerId === lookPointer.current)
            lookPointer.current = null;
        }}
        onPointerCancel={() => {
          lookPointer.current = null;
        }}
      />
    </div>
  );
}

export function InteractionPrompt() {
  const exhibit = useGameStore((state) => state.nearbyExhibit);
  const openExhibit = useGameStore((state) => state.openExhibit);
  const seatId = useGameStore((s) => s.seatId);
  const active = useGameStore((s) => s.activeExhibit);
  const connected = useGameStore((s) => s.connectionStatus === "connected");
  const position = useGameStore((s) => s.localPosition);
  const mapOpen = useGameStore((s) => s.mapOpen);
  const nearCake =
    Math.hypot(
      position[0] - BIRTHDAY_CAKE_POSITION[0],
      position[2] - BIRTHDAY_CAKE_POSITION[2],
    ) <= BIRTHDAY_INTERACTION_RADIUS;
  if (active || mapOpen) return null;
  if (seatId)
    return (
      <button className="interaction-prompt" onClick={() => requestSeat("")}>
        Stand up · E
      </button>
    );
  if (nearCake) return <BirthdayInteraction />;
  if (!exhibit) return null;
  return (
    <button
      className="interaction-prompt"
      onClick={() =>
        exhibit.type === "seat"
          ? requestSeat(exhibit.seatId!)
          : openExhibit(exhibit)
      }
      disabled={exhibit.type === "seat" && !connected}
    >
      <span className="desktop-key">E</span>
      <span>
        {exhibit.type === "seat" ? "Take a seat" : `View “${exhibit.title}”`}
      </span>
    </button>
  );
}
