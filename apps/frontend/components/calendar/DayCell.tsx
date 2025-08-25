import type { Event } from "@/lib/types";
import { EventChip } from "./EventChip";
import { Skeleton } from "../ui/Skeleton";
import { isToday, isSameDay } from "@/lib/date";
import { Plus } from "lucide-react";

interface Props {
  date: Date;
  inCurrentMonth: boolean;
  events: Event[];
  loading: boolean;
  onEventClick: (e: Event) => void;
  /**
   * When provided, the cell becomes selectable. Clicking anywhere on the
   * cell (except a chip) fires this handler.
   */
  onSelect?: (date: Date) => void;
  /**
   * When true (and the cell is selectable), reveals a `+ Tambah` affordance on
   * hover / keyboard focus. Used by the admin calendar.
   */
  showAdd?: boolean;
  /** Today's date, threaded from a live clock so the highlight stays current. */
  today?: Date;
}

const MAX_VISIBLE = 3;

export function DayCell({
  date,
  inCurrentMonth,
  events,
  loading,
  onEventClick,
  onSelect,
  showAdd = false,
  today,
}: Props) {
  const isCurrentDay = today ? isSameDay(date, today) : isToday(date);
  const dayNumber = date.getDate();
  const visible = events.slice(0, MAX_VISIBLE);
  const overflow = events.length - MAX_VISIBLE;

  const cellBg = inCurrentMonth ? "bg-white" : "bg-surface-muted";
  const numberColor = inCurrentMonth ? "text-ink" : "text-ink-4";
  const interactive = !!onSelect;

  return (
    <div
      onClick={interactive ? () => onSelect!(date) : undefined}
      className={`group relative flex flex-col gap-1 p-1.5 md:p-2 min-h-[96px] md:min-h-[120px] rounded border border-line ${cellBg} shadow-1 ${interactive ? "cursor-pointer hover:border-line-strong hover:shadow-2 transition-[box-shadow,border-color] duration-120" : ""}`}
    >
      <div className="flex items-center justify-between mb-0.5 px-0.5">
        {isCurrentDay ? (
          <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-brand-blue px-1.5 text-[13px] font-semibold tnum text-white">
            {dayNumber}
          </span>
        ) : (
          <span
            className={`inline-flex h-6 min-w-6 items-center justify-center text-[13px] font-semibold tnum ${numberColor}`}
          >
            {dayNumber}
          </span>
        )}
        {interactive && showAdd ? (
          <button
            type="button"
            tabIndex={inCurrentMonth ? 0 : -1}
            aria-label={`Tambah event pada ${dayNumber}`}
            onClick={(e) => {
              e.stopPropagation();
              onSelect!(date);
            }}
            className="inline-flex items-center gap-0.5 h-5 px-1.5 rounded-sm text-[11px] font-medium text-ink-3 hover:text-ink hover:bg-surface-muted transition-opacity duration-120 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
          >
            <Plus className="h-3 w-3" strokeWidth={2.25} aria-hidden="true" />
            Tambah
          </button>
        ) : null}
      </div>
      <div className="flex flex-col gap-1 overflow-hidden">
        {loading && inCurrentMonth ? (
          <Skeleton className="h-5 w-3/4" />
        ) : (
          visible.map((ev) => (
            <EventChip
              key={ev.id}
              event={ev}
              onClick={(e) => {
                e.stopPropagation();
                onEventClick(ev);
              }}
            />
          ))
        )}
        {!loading && overflow > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              if (interactive) {
                e.stopPropagation();
                onSelect!(date);
              }
            }}
            className="text-left text-[12px] font-medium text-ink-3 hover:text-ink px-2 py-0.5 rounded-sm hover:bg-surface-muted transition-colors"
          >
            +{overflow} lainnya
          </button>
        ) : null}
      </div>
    </div>
  );
}
