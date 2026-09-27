import { STATUS_LABEL, type Post } from "@/lib/types";
import { todayParis } from "@/lib/dates";

/** A status is always a word plus a colour (DESIGN.md 2.2). Overdue work reads as Late. */
export function StatusBadge({ post, today = todayParis() }: { post: Pick<Post, "status" | "planned_for">; today?: string }) {
  const late = post.status !== "posted" && post.status !== "skipped" && post.planned_for && post.planned_for < today;
  if (late) return <span className="dv-status st-late">Late · {STATUS_LABEL[post.status]}</span>;
  return <span className={`dv-status st-${post.status}`}>{STATUS_LABEL[post.status]}</span>;
}
