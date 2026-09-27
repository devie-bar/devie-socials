import Link from "next/link";
import { FORMAT_LABEL, type Pillar, type Post } from "@/lib/types";
import { StatusBadge } from "@/components/Status";

/** One post inside a calendar day. Identity on the first line, status and format on the second. */
export function PostChip({ post, pillars, back, today }: { post: Post; pillars: Pillar[]; back: string; today: string }) {
  const pillar = pillars.find((p) => p.key === post.pillar)?.label;
  return (
    <Link
      href={`/posts/${post.id}?back=${encodeURIComponent(back)}`}
      className="block rounded-inner border border-paper-line bg-paper-card px-3 py-2 text-left no-underline transition-colors hover:border-brand-soft"
    >
      <span className="block text-[14px] font-medium leading-snug text-ink">{post.title}</span>
      <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
        <StatusBadge post={post} today={today} />
        <span>{FORMAT_LABEL[post.format]}</span>
        {pillar && <span>· {pillar}</span>}
        {post.unplanned && <span>· Unplanned</span>}
      </span>
    </Link>
  );
}
