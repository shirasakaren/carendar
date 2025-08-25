"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "../ui/Button";

interface Props {
  onPrev: () => void;
  onToday: () => void;
  onNext: () => void;
}

/** Prev / Hari Ini / Next cluster, shown on the month-selector row. */
export function CalendarNav({ onPrev, onToday, onNext }: Props) {
  return (
    <div className="flex items-center gap-1.5">
      <Button variant="secondary" size="md" onClick={onPrev} aria-label="Bulan sebelumnya">
        <ChevronLeft className="w-4 h-4" strokeWidth={2.25} />
        <span className="hidden sm:inline">Sebelumnya</span>
      </Button>
      <Button variant="secondary" size="md" onClick={onToday} aria-label="Kembali ke bulan ini">
        Hari Ini
      </Button>
      <Button variant="secondary" size="md" onClick={onNext} aria-label="Bulan berikutnya">
        <span className="hidden sm:inline">Berikutnya</span>
        <ChevronRight className="w-4 h-4" strokeWidth={2.25} />
      </Button>
    </div>
  );
}
