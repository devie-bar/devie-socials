import { addDays, diffDays, parisDate, todayParis, weekStart } from "@/lib/dates";
import { FORMATS, type Format, type Post, type Target } from "@/lib/types";

export type WeekFormatState = "done" | "ontrack" | "behind" | "hit" | "missed" | "covered" | "gap" | "none";

export type WeekFormat = {
  format: Format;
  target: number;
  posted: number;
  planned: number;
  state: WeekFormatState;
  shortfall: number;
};

export const STATE_WORD: Record<WeekFormatState, string> = {
  done: "Done",
  ontrack: "On Track",
  behind: "Behind",
  hit: "Hit",
  missed: "Missed",
  covered: "Covered",
  gap: "Gap",
  none: "No Target",
};
export const STATE_CLASS: Record<WeekFormatState, string> = {
  done: "st-posted",
  ontrack: "st-ontrack",
  behind: "st-behind",
  hit: "st-posted",
  missed: "st-behind",
  covered: "st-ontrack",
  gap: "st-behind",
  none: "st-idea",
};

export function dayOf(p: Post): string | null {
  if (p.posted_at) return parisDate(p.posted_at);
  return p.planned_for;
}

export function isLive(p: Post) {
  return p.status === "posted";
}
export function isPending(p: Post) {
  return p.status !== "posted" && p.status !== "skipped";
}

export function weekSummary(posts: Post[], targets: Target[], start: string, today = todayParis()): WeekFormat[] {
  const end = addDays(start, 6);
  const inWeek = posts.filter((p) => {
    const d = dayOf(p);
    return d && d >= start && d <= end;
  });
  const phase = end < today ? "past" : start > today ? "future" : "current";
  return FORMATS.map((format) => {
    const target = targets.find((t) => t.format === format)?.per_week ?? 0;
    const posted = inWeek.filter((p) => p.format === format && isLive(p)).length;
    const planned = inWeek.filter((p) => p.format === format && isPending(p)).length;
    let state: WeekFormatState;
    let shortfall = 0;
    if (target === 0) state = "none";
    else if (phase === "past") {
      state = posted >= target ? "hit" : "missed";
      shortfall = Math.max(0, target - posted);
    } else if (phase === "current") {
      if (posted >= target) state = "done";
      else if (posted + planned >= target) state = "ontrack";
      else {
        state = "behind";
        shortfall = target - posted - planned;
      }
    } else {
      if (planned >= target) state = "covered";
      else {
        state = "gap";
        shortfall = target - planned;
      }
    }
    return { format, target, posted, planned, state, shortfall };
  });
}

/** Days since the last live post of the given formats, or null if none ever. */
export function daysSinceLast(posts: Post[], formats: Format[], today = todayParis()): number | null {
  const days = posts
    .filter((p) => isLive(p) && formats.includes(p.format) && p.posted_at)
    .map((p) => parisDate(p.posted_at!))
    .sort();
  if (!days.length) return null;
  return diffDays(today, days[days.length - 1]);
}

/** Longest run of days with no grid post (feed, reel, carousel) in the window. */
export function longestGridGap(posts: Post[], from: string, to: string): { days: number; from: string; to: string } | null {
  const days = Array.from(
    new Set(
      posts
        .filter((p) => isLive(p) && p.format !== "story" && p.posted_at)
        .map((p) => parisDate(p.posted_at!))
        .filter((d) => d >= from && d <= to)
    )
  ).sort();
  if (!days.length) return null;
  const points = [from, ...days, to];
  let best = { days: 0, from, to };
  for (let i = 1; i < points.length; i++) {
    const gap = diffDays(points[i], points[i - 1]) - (i === 1 || i === points.length - 1 ? 0 : 1);
    if (gap > best.days) best = { days: gap, from: points[i - 1], to: points[i] };
  }
  return best;
}

export function weeksBack(n: number, today = todayParis()): string[] {
  const cur = weekStart(today);
  return Array.from({ length: n }, (_, i) => addDays(cur, -7 * (n - 1 - i)));
}
