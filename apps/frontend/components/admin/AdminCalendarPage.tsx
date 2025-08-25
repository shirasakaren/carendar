"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Plus } from "lucide-react";
import { PageHeader } from "../layout/PageHeader";
import { MonthJump } from "../calendar/MonthJump";
import { CalendarNav } from "../calendar/CalendarNav";
import { WIBClock } from "../calendar/WIBClock";
import { CalendarGrid } from "../calendar/CalendarGrid";
import { Legend } from "../calendar/Legend";
import { EventDetailModal } from "../calendar/EventDetailModal";
import { DayEventsDrawer } from "./DayEventsDrawer";
import { Button } from "../ui/Button";
import { adminListEventsByMonth, ApiError } from "@/lib/admin-api";
import { toMonthString, dayKey, wibToday } from "@/lib/date";
import { useToday } from "@/lib/useToday";
import type { Event } from "@/lib/types";

export function AdminCalendarPage() {
  const router = useRouter();
  const today = useToday();

  const [year, setYear] = useState(() => wibToday().getFullYear());
  const [monthIndex0, setMonthIndex0] = useState(() => wibToday().getMonth());
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [drawerDate, setDrawerDate] = useState<Date | null>(null);
  const [animKey, setAnimKey] = useState(0);

  const abortRef = useRef<AbortController | null>(null);

  const reload = useCallback(() => {
    abortRef.current?.abort();
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setLoading(true);
    setError(null);
    adminListEventsByMonth(toMonthString(year, monthIndex0))
      .then((data) => {
        if (ctrl.signal.aborted) return;
        setEvents(data);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/?login=1");
          return;
        }
        const msg = err instanceof Error ? err.message : "Tidak bisa memuat event.";
        setError(msg);
      })
      .finally(() => {
        if (!ctrl.signal.aborted) setLoading(false);
      });
  }, [year, monthIndex0, router]);

  useEffect(() => {
    reload();
    return () => abortRef.current?.abort();
  }, [reload]);

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

  const onDaySelect = useCallback(
    (date: Date) => {
      const dayEvents = eventsByDay.get(dayKey(date)) ?? [];
      if (dayEvents.length === 0) {
        router.push(`/admin/events/new?date=${dayKey(date)}`);
        return;
      }
      setDrawerDate(date);
    },
    [eventsByDay, router],
  );

  const drawerEvents = drawerDate ? (eventsByDay.get(dayKey(drawerDate)) ?? []) : [];

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

  return (
    <>
      <PageHeader year={year} monthIndex0={monthIndex0} />

      <main className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-6 md:py-8">
        <div className="flex items-center justify-between gap-4 mb-4 md:mb-6 flex-wrap">
          <div className="flex items-center gap-3 flex-wrap">
            <MonthJump year={year} monthIndex0={monthIndex0} onChange={jump} />
            <WIBClock />
            {loading ? (
              <span className="text-caption text-ink-3" aria-live="polite" aria-busy="true">
                Memuat…
              </span>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <CalendarNav onPrev={goPrev} onToday={goToday} onNext={goNext} />
            <Button
              variant="primary"
              size="md"
              onClick={() => router.push("/admin/events/new")}
            >
              <Plus className="h-4 w-4" strokeWidth={2.25} />
              <span className="hidden sm:inline">Event Baru</span>
            </Button>
          </div>
        </div>

        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-brand-red bg-brand-red-50 p-4 text-body-sm text-brand-red mb-6"
          >
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
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
            showAdd
            onEventClick={setSelectedEvent}
            onDaySelect={onDaySelect}
          />
          <Legend />
        </div>
      </main>

      <EventDetailModal
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        mode="admin"
      />
      <DayEventsDrawer
        open={!!drawerDate}
        date={drawerDate}
        events={drawerEvents}
        onClose={() => setDrawerDate(null)}
      />
    </>
  );
}
