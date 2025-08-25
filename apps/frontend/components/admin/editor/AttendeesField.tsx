"use client";

import { useState, type KeyboardEvent } from "react";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
}

export function AttendeesField({ value, onChange }: Props) {
  const [draft, setDraft] = useState("");

  function commit(raw: string) {
    const t = raw.trim();
    if (!t) return;
    if (value.includes(t)) {
      setDraft("");
      return;
    }
    onChange([...value, t]);
    setDraft("");
  }

  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      commit(draft);
    } else if (e.key === "Backspace" && draft === "" && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  }

  function remove(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 min-h-10 rounded border border-line bg-white px-2 py-1.5 focus-within:border-brand-blue focus-within:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120">
      {value.map((name, i) => (
        <span
          key={`${name}-${i}`}
          className="inline-flex items-center gap-1 h-7 pl-2.5 pr-1 rounded-full bg-brand-blue-50 text-brand-blue text-caption font-medium"
        >
          {name}
          <button
            type="button"
            onClick={() => remove(i)}
            aria-label={`Hapus ${name}`}
            className="h-5 w-5 rounded-full grid place-items-center hover:bg-brand-blue/15"
          >
            <X className="h-3 w-3" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </span>
      ))}
      <input
        type="text"
        value={draft}
        placeholder={value.length === 0 ? "Tambah nama, tekan Enter" : ""}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={onKey}
        onBlur={() => commit(draft)}
        className="flex-1 min-w-[120px] h-7 bg-transparent text-body-sm text-ink placeholder:text-ink-4 focus:outline-none"
      />
    </div>
  );
}
