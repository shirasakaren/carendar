"use client";

import { useRouter } from "next/navigation";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import type { Event } from "@/lib/types";
import { CATEGORY_BY_KEY } from "@/lib/categories";
import { formatDate, formatTime } from "@/lib/date";
import { Clock, MapPin, Video, Shirt, Users, Paperclip, Pencil } from "lucide-react";
import { renderTipTapToHtml } from "@/lib/tiptap";

interface Props {
  event: Event | null;
  onClose: () => void;
  /** "admin" shows an Edit button that navigates to the editor. */
  mode?: "public" | "admin";
}

export function EventDetailModal({ event, onClose, mode = "public" }: Props) {
  const router = useRouter();
  if (!event) return null;
  const meta = CATEGORY_BY_KEY[event.category];
  const start = new Date(event.start_datetime);
  const end = new Date(event.end_datetime);
  const sameDay =
    start.getFullYear() === end.getFullYear() &&
    start.getMonth() === end.getMonth() &&
    start.getDate() === end.getDate();

  const dateText = event.is_all_day
    ? sameDay
      ? `Sepanjang Hari · ${formatDate(start)}`
      : `Sepanjang Hari · ${formatDate(start)} – ${formatDate(end)}`
    : sameDay
      ? `${formatDate(start)} · ${formatTime(start)} – ${formatTime(end)} WIB`
      : `${formatDate(start)} ${formatTime(start)} – ${formatDate(end)} ${formatTime(end)} WIB`;

  const html = renderTipTapToHtml(event.description_json);
  const showMeetingLink =
    !!event.meeting_link &&
    (event.location_type === "online" || event.location_type === "hybrid");

  return (
    <Modal open={!!event} onClose={onClose} ariaLabel={event.title} size="lg">
      {event.thumbnail_url ? (
        <div className="aspect-[16/9] w-full overflow-hidden rounded-t-xl bg-surface-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={event.thumbnail_url}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}
      <div className="p-6 md:p-8">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="inline-flex items-center gap-2">
            <span
              className="inline-block h-2.5 w-2.5 rounded-full"
              style={{
                backgroundColor: event.color || meta?.defaultColor,
                boxShadow: meta?.needsOutline ? "inset 0 0 0 1px var(--line-strong)" : undefined,
              }}
              aria-hidden="true"
            />
            <span className="text-eyebrow uppercase tracking-[0.12em] text-ink-3">
              {meta?.label}
            </span>
          </div>
          {mode === "admin" ? (
            <Button
              variant="secondary"
              size="sm"
              onClick={() => {
                const editId = event.parent_event_id ?? event.id;
                router.push(`/admin/events/${editId}/edit`);
              }}
            >
              <Pencil className="h-3.5 w-3.5 text-brand-blue" strokeWidth={2.25} />
              Edit
            </Button>
          ) : null}
        </div>
        <h2 className="font-display text-h1 md:text-display-lg text-ink mb-4 leading-[1.1] tracking-tight">
          {event.title}
        </h2>

        <dl className="space-y-3">
          <Row icon={<Clock className="h-4 w-4" strokeWidth={2.25} />}>{dateText}</Row>
          {event.location ? (
            <Row icon={<MapPin className="h-4 w-4" strokeWidth={2.25} />}>
              {event.location}
            </Row>
          ) : null}
          {showMeetingLink ? (
            <Row icon={<Video className="h-4 w-4" strokeWidth={2.25} />}>
              <a
                href={event.meeting_link!}
                target="_blank"
                rel="noreferrer noopener"
                className="text-brand-blue underline underline-offset-[3px] decoration-1 hover:decoration-2 break-all"
              >
                Tautan rapat
              </a>
            </Row>
          ) : null}
          {event.dresscode ? (
            <Row icon={<Shirt className="h-4 w-4" strokeWidth={2.25} />}>
              {event.dresscode}
            </Row>
          ) : null}
          {event.attendees && event.attendees.length > 0 ? (
            <Row icon={<Users className="h-4 w-4" strokeWidth={2.25} />}>
              {event.attendees.join(", ")}
            </Row>
          ) : null}
        </dl>

        {html ? (
          <div
            className="mgm-rich mt-6 max-w-none"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        ) : null}

        {event.attachments && event.attachments.length > 0 ? (
          <section className="mt-6 border-t border-line pt-6">
            <h3 className="text-eyebrow uppercase tracking-[0.12em] text-ink-3 mb-3">
              Lampiran
            </h3>
            <ul className="flex flex-col gap-2">
              {event.attachments.map((a) => (
                <li key={a.url}>
                  <a
                    href={a.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    download={a.name}
                    className="inline-flex items-center gap-2 text-body-sm text-ink hover:text-brand-blue transition-colors"
                  >
                    <Paperclip
                      className="h-4 w-4 text-ink-3"
                      strokeWidth={2.25}
                    />
                    {a.name}
                    {a.size ? (
                      <span className="text-caption text-ink-4">
                        · {formatBytes(a.size)}
                      </span>
                    ) : null}
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Modal>
  );
}

function Row({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 text-body text-ink-2">
      <div className="grid place-items-center w-5 h-5 mt-1 text-ink-3 shrink-0">
        {icon}
      </div>
      <div className="flex-1 leading-relaxed">{children}</div>
    </div>
  );
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
