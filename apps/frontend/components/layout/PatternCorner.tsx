// Signature corner pattern. Verbatim shape vocabulary from the design
// system §5.4: a 3×3 grid of cells in the four brand colors, mirrored
// here for a top-right placement. Decorative only.

interface Props {
  className?: string;
  /** "tr" (default) for top-right, "tl" for top-left. */
  corner?: "tr" | "tl";
}

export function PatternCorner({ className = "", corner = "tr" }: Props) {
  return (
    <svg
      viewBox="0 0 240 240"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
      style={corner === "tr" ? { transform: "scaleX(-1)" } : undefined}
    >
      {/* Top-left: red ring */}
      <circle cx="40" cy="40" r="28" fill="none" stroke="#f94141" strokeWidth="8" />

      {/* Top-middle: blue X */}
      <g stroke="#3a6dc5" strokeWidth="14" strokeLinecap="square">
        <line x1="92" y1="12" x2="148" y2="68" />
        <line x1="148" y1="12" x2="92" y2="68" />
      </g>

      {/* Top-right: green frame with yellow square */}
      <rect x="160" y="0" width="80" height="80" fill="#0f8657" />
      <rect x="180" y="20" width="40" height="40" fill="#f7bf33" />

      {/* Middle-left: yellow four-petal flower */}
      <g fill="#f7bf33">
        <path d="M40 80 A40 40 0 0 1 0 120 L0 80 Z" />
        <path d="M40 160 A40 40 0 0 0 0 120 L0 160 Z" />
        <path d="M40 80 A40 40 0 0 0 80 120 L80 80 Z" />
        <path d="M40 160 A40 40 0 0 1 80 120 L80 160 Z" />
      </g>

      {/* Middle-middle: blue plus */}
      <g fill="#3a6dc5">
        <rect x="112" y="92" width="16" height="56" />
        <rect x="92" y="112" width="56" height="16" />
      </g>

      {/* Middle-right: red half-disc */}
      <path d="M160 80 L240 80 A40 40 0 0 1 160 80 Z" fill="#f94141" />

      {/* Bottom-left: green triangle */}
      <polygon points="0,240 80,240 40,168" fill="#0f8657" />

      {/* Bottom-middle: yellow disc */}
      <circle cx="120" cy="200" r="28" fill="#f7bf33" />

      {/* Bottom-right: blue diamond with red inset */}
      <polygon points="200,168 240,200 200,232 160,200" fill="#3a6dc5" />
      <polygon points="200,184 220,200 200,216 180,200" fill="#f94141" />
    </svg>
  );
}
