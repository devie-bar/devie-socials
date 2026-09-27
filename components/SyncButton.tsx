"use client";

import { useFormState, useFormStatus } from "react-dom";
import { syncNow, type SyncState } from "@/app/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button className="dv-btn primary" disabled={pending}>
      {pending ? "Syncing..." : label}
    </button>
  );
}

export function SyncButton({ deep = false }: { deep?: boolean }) {
  const [state, action] = useFormState<SyncState, FormData>(syncNow, null);
  return (
    <form action={action}>
      {deep && <input type="hidden" name="deep" value="1" />}
      <Submit label={deep ? "Sync Full History" : "Sync Now"} />
      {state && (
        <p role="status" className={`mt-2 text-sm ${state.ok ? "text-good" : "text-danger"}`}>
          {state.message}
        </p>
      )}
    </form>
  );
}
