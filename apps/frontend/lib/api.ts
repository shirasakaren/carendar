import type { Event, ListEventsResponse } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export async function fetchEventsByMonth(
  month: string,
  opts?: { signal?: AbortSignal },
): Promise<Event[]> {
  const res = await fetch(`${API_URL}/api/events?month=${encodeURIComponent(month)}`, {
    cache: "no-store",
    signal: opts?.signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to load events (${res.status})`);
  }
  const data = (await res.json()) as ListEventsResponse;
  return data.events ?? [];
}

export async function fetchEvent(id: string): Promise<Event> {
  const res = await fetch(`${API_URL}/api/events/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to load event (${res.status})`);
  return (await res.json()) as Event;
}
