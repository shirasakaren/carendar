"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "../layout/PageHeader";
import { MonthJump } from "./MonthJump";
import { CalendarNav } from "./CalendarNav";
import { WIBClock } from "./WIBClock";
import { CalendarGrid } from "./CalendarGrid";
import { Legend } from "./Legend";
import { EventDetailModal } from "./EventDetailModal";
import { DayEventsModal } from "./DayEventsModal";
import { SyncCalendarModal } from "./SyncCalendarModal";
import { AdminAccessModal } from "../admin/AdminAccessModal";
import { fetchEventsByMonth } from "@/lib/api";
import { toMonthString, dayKey, wibToday } from "@/lib/date";
import { useToday } from "@/lib/useToday";
import { isLikelyAuthed } from "@/lib/auth";
import type { Event } from "@/lib/types";
import { AlertCircle } from "lucide-react";

export function CalendarPage() {
  const router = useRouter();
  const today = useToday();
  const [year, setYear] = useState(() => wibToday().getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(() => wibToday().getMonth());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [selectedDay, setSelectedDay] = useState<Date | null>(null);
  const [adminOpen, setAdminOpen] = useState(false);
  const [syncOpen, setSyncOpen] = useState(false);
  const [animKey, setAnimKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  // ?login=1 → open admin modal on landing (used by AdminGuard redirects).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("login") === "1") {
      setAdminOpen(true);
      const u = new URL(window.location.href);
      u.searchParams.delete("login");
      window.history.replaceState(null, "", u.toString());
    }
  }, []);

  useEffect(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    fetchEventsByMonth(toMonthString(year, monthIndex0), { signal: ctrl.signal })
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setEvents(data);
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg =
          err instanceof Error ? err.message : "Tidak bisa memuat event.";
        setError(`${msg} · Periksa koneksi backend.`);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
    return () => ctrl.abort();
  }, [year, monthIndex0]);

  const eventsByDay = useMemo(() => {
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
    return map;
  }, [events]);

  const goPrev = useCallback(() => {
    setMonthIndex0((m) => {
      if (m === 0) {
        setYear((y) => y - 1);
        return 11;
      }
      return m - 1;
    });
    setAnimKey((k) => k + 1);
  }, []);

  const goNext = useCallback(() => {
    setMonthIndex0((m) => {
      if (m === 11) {
        setYear((y) => y + 1);
        return 0;
      }
      return m + 1;
    });
    setAnimKey((k) => k + 1);
  }, []);

  const goToday = useCallback(() => {
    const t = wibToday();
    setYear(t.getFullYear());
    setMonthIndex0(t.getMonth());
    setAnimKey((k) => k + 1);
  }, []);

  const jump = useCallback((y: number, m: number) => {
    setYear(y);
    setMonthIndex0(m);
    setAnimKey((k) => k + 1);
  }, []);

  const dayEvents = selectedDay ? (eventsByDay.get(dayKey(selectedDay)) ?? []) : [];

  return (
    <>
      <PageHeader
        year={year}
        monthIndex0={monthIndex0}
        onSyncClick={() => setSyncOpen(true)}
        onAdminClick={() => {
          if (isLikelyAuthed()) {
            router.push("/admin");
          } else {
            setAdminOpen(true);
          }
        }}
      />

      <main className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4 mb-4 md:mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <MonthJump year={year} monthIndex0={monthIndex0} onChange={jump} />
            <WIBClock />
            {loading ? (
              <span
                className="text-caption text-ink-3"
                aria-live="polite"
                aria-busy="true"
              >
                Memuat event…
              </span>
            ) : null}
          </div>
          <CalendarNav onPrev={goPrev} onToday={goToday} onNext={goNext} />
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-brand-red bg-brand-red-50 p-4 text-body-sm text-brand-red mb-6"
          >
            <AlertCircle
              className="h-5 w-5 mt-0.5 shrink-0"
              strokeWidth={2.25}
              aria-hidden="true"
            />
            <span>{error}</span>
          </div>
        ) : null}

        <div key={animKey} className="mgm-slide-in">
          <CalendarGrid
            year={year}
            monthIndex0={monthIndex0}
            events={events}
            loading={loading}
            today={today}
            onEventClick={setSelectedEvent}
            onDaySelect={setSelectedDay}
          />
          <Legend />
        </div>
      </main>

      <DayEventsModal
        open={!!selectedDay}
        date={selectedDay}
        events={dayEvents}
        onClose={() => setSelectedDay(null)}
        onPick={(ev) => {
          setSelectedDay(null);
          setSelectedEvent(ev);
        }}
      />
      <EventDetailModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />
      <SyncCalendarModal open={syncOpen} onClose={() => setSyncOpen(false)} />
      <AdminAccessModal open={adminOpen} onClose={() => setAdminOpen(false)} />
    </>
  );
}
