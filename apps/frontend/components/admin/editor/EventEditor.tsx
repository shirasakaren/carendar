"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, MapPin, Globe, Building2 } from "lucide-react";

import { Button } from "@/components/ui/Button";
import { TipTapEditor } from "./TipTapEditor";
import { SaveBar } from "./SaveBar";
import { ColorPicker } from "./ColorPicker";
import { CategorySelect } from "./CategorySelect";
import { ThumbnailField } from "./ThumbnailField";
import { AttachmentsField } from "./AttachmentsField";
import { AttendeesField } from "./AttendeesField";
import { RecurrenceField } from "./RecurrenceField";

import type { Category, LocationKind, Event, Attachment } from "@/lib/types";
import {
  adminCreateEvent,
  adminDeleteEvent,
  adminUpdateEvent,
  ApiError,
  type EventInput,
} from "@/lib/admin-api";
import { CATEGORY_BY_KEY } from "@/lib/categories";

interface FormState {
  title: string;
  category: Category;
  color: string;
  description_json: unknown;
  thumbnail_url: string | null;
  start_date: string;
  start_time: string;
  end_date: string;
  end_time: string;
  is_all_day: boolean;
  location: string;
  location_type: LocationKind;
  meeting_link: string;
  dresscode: string;
  attendees: string[];
  attachments: Attachment[];
  recurrence_rule: string | null;
  recurrence_end_date: string | null;
  show_in_subscription: boolean;
  is_published: boolean;
}

interface Props {
  initialEvent?: Event;
  initialDate?: string; // YYYY-MM-DD for new events
}

function todayInWIB(): string {
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
  return fmt.format(new Date());
}

function splitIsoWIB(iso: string): { date: string; time: string } {
  const d = new Date(iso);
  const fmt = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  });
  const parts = fmt.formatToParts(d);
  const g = (k: string) => parts.find((p) => p.type === k)?.value ?? "";
  return {
    date: `${g("year")}-${g("month")}-${g("day")}`,
    time: `${g("hour")}:${g("minute")}`,
  };
}

function buildIsoWIB(date: string, time: string): string {
  return `${date}T${time}:00+07:00`;
}

function defaultForm(initialDate?: string): FormState {
  const d = initialDate || todayInWIB();
  return {
    title: "",
    category: "internal_events",
    color: CATEGORY_BY_KEY.internal_events.defaultColor,
    description_json: { type: "doc", content: [{ type: "paragraph" }] },
    thumbnail_url: null,
    start_date: d,
    start_time: "09:00",
    end_date: d,
    end_time: "10:00",
    is_all_day: false,
    location: "",
    location_type: "physical",
    meeting_link: "",
    dresscode: "",
    attendees: [],
    attachments: [],
    recurrence_rule: null,
    recurrence_end_date: null,
    show_in_subscription: false,
    is_published: true,
  };
}

function formFromEvent(e: Event): FormState {
  const s = splitIsoWIB(e.start_datetime);
  const en = splitIsoWIB(e.end_datetime);
  return {
    title: e.title,
    category: e.category,
    color: e.color || CATEGORY_BY_KEY[e.category].defaultColor,
    description_json: e.description_json ?? { type: "doc", content: [{ type: "paragraph" }] },
    thumbnail_url: e.thumbnail_url ?? null,
    start_date: s.date,
    start_time: e.is_all_day ? "00:00" : s.time,
    end_date: en.date,
    end_time: e.is_all_day ? "23:59" : en.time,
    is_all_day: e.is_all_day,
    location: e.location ?? "",
    location_type: e.location_type,
    meeting_link: e.meeting_link ?? "",
    dresscode: e.dresscode ?? "",
    attendees: e.attendees ?? [],
    attachments: e.attachments ?? [],
    recurrence_rule: e.recurrence_rule ?? null,
    recurrence_end_date: e.recurrence_end_date
      ? splitIsoWIB(e.recurrence_end_date).date
      : null,
    show_in_subscription: e.show_in_subscription,
    is_published: e.is_published,
  };
}

