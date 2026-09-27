import { createAdminClient } from "@/lib/supabase/admin";
import { addDays, diffDays, parisDate } from "@/lib/dates";
import type { Format } from "@/lib/types";

/*
 * Instagram API with Instagram Login (graph.instagram.com).
 * Needs @devie.bar to be a Business or Creator account and a Meta app with the
 * instagram_business_basic permission. The long-lived token (60 days) is stored
 * in public.social_ig_connection, which only the service role can read, and is
 * refreshed on every sync once it is older than a day.
 */

const GRAPH = "https://graph.instagram.com";
const FIELDS = "id,caption,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp,like_count,comments_count";

type IgMedia = {
  id: string;
  caption?: string;
  media_type: "IMAGE" | "VIDEO" | "CAROUSEL_ALBUM";
  media_product_type?: "FEED" | "REELS" | "STORY" | "AD";
  permalink?: string;
  thumbnail_url?: string;
  media_url?: string;
  timestamp: string;
  like_count?: number;
  comments_count?: number;
};

export function authorizeUrl(redirectUri: string, state: string) {
  const id = process.env.INSTAGRAM_APP_ID;
  if (!id) throw new Error("INSTAGRAM_APP_ID is not set in Vercel.");
  const u = new URL("https://www.instagram.com/oauth/authorize");
  u.searchParams.set("client_id", id);
  u.searchParams.set("redirect_uri", redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", "instagram_business_basic");
  u.searchParams.set("state", state);
  return u.toString();
}

async function getJson<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, { ...init, cache: "no-store", signal: AbortSignal.timeout(15_000) });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (body as { error?: { message?: string }; error_message?: string }).error?.message
      ?? (body as { error_message?: string }).error_message
      ?? `HTTP ${res.status}`;
    throw new Error(`Instagram said: ${msg}`);
  }
  return body as T;
}

