"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkAuth } from "@/lib/admin-api";

interface Props {
  children: React.ReactNode;
}

export function AdminGuard({ children }: Props) {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ok">("checking");

  useEffect(() => {
    let active = true;
    checkAuth().then((ok) => {
      if (!active) return;
      if (!ok) {
        router.replace("/?login=1");
        return;
      }
      setStatus("ok");
    });
    return () => {
      active = false;
    };
  }, [router]);

  if (status === "checking") {
    return (
      <div className="min-h-screen grid place-items-center text-body-sm text-ink-3">
        Memeriksa sesi…
      </div>
    );
  }
  return <>{children}</>;
}
