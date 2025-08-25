"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, ShieldCheck, ExternalLink } from "lucide-react";
import { logout } from "@/lib/admin-api";

export function AdminBanner() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function onLogout() {
    if (busy) return;
    setBusy(true);
    await logout();
    router.replace("/");
  }

  return (
    <div className="sticky top-0 z-40 bg-surface-inverse text-white">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 h-11 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-body-sm">
          <ShieldCheck className="h-4 w-4 text-brand-yellow" strokeWidth={2.25} aria-hidden="true" />
          <span className="font-medium">Mode Admin</span>
          <span className="hidden sm:inline text-white/60">·</span>
          <span className="hidden sm:inline text-white/60">MGM Laboratory</span>
        </div>
        <div className="flex items-center gap-1">
          <a
            href="/"
            target="_blank"
            rel="noreferrer noopener"
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded text-caption font-medium text-white/80 hover:text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Lihat Publik
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
          </a>
          <button
            type="button"
            onClick={onLogout}
            disabled={busy}
            className="inline-flex items-center gap-1.5 px-3 h-8 rounded text-caption font-medium text-white hover:bg-white/10 transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:opacity-50"
          >
            <LogOut className="h-3.5 w-3.5" strokeWidth={2.25} aria-hidden="true" />
            {busy ? "Keluar…" : "Keluar"}
          </button>
        </div>
      </div>
    </div>
  );
}
