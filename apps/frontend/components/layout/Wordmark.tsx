import { ShapeSignature } from "./ShapeSignature";

interface Props {
  /** When true, hides the "Laboratory" label (e.g. on narrow viewports). */
  compact?: boolean;
}

// "MGM" with each glyph in its own brand color, followed by the
// "Laboratory" tagline. Per design doc §5.5.
export function Wordmark({ compact = false }: Props) {
  return (
    <div className="flex items-center gap-3 select-none">
      <ShapeSignature size={28} />
      <div className="flex items-baseline gap-2">
        <span
          className="font-display font-semibold tracking-tight text-h2 leading-none"
          aria-label="MGM Laboratory"
        >
          <span style={{ color: "#3a6dc5" }}>M</span>
          <span style={{ color: "#f7bf33" }}>G</span>
          <span style={{ color: "#f94141" }}>M</span>
        </span>
        {!compact ? (
          <span
            className="hidden sm:inline text-caption uppercase tracking-[0.12em] text-ink-3"
            aria-hidden="true"
          >
            Laboratory
          </span>
        ) : null}
      </div>
    </div>
  );
}
