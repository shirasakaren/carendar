import Link from "next/link";
import { PatternCorner } from "@/components/layout/PatternCorner";
import { Wordmark } from "@/components/layout/Wordmark";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      <PatternCorner
        corner="tl"
        className="pointer-events-none absolute -top-4 -left-4 h-[280px] w-[280px] opacity-95"
      />
      <header className="relative max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-8">
        <Wordmark />
      </header>
      <main className="relative max-w-prose mx-auto px-6 md:px-10 pt-16 md:pt-24 pb-24">
        <p className="text-eyebrow uppercase tracking-[0.12em] text-ink-3 mb-4">
          404
        </p>
        <h1 className="font-display text-display-lg md:text-display-xl text-ink mb-4 tracking-tight">
          Halaman tidak ditemukan.
        </h1>
        <p className="text-body-lg text-ink-2 mb-8">
          Tautan yang Anda buka mungkin sudah dipindahkan atau tidak pernah ada.
        </p>
        <Link href="/">
          <Button variant="primary" size="lg">
            Kembali ke kalender
          </Button>
        </Link>
      </main>
    </div>
  );
}
