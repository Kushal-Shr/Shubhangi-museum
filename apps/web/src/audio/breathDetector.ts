/** Local signal features; no audio is recorded or sent to the server. */
export function breathFeatures(samples: Float32Array, spectrum: Float32Array) {
  let sum = 0,
    crossings = 0,
    arithmetic = 0,
    logarithmic = 0,
    bins = 0;
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i]! ** 2;
    if (i && samples[i]! >= 0 !== samples[i - 1]! >= 0) crossings++;
  }
  // Ignore DC and very low bins: a steady hum should not resemble breath.
  // Analyse the useful breath band rather than silent ultrasonic bins.
  for (let i = 4; i < Math.max(8, Math.floor(spectrum.length / 6)); i++) {
    const power = Math.max(1e-12, 10 ** (spectrum[i]! / 10));
    arithmetic += power;
    logarithmic += Math.log(power);
    bins++;
  }
  return {
    rms: Math.sqrt(sum / Math.max(1, samples.length)),
    crossings: crossings / Math.max(1, samples.length),
    flatness:
      Math.exp(logarithmic / Math.max(1, bins)) /
      Math.max(1e-12, arithmetic / Math.max(1, bins)),
  };
}

export class BreathDetector {
  private baseline = 0;
  private calibrationFrames = 0;
  private sustained = 0;
  private previous = 0;
  private fired = false;
  constructor(
    private startedAt: number,
    private sensitivity = 2.6,
  ) {}
  update(now: number, features: ReturnType<typeof breathFeatures>) {
    const dt = this.previous
      ? Math.min(80, Math.max(0, now - this.previous))
      : 0;
    this.previous = now;
    if (now - this.startedAt < 1000) {
      this.baseline += features.rms;
      this.calibrationFrames++;
      return { calibrating: true, level: 0, progress: 0, detected: false };
    }
    const noise = this.baseline / Math.max(1, this.calibrationFrames);
    const threshold = Math.max(0.018, noise * this.sensitivity);
    const level = Math.min(1, features.rms / threshold);
    const noisy = features.flatness > 0.025 && features.crossings > 0.02;
    this.sustained =
      features.rms > threshold && noisy
        ? this.sustained + dt
        : Math.max(0, this.sustained - dt * 2);
    const detected = !this.fired && this.sustained >= 450;
    if (detected) this.fired = true;
    return {
      calibrating: false,
      level,
      progress: Math.min(1, this.sustained / 450),
      detected,
    };
  }
}
