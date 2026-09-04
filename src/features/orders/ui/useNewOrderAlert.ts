"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  pollNewOrderAlertsAction,
  type NewOrderAlertDto,
} from "@/features/orders/application/poll-new-order-alerts";
import { OrderAlertAudio } from "@/features/orders/ui/orderAlertAudio";
import {
  acknowledgeOrderIds,
  isOrderAcknowledged,
  loadOrderAlertStorage,
  type OrderAlertStorageState,
} from "@/features/orders/ui/orderAlertStorage";
import { shouldPollNewOrderAlerts } from "@/features/orders/ui/should-poll-new-order-alerts";

/** Visible cashier tab only. Hidden tabs must not POST the admin URL. */
const POLL_INTERVAL_MS = 30_000;
const GESTURE_EVENTS = [
  "pointerdown",
  "keydown",
  "touchstart",
] as const satisfies ReadonlyArray<keyof DocumentEventMap>;

type UseNewOrderAlertOptions = {
  locale: string;
};

type UseNewOrderAlertResult = {
  current: NewOrderAlertDto | null;
  remainingCount: number;
  audioBlocked: boolean;
  /** True until a user gesture has unlocked Web Audio in this document. */
  needsUnlock: boolean;
  /** Dismisses every queued alert in one action (sound + overlay). */
  acknowledgeAll: () => void;
  unlockAudio: () => void;
};

function filterUnackedQueue(
  orders: NewOrderAlertDto[],
  storage: OrderAlertStorageState,
): NewOrderAlertDto[] {
  const baselineMs = Date.parse(storage.baselineAt);
  return orders.filter((order) => {
    if (isOrderAcknowledged(storage, order.id)) {
      return false;
    }
    const placedMs = Date.parse(order.placedAt);
    if (Number.isNaN(placedMs) || Number.isNaN(baselineMs)) {
      return false;
    }
    return placedMs >= baselineMs;
  });
}

function bindGestureUnlock(
  audio: OrderAlertAudio,
  skipAckClickRef: { current: boolean },
  applyLockState: (running: boolean) => void,
): () => void {
  const unlockOnGesture = () => {
    const wasLocked = !audio.isUnlocked();
    void audio.unlock().then((ok) => {
      applyLockState(ok);
    });
    if (wasLocked) {
      skipAckClickRef.current = true;
    }
  };
  const clearSkipAck = () => {
    skipAckClickRef.current = false;
  };

  for (const eventName of GESTURE_EVENTS) {
    document.addEventListener(eventName, unlockOnGesture, {
      capture: true,
      passive: true,
    });
  }
  document.addEventListener("click", clearSkipAck);

  return () => {
    document.removeEventListener("click", clearSkipAck);
    for (const eventName of GESTURE_EVENTS) {
      document.removeEventListener(eventName, unlockOnGesture, true);
    }
  };
}

function attachOrderAlertAudio(options: {
  audio: OrderAlertAudio;
  skipAckClickRef: { current: boolean };
  hasUnackedRef: { current: boolean };
  applyLockState: (running: boolean) => void;
  refreshQueue: () => void;
}): () => void {
  const { audio, skipAckClickRef, hasUnackedRef, applyLockState, refreshQueue } =
    options;
  const unbindGestures = bindGestureUnlock(
    audio,
    skipAckClickRef,
    applyLockState,
  );

  const pollId = window.setInterval(() => {
    if (!shouldPollNewOrderAlerts(document.visibilityState)) {
      return;
    }
    void refreshQueue();
  }, POLL_INTERVAL_MS);

  const onVisibility = () => {
    if (document.visibilityState !== "visible") {
      return;
    }
    void refreshQueue();
    void audio.resumeIfPossible().then((ok) => {
      applyLockState(ok);
      if (ok && hasUnackedRef.current) {
        void audio.start();
      }
    });
  };
  document.addEventListener("visibilitychange", onVisibility);

  return () => {
    window.clearInterval(pollId);
    document.removeEventListener("visibilitychange", onVisibility);
    unbindGestures();
    audio.dispose();
  };
}

/** Polls for new orders and drives the FIFO alert queue + looping sound. */
export function useNewOrderAlert({
  locale,
}: UseNewOrderAlertOptions): UseNewOrderAlertResult {
  const [queue, setQueue] = useState<NewOrderAlertDto[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const [needsUnlock, setNeedsUnlock] = useState(true);
  const storageRef = useRef<OrderAlertStorageState | null>(null);
  const audioRef = useRef<OrderAlertAudio | null>(null);
  const hasUnackedRef = useRef(false);
  const pollInFlightRef = useRef(false);
  const skipAckClickRef = useRef(false);

  const applyLockState = useCallback((running: boolean) => {
    setNeedsUnlock(!running);
    setAudioBlocked(!running && hasUnackedRef.current);
  }, []);

  const syncAudio = useCallback(
    (hasUnacked: boolean) => {
      hasUnackedRef.current = hasUnacked;
      const audio = audioRef.current;
      if (!audio) {
        return;
      }

      if (!hasUnacked) {
        audio.stop();
        setAudioBlocked(false);
        setNeedsUnlock(!audio.isUnlocked());
        return;
      }

      void audio.start().then((ok) => {
        applyLockState(ok);
      });
    },
    [applyLockState],
  );

  const refreshQueue = useCallback(async () => {
    if (pollInFlightRef.current) {
      return;
    }
    pollInFlightRef.current = true;

    try {
      if (!storageRef.current) {
        storageRef.current = loadOrderAlertStorage();
      }

      const result = await pollNewOrderAlertsAction(locale);
      if (!result.ok) {
        return;
      }

      const nextQueue = filterUnackedQueue(
        result.value.orders,
        storageRef.current,
      );
      setQueue(nextQueue);
      syncAudio(nextQueue.length > 0);
    } catch {
      // Auth redirect / network errors — keep current queue and retry next tick.
    } finally {
      pollInFlightRef.current = false;
    }
  }, [locale, syncAudio]);

  useEffect(() => {
    storageRef.current = loadOrderAlertStorage();
    const audio = new OrderAlertAudio();
    audioRef.current = audio;
    if (shouldPollNewOrderAlerts(document.visibilityState)) {
      void refreshQueue();
    }
    const detach = attachOrderAlertAudio({
      audio,
      skipAckClickRef,
      hasUnackedRef,
      applyLockState,
      refreshQueue,
    });
    return () => {
      detach();
      audioRef.current = null;
    };
  }, [applyLockState, refreshQueue]);

  const unlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    void audio.unlock().then((ok) => {
      if (hasUnackedRef.current) {
        void audio.start();
      }
      applyLockState(ok);
    });
  }, [applyLockState]);

  const acknowledgeAll = useCallback(() => {
    const audio = audioRef.current;
    if (skipAckClickRef.current || (audio && !audio.isUnlocked())) {
      skipAckClickRef.current = false;
      unlockAudio();
      return;
    }

    if (queue.length === 0) {
      return;
    }

    const storage = storageRef.current ?? loadOrderAlertStorage();
    storageRef.current = acknowledgeOrderIds(
      storage,
      queue.map((order) => order.id),
    );

    setQueue([]);
    syncAudio(false);
  }, [queue, syncAudio, unlockAudio]);

  return {
    current: queue[0] ?? null,
    remainingCount: queue.length,
    audioBlocked,
    needsUnlock,
    acknowledgeAll,
    unlockAudio,
  };
}
