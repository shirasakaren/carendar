"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { EventEditor } from "@/components/admin/editor/EventEditor";

function NewEventInner() {
  const params = useSearchParams();
  const date = params.get("date") || undefined;
  return <EventEditor initialDate={date} />;
}

export default function NewEventPage() {
  return (
    <Suspense fallback={null}>
      <NewEventInner />
    </Suspense>
  );
}
