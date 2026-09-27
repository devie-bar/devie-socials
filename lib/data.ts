import { createClient } from "@/lib/supabase/server";
import type { Connection, DvEvent, Pillar, Post, Target } from "@/lib/types";
import { PREVIEW } from "@/lib/preview";
import { FIX_CONN, FIX_EVENTS, FIX_PILLARS, FIX_POSTS, FIX_TARGETS } from "@/lib/fixtures";
import { dayOf } from "@/lib/cadence";

// Thin, typed reads. Each throws on error so the route's error.tsx can show
// what failed with a Retry (DESIGN.md 3.5).

function check<T>(res: { data: T | null; error: { message: string } | null }, what: string): T {
  if (res.error) throw new Error(`Could not load ${what}: ${res.error.message}`);
  return (res.data ?? ([] as unknown)) as T;
}

export async function getPostsBetween(from: string, to: string): Promise<Post[]> {
  if (PREVIEW) return FIX_POSTS.filter((p) => { const d = dayOf(p); return !!d && d >= from && d <= to; });
  const sb = createClient();
  // Planned in range, or posted in range (posted_at is a timestamp, so pad a day each side).
  const res = await sb
    .from("social_posts")
    .select("*")
    .or(
      `and(planned_for.gte.${from},planned_for.lte.${to}),and(posted_at.gte.${from}T00:00:00Z,posted_at.lte.${to}T23:59:59Z)`
    )
    .order("planned_for", { ascending: true, nullsFirst: false });
  return check(res, "posts");
}

export async function getPipelinePosts(): Promise<Post[]> {
  if (PREVIEW) return FIX_POSTS.filter((p) => !["posted", "skipped"].includes(p.status));
  const sb = createClient();
  const res = await sb
    .from("social_posts")
    .select("*")
    .in("status", ["idea", "planned", "shot", "edited", "ready"])
    .order("planned_for", { ascending: true, nullsFirst: false })
    .order("created_at", { ascending: false });
  return check(res, "the pipeline");
}

export async function getPosted(from: string, to: string): Promise<Post[]> {
  if (PREVIEW) return FIX_POSTS.filter((p) => p.status === "posted" && p.planned_for! >= from && p.planned_for! <= to).reverse();
  const sb = createClient();
  const res = await sb
    .from("social_posts")
    .select("*")
    .eq("status", "posted")
    .gte("posted_at", `${from}T00:00:00Z`)
    .lte("posted_at", `${to}T23:59:59Z`)
    .order("posted_at", { ascending: false });
  return check(res, "posted content");
}

export async function getPost(id: string): Promise<Post | null> {
  if (PREVIEW) return FIX_POSTS.find((p) => p.id === id) ?? null;
  const sb = createClient();
  const res = await sb.from("social_posts").select("*").eq("id", id).maybeSingle();
  if (res.error) throw new Error(`Could not load the post: ${res.error.message}`);
  return res.data as Post | null;
}

export async function getPillars(): Promise<Pillar[]> {
  if (PREVIEW) return FIX_PILLARS;
  const sb = createClient();
  return check(await sb.from("social_pillars").select("*").order("sort"), "pillars");
}

export async function getTargets(): Promise<Target[]> {
  if (PREVIEW) return FIX_TARGETS;
  const sb = createClient();
  return check(await sb.from("social_targets").select("format, per_week"), "weekly targets");
}

export async function getEvents(from: string, to: string): Promise<DvEvent[]> {
  if (PREVIEW) return FIX_EVENTS;
  const sb = createClient();
  return check(await sb.rpc("social_events", { p_from: from, p_to: to }), "events");
}

export async function getConnection(): Promise<Connection | null> {
  if (PREVIEW) return FIX_CONN;
  const sb = createClient();
  const res = await sb.rpc("social_connection_status");
  if (res.error) throw new Error(`Could not load the Instagram connection: ${res.error.message}`);
  const rows = (res.data ?? []) as Connection[];
  return rows[0] ?? null;
}
