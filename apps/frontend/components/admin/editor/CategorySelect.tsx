"use client";

import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/types";

interface Props {
  value: Category;
  onChange: (c: Category) => void;
}

export function CategorySelect({ value, onChange }: Props) {
  return (
    <div className="relative">
      <span
        className="absolute left-3 top-1/2 -translate-y-1/2 inline-block h-2.5 w-2.5 rounded-full pointer-events-none"
        style={{
          backgroundColor:
            CATEGORIES.find((c) => c.key === value)?.defaultColor ?? "#3a6dc5",
        }}
        aria-hidden="true"
      />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as Category)}
        className="mgm-select h-10 w-full rounded border border-line bg-white pl-8 text-body-sm font-medium text-ink hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
      >
        {CATEGORIES.map((c) => (
          <option key={c.key} value={c.key}>
            {c.label}
          </option>
        ))}
      </select>
    </div>
  );
}
