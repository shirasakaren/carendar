"use client";

import React from "react";

interface Props {
  children: React.ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches render errors anywhere below it in the admin tree and shows a
 * recoverable fallback instead of a blank page. Re-renders from scratch
 * when the user retries (a full reload, so broken module state is also
 * dropped).
 */
export class AdminErrorBoundary extends React.Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("Admin route crashed:", error, info.componentStack);
  }

  private retry = () => {
    window.location.reload();
  };

  render() {
    if (this.state.error === null) {
      return this.props.children;
    }
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 p-8 text-center">
        <p className="text-h2 font-display font-semibold text-ink">
          Terjadi kesalahan tak terduga
        </p>
        <p className="max-w-md text-body-sm text-ink-2">
          Halaman admin gagal dimuat. Coba muat ulang — jika masalah
          berlanjut, laporkan ke tim pengembang beserta langkah yang
          dilakukan sebelumnya.
        </p>
        <button
          type="button"
          onClick={this.retry}
          className="mt-2 rounded bg-brand-blue px-5 py-2.5 text-body-sm font-semibold text-white shadow-2 transition-transform duration-120 hover:scale-[1.02]"
        >
          Muat Ulang
        </button>
      </div>
    );
  }
}
