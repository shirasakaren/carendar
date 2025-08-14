"use client";

import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

type Size = "sm" | "md" | "lg";

interface Props {
  open: boolean;
  onClose: () => void;
  ariaLabel?: string;
  size?: Size;
  children: React.ReactNode;
}

const SIZE_MAX: Record<Size, string> = {
  sm: "max-w-[480px]",
  md: "max-w-[560px]",
  lg: "max-w-[720px]",
};

export function Modal({ open, onClose, ariaLabel, size = "lg", children }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t = window.setTimeout(() => ref.current?.focus(), 0);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
      window.clearTimeout(t);
    };
  }, [open, onClose]);

  if (!open) return null;
  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={ariaLabel}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-[rgba(14,17,22,0.45)] backdrop-blur-[2px] mgm-backdrop-in" />
      <div
        ref={ref}
        tabIndex={-1}
        className={`relative w-full ${SIZE_MAX[size]} max-h-[90vh] overflow-y-auto bg-white rounded-xl shadow-3 outline-none mgm-modal-in`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          aria-label="Tutup"
          onClick={onClose}
          className="absolute top-4 right-4 z-10 h-9 w-9 rounded grid place-items-center bg-white/80 backdrop-blur-sm hover:bg-surface-muted transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-blue"
        >
          <X className="w-4 h-4 text-ink-2" strokeWidth={2.25} aria-hidden="true" />
        </button>
        {children}
      </div>
    </div>,
    document.body,
  );
}
