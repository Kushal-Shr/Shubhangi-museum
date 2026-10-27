import { lazy, Suspense, useState, type FormEvent } from "react";
import { ROLE_MODELS, type VisitorRole } from "@museum/shared";
import { useGameStore } from "../store/gameStore";
import { SceneBoundary } from "./SceneBoundary";
const CharacterPreview = lazy(() => import("./CharacterPreview"));
const portals = [
  {
    role: "girlfriend" as const,
    query: "her",
    name: "Shubhangi",
    subtitle: "Your birthday gift",
    mark: "♡",
  },
  {
    role: "host" as const,
    query: "him",
    name: "Kushal",
    subtitle: "Made for Shubhangi",
    mark: "✦",
  },
  {
    role: "guest" as const,
    query: "guests",
    name: "Our guests",
    subtitle: "Friends and family",
    mark: "✿",
  },
];
export function Welcome({ prepare }: { prepare?: () => void }) {
  const saved = useGameStore((s) => s.profile);
  const error = useGameStore((s) => s.connectionMessage);
  const initial =
    portals.find(
      (p) => p.query === new URLSearchParams(location.search).get("portal"),
    )?.role ?? "guest";
  const privateName = (portalRole: VisitorRole) =>
    portalRole === "girlfriend"
      ? "Shubhangi"
      : portalRole === "host"
        ? "Kushal"
        : "";
  const [role, setRole] = useState<VisitorRole>(initial);
  const [profile, setProfile] = useState({
    ...saved,
    displayName: privateName(initial) || saved.displayName,
    modelId: ROLE_MODELS[initial] as string,
  });
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const selectPortal = (next: VisitorRole) => {
    setRole(next);
    setPassword("");
    setShowPassword(false);
    setProfile((p) => ({
      ...p,
      displayName: privateName(next) || (role === "guest" ? p.displayName : ""),
      modelId: ROLE_MODELS[next],
    }));
    useGameStore.getState().setConnection("idle", "");
    history.replaceState(
      null,
      "",
      `?portal=${portals.find((p) => p.role === next)!.query}`,
    );
  };
  const submit = (event: FormEvent) => {
    event.preventDefault();
    const displayName = profile.displayName
      .replace(/[^a-zA-Z0-9 '\-]/g, "")
      .trim()
      .slice(0, 20);
    if (!displayName || (role !== "guest" && !password)) return;
    const store = useGameStore.getState();
    store.setProfile({ ...profile, displayName });
    store.setPortal(role, password);
    store.enter();
  };
  return (
    <main className="pink-welcome">
      <div className="welcome-orbit orbit-one" />
      <div className="welcome-orbit orbit-two" />
      <header className="pink-masthead">
        <a href="/" className="pink-wordmark" aria-label="Kushal and Shubhangi — home">
          k<span>♡</span>s
        </a>
        <span>FROM KUSHAL, FOR SHUBHANGI</span>
        <span className="edition">WITH ALL MY LOVE</span>
      </header>
      <div className="pink-invitation">
        <section className="pink-intro">
          <span className="pink-eyebrow">
            HAPPY BIRTHDAY, MY LOVE
          </span>
          <h1>
            Shubhangi,
            <br />
            <em>I love you.</em>
          </h1>
          <p>
            I wanted to give you something I made just for you.
          </p>
          <nav className="portal-tabs" aria-label="Choose your entrance">
            {portals.map((p) => (
              <button
                key={p.role}
                aria-pressed={role === p.role}
                onClick={() => selectPortal(p.role)}
              >
                <span aria-hidden="true">{p.mark}</span>
                <strong>{p.name}</strong>
                <small>{p.subtitle}</small>
              </button>
            ))}
          </nav>
          <form className="portal-form" onSubmit={submit}>
            <div className="portal-form-heading">
              <span>
                {role === "girlfriend"
                  ? "SHUBHANGI’S ENTRANCE"
                  : role === "host"
                    ? "KUSHAL’S ENTRANCE"
                    : "CELEBRATE WITH US"}
              </span>
              <h2>
                {role === "girlfriend"
                  ? "Come in, Shubhangi."
                  : role === "host"
                    ? "Welcome, Kushal."
                    : "We’re glad you’re here."}
              </h2>
            </div>
            <label>
              Your name
              <input
                required
                maxLength={20}
                autoComplete="nickname"
                placeholder="What should we call you?"
                value={profile.displayName}
                readOnly={role !== "guest"}
                onChange={(e) =>
                  setProfile({ ...profile, displayName: e.target.value })
                }
              />
            </label>
            {role !== "guest" && (
              <label>
                Password
                <div className="portal-password">
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    maxLength={256}
                    value={password}
                    autoComplete="current-password"
                    placeholder="Enter your password"
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                </div>
              </label>
            )}
            {error && (
              <p className="portal-error" role="alert">
                {error}
              </p>
            )}
            <button
              className="pink-enter"
              type="submit"
              onPointerEnter={prepare}
              onFocus={prepare}
            >
              {role === "girlfriend"
                ? "See what Kushal made"
                : role === "host"
                  ? "Join Shubhangi"
                  : "Celebrate Shubhangi"}
              <span>↗</span>
            </button>
            <small>
              {role === "host"
                ? "Everything here is for Shubhangi."
                : role === "girlfriend"
                  ? "I hope you feel loved every time you come back."
                  : "Thank you for being part of Shubhangi’s birthday."}
            </small>
          </form>
        </section>
        <section className="character-stage">
          <div className="stage-halo" />
          <div className="stage-sparkle sparkle-one">✦</div>
          <div className="stage-sparkle sparkle-two">♡</div>
          <span className="stage-caption">WALK THROUGH THE MUSEUM</span>
          <SceneBoundary>
            <Suspense
              fallback={
                <div className="character-loading">
                  Loading your character…
                </div>
              }
            >
              <CharacterPreview profile={profile} />
            </Suspense>
          </SceneBoundary>
          <div className="stage-pedestal" />
          <div className="character-identity">
            <span>
              {role === "girlfriend"
                ? "WITH ALL MY LOVE"
                : role === "host"
                  ? "FOR SHUBHANGI"
                  : "CELEBRATING SHUBHANGI"}
            </span>
            <h2>
              {role === "girlfriend"
                ? "Shubhangi"
                : role === "host"
                  ? "Kushal"
                  : profile.displayName.trim() || "Our guest"}
            </h2>
            <p>
              {role === "girlfriend"
                ? "I hope this makes you smile. Making it for you means a lot to me."
                : role === "host"
                  ? "I made this because I love you, Shubhangi."
                  : "Choose a character and come celebrate with Kushal and Shubhangi."}
            </p>
            {role === "guest" && (
              <div
                className="guest-choices"
                aria-label="Choose a guest character"
              >
                {["guest-female", "guest-male"].map((id) => (
                  <button
                    key={id}
                    type="button"
                    aria-pressed={profile.modelId === id}
                    onClick={() => setProfile({ ...profile, modelId: id })}
                  >
                    {id === "guest-female" ? "Girl" : "Guy"}
                  </button>
                ))}
              </div>
            )}
            <small>Drag to turn your character</small>
          </div>
        </section>
      </div>
      <footer className="pink-footer">
        <span>KUSHAL &amp; SHUBHANGI</span>
        <span>OUR PHOTOS</span>
        <span>HAPPY BIRTHDAY, SHUBHANGI</span>
        <a href="/models/credits.html" target="_blank" rel="noreferrer">
          Character credits
        </a>
      </footer>
    </main>
  );
}
