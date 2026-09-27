import { notFound } from "next/navigation";
import Link from "next/link";
import { getEvents, getPillars, getPost } from "@/lib/data";
import { addDays, todayParis } from "@/lib/dates";
import { FORMAT_LABEL } from "@/lib/types";
import { PostForm } from "@/components/PostForm";
import { StatusBadge } from "@/components/Status";
import { Thumb } from "@/components/Thumb";

export const dynamic = "force-dynamic";

function safeBack(b?: string) {
  return b && b.startsWith("/") && !b.startsWith("//") ? b : "/plan";
}

export default async function EditPost({ params, searchParams }: { params: { id: string }; searchParams: { back?: string } }) {
  if (!/^[0-9a-f-]{36}$/i.test(params.id)) notFound();
  const today = todayParis();
  const [post, pillars, events] = await Promise.all([getPost(params.id), getPillars(), getEvents(addDays(today, -60), addDays(today, 180))]);
  if (!post) notFound();
  const back = safeBack(searchParams.back);

  return (
    <>
      <Link href={back} className="dv-link text-sm">
        Back
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <h1 className="display-l">{post.title}</h1>
      </div>
      <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-ink-soft">
        <StatusBadge post={post} today={today} />
        <span>{FORMAT_LABEL[post.format]}</span>
        {post.unplanned && <span>· Unplanned, found on Instagram</span>}
      </p>
      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_280px]">
        <PostForm post={post} pillars={pillars} events={events} back={back} />
        {post.ig_media_id && (
          <aside className="order-first lg:order-none">
            <div className="max-w-[280px]">
              <Thumb src={post.ig_thumbnail_url} alt={post.title} tall={post.format === "story" || post.format === "reel"} />
              <p className="mt-2 text-sm text-ink-soft nums">
                {post.likes ?? 0} likes · {post.comments ?? 0} comments
              </p>
            </div>
          </aside>
        )}
      </div>
    </>
  );
}
