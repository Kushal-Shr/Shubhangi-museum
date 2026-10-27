import { useEffect, useRef, useState } from "react";
import {
  BIRTHDAY_STAGE_DURATION,
  canBirthdayAction,
  nextBirthdayAction,
} from "@museum/shared";
import { BreathDetector, breathFeatures } from "../audio/breathDetector";
import { requestBirthdayAction } from "../network/multiplayer";
import { useGameStore } from "../store/gameStore";

type MicStatus =
  | "idle"
  | "requesting"
  | "calibrating"
  | "listening"
  | "detected"
  | "error";
export function BirthdayInteraction() {
  const stage = useGameStore((s) => s.birthdayStage);
  const startedAt = useGameStore((s) => s.birthdayStartedAt);
  const connected = useGameStore((s) => s.connectionStatus === "connected");
  const role = useGameStore((s) => s.portalRole);
  const [status, setStatus] = useState<MicStatus>("idle");
  const [message, setMessage] = useState("");
  const [meter, setMeter] = useState({ level: 0, progress: 0 });
  const [sensitivity, setSensitivity] = useState(2.6);
  const [now, setNow] = useState(Date.now());
  const resources = useRef<{
    stream?: MediaStream;
    context?: AudioContext;
    frame?: number;
  }>({});
  const generation = useRef(0);
  const cleanup = () => {
    generation.current++;
    if (resources.current.frame) cancelAnimationFrame(resources.current.frame);
    resources.current.stream?.getTracks().forEach((track) => track.stop());
    const context = resources.current.context;
    if (context && context.state !== "closed")
      void context.close().catch(() => {});
    resources.current = {};
  };
  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 100);
    const cancel = () => {
      cleanup();
      setStatus("idle");
      setMeter({ level: 0, progress: 0 });
    };
    // Native permission prompts can blur the window before a stream exists.
    const blur = () => {
      if (resources.current.stream) cancel();
    };
    const visibility = () => {
      if (document.hidden) cancel();
    };
    window.addEventListener("blur", blur);
    window.addEventListener("pagehide", cancel);
    document.addEventListener("visibilitychange", visibility);
    return () => {
      clearInterval(timer);
      cleanup();
      window.removeEventListener("blur", blur);
      window.removeEventListener("pagehide", cancel);
      document.removeEventListener("visibilitychange", visibility);
    };
  }, []);
  useEffect(() => {
    cleanup();
    setStatus("idle");
    setMessage("");
  }, [stage, connected]);
  useEffect(() => {
    useGameStore
      .getState()
      .setBirthdayFocus(["calibrating", "listening"].includes(status));
    return () => useGameStore.getState().setBirthdayFocus(false);
  }, [status]);
  useEffect(() => {
    if (status !== "detected") return;
    const retry = window.setTimeout(() => {
      setStatus("idle");
      setMessage("The candles haven’t gone out yet. Please try again.");
    }, 3000);
    return () => clearTimeout(retry);
  }, [status]);

  const busy =
    now + useGameStore.getState().serverClockOffset - startedAt <
    (BIRTHDAY_STAGE_DURATION[stage] ?? 0) + 100;
  const listening = [
    "requesting",
    "calibrating",
    "listening",
    "detected",
  ].includes(status);
  const start = async () => {
    cleanup();
    const token = generation.current;
    setMessage("");
    setMeter({ level: 0, progress: 0 });
    setStatus("requesting");
    try {
      if (!navigator.mediaDevices?.getUserMedia || !window.isSecureContext)
        throw new Error(
          "Microphone blowing needs HTTPS or localhost. You can use the button below.",
        );
      const context = new AudioContext();
      resources.current.context = context;
      // Resume during the button gesture, including on mobile Safari.
      await context.resume();
      if (token !== generation.current) return;
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
        video: false,
      });
      if (token !== generation.current) {
        stream.getTracks().forEach((track) => track.stop());
        return;
      }
      resources.current.stream = stream;
      const source = context.createMediaStreamSource(stream);
      const analyser = context.createAnalyser();
      analyser.fftSize = 2048;
      analyser.smoothingTimeConstant = 0.15;
      source.connect(analyser); // Deliberately never connected to speakers.
      const samples = new Float32Array(analyser.fftSize);
      const spectrum = new Float32Array(analyser.frequencyBinCount);
      const began = performance.now();
      const detector = new BreathDetector(began, sensitivity);
      setStatus("calibrating");
      let lastUi = 0;
      const tick = () => {
        if (generation.current !== token) return;
        const time = performance.now();
        if (time - began > 20000) {
          cleanup();
          setStatus("error");
          setMessage(
            "No breath detected. Try again closer to your microphone, or increase sensitivity.",
          );
          return;
        }
        analyser.getFloatTimeDomainData(samples);
        analyser.getFloatFrequencyData(spectrum);
        const result = detector.update(time, breathFeatures(samples, spectrum));
        if (time - lastUi > 70) {
          setMeter({ level: result.level, progress: result.progress });
          setStatus(result.calibrating ? "calibrating" : "listening");
          lastUi = time;
        }
        if (result.detected) {
          cleanup();
          setStatus("detected");
          setMeter({ level: 1, progress: 1 });
          requestBirthdayAction("blow");
          return;
        }
        resources.current.frame = requestAnimationFrame(tick);
      };
      tick();
    } catch (error) {
      if (token !== generation.current) return;
      cleanup();
      setStatus("error");
      const name = error instanceof Error ? error.name : "";
      setMessage(
        name === "NotAllowedError"
          ? "Microphone access was not allowed. Enable it in your browser, or use the button below."
          : name === "NotFoundError"
            ? "No microphone found. You can still blow out the candles with the button."
            : error instanceof Error
              ? error.message
              : "Could not start the microphone. Please try again.",
      );
    }
  };
  const labels = [
    "Light the candles",
    "Enable microphone",
    "Cut the cake",
    "Share the cake",
    "Celebrate again",
  ];
  if (!canBirthdayAction(role, nextBirthdayAction(stage)))
    return (
      <section className="birthday-panel" aria-label="Birthday celebration">
        <span className="birthday-panel-eyebrow">SHUBHANGI’S BIRTHDAY</span>
        <strong>
          {stage === 0
            ? "Kushal is lighting the candles for Shubhangi."
            : stage === 1
              ? "Take your time, Shubhangi."
              : stage === 2
                ? "Shubhangi gets the first slice."
                : stage === 3
                  ? "Kushal and Shubhangi are sharing the cake."
                  : "Happy birthday, Shubhangi. We love you."}
        </strong>
        <p>
          {stage === 1
            ? "We’ll wait while Shubhangi makes a wish and blows out the candles."
            : "Thank you for being here to celebrate Shubhangi with us."}
        </p>
      </section>
    );
  return (
    <section className="birthday-panel" aria-label="Birthday celebration">
      <span className="birthday-panel-eyebrow">HAPPY BIRTHDAY, SHUBHANGI</span>
      {stage === 1 && (
        <>
          <strong>
            {status === "calibrating"
              ? "Getting the microphone ready…"
              : status === "listening"
                ? "Shubhangi, make your wish, then blow gently."
                : status === "detected"
                  ? "You did it, Shubhangi!"
                  : "Shubhangi, I hope your wish comes true."}
          </strong>
          <p>
            {status === "calibrating"
              ? "Stay quiet while we listen to the room."
              : "Blow toward your phone or laptop’s microphone for half a second."}
          </p>
          {listening && (
            <div
              className="breath-meter"
              role="progressbar"
              aria-label="Breath detected"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={Math.round(meter.progress * 100)}
            >
              <i style={{ width: meter.level * 100 + "%" }} />
              <b style={{ width: meter.progress * 100 + "%" }} />
            </div>
          )}
          {message && (
            <p role="status" className="mic-message">
              {message}
            </p>
          )}
        </>
      )}
      <button
        data-birthday-primary
        className="birthday-primary"
        disabled={!connected || busy || listening}
        onClick={() =>
          stage === 1
            ? void start()
            : requestBirthdayAction(nextBirthdayAction(stage))
        }
      >
        {busy
          ? "Just a moment…"
          : status === "requesting"
            ? "Allow microphone access…"
            : status === "calibrating"
              ? "Getting ready…"
              : status === "listening"
                ? "Listening for your breath…"
                : status === "detected"
                  ? "Candles blown out"
                  : labels[stage]}
        {!busy && !listening && <kbd>E</kbd>}
      </button>
      {stage === 1 && (
        <>
          {listening && (
            <button
              className="birthday-secondary"
              onClick={() => {
                cleanup();
                setStatus("idle");
              }}
            >
              Cancel microphone
            </button>
          )}
          {!listening && (
            <label className="mic-sensitivity">
              Microphone sensitivity
              <select
                value={sensitivity}
                onChange={(e) => setSensitivity(Number(e.target.value))}
              >
                <option value={2.6}>Normal</option>
                <option value={1.6}>High</option>
                <option value={4}>Low</option>
              </select>
            </label>
          )}
          <button
            className="birthday-secondary"
            disabled={!connected || busy}
            onClick={() => {
              cleanup();
              requestBirthdayAction("blow");
            }}
          >
            Use a button instead
          </button>
          <small>
            Microphone stays on this device. Nothing is recorded or shared.
          </small>
        </>
      )}
    </section>
  );
}
