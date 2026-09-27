export const FORMATS = ["feed", "reel", "carousel", "story"] as const;
export type Format = (typeof FORMATS)[number];
export const FORMAT_LABEL: Record<Format, string> = {
  feed: "Feed",
  reel: "Reel",
  carousel: "Carousel",
  story: "Story",
};
export const FORMAT_PLURAL: Record<Format, string> = {
  feed: "feed posts",
  reel: "Reels",
  carousel: "carousels",
  story: "Stories",
};

export const STATUSES = ["idea", "planned", "shot", "edited", "ready", "posted", "skipped"] as const;
export type Status = (typeof STATUSES)[number];
export const STATUS_LABEL: Record<Status, string> = {
  idea: "Idea",
  planned: "Planned",
  shot: "Shot",
  edited: "Edited",
  ready: "Ready",
  posted: "Posted",
  skipped: "Skipped",
};
/** The working pipeline, in order. Posted and Skipped are outcomes, not stages. */
export const PIPELINE: Status[] = ["idea", "planned", "shot", "edited", "ready"];
export function nextStatus(s: Status): Status | null {
  const i = PIPELINE.indexOf(s);
  return i >= 0 && i < PIPELINE.length - 1 ? PIPELINE[i + 1] : null;
}

export type Post = {
  id: string;
  title: string;
  format: Format;
  pillar: string | null;
  status: Status;
  planned_for: string | null;
  planned_time: string | null;
  caption: string | null;
  notes: string | null;
  drive_path: string | null;
  event_id: string | null;
  ig_media_id: string | null;
  ig_permalink: string | null;
  ig_media_type: string | null;
  ig_thumbnail_url: string | null;
  posted_at: string | null;
  likes: number | null;
  comments: number | null;
  unplanned: boolean;
  created_at: string;
  updated_at: string;
};

export type Pillar = {
  key: string;
  label: string;
  blurb: string | null;
  drive_folder: string | null;
  sort: number;
  active: boolean;
};

export type Target = { format: Format; per_week: number };

export type DvEvent = {
  id: string;
  name: string | null;
  start_date: string;
  end_date: string;
  status: string | null;
  location: string | null;
};

export type Connection = {
  username: string | null;
  token_expires_at: string | null;
  last_sync_at: string | null;
  last_sync_result: string | null;
  connected: boolean;
};

/** The day a post counts for: when it went live, else when it is planned. */
export function postDay(p: Pick<Post, "posted_at" | "planned_for">, parisDate: (iso: string) => string): string | null {
  if (p.posted_at) return parisDate(p.posted_at);
  return p.planned_for;
}
