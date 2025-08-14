import type { Category } from "./types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

/** Build the public .ics feed URL, optionally filtered to specific categories. */
export function feedUrl(categories: Category[]): string {
  const base = `${API_URL}/api/calendar.ics`;
  if (categories.length === 0) return base;
  return `${base}?categories=${encodeURIComponent(categories.join(","))}`;
}

/** webcal:// variant — calendar apps treat this as "subscribe", not download. */
export function webcalUrl(httpUrl: string): string {
  return httpUrl.replace(/^https?:\/\//, "webcal://");
}

export function googleSubscribeUrl(httpUrl: string): string {
  return `https://calendar.google.com/calendar/r?cid=${encodeURIComponent(webcalUrl(httpUrl))}`;
}

export function outlookSubscribeUrl(httpUrl: string): string {
  return `https://outlook.live.com/calendar/0/addfromweb?url=${encodeURIComponent(
    httpUrl,
  )}&name=${encodeURIComponent("MGM Calendar")}`;
}
