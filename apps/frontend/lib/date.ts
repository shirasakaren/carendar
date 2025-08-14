export const MONTHS_ID = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

export const DAYS_SHORT_ID = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];
export const DAYS_LONG_ID = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu", "Minggu"];

export function formatDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getDate()} ${MONTHS_ID[date.getMonth()]} ${date.getFullYear()}`;
}

export function formatTime(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  const hh = date.getHours().toString().padStart(2, "0");
  const mm = date.getMinutes().toString().padStart(2, "0");
  return `${hh}.${mm}`;
}

/** Convert (year, 0-based month) to "YYYY-MM". */
export function toMonthString(year: number, monthIndex0: number): string {
  return `${year}-${(monthIndex0 + 1).toString().padStart(2, "0")}`;
}

export interface CalendarCell {
  date: Date;
  inCurrentMonth: boolean;
}

/**
 * Build a 6×7 matrix for the given month, starting on Monday and including
 * leading / trailing days from adjacent months. Always 42 cells.
 */
export function buildCalendarMatrix(year: number, monthIndex0: number): CalendarCell[][] {
  const firstOfMonth = new Date(year, monthIndex0, 1);
  // JS: Sunday=0..Saturday=6. We want Monday=0..Sunday=6.
  const firstDow = (firstOfMonth.getDay() + 6) % 7;

  const weeks: CalendarCell[][] = [];
  for (let w = 0; w < 6; w++) {
    const week: CalendarCell[] = [];
    for (let d = 0; d < 7; d++) {
      const dayOffset = w * 7 + d - firstDow;
      const cellDate = new Date(year, monthIndex0, 1 + dayOffset);
      week.push({
        date: cellDate,
        inCurrentMonth: cellDate.getMonth() === monthIndex0 && cellDate.getFullYear() === year,
      });
    }
    weeks.push(week);
  }
  return weeks;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

export function isToday(d: Date): boolean {
  return isSameDay(d, wibToday());
}

/**
 * Current wall-clock parts in WIB (Asia/Jakarta), independent of the device
 * timezone. The whole calendar runs on WIB, so "today" and the clock must too.
 */
export function wibNowParts(d: Date = new Date()): {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
} {
  const fmt = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "0";
  return {
    year: +get("year"),
    month: +get("month"),
    day: +get("day"),
    hour: +get("hour") % 24,
    minute: +get("minute"),
    second: +get("second"),
  };
}

/**
 * Today as a local Date whose Y/M/D match the current WIB calendar day, so
 * isSameDay comparisons against calendar cells are correct on any device tz.
 */
export function wibToday(): Date {
  const p = wibNowParts();
  return new Date(p.year, p.month - 1, p.day);
}

/** Local-time YYYY-MM-DD key for map lookups. */
export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}
