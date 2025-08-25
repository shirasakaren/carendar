"use client";

import { useRef, useState } from "react";
import { Upload, X, AlertCircle } from "lucide-react";
import { adminUpload, ApiError } from "@/lib/admin-api";

interface Props {
  value: string | null;
  onChange: (url: string | null) => void;
}

export function ThumbnailField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFile(file: File | null) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const res = await adminUpload(file);
      onChange(res.url);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah.");
    } finally {
      setBusy(false);
    }
  }

  if (value) {
    return (
      <div className="relative aspect-[16/9] w-full rounded-lg overflow-hidden border border-line bg-surface-muted">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={value} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onChange(null)}
          aria-label="Hapus thumbnail"
          className="absolute top-2 right-2 h-8 w-8 rounded grid place-items-center bg-white/90 backdrop-blur-sm hover:bg-white shadow-1 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <X className="h-4 w-4 text-ink-2" strokeWidth={2.25} aria-hidden="true" />
        </button>
      </div>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="flex flex-col items-center justify-center gap-2 aspect-[16/9] w-full rounded-lg border border-dashed border-line-strong bg-surface-muted hover:border-brand-blue hover:bg-brand-blue-50/40 transition-colors text-ink-3 hover:text-brand-blue disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {busy ? (
          <span className="h-4 w-4 rounded-full border-2 border-current border-r-transparent animate-spin" />
        ) : (
          <Upload className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        )}
        <span className="text-body-sm font-medium">
          {busy ? "Mengunggah…" : "Unggah thumbnail"}
        </span>
        <span className="text-caption text-ink-4">PNG, JPG, atau WebP</span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => onFile(e.target.files?.[0] ?? null)}
      />
      {error ? (
        <div className="mt-2 flex items-start gap-2 text-caption text-brand-red">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </>
  );
}
