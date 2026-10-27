import { lazy, Suspense, useEffect } from "react";
import {
  BIRTHDAY_CAKE_POSITION,
  BIRTHDAY_INTERACTION_RADIUS,
} from "@museum/shared";
import {
  InteractionPrompt,
  KeyboardControls,
  TouchControls,
} from "./components/Controls";
import { ExhibitViewer, MuseumHud } from "./components/Overlays";
import { SceneBoundary } from "./components/SceneBoundary";
import { Welcome } from "./components/Welcome";
import { requestSeat, MultiplayerSession } from "./network/multiplayer";
import { useGameStore } from "./store/gameStore";

const loadMuseum = () =>
  import("./components/MuseumScene").then((module) => ({
    default: module.MuseumScene,
  }));
const MuseumScene = lazy(loadMuseum);

export default function App() {
  const entered = useGameStore((state) => state.entered);

  useEffect(() => {
    const interact = (event: KeyboardEvent) => {
      if (
        event.code !== "KeyE" ||
        event.repeat ||
        (event.target as HTMLElement)?.closest("input,textarea,select") ||
        useGameStore.getState().activeExhibit ||
        useGameStore.getState().mapOpen
      )
        return;
      if (useGameStore.getState().seatId) {
        requestSeat("");
        return;
      }
      const game = useGameStore.getState();
      if (
        game.connectionStatus === "connected" &&
        Math.hypot(
          game.localPosition[0] - BIRTHDAY_CAKE_POSITION[0],
          game.localPosition[2] - BIRTHDAY_CAKE_POSITION[2],
        ) <= BIRTHDAY_INTERACTION_RADIUS
      ) {
        // Use the same user gesture path for keyboard and touch, including mic permission.
        document
          .querySelector<HTMLButtonElement>("[data-birthday-primary]")
          ?.click();
        return;
      }
      const nearby = useGameStore.getState().nearbyExhibit;
      if (nearby) {
        if (nearby.type === "seat") requestSeat(nearby.seatId!);
        else useGameStore.getState().openExhibit(nearby);
      }
    };
    window.addEventListener("keydown", interact);
    return () => window.removeEventListener("keydown", interact);
  }, []);

  if (
    import.meta.env.DEV &&
    new URLSearchParams(location.search).has("capture")
  )
    return (
      <Suspense fallback={null}>
        <MuseumScene />
      </Suspense>
    );
  if (!entered) return <Welcome prepare={loadMuseum} />;
  return (
    <main className="museum-shell">
      <MultiplayerSession />
      <KeyboardControls />
      <SceneBoundary>
        <Suspense
          fallback={<div className="scene-loading">Preparing the gallery…</div>}
        >
          <MuseumScene />
        </Suspense>
      </SceneBoundary>
      <MuseumHud />
      <InteractionPrompt />
      <TouchControls />
      <ExhibitViewer />
    </main>
  );
}
