"use client";

import { MONTHS_ID } from "@/lib/date";

interface Props {
  year: number;
  monthIndex0: number;
  onChange: (year: number, monthIndex0: number) => void;
}

export function MonthJump({ year, monthIndex0, onChange }: Props) {
  return (
    <div className="flex items-center gap-2">
      <label className="sr-only" htmlFor="mgm-month-select">
        Pilih bulan
      </label>
      <select
        id="mgm-month-select"
        value={monthIndex0}
        onChange={(e) => onChange(year, parseInt(e.target.value, 10))}
        className="mgm-select h-10 rounded border border-line bg-white pl-3 text-body-sm font-medium text-ink hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
      >
        {MONTHS_ID.map((m, i) => (
          <option key={m} value={i}>
            {m}
          </option>
        ))}
      </select>
      <label className="sr-only" htmlFor="mgm-year-input">
        Tahun
      </label>
      <input
        id="mgm-year-input"
        type="number"
        value={year}
        min={1970}
        max={2100}
        onChange={(e) => {
          const y = parseInt(e.target.value, 10);
          if (!Number.isNaN(y)) onChange(y, monthIndex0);
        }}
        className="h-10 w-24 rounded border border-line bg-white px-3 text-body-sm font-medium text-ink tnum hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
      />
    </div>
  );
}
