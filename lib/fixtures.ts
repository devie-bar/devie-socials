import { addDays, todayParis, weekStart } from "@/lib/dates";
import type { Connection, DvEvent, Pillar, Post, Target } from "@/lib/types";

// Sample data for the local design preview (lib/preview.ts). Not used in production.
const t = todayParis();
const ws = weekStart(t);
let n = 0;
function p(over: Partial<Post>): Post {
  n++;
  return {
    id: `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`,
    title: "Untitled",
    format: "feed",
    pillar: null,
    status: "idea",
    planned_for: null,
    planned_time: null,
    caption: null,
    notes: null,
    drive_path: null,
    event_id: null,
    ig_media_id: null,
    ig_permalink: null,
    ig_media_type: null,
    ig_thumbnail_url: null,
    posted_at: null,
    likes: null,
    comments: null,
    unplanned: false,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...over,
  };
}
const posted = (d: string, over: Partial<Post>) =>
  p({ status: "posted", planned_for: d, posted_at: `${d}T17:30:00Z`, ig_media_id: `ig${n}`, ig_permalink: "https://instagram.com/p/x", likes: 120 + n * 7, comments: 4 + (n % 9), ...over });

const history: Post[] = [];
for (let w = 1; w <= 11; w++) {
  const s = addDays(ws, -7 * w);
  const k = w % 4;
  history.push(posted(addDays(s, 1), { title: "Autumn menu serve", format: "feed", pillar: "drinks" }));
  if (k !== 2) history.push(posted(addDays(s, 3), { title: "Reel from service", format: "reel", pillar: "service" }));
  if (k === 0) history.push(posted(addDays(s, 4), { title: "Producer visit carousel", format: "carousel", pillar: "producers" }));
  if (k !== 3) history.push(posted(addDays(s, 5), { title: "Kitchen plate", format: "feed", pillar: "food" }));
  for (let d = 0; d < (k === 1 ? 2 : 5); d++) history.push(posted(addDays(s, d), { title: "Story", format: "story", unplanned: true }));
}

export const FIX_POSTS: Post[] = [
  ...history,
  posted(addDays(t, -4), { title: "Mirabelle, the last of the season", format: "feed", pillar: "produce" }),
  posted(addDays(t, -1), { title: "Open tonight", format: "story", pillar: "service" }),
  posted(addDays(t, -2), { title: "Guest shift recap from Tokyo", format: "reel", unplanned: true }),
  p({ title: "Quince: from orchard to glass", format: "reel", pillar: "produce", status: "edited", planned_for: t }),
  p({ title: "New autumn menu carousel", format: "carousel", pillar: "info", status: "shot", planned_for: addDays(t, 2) }),
  p({ title: "Team portrait: Cherry in the kitchen", format: "feed", pillar: "team", status: "planned", planned_for: addDays(t, 5) }),
  p({ title: "Cointreau Spicy at Lubna, Milan", format: "reel", pillar: "events", status: "planned", planned_for: addDays(t, 8), event_id: "evt1" }),
  p({ title: "Sea buckthorn ferment", format: "feed", pillar: "drinks", status: "ready", planned_for: addDays(t, 1) }),
  p({ title: "Stories: Friday service", format: "story", pillar: "service", status: "planned", planned_for: addDays(t, 3) }),
  p({ title: "Library pantry in December light", format: "feed", pillar: "venue", status: "idea" }),
  p({ title: "Michel Huard field trip", format: "carousel", pillar: "producers", status: "idea" }),
  p({ title: "Late one", format: "feed", pillar: "food", status: "shot", planned_for: addDays(t, -2) }),
];

export const FIX_PILLARS: Pillar[] = [
  ["drinks", "Drinks"], ["food", "Food"], ["produce", "Produce"], ["producers", "Producers"], ["venue", "Venue"],
  ["team", "Team"], ["service", "Service"], ["events", "Events"], ["info", "Info"], ["cave", "Cave"], ["atelier", "Atelier"],
].map(([key, label], i) => ({ key, label, blurb: `${label} content`, drive_folder: `DV - ${label.toUpperCase()}`, sort: i * 10, active: true }));

export const FIX_TARGETS: Target[] = [
  { format: "feed", per_week: 2 },
  { format: "reel", per_week: 1 },
  { format: "carousel", per_week: 1 },
  { format: "story", per_week: 5 },
];

export const FIX_EVENTS: DvEvent[] = [
  { id: "evt1", name: "Cointreau Spicy, Lubna Milan", start_date: addDays(t, 7), end_date: addDays(t, 7), status: "confirmed", location: "Milan" },
  { id: "evt2", name: "W50BB Milan, Bacardi", start_date: addDays(t, 8), end_date: addDays(t, 11), status: "proposed", location: "Milan" },
];

export const FIX_CONN: Connection = {
  username: "devie.bar",
  token_expires_at: addDays(t, 52) + "T00:00:00Z",
  last_sync_at: new Date().toISOString(),
  last_sync_result: "Read 64 items: 3 matched to plans, 1 added as unplanned, 60 refreshed.",
  connected: true,
};
