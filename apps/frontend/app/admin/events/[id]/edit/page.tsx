"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle } from "lucide-react";
import { EventEditor } from "@/components/admin/editor/EventEditor";
import { adminGetEvent, ApiError } from "@/lib/admin-api";
import type { Event } from "@/lib/types";

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params.id === "string" ? params.id : "";
  const [event, setEvent] = useState<Event | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    adminGetEvent(id)
      .then((e) => {
        // Recurring instances can't be edited directly — bounce to parent.
        if (e.parent_event_id) {
          router.replace(`/admin/events/${e.parent_event_id}/edit`);
          return;
        }
        setEvent(e);
      })
      .catch((err: unknown) => {
        if (err instanceof ApiError && err.status === 401) {
          router.replace("/?login=1");
          return;
        }
        setError(
          err instanceof ApiError
            ? err.message
            : err instanceof Error
              ? err.message
              : "Gagal memuat event.",
        );
      });
  }, [id, router]);

  if (error) {
    return (
      <main className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-12">
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-brand-red bg-brand-red-50 p-4 text-body-sm text-brand-red"
        >
          <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span>{error}</span>
        </div>
      </main>
    );
  }

  if (!event) {
    return (
      <div className="min-h-[60vh] grid place-items-center text-body-sm text-ink-3">
        Memuat event…
      </div>
    );
  }

  return <EventEditor initialEvent={event} />;
}
