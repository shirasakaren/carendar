"use client";

import { useEffect, useRef, useState } from "react";

type Freq = "none" | "daily" | "weekly" | "monthly" | "yearly";
type EndsType = "never" | "on" | "count";

interface ParsedRule {
  freq: Freq;
  byDay: number[]; // 0=Mon..6=Sun
  count: number | null;
}

interface Value {
  rule: string | null;
  endDate: string | null;
}

interface Props {
  value: Value;
  onChange: (v: Value) => void;
}

const DAYS = [
  { code: "MO", short: "Sen" },
  { code: "TU", short: "Sel" },
  { code: "WE", short: "Rab" },
  { code: "TH", short: "Kam" },
  { code: "FR", short: "Jum" },
  { code: "SA", short: "Sab" },
  { code: "SU", short: "Min" },
];

function parseRule(rule: string | null): ParsedRule {
  if (!rule) return { freq: "none", byDay: [], count: null };
  const freqMatch = rule.match(/FREQ=(DAILY|WEEKLY|MONTHLY|YEARLY)/i);
  const freq = (freqMatch ? freqMatch[1].toLowerCase() : "none") as Freq;
  const byDayMatch = rule.match(/BYDAY=([A-Z,]+)/i);
  const byDay = byDayMatch
    ? byDayMatch[1]
        .split(",")
        .map((d) => DAYS.findIndex((x) => x.code === d.trim().toUpperCase()))
        .filter((i) => i >= 0)
    : [];
  const countMatch = rule.match(/COUNT=(\d+)/i);
  const count = countMatch ? parseInt(countMatch[1], 10) : null;
  return { freq, byDay, count };
}

function buildRule(freq: Freq, byDay: number[], endsType: EndsType, endsCount: number): string | null {
  if (freq === "none") return null;
  const parts = [`FREQ=${freq.toUpperCase()}`];
  if (freq === "weekly" && byDay.length > 0) {
    const codes = byDay.map((i) => DAYS[i].code).join(",");
    parts.push(`BYDAY=${codes}`);
  }
  if (endsType === "count" && endsCount > 0) {
    parts.push(`COUNT=${endsCount}`);
  }
  return parts.join(";");
}

export function RecurrenceField({ value, onChange }: Props) {
  const parsed = parseRule(value.rule);
  const [freq, setFreq] = useState<Freq>(parsed.freq);
  const [byDay, setByDay] = useState<number[]>(parsed.byDay);
  const [endsType, setEndsType] = useState<EndsType>(
    value.endDate ? "on" : parsed.count ? "count" : "never",
  );
  const [endsDate, setEndsDate] = useState<string>(value.endDate ?? "");
  const [endsCount, setEndsCount] = useState<number>(parsed.count ?? 10);

  const cbRef = useRef(onChange);
  useEffect(() => {
    cbRef.current = onChange;
  });

  useEffect(() => {
    const rule = buildRule(freq, byDay, endsType, endsCount);
    const endDate = endsType === "on" && rule ? endsDate || null : null;
    cbRef.current({ rule, endDate });
  }, [freq, byDay, endsType, endsCount, endsDate]);

  function toggleDay(i: number) {
    setByDay((prev) => (prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i].sort()));
  }

  return (
    <div className="flex flex-col gap-3">
      <select
        value={freq}
        onChange={(e) => setFreq(e.target.value as Freq)}
        className="mgm-select h-10 rounded border border-line bg-white pl-3 text-body-sm font-medium text-ink hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
      >
        <option value="none">Tidak berulang</option>
        <option value="daily">Setiap hari</option>
        <option value="weekly">Setiap minggu</option>
        <option value="monthly">Setiap bulan</option>
        <option value="yearly">Setiap tahun</option>
      </select>

      {freq === "weekly" ? (
        <div>
          <p className="text-caption text-ink-3 mb-1.5">Pada hari</p>
          <div className="flex flex-wrap gap-1">
            {DAYS.map((d, i) => {
              const active = byDay.includes(i);
              return (
                <button
                  key={d.code}
                  type="button"
                  onClick={() => toggleDay(i)}
                  aria-pressed={active}
                  className={`h-8 px-2.5 rounded-sm text-caption font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue ${
                    active
                      ? "bg-brand-blue text-white"
                      : "bg-white border border-line text-ink-2 hover:border-line-strong"
                  }`}
                >
                  {d.short}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}

      {freq !== "none" ? (
        <fieldset>
          <legend className="text-caption text-ink-3 mb-1.5">Berakhir</legend>
          <div className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-body-sm text-ink">
              <input
                type="radio"
                checked={endsType === "never"}
                onChange={() => setEndsType("never")}
                className="accent-brand-blue"
              />
              Tidak pernah
            </label>

            <label className="flex items-center gap-2 text-body-sm text-ink">
              <input
                type="radio"
                checked={endsType === "on"}
                onChange={() => setEndsType("on")}
                className="accent-brand-blue"
              />
              Pada tanggal
              <input
                type="date"
                value={endsDate}
                disabled={endsType !== "on"}
                onChange={(e) => setEndsDate(e.target.value)}
                className="h-8 rounded border border-line bg-white px-2 text-body-sm text-ink disabled:opacity-50 focus:outline-none focus:border-brand-blue"
              />
            </label>

            <label className="flex items-center gap-2 text-body-sm text-ink">
              <input
                type="radio"
                checked={endsType === "count"}
                onChange={() => setEndsType("count")}
                className="accent-brand-blue"
              />
              Setelah
              <input
                type="number"
                min={1}
                max={520}
                value={endsCount}
                disabled={endsType !== "count"}
                onChange={(e) => {
                  const v = parseInt(e.target.value, 10);
                  if (!Number.isNaN(v)) setEndsCount(v);
                }}
                className="h-8 w-20 rounded border border-line bg-white px-2 text-body-sm text-ink tnum disabled:opacity-50 focus:outline-none focus:border-brand-blue"
              />
              kali
            </label>
          </div>
        </fieldset>
      ) : null}
    </div>
  );
}
