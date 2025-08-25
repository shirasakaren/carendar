"use client";

import { useRef, useState } from "react";
import { Paperclip, Plus, Trash2, AlertCircle } from "lucide-react";
import { adminUpload, ApiError } from "@/lib/admin-api";
import type { Attachment } from "@/lib/types";

interface Props {
  value: Attachment[];
  onChange: (a: Attachment[]) => void;
}

export function AttachmentsField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    const next: Attachment[] = [...value];
    try {
      for (const f of Array.from(files)) {
        const res = await adminUpload(f);
        next.push({ name: res.name, url: res.url, type: res.type, size: res.size });
      }
      onChange(next);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Gagal mengunggah.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function removeAt(i: number) {
    const next = [...value];
    next.splice(i, 1);
    onChange(next);
  }

  return (
    <div>
      {value.length > 0 ? (
        <ul className="flex flex-col gap-1.5 mb-3">
          {value.map((a, i) => (
            <li
              key={`${a.url}-${i}`}
              className="flex items-center gap-3 rounded border border-line bg-white px-3 py-2"
            >
              <Paperclip className="h-4 w-4 text-ink-3 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <div className="flex-1 min-w-0">
                <a
                  href={a.url}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="block text-body-sm text-ink truncate hover:text-brand-blue"
                >
                  {a.name}
                </a>
                <p className="text-caption text-ink-4 tnum">{formatSize(a.size)}</p>
              </div>
              <button
                type="button"
                onClick={() => removeAt(i)}
                aria-label={`Hapus ${a.name}`}
                className="h-8 w-8 rounded grid place-items-center text-ink-3 hover:text-brand-red hover:bg-brand-red-50 transition-colors"
              >
                <Trash2 className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className="inline-flex items-center gap-2 h-9 px-3 rounded border border-line bg-white text-body-sm font-medium text-ink hover:bg-surface-muted hover:border-line-strong disabled:opacity-60 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
      >
        {busy ? (
          <span className="h-3 w-3 rounded-full border-2 border-current border-r-transparent animate-spin" />
        ) : (
          <Plus className="h-4 w-4" strokeWidth={2.25} aria-hidden="true" />
        )}
        {busy ? "Mengunggah…" : "Tambah lampiran"}
      </button>
      <input
        ref={inputRef}
        type="file"
        multiple
        className="hidden"
        onChange={(e) => onFiles(e.target.files)}
      />
      {error ? (
        <div className="mt-2 flex items-start gap-2 text-caption text-brand-red">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
          <span>{error}</span>
        </div>
      ) : null}
    </div>
  );
}

function formatSize(n?: number): string {
  if (!n) return "";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}
