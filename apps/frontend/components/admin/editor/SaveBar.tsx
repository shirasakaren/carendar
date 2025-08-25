"use client";

import { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Props {
  isEdit: boolean;
  saving: boolean;
  canDelete: boolean;
  onSave: (publish: boolean) => void;
  onDelete: () => Promise<void> | void;
}

export function SaveBar({ isEdit, saving, canDelete, onSave, onDelete }: Props) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function doDelete() {
    if (deleting) return;
    setDeleting(true);
    try {
      await onDelete();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="sticky bottom-0 z-30 mt-8 -mx-6 md:-mx-10 lg:-mx-16 border-t border-line bg-white/95 backdrop-blur-sm shadow-2">
      <div className="max-w-[1360px] mx-auto px-6 md:px-10 lg:px-16 py-4">
        {confirming ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-brand-red bg-brand-red-50 px-4 py-3">
            <div className="flex items-start gap-2 text-body-sm text-brand-red">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" strokeWidth={2.25} aria-hidden="true" />
              <span>
                Event ini akan dihapus permanen, termasuk semua kemunculan berulangnya. Lanjutkan?
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="md"
                onClick={() => setConfirming(false)}
                disabled={deleting}
              >
                Batal
              </Button>
              <Button
                variant="destructive"
                size="md"
                onClick={doDelete}
                disabled={deleting}
              >
                {deleting ? "Menghapus…" : "Ya, hapus"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              {canDelete ? (
                <Button
                  variant="destructive"
                  size="md"
                  onClick={() => setConfirming(true)}
                  disabled={saving}
                >
                  <Trash2 className="h-4 w-4" strokeWidth={2.25} />
                  Hapus Event
                </Button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="md"
                onClick={() => onSave(false)}
                disabled={saving}
              >
                {saving ? "Menyimpan…" : "Simpan Draft"}
              </Button>
              <Button
                variant="primary"
                size="md"
                onClick={() => onSave(true)}
                disabled={saving}
              >
                {saving ? "Menyimpan…" : isEdit ? "Simpan & Publikasikan" : "Publikasikan"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
