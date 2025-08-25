import { CATEGORIES } from "@/lib/categories";

export function Legend() {
  return (
    <ul className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-8 mb-2">
      {CATEGORIES.map((c) => (
        <li key={c.key} className="flex items-center gap-2 text-caption text-ink-2">
          <span
            className="inline-block h-2.5 w-2.5 rounded-full"
            style={{
              backgroundColor: c.defaultColor,
              boxShadow: c.needsOutline ? "inset 0 0 0 1px var(--line-strong)" : "none",
            }}
            aria-hidden="true"
          />
          {c.label}
        </li>
      ))}
    </ul>
  );
}
