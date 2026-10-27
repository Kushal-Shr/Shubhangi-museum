import { useEffect, useRef, useState } from "react";
import { roomAt, rooms } from "@museum/shared";
import { videos } from "../config/exhibits";
import { useGameStore, useInputStore } from "../store/gameStore";

function useDialog(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const before = document.activeElement as HTMLElement;
    useInputStore.getState().setMove(0, 0);
    useInputStore.getState().setRunning(false);
    const element = ref.current;
    const focusable = () =>
      element?.querySelectorAll<HTMLElement>(
        'button:not([disabled]),[href],input,select,textarea,video,[tabindex="0"]',
      );
    focusable()?.[0]?.focus();
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
      if (event.key === "Tab") {
        const all = focusable();
        if (!all?.length) return;
        const first = all[0]!,
          last = all[all.length - 1]!;
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", key);
    return () => {
      window.removeEventListener("keydown", key);
      before?.focus();
    };
  }, [open, close]);
  return ref;
}
function MuseumMap() {
  const open = useGameStore((s) => s.mapOpen),
    setOpen = useGameStore((s) => s.setMapOpen);
  const [close] = useState(
    () => () => useGameStore.getState().setMapOpen(false),
  );
  const position = useGameStore((s) => (s.mapOpen ? s.localPosition : null));
  const ref = useDialog(open, close);
  if (!open || !position) return null;
  return (
    <div
      ref={ref}
      className="viewer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-title"
      onClick={close}
    >
      <section className="museum-map" onClick={(e) => e.stopPropagation()}>
        <button
          className="viewer-close"
          onClick={() => setOpen(false)}
          aria-label="Close museum guide"
        >
          ×
        </button>
        <span className="eyebrow">Museum of Us</span>
        <h2 id="map-title">The museum guide</h2>
        <div className="map-layout">
          <svg
            viewBox="-22 -26 44 64"
            role="img"
            aria-label="Our Story on the left, The Girl Behind It All on the right, the birthday celebration ahead, and the garden outside."
          >
            {rooms.map((r) => (
              <g key={r.id}>
                <rect
                  x={r.bounds[0]}
                  y={r.bounds[2]}
                  width={r.bounds[1] - r.bounds[0]}
                  height={r.bounds[3] - r.bounds[2]}
                  fill={
                    r.id === "plaza"
                      ? "#b9c1a8"
                      : r.id === "lobby"
                        ? "#ddd2bb"
                        : "#c7b69e"
                  }
                  stroke="#f7f0e5"
                  strokeWidth=".6"
                />
                <text
                  x={(r.bounds[0] + r.bounds[1]) / 2}
                  y={(r.bounds[2] + r.bounds[3]) / 2}
                  textAnchor="middle"
                  fontSize="3"
                  fill="#50453b"
                >
                  {r.number}
                </text>
              </g>
            ))}
            {[-3.6, 3.6].flatMap((x) =>
              [1.6].map((z) => (
                <path
                  key={`${x}-${z}`}
                  d={`M${x} ${z - 2}v4`}
                  stroke="#655641"
                  strokeWidth="1.1"
                />
              )),
            )}
            <path d="M-2.4 -6.8h4.8" stroke="#655641" strokeWidth="1.1" />
            <circle
              cx={position[0]}
              cy={position[2]}
              r="1.4"
              fill="#7c3d4c"
              stroke="#fff"
              strokeWidth=".5"
            />
          </svg>
          <div>
            {rooms.map((r) => (
              <div className="guide-room" key={r.id}>
                <span>{r.number}</span>
                <div>
                  <strong>{r.title}</strong>
                  <p>{r.description}</p>
                </div>
              </div>
            ))}
            <small>● You are here · Doorways connect every gallery.</small>
          </div>
        </div>
      </section>
    </div>
  );
}
export function MuseumHud() {
  const status = useGameStore((s) => s.connectionStatus),
    message = useGameStore((s) => s.connectionMessage),
    playerCount = useGameStore((s) => s.players.length),
    quality = useGameStore((s) => s.quality),
    birthdayStage = useGameStore((s) => s.birthdayStage),
    birthdayMessage = useGameStore((s) => s.birthdayMessage);
  const room = useGameStore((s) =>
    roomAt(s.localPosition[0], s.localPosition[2]),
  );
  return (
    <>
      <header className="museum-hud">
        <div className="museum-mark">
          <span>K/S</span>
          <div>
            <strong>Museum of Us</strong>
            <small>{room.title}</small>
          </div>
        </div>
        <div className="hud-actions">
          <button onClick={() => useGameStore.getState().setMapOpen(true)}>
            Museum guide <span>↗</span>
          </button>
          <label className="quality-select">
            <span className="sr-only">Graphics quality</span>
            <select
              aria-label="Graphics quality"
              value={quality}
              onChange={(e) =>
                useGameStore
                  .getState()
                  .setQuality(e.target.value as typeof quality)
              }
            >
              <option value="low">Light</option>
              <option value="balanced">Balanced</option>
              <option value="high">High</option>
            </select>
          </label>
          <div className={`connection-pill ${status}`}>
            <i />
            {status === "connected"
              ? `${playerCount} ${playerCount === 1 ? "visitor" : "visitors"}`
              : status}
          </div>
        </div>
      </header>
      <aside className="room-caption" key={room.id}>
        <span>{room.number} / MUSEUM OF US</span>
        <h2>{room.title}</h2>
        <p>{room.description}</p>
        {room.id === "birthday" && (
          <div className="birthday-progress">
            <div
              aria-label={`Birthday celebration step ${birthdayStage + 1} of 5`}
            >
              {[0, 1, 2, 3, 4].map((step) => (
                <i key={step} className={step <= birthdayStage ? "done" : ""} />
              ))}
            </div>
            <strong>
              {[
                "Kushal, light the candles for Shubhangi",
                "Shubhangi, make your wish",
                "Shubhangi, cut the first slice",
                "Kushal and Shubhangi, share the cake",
                "Happy birthday, Shubhangi!",
              ][birthdayStage] ?? "Happy birthday, Shubhangi!"}
            </strong>
          </div>
        )}
      </aside>
      <div className="controls-help">
        <span>
          <kbd>WASD</kbd> move
        </span>
        <span>
          <kbd>Shift</kbd> run
        </span>
        <span>
          <kbd>Drag</kbd> look
        </span>
        <span>
          <kbd>E</kbd> interact
        </span>
      </div>
      {status === "connected" && message && (
        <div className="status-note" role="status">
          {message}
        </div>
      )}
      {birthdayMessage && (
        <div className="birthday-event-toast" role="status">
          <span>✦</span> {birthdayMessage}
        </div>
      )}
      {status === "error" && (
        <div className="connection-error" role="alert">
          <strong>The museum server is unavailable.</strong>
          <span>{message || "Start the multiplayer server, then reload."}</span>
          <button onClick={() => location.reload()}>Try again</button>
        </div>
      )}
      <MuseumMap />
    </>
  );
}
function FilmPlayer({ birthday = false }: { birthday?: boolean }) {
  const [selection, setSelection] = useState(
    birthday ? "birthday-film" : "film-01",
  );
  const film = videos.find((v) => v.id === selection)!;
  const [error, setError] = useState(false);
  const setVideoElement = useGameStore((s) => s.setVideoElement);
  return (
    <div className="film-player">
      <div className="film-tabs" role="group" aria-label="Choose a film">
        {videos.map((v) => (
          <button
            key={v.id}
            aria-pressed={selection === v.id}
            onClick={() => {
              setSelection(v.id);
              setError(false);
            }}
          >
            {v.title}
          </button>
        ))}
      </div>
      {film.url ? (
        <video
          ref={birthday ? undefined : setVideoElement}
          key={film.id}
          crossOrigin="anonymous"
          controls
          playsInline
          preload="metadata"
          onError={() => setError(true)}
          aria-label={film.title}
        >
          <source src={film.url} />
        </video>
      ) : (
        <div className="empty-film">
          <span>▷</span>
          <h3>{film.title}</h3>
          <p>This screen is waiting for your film.</p>
          <small>{film.description}</small>
        </div>
      )}
      {error && (
        <p role="alert">
          This video could not be played. Check its URL, access permissions, and
          browser format support.
        </p>
      )}
      <small>
        Playback is personal to this visitor. Use the player controls for sound
        and fullscreen.
      </small>
    </div>
  );
}
export function ExhibitViewer() {
  const e = useGameStore((s) => s.activeExhibit),
    close = useGameStore((s) => s.closeExhibit);
  const ref = useDialog(!!e, close);
  const [revealed, setRevealed] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    setRevealed(false);
    setFailed(false);
  }, [e?.id]);
  if (!e) return null;
  return (
    <div
      ref={ref}
      className="viewer-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="viewer-title"
      onMouseDown={close}
    >
      <article
        className={`viewer ${e.type !== "photo" ? "special-viewer" : ""}`}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          className="viewer-close"
          onClick={close}
          aria-label="Close exhibit"
        >
          ×
        </button>
        {e.type === "photo" && (
          <div className="viewer-image-wrap">
            {failed ? (
              <p role="alert">This photograph is unavailable.</p>
            ) : (
              <img
                src={e.image}
                alt={e.title}
                onError={() => setFailed(true)}
              />
            )}
          </div>
        )}
        <div className="viewer-copy">
          <span>
            {e.type === "photo"
              ? e.date
              : `${rooms.find((r) => r.id === e.room)?.title} / A private collection`}
          </span>
          <h2 id="viewer-title">{e.title}</h2>
          {e.type === "photo" && <p>{e.caption}</p>}
          {e.type === "letter" && <p className="letter-body">{e.body}</p>}
          {e.type === "video" && (
            <FilmPlayer birthday={e.room === "birthday"} />
          )}
          {e.type === "surprise" && (
            <div className={`surprise ${revealed ? "revealed" : ""}`}>
              {!revealed ? (
                <>
                  <div className="gift-seal">M / U</div>
                  <p>One last thing, just for you.</p>
                  <button
                    className="enter-button"
                    onClick={() => setRevealed(true)}
                  >
                    Open your surprise <span>↗</span>
                  </button>
                </>
              ) : (
                <>
                  <span className="surprise-stars" aria-hidden="true">
                    ✧ &nbsp; ✦ &nbsp; ✧
                  </span>
                  <h3>To all the days ahead.</h3>
                  <p className="letter-body">{e.body}</p>
                  <p className="surprise-signature">With love, always.</p>
                </>
              )}
            </div>
          )}
          {e.placeholder && (
            <small className="placeholder-note">
              Editable placeholder · Your own photographs and words belong here.
            </small>
          )}
        </div>
      </article>
    </div>
  );
}
