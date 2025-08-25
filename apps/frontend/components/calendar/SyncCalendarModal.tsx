"use client";

import { useMemo, useState } from "react";
import { Modal } from "../ui/Modal";
import { CATEGORIES } from "@/lib/categories";
import type { Category } from "@/lib/types";
import {
  feedUrl,
  webcalUrl,
  googleSubscribeUrl,
  outlookSubscribeUrl,
} from "@/lib/ical";
import { CalendarPlus, Apple, Globe, Link2, Download, Check, Copy } from "lucide-react";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ALL_KEYS = CATEGORIES.map((c) => c.key);

export function SyncCalendarModal({ open, onClose }: Props) {
  const [selected, setSelected] = useState<Set<Category>>(() => new Set(ALL_KEYS));
  const [copied, setCopied] = useState(false);

  const allSelected = selected.size === ALL_KEYS.length;

  // When every category is selected we omit the filter entirely, so categories
  // added later still flow into already-subscribed feeds.
  const httpUrl = useMemo(() => {
    const cats = allSelected ? [] : ALL_KEYS.filter((k) => selected.has(k));
    return feedUrl(cats);
  }, [selected, allSelected]);

  function toggle(key: Category) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(httpUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — the link is still shown below */
    }
  }

  if (!open) return null;

  const noneSelected = selected.size === 0;

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Sinkronisasi kalender" size="md">
      <div className="p-6 md:p-8">
        <h2 className="font-display text-h1 text-ink tracking-tight mb-1.5">
          Sync ke kalender Anda
        </h2>
        <p className="text-body-sm text-ink-2 mb-6">
          Berlangganan kalender MGM dari aplikasi favorit Anda. Event yang dipilih
          admin akan otomatis muncul dan tersinkron berkala.
        </p>

        <section className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-eyebrow uppercase tracking-[0.12em] text-ink-3">
              Kategori yang dilacak
            </h3>
            <button
              type="button"
              onClick={() =>
                setSelected(allSelected ? new Set() : new Set(ALL_KEYS))
              }
              className="text-caption font-medium text-brand-blue hover:underline underline-offset-2"
            >
              {allSelected ? "Kosongkan" : "Pilih semua"}
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
            {CATEGORIES.map((c) => {
              const checked = selected.has(c.key);
              return (
                <label
                  key={c.key}
                  className="flex items-center gap-2 rounded-md px-2 py-1.5 cursor-pointer hover:bg-surface-muted transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => toggle(c.key)}
                    className="h-4 w-4 accent-brand-blue"
                  />
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: c.defaultColor,
                      boxShadow: c.needsOutline ? "inset 0 0 0 1px var(--line-strong)" : undefined,
                    }}
                    aria-hidden="true"
                  />
                  <span className="text-body-sm text-ink truncate">{c.label}</span>
                </label>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-eyebrow uppercase tracking-[0.12em] text-ink-3 mb-2">
            Pilih aplikasi
          </h3>
          {noneSelected ? (
            <p className="text-caption text-brand-red mb-3">
              Pilih minimal satu kategori untuk berlangganan.
            </p>
          ) : null}
          <div className="flex flex-col gap-2">
            <ProviderLink
              href={googleSubscribeUrl(httpUrl)}
              icon={<CalendarPlus className="h-4 w-4" strokeWidth={2.25} />}
              label="Google Calendar"
              disabled={noneSelected}
            />
            <ProviderLink
              href={webcalUrl(httpUrl)}
              icon={<Apple className="h-4 w-4" strokeWidth={2.25} />}
              label="Apple Calendar"
              disabled={noneSelected}
            />
            <ProviderLink
              href={outlookSubscribeUrl(httpUrl)}
              icon={<Globe className="h-4 w-4" strokeWidth={2.25} />}
              label="Outlook"
              disabled={noneSelected}
            />
            <ProviderLink
              href={httpUrl}
              icon={<Download className="h-4 w-4" strokeWidth={2.25} />}
              label="Unduh berkas .ics"
              disabled={noneSelected}
              download
            />
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg border border-line bg-surface-muted px-3 py-2">
            <Link2 className="h-4 w-4 text-ink-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <span className="flex-1 min-w-0 truncate text-caption text-ink-2 tnum">{httpUrl}</span>
            <button
              type="button"
              onClick={copyLink}
              disabled={noneSelected}
              className="inline-flex items-center gap-1 h-7 px-2 rounded-sm text-caption font-medium text-brand-blue hover:bg-brand-blue-50 transition-colors disabled:opacity-40 disabled:pointer-events-none focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5" strokeWidth={2.25} /> Tersalin
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5" strokeWidth={2.25} /> Salin
                </>
              )}
            </button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

function ProviderLink({
  href,
  icon,
  label,
  disabled,
  download,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  download?: boolean;
}) {
  if (disabled) {
    return (
      <span className="inline-flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-body-sm font-medium text-ink-4 opacity-50 cursor-not-allowed">
        <span className="grid place-items-center h-8 w-8 rounded-md bg-surface-muted text-ink-4">
          {icon}
        </span>
        {label}
      </span>
    );
  }
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer noopener"
      download={download}
      className="group inline-flex items-center gap-3 rounded-lg border border-line px-4 py-3 text-body-sm font-medium text-ink hover:border-line-strong hover:bg-surface-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-brand-blue"
    >
      <span className="grid place-items-center h-8 w-8 rounded-md bg-brand-blue-50 text-brand-blue">
        {icon}
      </span>
      {label}
    </a>
  );
}
