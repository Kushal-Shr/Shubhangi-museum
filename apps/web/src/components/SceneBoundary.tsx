import { Component, type ReactNode } from "react";
export class SceneBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  override state = { error: false };
  static getDerivedStateFromError() {
    return { error: true };
  }
  override render() {
    return this.state.error ? (
      <div className="scene-loading" role="alert">
        <div>
          <p>The museum could not start on this device.</p>
          <p>Check that WebGL is available, then try again.</p>
          <button className="enter-button" onClick={() => location.reload()}>
            Reload museum
          </button>
        </div>
      </div>
    ) : (
      this.props.children
    );
  }
}
