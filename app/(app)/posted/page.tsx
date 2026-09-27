import Link from "next/link";
import { getConnection, getPillars, getPosted } from "@/lib/data";
import { addDays, fmtDateTime, fmtMonth, todayParis } from "@/lib/dates";
import { FORMAT_LABEL, FORMATS, type Format } from "@/lib/types";
import { AutoSync } from "@/components/AutoSync";
import { Thumb } from "@/components/Thumb";

export const dynamic = "force-dynamic";

function monthBounds(m: string) {
  const [y, mo] = m.split("-").map(Number);
  const first = `${m}-01`;
  const next = mo === 12 ? `${y + 1}-01-01` : `${y}-${String(mo + 1).padStart(2, "0")}-01`;
  return { first, last: addDays(next, -1), prev: addDays(first, -1).slice(0, 7), next: next.slice(0, 7) };
}

export default async function PostedPage({ searchParams }: { searchParams: { month?: string; format?: string } }) {
  const today = todayParis();
  const month = searchParams.month && /^\d{4}-\d{2}$/.test(searchParams.month) ? searchParams.month : today.slice(0, 7);
  const format = FORMATS.includes(searchParams.format as Format) ? (searchParams.format as Format) : null;
  const b = monthBounds(month);
  const [all, pillars, conn] = await Promise.all([getPosted(b.first, b.last), getPillars(), getConnection()]);
  const posts = format ? all.filter((p) => p.format === format) : all;
  const q = (m: string, f: Format | null) => `/posted?month=${m}${f ? `&format=${f}` : ""}`;
  const unplanned = all.filter((p) => p.unplanned).length;

  return (
    <>
      <AutoSync lastSyncAt={conn?.last_sync_at ?? null} connected={!!conn?.connected} />
      <h1 className="display-xl">Posted</h1>
      <p className="mt-3 max-w-[70ch] text-ink-soft">
        What actually went live on {conn?.username ? `@${conn.username}` : "Instagram"}. Posts that matched nothing in the plan are marked Unplanned.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-2">
        <Link className="dv-btn small" href={q(b.prev, format)}>
          Previous Month
        </Link>
        <span className="display-s px-2">{fmtMonth(b.first)}</span>
        {b.next <= today.slice(0, 7) && (
          <Link className="dv-btn small" href={q(b.next, format)}>
            Next Month
          </Link>
        )}
      </div>
      <nav className="dv-seg mt-4" aria-label="Filter by format">
        <Link href={q(month, null)} aria-current={!format ? "page" : undefined}>
          All
        </Link>
        {FORMATS.map((f) => (
          <Link key={f} href={q(month, f)} aria-current={format === f ? "page" : undefined}>
            {FORMAT_LABEL[f]}
          </Link>
        ))}
      </nav>

      {all.length > 0 && (
        <p className="mt-6 text-sm text-ink-soft">
          <span className="nums font-semibold text-ink">{all.length}</span> live this month ·{" "}
          <span className="nums">{all.length - unplanned}</span> from the plan · <span className="nums">{unplanned}</span> unplanned
        </p>
      )}

      {!conn?.connected && all.length === 0 ? (
        <div className="mt-8 max-w-[70ch]">
          <p>Nothing synced from Instagram yet. Connect @devie.bar and this fills in by itself.</p>
          <Link href="/settings" className="dv-btn primary mt-4">
            Connect Instagram
          </Link>
        </div>
      ) : all.length === 0 ? (
        <p className="mt-8">Nothing went live in {fmtMonth(b.first)}.</p>
      ) : posts.length === 0 ? (
        <div className="mt-8">
          <p>
            No {FORMAT_LABEL[format!]} posts in {fmtMonth(b.first)}.
          </p>
          <Link href={q(month, null)} className="dv-btn mt-4">
            Clear Filter
          </Link>
        </div>
      ) : (
        <ul className="mt-6 grid grid-cols-2 gap-x-3 gap-y-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
          {posts.map((p) => (
            <li key={p.id}>
              <Link href={`/posts/${p.id}?back=${encodeURIComponent(q(month, format))}`} className="group block">
                <Thumb src={p.ig_thumbnail_url} alt={p.title} tall={p.format === "story" || p.format === "reel"} />
                <span className="mt-2 block text-[14px] font-medium leading-snug group-hover:text-brand">{p.title}</span>
              </Link>
              <span className="mt-1 flex flex-wrap gap-x-2 text-[12px] text-ink-soft">
                <span>{FORMAT_LABEL[p.format]}</span>
                {p.posted_at && <span className="nums">· {fmtDateTime(p.posted_at)}</span>}
              </span>
              <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-[12px] text-ink-soft">
                {p.likes != null && <span className="nums">{p.likes} likes</span>}
                {p.comments != null && <span className="nums">· {p.comments} comments</span>}
                {p.unplanned ? (
                  <span className="dv-status st-idea">Unplanned</span>
                ) : (
                  pillars.find((x) => x.key === p.pillar) && <span>· {pillars.find((x) => x.key === p.pillar)!.label}</span>
                )}
              </span>
              {p.ig_permalink && (
                <a href={p.ig_permalink} target="_blank" rel="noreferrer" className="dv-link mt-1 inline-block text-[12px]">
                  Open On Instagram
                </a>
              )}
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