function toApiInput(f: FormState): EventInput {
  const startTime = f.is_all_day ? "00:00" : f.start_time;
  const endTime = f.is_all_day ? "23:59" : f.end_time;
  return {
    title: f.title.trim(),
    category: f.category,
    color: f.color,
    description_json: f.description_json,
    thumbnail_url: f.thumbnail_url,
    start_datetime: buildIsoWIB(f.start_date, startTime),
    end_datetime: buildIsoWIB(f.end_date, endTime),
    is_all_day: f.is_all_day,
    location:
      f.location_type === "online" || !f.location.trim() ? null : f.location.trim(),
    location_type: f.location_type,
    meeting_link:
      (f.location_type === "online" || f.location_type === "hybrid") && f.meeting_link.trim()
        ? f.meeting_link.trim()
        : null,
    dresscode: f.dresscode.trim() || null,
    attendees: f.attendees,
    attachments: f.attachments,
    recurrence_rule: f.recurrence_rule,
    recurrence_end_date: f.recurrence_end_date,
    show_in_subscription: f.show_in_subscription,
    is_published: f.is_published,
  };
}

export function EventEditor({ initialEvent, initialDate }: Props) {
  const router = useRouter();
  const isEdit = !!initialEvent;

  const [form, setForm] = useState<FormState>(() =>
    initialEvent ? formFromEvent(initialEvent) : defaultForm(initialDate),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const showLocation = form.location_type !== "online";
  const showMeetingLink = form.location_type !== "physical";

  async function save(publish: boolean) {
    setError(null);
    if (!form.title.trim()) {
      setError("Judul tidak boleh kosong.");
      return;
    }
    if (!form.is_all_day) {
      const start = new Date(buildIsoWIB(form.start_date, form.start_time));
      const end = new Date(buildIsoWIB(form.end_date, form.end_time));
      if (end.getTime() < start.getTime()) {
        setError("Waktu selesai tidak boleh sebelum waktu mulai.");
        return;
      }
    }
    setSaving(true);
    try {
      const input = toApiInput({ ...form, is_published: publish });
      if (isEdit && initialEvent) {
        await adminUpdateEvent(initialEvent.id, input);
      } else {
        await adminCreateEvent(input);
      }
      router.replace("/admin");
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : "Gagal menyimpan.",
      );
      setSaving(false);
    }
  }

  async function remove() {
    if (!initialEvent) return;
    try {
      await adminDeleteEvent(initialEvent.id);
      router.replace("/admin");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal menghapus.");
    }
  }

  const categoryMeta = useMemo(() => CATEGORY_BY_KEY[form.category], [form.category]);

  return (
    <div>
      <header className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 pt-8 pb-6 border-b border-line bg-white">
        <button
          type="button"
          onClick={() => router.replace("/admin")}
          className="inline-flex items-center gap-1.5 text-body-sm text-ink-3 hover:text-ink transition-colors mb-4"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
          Kembali ke kalender admin
        </button>
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-display-lg text-ink tracking-tight">
            {isEdit ? "Edit Event" : "Event Baru"}
          </h1>
        </div>
      </header>

      <main className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-6 md:py-8">
        {error ? (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-brand-red bg-brand-red-50 p-4 text-body-sm text-brand-red mb-6"
          >
            <AlertCircle className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 lg:gap-10">
          {/* ── Left: title + rich text body ─────────────────────────── */}
          <section className="flex flex-col gap-5">
            <Field label="Judul" required>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Judul event"
                className="h-12 w-full rounded border border-line bg-white px-4 text-h3 font-semibold text-ink placeholder:text-ink-4 hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
              />
            </Field>

            <Field label="Deskripsi">
              <TipTapEditor
                initialContent={form.description_json}
                onUpdate={(doc) => set("description_json", doc)}
              />
            </Field>
          </section>

          {/* ── Right: metadata sidebar ──────────────────────────────── */}
          <aside className="flex flex-col gap-5">
            <Field label="Kategori">
              <CategorySelect value={form.category} onChange={(c) => {
                set("category", c);
                set("color", CATEGORY_BY_KEY[c].defaultColor);
              }} />
            </Field>

            <Field label="Warna">
              <ColorPicker value={form.color} onChange={(hex) => set("color", hex)} />
              <p className="mt-2 text-caption text-ink-3">
                Default kategori: {categoryMeta.label}.
              </p>
            </Field>

            <Field label="Thumbnail">
              <ThumbnailField
                value={form.thumbnail_url}
                onChange={(u) => set("thumbnail_url", u)}
              />
            </Field>

            <Field label="Sepanjang Hari">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.is_all_day}
                  onChange={(e) => set("is_all_day", e.target.checked)}
                  className="h-4 w-4 accent-brand-blue"
                />
                <span className="text-body-sm text-ink">Event berlangsung sepanjang hari</span>
              </label>
            </Field>

            <Field label="Sinkronisasi Kalender">
              <label className="inline-flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.show_in_subscription}
                  onChange={(e) => set("show_in_subscription", e.target.checked)}
                  className="mt-0.5 h-4 w-4 accent-brand-blue"
                />
                <span className="text-body-sm text-ink">
                  Tampilkan di kalender pengguna
                  <span className="block text-caption text-ink-3">
                    Event ikut tersinkron ke kalender (Google, Apple, Outlook) yang
                    berlangganan MGM Calendar.
                  </span>
                </span>
              </label>
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Mulai">
                <input
                  type="date"
                  value={form.start_date}
                  onChange={(e) => {
                    set("start_date", e.target.value);
                    if (form.end_date < e.target.value) set("end_date", e.target.value);
                  }}
                  className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                />
              </Field>
              {!form.is_all_day ? (
                <Field label="Jam mulai">
                  <input
                    type="time"
                    value={form.start_time}
                    onChange={(e) => set("start_time", e.target.value)}
                    className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink tnum hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                  />
                </Field>
              ) : null}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Selesai">
                <input
                  type="date"
                  value={form.end_date}
                  min={form.start_date}
                  onChange={(e) => set("end_date", e.target.value)}
                  className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                />
              </Field>
              {!form.is_all_day ? (
                <Field label="Jam selesai">
                  <input
                    type="time"
                    value={form.end_time}
                    onChange={(e) => set("end_time", e.target.value)}
                    className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink tnum hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                  />
                </Field>
              ) : null}
            </div>

            <Field label="Jenis lokasi">
              <div role="radiogroup" className="grid grid-cols-3 gap-1 rounded border border-line bg-white p-1">
                {(
                  [
                    { v: "physical", label: "Fisik", icon: <MapPin className="h-3.5 w-3.5" strokeWidth={2.25} /> },
                    { v: "online", label: "Online", icon: <Globe className="h-3.5 w-3.5" strokeWidth={2.25} /> },
                    { v: "hybrid", label: "Hybrid", icon: <Building2 className="h-3.5 w-3.5" strokeWidth={2.25} /> },
                  ] as const
                ).map((opt) => {
                  const active = form.location_type === opt.v;
                  return (
                    <button
                      key={opt.v}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => set("location_type", opt.v)}
                      className={`inline-flex items-center justify-center gap-1.5 h-8 rounded-sm text-caption font-medium transition-colors ${
                        active
                          ? "bg-brand-blue text-white"
                          : "text-ink-2 hover:bg-surface-muted"
                      }`}
                    >
                      {opt.icon}
                      {opt.label}
                    </button>
                  );
                })}
              </div>
            </Field>

            {showLocation ? (
              <Field label="Lokasi">
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => set("location", e.target.value)}
                  placeholder="Misal: Lab A, Lt. 3"
                  className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink placeholder:text-ink-4 hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                />
              </Field>
            ) : null}

            {showMeetingLink ? (
              <Field label="Tautan rapat">
                <input
                  type="url"
                  value={form.meeting_link}
                  onChange={(e) => set("meeting_link", e.target.value)}
                  placeholder="https://meet.example.com/..."
                  className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink placeholder:text-ink-4 hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
                />
              </Field>
            ) : null}

            <Field label="Dresscode">
              <input
                type="text"
                value={form.dresscode}
                onChange={(e) => set("dresscode", e.target.value)}
                placeholder="Misal: Batik"
                className="h-10 w-full rounded border border-line bg-white px-3 text-body-sm text-ink placeholder:text-ink-4 hover:border-line-strong focus:outline-none focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)] transition-[border-color,box-shadow] duration-120"
              />
            </Field>

            <Field label="Peserta">
              <AttendeesField
                value={form.attendees}
                onChange={(v) => set("attendees", v)}
              />
            </Field>

            <Field label="Pengulangan">
              <RecurrenceField
                value={{
                  rule: form.recurrence_rule,
                  endDate: form.recurrence_end_date,
                }}
                onChange={({ rule, endDate }) => {
                  setForm((f) => ({
                    ...f,
                    recurrence_rule: rule,
                    recurrence_end_date: endDate,
                  }));
                }}
              />
            </Field>

            <Field label="Lampiran">
              <AttachmentsField
                value={form.attachments}
                onChange={(v) => set("attachments", v)}
              />
            </Field>
          </aside>
        </div>

        <SaveBar
          isEdit={isEdit}
          saving={saving}
          canDelete={isEdit}
          onSave={save}
          onDelete={remove}
        />
      </main>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-caption font-medium text-ink mb-1.5">
        {label}
        {required ? <span className="text-brand-red ml-0.5">*</span> : null}
      </span>
      {children}
    </label>
  );
}
