import type { Event } from "@/lib/types";
import { CATEGORY_BY_KEY, textColorForFill } from "@/lib/categories";
import { formatTime } from "@/lib/date";

interface Props {
  event: Event;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

export function EventChip({ event, onClick }: Props) {
  const meta = CATEGORY_BY_KEY[event.category];
  const bg = event.color || meta?.defaultColor || "#3a6dc5";
  const text = textColorForFill(bg);
  const needsBorder = meta?.needsOutline;

  return (
    <button
      type="button"
      onClick={onClick}
      title={event.title}
      className="w-full text-left truncate rounded-sm px-2 py-1 text-[12px] font-medium leading-tight transition-[filter] duration-120 ease-out-soft hover:brightness-[1.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
      style={{
        backgroundColor: bg,
        color: text,
        boxShadow: needsBorder ? "inset 0 0 0 1px var(--line-strong)" : undefined,
      }}
    >
      {event.is_all_day ? null : (
        <span className="tnum opacity-80 mr-1">{formatTime(event.start_datetime)}</span>
      )}
      {event.title}
    </button>
  );
}
