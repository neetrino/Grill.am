const BEEP_INTERVAL_MS = 1400;
const BEEP_DURATION_SEC = 0.22;
const BEEP_FREQUENCY_HZ = 880;
const BEEP_GAIN = 0.12;

/**
 * Looping Web Audio beep for the admin new-order alert.
 * Requires a user gesture to unlock (browser autoplay policy).
 */
export class OrderAlertAudio {
  private context: AudioContext | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private wantsPlaying = false;
  private unlocked = false;

  isUnlocked(): boolean {
    return this.unlocked;
  }

  /** Call from a user gesture (click / key / touch). */
  async unlock(): Promise<boolean> {
    const ctx = this.ensureContext();
    try {
      await ctx.resume();
    } catch {
      this.unlocked = false;
      return false;
    }
    this.unlocked = ctx.state === "running";
    if (this.wantsPlaying && this.unlocked) {
      this.startLoopInternal();
    }
    return this.unlocked;
  }

  start(): void {
    this.wantsPlaying = true;
    const ctx = this.ensureContext();
    if (ctx.state === "suspended") {
      void ctx.resume().then(() => {
        this.unlocked = ctx.state === "running";
        if (this.wantsPlaying && this.unlocked) {
          this.startLoopInternal();
        }
      });
      return;
    }

    this.unlocked = ctx.state === "running";
    if (this.unlocked) {
      this.startLoopInternal();
    }
  }

  stop(): void {
    this.wantsPlaying = false;
    this.clearLoop();
  }

  dispose(): void {
    this.stop();
    if (this.context) {
      void this.context.close();
      this.context = null;
    }
    this.unlocked = false;
  }

  private ensureContext(): AudioContext {
    if (!this.context) {
      this.context = new AudioContext();
    }
    return this.context;
  }

  private startLoopInternal(): void {
    if (this.loopTimer !== null) {
      return;
    }
    this.playBeep();
    this.loopTimer = setInterval(() => {
      if (!this.wantsPlaying) {
        return;
      }
      this.playBeep();
    }, BEEP_INTERVAL_MS);
  }

  private clearLoop(): void {
    if (this.loopTimer !== null) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  private playBeep(): void {
    const ctx = this.context;
    if (!ctx || ctx.state !== "running") {
      return;
    }

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = BEEP_FREQUENCY_HZ;
    gain.gain.setValueAtTime(BEEP_GAIN, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      ctx.currentTime + BEEP_DURATION_SEC,
    );
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + BEEP_DURATION_SEC);
  }
}
