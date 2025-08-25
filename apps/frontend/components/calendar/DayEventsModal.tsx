"use client";

import { Modal } from "../ui/Modal";
import type { Event } from "@/lib/types";
import { CATEGORY_BY_KEY } from "@/lib/categories";
import { formatDate, formatTime } from "@/lib/date";

interface Props {
  open: boolean;
  date: Date | null;
  events: Event[];
  onClose: () => void;
  /** Called when a row is picked — open the full event detail. */
  onPick: (e: Event) => void;
}

export function DayEventsModal({ open, date, events, onClose, onPick }: Props) {
  if (!open || !date) return null;

  return (
    <Modal open={open} onClose={onClose} ariaLabel={`Event ${formatDate(date)}`} size="md">
      <div className="p-6 md:p-7">
        <p className="text-eyebrow uppercase tracking-[0.12em] text-ink-3 mb-1">
          {events.length === 0 ? "Tidak ada event" : `${events.length} event`}
        </p>
        <h2 className="font-display text-h2 text-ink tracking-tight mb-5">
          {formatDate(date)}
        </h2>

        {events.length === 0 ? (
          <p className="text-body-sm text-ink-3">Belum ada event pada hari ini.</p>
        ) : (
          <ul className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto -mr-2 pr-2">
            {events.map((ev) => (
              <li key={ev.id}>
                <Row event={ev} onClick={() => onPick(ev)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </Modal>
  );
}

function Row({ event, onClick }: { event: Event; onClick: () => void }) {
  const meta = CATEGORY_BY_KEY[event.category];
  const bg = event.color || meta?.defaultColor || "#3a6dc5";
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-start gap-3 rounded-lg border border-line p-3 text-left hover:border-line-strong hover:bg-surface-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
    >
      <span
        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
        style={{
          backgroundColor: bg,
          boxShadow: meta?.needsOutline ? "inset 0 0 0 1px var(--line-strong)" : undefined,
        }}
        aria-hidden="true"
      />
      <span className="flex-1 min-w-0">
        <span className="block text-body-sm font-medium text-ink truncate">{event.title}</span>
        <span className="block text-caption text-ink-3 mt-0.5">
          {event.is_all_day
            ? "Sepanjang Hari"
            : `${formatTime(event.start_datetime)} – ${formatTime(event.end_datetime)} WIB`}
          {meta ? <span className="text-ink-4"> · {meta.label}</span> : null}
        </span>
      </span>
    </button>
  );
}
