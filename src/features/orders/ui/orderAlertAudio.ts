const BEEP_INTERVAL_MS = 1400;
const BEEP_DURATION_SEC = 0.22;
const BEEP_FREQUENCY_HZ = 880;
const BEEP_GAIN = 0.12;

/**
 * Looping Web Audio beep for the admin new-order alert.
 * Create/resume the context only from a user gesture (browser autoplay policy).
 */
export class OrderAlertAudio {
  private context: AudioContext | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private wantsPlaying = false;
  private stateListenerBound = false;

  isUnlocked(): boolean {
    return this.context?.state === "running";
  }

  /** Call from a user gesture (click / key / touch). Creates the context here for iOS. */
  async unlock(): Promise<boolean> {
    try {
      const ctx = this.ensureContextFromGesture();
      this.bindStateListener(ctx);
      if (ctx.state !== "running" && ctx.state !== "closed") {
        await ctx.resume();
      }
    } catch {
      return false;
    }
    return this.afterRunningCheck();
  }

  /**
   * Resume after tab focus. Works without a new gesture if this document
   * already unlocked audio.
   */
  async resumeIfPossible(): Promise<boolean> {
    if (!this.context || this.context.state === "closed") {
      return false;
    }
    if (this.context.state === "running") {
      return this.afterRunningCheck();
    }
    try {
      await this.context.resume();
    } catch {
      return false;
    }
    return this.afterRunningCheck();
  }

  start(): void {
    this.wantsPlaying = true;
    if (this.isUnlocked()) {
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
      this.context.removeEventListener("statechange", this.handleStateChange);
      void this.context.close();
      this.context = null;
    }
    this.stateListenerBound = false;
  }

  /** Must run inside a user-gesture stack (iOS). */
  private ensureContextFromGesture(): AudioContext {
    if (!this.context || this.context.state === "closed") {
      this.context = new AudioContext();
      this.stateListenerBound = false;
    }
    return this.context;
  }

  private bindStateListener(ctx: AudioContext): void {
    if (this.stateListenerBound) {
      return;
    }
    ctx.addEventListener("statechange", this.handleStateChange);
    this.stateListenerBound = true;
  }

  private afterRunningCheck(): boolean {
    const running = this.isUnlocked();
    if (running && this.wantsPlaying) {
      this.startLoopInternal();
    }
    return running;
  }

  private handleStateChange = (): void => {
    if (this.context?.state === "running" && this.wantsPlaying) {
      this.startLoopInternal();
      return;
    }
    if (this.context?.state !== "running") {
      this.clearLoop();
    }
  };

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
