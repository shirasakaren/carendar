"use client";

import { Check } from "lucide-react";

// Curated MGM palette — design system §2.5 forbids gradients / off-palette
// colors, so the swatches here are the only colors admin can pick.
const SWATCHES: { hex: string; label: string }[] = [
  { hex: "#3a6dc5", label: "Brand Blue" },
  { hex: "#f7bf33", label: "Brand Yellow" },
  { hex: "#f94141", label: "Brand Red" },
  { hex: "#0f8657", label: "Brand Green" },
  { hex: "#0e1116", label: "Ink" },
  { hex: "#ecf1fa", label: "Blue 50" },
  { hex: "#fef6e0", label: "Yellow 50" },
  { hex: "#fee5e5", label: "Red 50" },
  { hex: "#e2f1ea", label: "Green 50" },
  { hex: "#c01f1f", label: "Red Dark" },
];

interface Props {
  value: string;
  onChange: (hex: string) => void;
}

export function ColorPicker({ value, onChange }: Props) {
  const normalized = (value || "").toLowerCase();
  return (
    <div className="flex flex-wrap gap-2">
      {SWATCHES.map((s) => {
        const active = s.hex.toLowerCase() === normalized;
        const isLight = ["#ecf1fa", "#fef6e0", "#fee5e5", "#e2f1ea"].includes(
          s.hex.toLowerCase(),
        );
        return (
          <button
            key={s.hex}
            type="button"
            onClick={() => onChange(s.hex)}
            aria-label={s.label}
            aria-pressed={active}
            title={s.label}
            className={`relative h-8 w-8 rounded-sm transition-transform duration-120 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue ${
              active ? "ring-2 ring-brand-blue ring-offset-2" : "hover:scale-105"
            }`}
            style={{
              backgroundColor: s.hex,
              boxShadow: isLight ? "inset 0 0 0 1px var(--line-strong)" : undefined,
            }}
          >
            {active ? (
              <Check
                className={`absolute inset-0 m-auto h-4 w-4 ${isLight ? "text-ink" : "text-white"}`}
                strokeWidth={2.5}
                aria-hidden="true"
              />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}
