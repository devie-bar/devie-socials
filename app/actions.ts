"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getSocialUser } from "@/lib/auth";
import { syncInstagram, disconnect } from "@/lib/instagram";
import { FORMATS, STATUSES, type Format, type Status } from "@/lib/types";

async function requireAccess() {
  const u = await getSocialUser();
  if (!u?.allowed) throw new Error("You do not have Socials access.");
  return u;
}

function str(fd: FormData, k: string): string | null {
  const v = fd.get(k);
  if (typeof v !== "string") return null;
  const t = v.trim();
  return t === "" ? null : t;
}

function refreshAll() {
  ["/plan", "/pipeline", "/posted", "/rhythm", "/settings"].forEach((p) => revalidatePath(p));
}

export async function savePost(fd: FormData) {
  await requireAccess();
  const sb = createClient();
  const id = str(fd, "id");
  const format = (str(fd, "format") ?? "feed") as Format;
  let status = (str(fd, "status") ?? "idea") as Status;
  if (!FORMATS.includes(format)) throw new Error("Unknown format.");
  if (!STATUSES.includes(status)) throw new Error("Unknown status.");
  const planned_for = str(fd, "planned_for");
  // A dated idea is a plan; an undated plan stays an idea.
  if (status === "idea" && planned_for) status = "planned";

  const row = {
    title: str(fd, "title") ?? "Untitled",
    format,
    status,
    pillar: str(fd, "pillar"),
    planned_for,
    planned_time: str(fd, "planned_time"),
    caption: str(fd, "caption"),
    notes: str(fd, "notes"),
    drive_path: str(fd, "drive_path"),
    event_id: str(fd, "event_id"),
    ig_permalink: str(fd, "ig_permalink"),
    posted_at: status === "posted" ? str(fd, "posted_at_keep") ?? new Date().toISOString() : null,
  };

  const res = id ? await sb.from("social_posts").update(row).eq("id", id) : await sb.from("social_posts").insert(row);
  if (res.error) throw new Error(`Could not save: ${res.error.message}`);
  refreshAll();
  redirect(str(fd, "back") ?? "/plan");
}

export async function deletePost(fd: FormData) {
  await requireAccess();
  const id = str(fd, "id");
  if (!id) return;
  const { error } = await createClient().from("social_posts").delete().eq("id", id);
  if (error) throw new Error(`Could not delete: ${error.message}`);
  refreshAll();
  redirect(str(fd, "back") ?? "/plan");
}

export async function setStatus(fd: FormData) {
  await requireAccess();
  const id = str(fd, "id");
  const status = str(fd, "status") as Status | null;
  if (!id || !status || !STATUSES.includes(status)) return;
  const patch: Record<string, unknown> = { status };
  if (status === "posted") patch.posted_at = new Date().toISOString();
  const { error } = await createClient().from("social_posts").update(patch).eq("id", id);
  if (error) throw new Error(`Could not update: ${error.message}`);
  refreshAll();
}

/** Moves a post to another day (drag-free: used by "Move To" on the plan). */
export async function reschedule(fd: FormData) {
  await requireAccess();
  const id = str(fd, "id");
  const date = str(fd, "planned_for");
  if (!id) return;
  const { error } = await createClient().from("social_posts").update({ planned_for: date }).eq("id", id);
  if (error) throw new Error(`Could not move: ${error.message}`);
  refreshAll();
}

export async function saveTargets(fd: FormData) {
  await requireAccess();
  const sb = createClient();
  for (const f of FORMATS) {
    const n = Math.max(0, Math.min(50, parseInt(String(fd.get(f) ?? "0"), 10) || 0));
    const { error } = await sb.from("social_targets").upsert({ format: f, per_week: n, updated_at: new Date().toISOString() });
    if (error) throw new Error(`Could not save targets: ${error.message}`);
  }
  refreshAll();
}

export async function savePillar(fd: FormData) {
  await requireAccess();
  const sb = createClient();
  const key = str(fd, "key");
  const label = str(fd, "label");
  if (!label) return;
  const row = {
    label,
    blurb: str(fd, "blurb"),
    drive_folder: str(fd, "drive_folder"),
    active: fd.get("active") === "on",
  };
  if (key) {
    const { error } = await sb.from("social_pillars").update(row).eq("key", key);
    if (error) throw new Error(`Could not save the pillar: ${error.message}`);
  } else {
    const newKey = label.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    const { data: last } = await sb.from("social_pillars").select("sort").order("sort", { ascending: false }).limit(1);
    const { error } = await sb.from("social_pillars").insert({ ...row, active: true, key: newKey, sort: (last?.[0]?.sort ?? 0) + 10 });
    if (error) throw new Error(`Could not add the pillar: ${error.message}`);
  }
  revalidatePath("/settings");
}

export type SyncState = { ok: boolean; message: string } | null;

export async function syncNow(_prev: SyncState, fd?: FormData): Promise<SyncState> {
  await requireAccess();
  try {
    const r = await syncInstagram({ deep: fd?.get("deep") === "1" });
    refreshAll();
    return { ok: true, message: r.message };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : String(e) };
  }
}

/** Called quietly on page open when the last sync is stale. */
export async function autoSync(): Promise<boolean> {
  const u = await getSocialUser();
  if (!u?.allowed) return false;
  try {
    await syncInstagram();
    return true;
  } catch {
    return false;
  }
}

export async function disconnectInstagram() {
  await requireAccess();
  await disconnect();
  revalidatePath("/settings");
}
