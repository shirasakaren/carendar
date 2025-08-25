"use client";

import { Lock, RefreshCw } from "lucide-react";
import { Button } from "../ui/Button";
import { Wordmark } from "./Wordmark";
import { PatternCorner } from "./PatternCorner";
import { MONTHS_ID } from "@/lib/date";

interface Props {
  year: number;
  monthIndex0: number;
  /** When omitted, the Admin Panel button is hidden. */
  onAdminClick?: () => void;
  /** When omitted, the Sync button is hidden. */
  onSyncClick?: () => void;
}

export function PageHeader({ year, monthIndex0, onAdminClick, onSyncClick }: Props) {
  const hasActions = !!onSyncClick || !!onAdminClick;
  return (
    <header className="relative overflow-hidden border-b border-line bg-white">
      {/* Pattern lives in the top-right corner, ~20% of the header. Decorative only. */}
      <PatternCorner
        corner="tr"
        className="pointer-events-none absolute -top-4 -right-4 h-[160px] w-[160px] md:h-[200px] md:w-[200px] opacity-95"
      />
      <div className="relative max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-8 md:py-10">
        <div className="flex items-center justify-between gap-6">
          <Wordmark />
          {hasActions ? (
            <div className="flex items-center gap-2">
              {onSyncClick ? (
                <Button variant="secondary" size="md" onClick={onSyncClick}>
                  <RefreshCw className="w-4 h-4" strokeWidth={2.25} />
                  <span className="hidden sm:inline">Sync Kalender</span>
                </Button>
              ) : null}
              {onAdminClick ? (
                <Button variant="secondary" size="md" onClick={onAdminClick}>
                  <Lock className="w-4 h-4" strokeWidth={2.25} />
                  <span className="hidden sm:inline">Admin Panel</span>
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
        <h1 className="mt-8 md:mt-10 font-display text-display-lg md:text-display-xl text-ink leading-[1.05] tracking-tight">
          {MONTHS_ID[monthIndex0]} <span className="text-ink-3 font-normal tnum">{year}</span>
        </h1>
      </div>
    </header>
  );
}
