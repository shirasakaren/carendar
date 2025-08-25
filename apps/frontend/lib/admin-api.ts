import type { Event } from "./types";
import { clearToken, getToken, setToken } from "./auth";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

async function authedFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(init.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !(init.body instanceof FormData)) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
    credentials: "include",
  });
  if (res.status === 401) {
    clearToken();
    throw new ApiError("Sesi habis. Silakan masuk lagi.", 401);
  }
  return res;
}

async function readJson<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = `Request gagal (${res.status})`;
    try {
      const j = JSON.parse(text);
      if (j?.error) message = String(j.error);
    } catch {
      if (text) message = text;
    }
    throw new ApiError(message, res.status);
  }
  return (await res.json()) as T;
}

// ─── Auth ─────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string;
  expires_at: string;
}

export async function login(password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/api/admin/auth`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ password }),
  });
  const data = await readJson<LoginResponse>(res);
  setToken(data.token, data.expires_at);
  return data;
}

export async function logout(): Promise<void> {
  try {
    await authedFetch("/api/admin/logout", { method: "POST" });
  } catch {
    // ignore — local clear still wins
  } finally {
    clearToken();
  }
}

export async function checkAuth(): Promise<boolean> {
  if (!getToken()) return false;
  try {
    const res = await authedFetch("/api/admin/me");
    return res.ok;
  } catch {
    return false;
  }
}

// ─── Events ───────────────────────────────────────────────────────────

export async function adminListEventsByMonth(month: string): Promise<Event[]> {
  const res = await authedFetch(`/api/admin/events?month=${encodeURIComponent(month)}`);
  const data = await readJson<{ month: string; events: Event[] }>(res);
  return data.events ?? [];
}

export async function adminGetEvent(id: string): Promise<Event> {
  const res = await authedFetch(`/api/admin/events/${encodeURIComponent(id)}`);
  return readJson<Event>(res);
}

export interface EventInput {
  title: string;
  category: string;
  color: string;
  description_json: unknown;
  thumbnail_url: string | null;
  start_datetime: string;
  end_datetime: string;
  is_all_day: boolean;
  location: string | null;
  location_type: "physical" | "online" | "hybrid";
  meeting_link: string | null;
  dresscode: string | null;
  attendees: string[];
  attachments: Array<{ name: string; url: string; type: string; size?: number }>;
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  show_in_subscription: boolean;
  is_published: boolean;
}

export async function adminCreateEvent(input: EventInput): Promise<Event> {
  const res = await authedFetch("/api/admin/events", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return readJson<Event>(res);
}

export async function adminUpdateEvent(id: string, input: EventInput): Promise<Event> {
  const res = await authedFetch(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: "PUT",
    body: JSON.stringify(input),
  });
  return readJson<Event>(res);
}

export async function adminDeleteEvent(id: string): Promise<void> {
  const res = await authedFetch(`/api/admin/events/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
  if (!res.ok && res.status !== 204) {
    await readJson(res);
  }
}

// ─── Uploads ──────────────────────────────────────────────────────────

export interface UploadResult {
  url: string;
  name: string;
  type: string;
  size: number;
}

export async function adminUpload(file: File): Promise<UploadResult> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await authedFetch("/api/admin/upload", { method: "POST", body: fd });
  return readJson<UploadResult>(res);
}
