"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { wibNowParts } from "@/lib/date";

/** Live WIB (Asia/Jakarta) wall clock, ticking every second. */
export function WIBClock() {
  // Starts null so SSR and the first client render match (no hydration
  // mismatch); the real time appears once mounted.
  const [now, setNow] = useState<{ hour: number; minute: number; second: number } | null>(null);

  useEffect(() => {
    const tick = () => setNow(wibNowParts());
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const pad = (n: number) => n.toString().padStart(2, "0");
  const time = now ? `${pad(now.hour)}:${pad(now.minute)}:${pad(now.second)}` : "--:--:--";

  return (
    <div
      className="inline-flex items-center gap-1.5 h-10 px-3 rounded border border-line bg-white text-body-sm font-medium text-ink-2"
      aria-label="Waktu saat ini (WIB)"
      title="Waktu Indonesia Barat"
    >
      <Clock className="h-4 w-4 text-ink-3" strokeWidth={2.25} aria-hidden="true" />
      <span className="tnum tabular-nums">{time}</span>
      <span className="text-ink-4">WIB</span>
    </div>
  );
}
