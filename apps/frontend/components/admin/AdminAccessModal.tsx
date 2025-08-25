"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, AlertCircle } from "lucide-react";
import { Modal } from "../ui/Modal";
import { Button } from "../ui/Button";
import { login, ApiError } from "@/lib/admin-api";

interface Props {
  open: boolean;
  onClose: () => void;
  /** Where to navigate after successful login. Defaults to `/admin`. */
  redirectTo?: string;
}

export function AdminAccessModal({ open, onClose, redirectTo = "/admin" }: Props) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) {
      setPassword("");
      setError(null);
      return;
    }
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await login(password);
      router.replace(redirectTo);
    } catch (err) {
      const msg =
        err instanceof ApiError && err.status === 401
          ? "Password salah."
          : err instanceof Error
            ? err.message
            : "Tidak bisa masuk.";
      setError(msg);
      setSubmitting(false);
      window.setTimeout(() => inputRef.current?.focus(), 0);
    }
  }

  return (
    <Modal open={open} onClose={onClose} ariaLabel="Masuk Admin Panel" size="sm">
      <form onSubmit={onSubmit} className="p-8">
        <div className="grid place-items-center mb-5 h-12 w-12 rounded-lg bg-brand-blue-50 text-brand-blue">
          <Lock className="h-5 w-5" strokeWidth={2.25} aria-hidden="true" />
        </div>
        <h2 className="font-display text-h2 text-ink mb-2 tracking-tight">
          Masuk Admin Panel
        </h2>
        <p className="text-body-sm text-ink-2 leading-relaxed mb-6">
          Masukkan password admin untuk mengelola event kalender.
        </p>

        <label htmlFor="mgm-admin-password" className="block text-caption font-medium text-ink mb-1.5">
          Password
        </label>
        <input
          ref={inputRef}
          id="mgm-admin-password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={submitting}
          aria-invalid={error ? "true" : "false"}
          aria-describedby={error ? "mgm-admin-password-error" : undefined}
          className={`w-full h-10 px-3.5 rounded border bg-white text-body-sm text-ink placeholder:text-ink-4 transition-[border-color,box-shadow] duration-120 focus:outline-none ${
            error
              ? "border-brand-red focus:border-brand-red focus:shadow-[0_0_0_3px_rgba(249,65,65,0.15)]"
              : "border-line hover:border-line-strong focus:border-brand-blue focus:shadow-[0_0_0_3px_rgba(58,109,197,0.15)]"
          }`}
        />

        {error ? (
          <div
            id="mgm-admin-password-error"
            role="alert"
            className="mt-3 flex items-start gap-2 text-body-sm text-brand-red"
          >
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
            <span>{error}</span>
          </div>
        ) : null}

        <div className="mt-6 flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" size="md" onClick={onClose} disabled={submitting}>
            Batal
          </Button>
          <Button type="submit" variant="primary" size="md" disabled={submitting || !password}>
            {submitting ? "Memeriksa…" : "Masuk"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
