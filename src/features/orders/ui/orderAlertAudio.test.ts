import { afterEach, describe, expect, it, vi } from "vitest";

import { OrderAlertAudio } from "@/features/orders/ui/orderAlertAudio";

type MockAudioState = "suspended" | "running" | "closed";

function createMockAudioContext(initialState: MockAudioState = "suspended") {
  const oscillator = {
    type: "sine",
    frequency: { value: 0 },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  };
  const gain = {
    gain: {
      setValueAtTime: vi.fn(),
      exponentialRampToValueAtTime: vi.fn(),
    },
    connect: vi.fn(),
  };
  const ctx = {
    state: initialState as AudioContextState,
    currentTime: 0,
    destination: {},
    resume: vi.fn(async () => {
      ctx.state = "running";
    }),
    close: vi.fn(async () => {
      ctx.state = "closed";
    }),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    createOscillator: vi.fn(() => oscillator),
    createGain: vi.fn(() => gain),
  };
  return ctx;
}

describe("OrderAlertAudio", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("does not create AudioContext until a user-gesture unlock", async () => {
    const ctor = vi.fn(() => createMockAudioContext());
    vi.stubGlobal("AudioContext", ctor);
    const audio = new OrderAlertAudio();

    await audio.start();

    expect(ctor).not.toHaveBeenCalled();
    expect(audio.isUnlocked()).toBe(false);
    audio.dispose();
  });

  it("creates and resumes AudioContext on unlock, then beeps on start", async () => {
    const ctx = createMockAudioContext("suspended");
    const ctor = vi.fn(() => ctx);
    vi.stubGlobal("AudioContext", ctor);
    const audio = new OrderAlertAudio();

    await audio.start();
    const unlocked = await audio.unlock();

    expect(ctor).toHaveBeenCalledTimes(1);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(unlocked).toBe(true);
    expect(audio.isUnlocked()).toBe(true);
    expect(ctx.createOscillator).toHaveBeenCalled();
    audio.dispose();
  });

  it("resumes an existing context without creating a new one", async () => {
    const ctx = createMockAudioContext("running");
    const ctor = vi.fn(() => ctx);
    vi.stubGlobal("AudioContext", ctor);
    const audio = new OrderAlertAudio();

    await audio.unlock();
    ctx.state = "suspended";
    const resumed = await audio.resumeIfPossible();

    expect(ctor).toHaveBeenCalledTimes(1);
    expect(resumed).toBe(true);
    expect(ctx.state).toBe("running");
    audio.dispose();
  });

  it("start() resumes a previously unlocked context that the browser suspended", async () => {
    const ctx = createMockAudioContext("running");
    vi.stubGlobal("AudioContext", vi.fn(() => ctx));
    const audio = new OrderAlertAudio();

    await audio.unlock();
    expect(ctx.createOscillator).not.toHaveBeenCalled();

    ctx.state = "suspended";
    const started = await audio.start();

    expect(started).toBe(true);
    expect(ctx.resume).toHaveBeenCalledTimes(1);
    expect(ctx.createOscillator).toHaveBeenCalled();
    expect(audio.isUnlocked()).toBe(true);
    audio.dispose();
  });
});
