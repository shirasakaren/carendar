"use client";

import { useEffect, useState } from "react";
import { dayKey, wibToday } from "./date";

/**
 * Returns today's date in WIB (Asia/Jakarta) and re-renders the caller when the
 * WIB calendar day rolls over, or when the tab regains focus / visibility.
 * Computing in WIB (not the device timezone) keeps the "today" highlight on the
 * correct day even when the device clock isn't set to GMT+7.
 */
export function useToday(): Date {
  const [today, setToday] = useState<Date>(() => wibToday());

  useEffect(() => {
    const sync = () => {
      setToday((prev) => {
        const next = wibToday();
        return dayKey(prev) === dayKey(next) ? prev : next;
      });
    };

    // A 30s poll catches the WIB midnight rollover without per-second churn.
    const id = setInterval(sync, 30_000);

    const onVisible = () => {
      if (document.visibilityState === "visible") sync();
    };

    document.addEventListener("visibilitychange", onVisible);
    window.addEventListener("focus", sync);

    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
      window.removeEventListener("focus", sync);
    };
  }, []);

  return today;
}