/** OAuth callback: code -> short token -> long-lived token, then store it. */
export async function connectWithCode(code: string, redirectUri: string) {
  const id = process.env.INSTAGRAM_APP_ID!;
  const secret = process.env.INSTAGRAM_APP_SECRET;
  if (!secret) throw new Error("INSTAGRAM_APP_SECRET is not set in Vercel.");
  const form = new URLSearchParams({
    client_id: id,
    client_secret: secret,
    grant_type: "authorization_code",
    redirect_uri: redirectUri,
    code,
  });
  const short = await getJson<{ access_token: string; user_id: number | string }>(
    "https://api.instagram.com/oauth/access_token",
    { method: "POST", body: form }
  );
  const long = await getJson<{ access_token: string; expires_in: number }>(
    `${GRAPH}/access_token?grant_type=ig_exchange_token&client_secret=${encodeURIComponent(secret)}&access_token=${encodeURIComponent(short.access_token)}`
  );
  const me = await getJson<{ user_id?: string; id?: string; username: string }>(
    `${GRAPH}/me?fields=user_id,username&access_token=${encodeURIComponent(long.access_token)}`
  );
  const admin = createAdminClient();
  const { error } = await admin.from("social_ig_connection").upsert({
    id: 1,
    ig_user_id: String(me.user_id ?? me.id ?? short.user_id),
    username: me.username,
    access_token: long.access_token,
    token_expires_at: new Date(Date.now() + long.expires_in * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  });
  if (error) throw new Error(`Could not save the Instagram connection: ${error.message}`);
}

export async function disconnect() {
  const admin = createAdminClient();
  await admin
    .from("social_ig_connection")
    .update({ access_token: null, token_expires_at: null, updated_at: new Date().toISOString() })
    .eq("id", 1);
}

function formatOf(m: IgMedia, fromStories: boolean): Format {
  if (fromStories || m.media_product_type === "STORY") return "story";
  if (m.media_product_type === "REELS") return "reel";
  if (m.media_type === "CAROUSEL_ALBUM") return "carousel";
  return "feed";
}

function titleFrom(m: IgMedia, format: Format): string {
  const first = (m.caption ?? "").split("\n").map((s) => s.trim()).find(Boolean);
  if (first) return first.length > 70 ? first.slice(0, 67).trimEnd() + "..." : first;
  const label = { feed: "Feed post", reel: "Reel", carousel: "Carousel", story: "Story" }[format];
  return label;
}

export type SyncResult = { imported: number; matched: number; updated: number; message: string };

/**
 * Pull recent media and stories, then:
 *  - update likes/comments/thumbnail on posts already linked to a media id
 *  - link new media to the closest planned post of the same format within 3 days
 *  - create an "unplanned" posted record for anything that matches nothing
 */
export async function syncInstagram(opts: { deep?: boolean } = {}): Promise<SyncResult> {
  const admin = createAdminClient();
  const { data: conn, error: connErr } = await admin.from("social_ig_connection").select("*").eq("id", 1).maybeSingle();
  if (connErr) throw new Error(connErr.message);
  if (!conn?.access_token) throw new Error("Instagram is not connected yet. Connect it in Settings.");

  let token: string = conn.access_token;

  const record = async (message: string) => {
    await admin
      .from("social_ig_connection")
      .update({ last_sync_at: new Date().toISOString(), last_sync_result: message, updated_at: new Date().toISOString() })
      .eq("id", 1);
  };

  try {
    // Refresh the long-lived token when it is more than a day old (allowed after 24h).
    const expires = conn.token_expires_at ? new Date(conn.token_expires_at).getTime() : 0;
    if (expires && expires - Date.now() < 59 * 86_400_000) {
      const r = await getJson<{ access_token: string; expires_in: number }>(
        `${GRAPH}/refresh_access_token?grant_type=ig_refresh_token&access_token=${encodeURIComponent(token)}`
      ).catch(() => null);
      if (r?.access_token) {
        token = r.access_token;
        await admin
          .from("social_ig_connection")
          .update({ access_token: token, token_expires_at: new Date(Date.now() + r.expires_in * 1000).toISOString() })
          .eq("id", 1);
      }
    }

    // First sync goes deep so the Rhythm view has history. Later syncs read the latest 50.
    const { count } = await admin.from("social_posts").select("id", { count: "exact", head: true }).not("ig_media_id", "is", null);
    const pages = opts.deep || !count ? 8 : 1;

    const media: { m: IgMedia; story: boolean }[] = [];
    let next: string | null = `${GRAPH}/me/media?fields=${FIELDS}&limit=50&access_token=${encodeURIComponent(token)}`;
    for (let i = 0; i < pages && next; i++) {
      const page: { data: IgMedia[]; paging?: { next?: string } } = await getJson(next);
      page.data.forEach((m) => media.push({ m, story: false }));
      next = page.paging?.next ?? null;
    }
    // Stories are only visible while live (24h), so a missed day is a missed story.
    const stories = await getJson<{ data: IgMedia[] }>(
      `${GRAPH}/me/stories?fields=id,media_type,media_product_type,permalink,thumbnail_url,media_url,timestamp&access_token=${encodeURIComponent(token)}`
    ).catch(() => ({ data: [] as IgMedia[] }));
    stories.data.forEach((m) => media.push({ m, story: true }));

    const ids = media.map((x) => x.m.id);
    const { data: linked } = await admin.from("social_posts").select("id, ig_media_id").in("ig_media_id", ids.length ? ids : ["-"]);
    const linkedIds = new Map((linked ?? []).map((r) => [r.ig_media_id as string, r.id as string]));

    const oldest = media.length ? parisDate(media.map((x) => x.m.timestamp).sort()[0]) : parisDate(new Date());
    const { data: candidatesRaw } = await admin
      .from("social_posts")
      .select("id, format, status, planned_for, caption")
      .is("ig_media_id", null)
      .not("status", "in", "(posted,skipped)")
      .gte("planned_for", addDays(oldest, -3));
    const candidates = [...(candidatesRaw ?? [])];

    let imported = 0, matched = 0, updated = 0;

    // Oldest first so earlier plans are matched to earlier posts.
    media.sort((a, b) => a.m.timestamp.localeCompare(b.m.timestamp));
    for (const { m, story } of media) {
      const format = formatOf(m, story);
      const thumb = m.media_type === "VIDEO" ? m.thumbnail_url ?? null : m.media_url ?? m.thumbnail_url ?? null;
      const igFields = {
        ig_permalink: m.permalink ?? null,
        ig_media_type: m.media_type,
        ig_thumbnail_url: thumb,
        likes: m.like_count ?? null,
        comments: m.comments_count ?? null,
      };

      const existing = linkedIds.get(m.id);
      if (existing) {
        await admin.from("social_posts").update(igFields).eq("id", existing);
        updated++;
        continue;
      }

      const day = parisDate(m.timestamp);
      const compatible = (f: string) => f === format || (format !== "story" && f !== "story" && (f === "feed" || f === "carousel") && (format === "feed" || format === "carousel"));
      const best = candidates
        .filter((c) => compatible(c.format) && c.planned_for && Math.abs(diffDays(day, c.planned_for)) <= 3)
        .sort((a, b) => {
          const da = Math.abs(diffDays(day, a.planned_for!)), db = Math.abs(diffDays(day, b.planned_for!));
          if (da !== db) return da - db;
          return (b.status === "ready" ? 1 : 0) - (a.status === "ready" ? 1 : 0);
        })[0];

      if (best) {
        await admin
          .from("social_posts")
          .update({
            ...igFields,
            ig_media_id: m.id,
            status: "posted",
            posted_at: m.timestamp,
            format,
            caption: best.caption || m.caption || null,
          })
          .eq("id", best.id);
        candidates.splice(candidates.indexOf(best), 1);
        matched++;
      } else {
        await admin.from("social_posts").insert({
          ...igFields,
          title: titleFrom(m, format),
          format,
          status: "posted",
          planned_for: day,
          posted_at: m.timestamp,
          caption: m.caption ?? null,
          ig_media_id: m.id,
          unplanned: true,
          created_by: null,
        });
        imported++;
      }
    }

    const message = `Read ${media.length} items: ${matched} matched to plans, ${imported} added as unplanned, ${updated} refreshed.`;
    await record(message);
    return { imported, matched, updated, message };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    await record(`Failed: ${message}`);
    throw e;
  }
}
