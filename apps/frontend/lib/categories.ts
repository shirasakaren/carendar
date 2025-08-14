import type { Category } from "./types";

export interface CategoryMeta {
  key: Category;
  label: string;
  defaultColor: string;
  /** Whether legend dots / chips need an outline to remain visible on white. */
  needsOutline: boolean;
  /** Whether the default text color on this fill is white (true) or ink (false). */
  textOnFillIsWhite: boolean;
}

export const CATEGORIES: CategoryMeta[] = [
  { key: "internal_events",     label: "Internal Events",     defaultColor: "#3a6dc5", needsOutline: false, textOnFillIsWhite: true  },
  { key: "external_events",     label: "External Events",     defaultColor: "#0d9488", needsOutline: false, textOnFillIsWhite: true  },
  { key: "rnd_website",         label: "R&D Website",         defaultColor: "#7c3aed", needsOutline: false, textOnFillIsWhite: true  },
  { key: "rnd_game",            label: "R&D Game",            defaultColor: "#db2777", needsOutline: false, textOnFillIsWhite: true  },
  { key: "rnd_mobile",          label: "R&D Mobile",          defaultColor: "#0891b2", needsOutline: false, textOnFillIsWhite: true  },
  { key: "rnd_ux",              label: "R&D UX",              defaultColor: "#ea580c", needsOutline: false, textOnFillIsWhite: true  },
  { key: "major_events",        label: "Major Events",        defaultColor: "#0e1116", needsOutline: false, textOnFillIsWhite: true  },
  { key: "workshop",            label: "Workshop",            defaultColor: "#f7bf33", needsOutline: false, textOnFillIsWhite: false },
  { key: "project_development", label: "Project Development", defaultColor: "#16a34a", needsOutline: false, textOnFillIsWhite: true  },
  { key: "academic_events",     label: "Academic Events",     defaultColor: "#92400e", needsOutline: false, textOnFillIsWhite: true  },
  { key: "holiday",             label: "Holiday",             defaultColor: "#f94141", needsOutline: false, textOnFillIsWhite: true  },
];

export const CATEGORY_BY_KEY: Record<Category, CategoryMeta> =
  Object.fromEntries(CATEGORIES.map((c) => [c.key, c])) as Record<Category, CategoryMeta>;

/**
 * Pick the foreground text color for a given event fill. Yellow is the
 * one fill that may NOT carry text on white (see design doc §2.4), so on
 * yellow we always use ink. For arbitrary admin-chosen colors, we fall
 * back to a luminance heuristic.
 */
export function textColorForFill(fill: string): "#0e1116" | "#ffffff" {
  const f = fill.toLowerCase();
  // Yellow family — always ink.
  if (f === "#f7bf33" || f === "#fef6e0") return "#0e1116";
  // Known light tints — ink.
  if (f === "#fee5e5" || f === "#ecf1fa" || f === "#e2f1ea") return "#0e1116";
  return luminance(f) > 0.55 ? "#0e1116" : "#ffffff";
}

function luminance(hex: string): number {
  const m = hex.replace("#", "");
  if (m.length !== 6) return 0;
  const r = parseInt(m.slice(0, 2), 16) / 255;
  const g = parseInt(m.slice(2, 4), 16) / 255;
  const b = parseInt(m.slice(4, 6), 16) / 255;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
