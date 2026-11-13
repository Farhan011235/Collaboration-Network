"use client";

import { useEffect, useRef } from "react";

// Default cadence for background refreshes. Short enough to feel live on a
// shared page, light enough not to hammer the API. Note: browsers throttle
// timers in hidden/background tabs, so the real guarantee for "no reload" is
// the focus/visibility refetch below - a tab refreshes the instant it's
// viewed, and this interval keeps an already-open, visible tab current.
const DEFAULT_INTERVAL_MS = 10_000;

interface LivePollOptions {
  enabled?: boolean;
  intervalMs?: number;
}

/**
 * Keeps a page's data fresh without a manual reload: runs `refresh` on an
 * interval and again whenever the tab regains focus. `refresh` should be a
 * "silent" reload - it updates data in place, without toggling a loading
 * spinner or disturbing open forms. Overlapping runs are skipped, and the
 * latest `refresh` is always used so it can close over current state.
 */
export function useLivePoll(
  refresh: () => void | Promise<void>,
  { enabled = true, intervalMs = DEFAULT_INTERVAL_MS }: LivePollOptions = {}
) {
  const saved = useRef(refresh);
  saved.current = refresh;
  const running = useRef(false);

  useEffect(() => {
    if (!enabled) return;

    const tick = async () => {
      if (running.current) return;
      running.current = true;
      try {
        await saved.current();
      } finally {
        running.current = false;
      }
    };

    const timer = setInterval(tick, intervalMs);

    // Refetch immediately when the user returns to the tab/window.
    const onVisible = () => {
      if (document.visibilityState === "visible") tick();
    };
    window.addEventListener("focus", onVisible);
    document.addEventListener("visibilitychange", onVisible);

    return () => {
      clearInterval(timer);
      window.removeEventListener("focus", onVisible);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, intervalMs]);
}
