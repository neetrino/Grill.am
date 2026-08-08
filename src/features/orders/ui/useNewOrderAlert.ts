"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import {
  pollNewOrderAlertsAction,
  type NewOrderAlertDto,
} from "@/features/orders/application/poll-new-order-alerts";
import { OrderAlertAudio } from "@/features/orders/ui/orderAlertAudio";
import {
  acknowledgeOrderId,
  isOrderAcknowledged,
  loadOrderAlertStorage,
  type OrderAlertStorageState,
} from "@/features/orders/ui/orderAlertStorage";

const POLL_INTERVAL_MS = 7_000;

type UseNewOrderAlertOptions = {
  locale: string;
};

type UseNewOrderAlertResult = {
  current: NewOrderAlertDto | null;
  remainingCount: number;
  audioBlocked: boolean;
  acknowledgeCurrent: () => void;
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

/** Polls for new orders and drives the FIFO alert queue + looping sound. */
export function useNewOrderAlert({
  locale,
}: UseNewOrderAlertOptions): UseNewOrderAlertResult {
  const [queue, setQueue] = useState<NewOrderAlertDto[]>([]);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const storageRef = useRef<OrderAlertStorageState | null>(null);
  const audioRef = useRef<OrderAlertAudio | null>(null);
  const hasUnackedRef = useRef(false);
  const pollInFlightRef = useRef(false);

  const syncAudio = useCallback((hasUnacked: boolean) => {
    hasUnackedRef.current = hasUnacked;
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!hasUnacked) {
      audio.stop();
      setAudioBlocked(false);
      return;
    }

    audio.start();
    setAudioBlocked(!audio.isUnlocked());
  }, []);

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

    const unlockOnGesture = () => {
      void audio.unlock().then((ok) => {
        setAudioBlocked(!ok && hasUnackedRef.current);
      });
    };

    const gestureEvents: Array<keyof DocumentEventMap> = [
      "pointerdown",
      "keydown",
      "touchstart",
    ];
    for (const eventName of gestureEvents) {
      document.addEventListener(eventName, unlockOnGesture, {
        capture: true,
        passive: true,
      });
    }

    void refreshQueue();

    const pollId = window.setInterval(() => {
      void refreshQueue();
    }, POLL_INTERVAL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") {
        void refreshQueue();
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(pollId);
      document.removeEventListener("visibilitychange", onVisibility);
      for (const eventName of gestureEvents) {
        document.removeEventListener(eventName, unlockOnGesture, true);
      }
      audio.dispose();
      audioRef.current = null;
    };
  }, [refreshQueue]);

  const unlockAudio = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }
    void audio.unlock().then((ok) => {
      if (hasUnackedRef.current) {
        audio.start();
      }
      setAudioBlocked(!ok && hasUnackedRef.current);
    });
  }, []);

  const acknowledgeCurrent = useCallback(() => {
    const current = queue[0];
    if (!current) {
      return;
    }

    unlockAudio();

    const storage = storageRef.current ?? loadOrderAlertStorage();
    storageRef.current = acknowledgeOrderId(storage, current.id);

    setQueue((prev) => {
      const next = prev.filter((order) => order.id !== current.id);
      syncAudio(next.length > 0);
      return next;
    });
  }, [queue, syncAudio, unlockAudio]);

  return {
    current: queue[0] ?? null,
    remainingCount: queue.length,
    audioBlocked,
    acknowledgeCurrent,
    unlockAudio,
  };
}
