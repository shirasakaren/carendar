import { buildCalendarMatrix, DAYS_SHORT_ID, dayKey } from "@/lib/date";
import { DayCell } from "./DayCell";
import type { Event } from "@/lib/types";

interface Props {
  year: number;
  monthIndex0: number;
  events: Event[];
  loading: boolean;
  onEventClick: (e: Event) => void;
  /** When set, day cells become selectable (click opens the day's events). */
  onDaySelect?: (date: Date) => void;
  /** When true, selectable cells also show a `+ Tambah` affordance (admin). */
  showAdd?: boolean;
  /** Today's date, threaded from a live clock so the highlight stays current. */
  today?: Date;
}

function groupByDay(events: Event[]): Map<string, Event[]> {
  const map = new Map<string, Event[]>();
  for (const ev of events) {
    const start = new Date(ev.start_datetime);
    const end = new Date(ev.end_datetime);
    const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    while (cursor <= endDay) {
      const k = dayKey(cursor);
      const arr = map.get(k);
      if (arr) arr.push(ev);
      else map.set(k, [ev]);
      cursor.setDate(cursor.getDate() + 1);
    }
  }
  for (const arr of map.values()) {
    arr.sort((a, b) => {
      // All-day events first, then by start time.
      if (a.is_all_day !== b.is_all_day) return a.is_all_day ? -1 : 1;
      return +new Date(a.start_datetime) - +new Date(b.start_datetime);
    });
  }
  return map;
}

export function CalendarGrid({
  year,
  monthIndex0,
  events,
  loading,
  onEventClick,
  onDaySelect,
  showAdd = false,
  today,
}: Props) {
  const matrix = buildCalendarMatrix(year, monthIndex0);
  const byDay = groupByDay(events);

  return (
    <div>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2 mb-2">
        {DAYS_SHORT_ID.map((d) => (
          <div
            key={d}
            className="text-caption text-ink-3 uppercase tracking-[0.08em] text-center font-medium py-1"
          >
            {d}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5 md:gap-2">
        {matrix.flatMap((week, wi) =>
          week.map((cell, di) => (
            <DayCell
              key={`${wi}-${di}`}
              date={cell.date}
              inCurrentMonth={cell.inCurrentMonth}
              events={byDay.get(dayKey(cell.date)) ?? []}
              loading={loading}
              onEventClick={onEventClick}
              onSelect={onDaySelect}
              showAdd={showAdd}
              today={today}
            />
          )),
        )}
      </div>
    </div>
  );
}
