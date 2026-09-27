"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { autoSync } from "@/app/actions";

/** Syncs Instagram in the background when the last sync is more than 3 hours old. */
export function AutoSync({ lastSyncAt, connected }: { lastSyncAt: string | null; connected: boolean }) {
  const router = useRouter();
  const ran = useRef(false);
  useEffect(() => {
    if (ran.current || !connected) return;
    const stale = !lastSyncAt || Date.now() - new Date(lastSyncAt).getTime() > 3 * 3600_000;
    if (!stale) return;
    ran.current = true;
    autoSync().then((ok) => ok && router.refresh());
  }, [lastSyncAt, connected, router]);
  return null;
}
