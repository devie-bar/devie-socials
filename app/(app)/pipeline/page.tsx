import Link from "next/link";
import { getPillars, getPipelinePosts } from "@/lib/data";
import { setStatus } from "@/app/actions";
import { fmtDay, todayParis } from "@/lib/dates";
import { FORMAT_LABEL, FORMATS, PIPELINE, STATUS_LABEL, nextStatus, type Format, type Post } from "@/lib/types";
import { StatusBadge } from "@/components/Status";

export const dynamic = "force-dynamic";

const STAGE_HELP: Record<string, string> = {
  idea: "Not dated yet",
  planned: "Dated, not shot",
  shot: "Shot, needs editing",
  edited: "Edited, needs caption and sign-off",
  ready: "Ready to go out",
};

export default async function PipelinePage({ searchParams }: { searchParams: { format?: string } }) {
  const format = FORMATS.includes(searchParams.format as Format) ? (searchParams.format as Format) : null;
  const [all, pillars] = await Promise.all([getPipelinePosts(), getPillars()]);
  const posts = format ? all.filter((p) => p.format === format) : all;
  const today = todayParis();
  const back = `/pipeline${format ? `?format=${format}` : ""}`;

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-xl">Pipeline</h1>
        <Link href={`/posts/new?back=${encodeURIComponent(back)}`} className="dv-btn copper">
          New Post
        </Link>
      </div>
      <p className="mt-3 max-w-[70ch] text-ink-soft">
        Everything not yet live, from idea to ready. Instagram sync moves a post to Posted when it goes out.
      </p>

      <nav className="dv-seg mt-6" aria-label="Filter by format">
        <Link href="/pipeline" aria-current={!format ? "page" : undefined}>
          All
        </Link>
        {FORMATS.map((f) => (
          <Link key={f} href={`/pipeline?format=${f}`} aria-current={format === f ? "page" : undefined}>
            {FORMAT_LABEL[f]}
          </Link>
        ))}
      </nav>

      {all.length === 0 ? (
        <div className="mt-10 max-w-[70ch]">
          <p>Nothing in the pipeline yet. This is where ideas wait for a date, and planned posts move through shooting and editing.</p>
          <Link href={`/posts/new?back=${encodeURIComponent(back)}`} className="dv-btn primary mt-4">
            Create Your First Post
          </Link>
        </div>
      ) : posts.length === 0 ? (
        <div className="mt-10">
          <p>No {FORMAT_LABEL[format!]} posts in the pipeline.</p>
          <Link href="/pipeline" className="dv-btn mt-4">
            Clear Filter
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-5 lg:gap-4">
          {PIPELINE.map((stage) => {
            const items = posts.filter((p) => p.status === stage);
            return (
              <section key={stage} aria-labelledby={`st-${stage}`}>
                <div className="flex items-baseline justify-between gap-2 border-b border-paper-line pb-2">
                  <h2 id={`st-${stage}`} className="display-s">
                    {STATUS_LABEL[stage]}
                  </h2>
                  <span className="nums text-sm text-ink-soft">{items.length}</span>
                </div>
                <p className="mt-1 text-[12px] text-ink-soft">{STAGE_HELP[stage]}</p>
                <ul className="mt-2">
                  {items.map((p) => (
                    <Item key={p.id} post={p} pillar={pillars.find((x) => x.key === p.pillar)?.label} today={today} back={back} />
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}

function Item({ post, pillar, today, back }: { post: Post; pillar?: string; today: string; back: string }) {
  const next = nextStatus(post.status);
  return (
    <li className="border-b border-paper-line py-3">
      <Link href={`/posts/${post.id}?back=${encodeURIComponent(back)}`} className="block font-medium leading-snug hover:text-brand">
        {post.title}
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
        {post.planned_for && post.planned_for < today && <StatusBadge post={post} today={today} />}
        <span>{FORMAT_LABEL[post.format]}</span>
        {pillar && <span>· {pillar}</span>}
        {post.planned_for && <span className="nums">· {fmtDay(post.planned_for)}</span>}
      </div>
      {next && next !== "planned" && (
        <form action={setStatus} className="mt-2">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="status" value={next} />
          <button className="dv-btn small">Mark {STATUS_LABEL[next]}</button>
        </form>
      )}
      {post.status === "ready" && (
        <form action={setStatus} className="mt-2">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="status" value="posted" />
          <button className="dv-btn small">Mark Posted</button>
        </form>
      )}
      {post.status === "idea" && (
        <Link href={`/posts/${post.id}?back=${encodeURIComponent(back)}`} className="dv-btn small mt-2">
          Give It A Date
        </Link>
      )}
    </li>
  );
}
