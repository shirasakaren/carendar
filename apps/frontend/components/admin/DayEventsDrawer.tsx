"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { X, Plus, Pencil } from "lucide-react";
import type { Event } from "@/lib/types";
import { Button } from "../ui/Button";
import { CATEGORY_BY_KEY } from "@/lib/categories";
import { formatDate, formatTime, dayKey } from "@/lib/date";

interface Props {
  open: boolean;
  date: Date | null;
  events: Event[];
  onClose: () => void;
}

export function DayEventsDrawer({ open, date, events, onClose }: Props) {
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !date) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Event ${formatDate(date)}`}
      className="fixed inset-0 z-50 flex justify-end"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[rgba(14,17,22,0.35)] mgm-backdrop-in" />
      <aside
        className="relative h-full w-full max-w-[440px] bg-white shadow-3 mgm-drawer-in flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 px-6 py-5 border-b border-line">
          <div>
            <p className="text-eyebrow uppercase tracking-[0.12em] text-ink-3 mb-1">
              {events.length === 0 ? "Tidak ada event" : `${events.length} event`}
            </p>
            <h2 className="font-display text-h2 text-ink tracking-tight">
              {formatDate(date)}
            </h2>
          </div>
          <button
            aria-label="Tutup"
            onClick={onClose}
            className="h-9 w-9 -mr-2 rounded grid place-items-center text-ink-2 hover:bg-surface-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
          >
            <X className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {events.length === 0 ? (
            <p className="text-body-sm text-ink-3">
              Belum ada event pada hari ini.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {events.map((ev) => (
                <li key={ev.id}>
                  <DrawerRow
                    event={ev}
                    onEdit={() => {
                      const id = ev.parent_event_id ?? ev.id;
                      router.push(`/admin/events/${id}/edit`);
                    }}
                  />
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="px-6 py-4 border-t border-line">
          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              const d = dayKey(date);
              router.push(`/admin/events/new?date=${d}`);
            }}
          >
            <Plus className="h-4 w-4" strokeWidth={2.25} />
            Tambah Event Baru
          </Button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}

function DrawerRow({ event, onEdit }: { event: Event; onEdit: () => void }) {
  const meta = CATEGORY_BY_KEY[event.category];
  const bg = event.color || meta?.defaultColor || "#3a6dc5";
  return (
    <div className="flex items-start gap-3 rounded-lg border border-line p-3 hover:border-line-strong transition-colors">
      <span
        className="mt-1 h-2.5 w-2.5 rounded-full shrink-0"
        style={{
          backgroundColor: bg,
          boxShadow: meta?.needsOutline ? "inset 0 0 0 1px var(--line-strong)" : undefined,
        }}
        aria-hidden="true"
      />
      <div className="flex-1 min-w-0">
        <p className="text-body-sm font-medium text-ink truncate">{event.title}</p>
        <p className="text-caption text-ink-3 mt-0.5">
          {event.is_all_day
            ? "Sepanjang Hari"
            : `${formatTime(event.start_datetime)} – ${formatTime(event.end_datetime)} WIB`}
          {!event.is_published ? (
            <span className="ml-2 inline-flex h-4 items-center px-1.5 rounded-sm bg-brand-yellow-50 text-[10px] font-semibold text-[#8a6d18] uppercase tracking-wider">
              Draft
            </span>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onEdit}
        aria-label={`Edit ${event.title}`}
        className="inline-flex items-center gap-1 h-7 px-2 rounded-sm text-caption font-medium text-brand-blue hover:bg-brand-blue-50 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
      >
        <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
        Edit
      </button>
    </div>
  );
}
