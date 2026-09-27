import Link from "next/link";
import { getConnection, getEvents, getPillars, getPostsBetween, getTargets } from "@/lib/data";
import { STATE_CLASS, STATE_WORD, dayOf, daysSinceLast, weekSummary, type WeekFormat } from "@/lib/cadence";
import { addDays, fmtDayNum, fmtShort, fmtWeekday, isoWeek, todayParis, weekStart } from "@/lib/dates";
import { FORMAT_LABEL, FORMAT_PLURAL, type DvEvent, type Pillar, type Post } from "@/lib/types";
import { PostChip } from "@/components/PostChip";
import { AutoSync } from "@/components/AutoSync";

export const dynamic = "force-dynamic";

const WEEKS = 4;

export default async function PlanPage({ searchParams }: { searchParams: { from?: string } }) {
  const today = todayParis();
  const thisWeek = weekStart(today);
  const from = searchParams.from && /^\d{4}-\d{2}-\d{2}$/.test(searchParams.from) ? weekStart(searchParams.from) : thisWeek;
  const to = addDays(from, 7 * WEEKS - 1);

  // Look back 60 days as well, so "days since last post" is right even when viewing later weeks.
  const [posts, recent, targets, pillars, events, conn] = await Promise.all([
    getPostsBetween(from, to),
    getPostsBetween(addDays(today, -60), today),
    getTargets(),
    getPillars(),
    getEvents(from, to),
    getConnection(),
  ]);

  const sinceGrid = daysSinceLast(recent, ["feed", "reel", "carousel"], today);
  const sinceStory = daysSinceLast(recent, ["story"], today);
  const now = weekSummary([...recent, ...posts.filter((p) => !recent.some((r) => r.id === p.id))], targets, thisWeek, today);
  const back = `/plan${from === thisWeek ? "" : `?from=${from}`}`;
  const weeks = Array.from({ length: WEEKS }, (_, i) => addDays(from, 7 * i));

  return (
    <>
      <AutoSync lastSyncAt={conn?.last_sync_at ?? null} connected={!!conn?.connected} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="display-xl">Plan</h1>
        <Link href={`/posts/new?back=${encodeURIComponent(back)}`} className="dv-btn copper">
          New Post
        </Link>
      </div>

      {/* The number this screen exists for: how long since the grid last moved. */}
      <section className="mt-8 grid gap-8 md:grid-cols-[auto_1fr] md:items-end md:gap-12" aria-label="This week">
        <div>
          <p className="label text-copper-deep">Since the last grid post</p>
          <p className="display mt-1 text-[56px] leading-none text-brand nums">
            {sinceGrid === null ? "No data" : `${sinceGrid} ${sinceGrid === 1 ? "day" : "days"}`}
          </p>
          <p className="mt-2 text-sm text-ink-soft">
            {sinceStory === null ? "No Stories synced yet." : `Last Story ${sinceStory === 0 ? "today" : `${sinceStory} ${sinceStory === 1 ? "day" : "days"} ago`}.`}
            {!conn?.connected && (
              <>
                {" "}
                <Link href="/settings" className="dv-link">
                  Connect Instagram
                </Link>{" "}
                to fill this in from what is live.
              </>
            )}
          </p>
        </div>
        <div>
          <p className="label mb-2 text-copper-deep">This week against target</p>
          <FormatLine items={now} current />
        </div>
      </section>

      <nav className="mt-12 flex flex-wrap items-center gap-2" aria-label="Weeks">
        <Link className="dv-btn small" href={`/plan?from=${addDays(from, -7 * WEEKS)}`}>
          Earlier
        </Link>
        {from !== thisWeek && (
          <Link className="dv-btn small" href="/plan">
            This Week
          </Link>
        )}
        <Link className="dv-btn small" href={`/plan?from=${addDays(from, 7 * WEEKS)}`}>
          Later
        </Link>
        <span className="ml-auto text-sm text-ink-soft">
          {fmtShort(from)} to {fmtShort(to)}
        </span>
      </nav>

      {weeks.map((ws) => (
        <Week
          key={ws}
          start={ws}
          today={today}
          posts={posts}
          summary={weekSummary(posts, targets, ws, today)}
          events={events}
          pillars={pillars}
          back={back}
        />
      ))}
    </>
  );
}

function FormatLine({ items, current = false }: { items: WeekFormat[]; current?: boolean }) {
  const shown = items.filter((i) => i.target > 0);
  if (!shown.length)
    return (
      <p className="text-sm text-ink-soft">
        No weekly targets set.{" "}
        <Link href="/settings" className="dv-link">
          Set targets
        </Link>
      </p>
    );
  return (
    <ul className="flex flex-wrap gap-x-6 gap-y-2">
      {shown.map((i) => (
        <li key={i.format} className="flex items-center gap-2 text-sm">
          <span className="font-medium">{FORMAT_LABEL[i.format]}</span>
          <span className="nums text-ink-soft">
            {current || i.state === "hit" || i.state === "missed" ? i.posted : i.planned} of {i.target}
          </span>
          <span className={`dv-status ${STATE_CLASS[i.state]}`}>{STATE_WORD[i.state]}</span>
        </li>
      ))}
    </ul>
  );
}

function shortfallText(items: WeekFormat[]): string | null {
  const gaps = items.filter((i) => i.shortfall > 0 && (i.state === "gap" || i.state === "behind"));
  if (!gaps.length) return null;
  return "Needs " + gaps.map((g) => `${g.shortfall} more ${g.shortfall === 1 ? FORMAT_LABEL[g.format] : FORMAT_PLURAL[g.format]}`).join(", ");
}

function Week({
  start,
  today,
  posts,
  summary,
  events,
  pillars,
  back,
}: {
  start: string;
  today: string;
  posts: Post[];
  summary: WeekFormat[];
  events: DvEvent[];
  pillars: Pillar[];
  back: string;
}) {
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const end = days[6];
  const need = end >= today ? shortfallText(summary) : null;
  const isCurrent = start <= today && today <= end;

  return (
    <section className="mt-12" aria-labelledby={`w-${start}`}>
      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <h2 id={`w-${start}`} className="display-m">
          {isCurrent ? "This week" : `Week ${isoWeek(start)}`}
        </h2>
        <span className="text-sm text-ink-soft">
          {fmtShort(start)} to {fmtShort(end)}
        </span>
      </div>
      <div className="mt-3">
        <FormatLine items={summary} current={isCurrent} />
        {need && <p className="mt-2 text-sm font-medium text-danger">{need}</p>}
      </div>

      <div className="mt-4 grid border-t border-paper-line md:grid-cols-7 md:gap-2 md:border-t-0">
        {days.map((d) => {
          const dayPosts = posts.filter((p) => dayOf(p) === d && p.status !== "skipped");
          const dayEvents = events.filter((e) => e.start_date <= d && e.end_date >= d);
          const isToday = d === today;
          const empty = !dayPosts.length && !dayEvents.length;
          return (
            <div
              key={d}
              className={`flex gap-3 border-b border-paper-line py-2 md:min-h-[150px] md:flex-col md:gap-2 md:rounded-module md:border md:px-3 md:py-3 ${
                isToday ? "md:border-copper md:bg-paper-card" : ""
              }`}
            >
              <div className="w-14 shrink-0 md:w-auto">
                <span className="label block text-ink-soft">{fmtWeekday(d)}</span>
                <span className={`display text-[21px] leading-tight nums ${isToday ? "text-copper-deep" : "text-ink"}`}>
                  {fmtDayNum(d)}
                </span>
                {isToday && <span className="sr-only">Today</span>}
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {dayEvents.map((e) => (
                  <p key={e.id} className="text-[12px] leading-snug text-info">
                    <span className="font-semibold">Event:</span> {e.name}
                  </p>
                ))}
                {dayPosts.map((p) => (
                  <PostChip key={p.id} post={p} pillars={pillars} back={back} today={today} />
                ))}
                {d >= today && (
                  <Link
                    href={`/posts/new?date=${d}&back=${encodeURIComponent(back)}`}
                    className={`inline-flex min-h-[44px] items-center text-[13px] text-ink-soft underline-offset-2 hover:text-copper-deep hover:underline md:mt-auto md:min-h-[32px] ${
                      empty ? "" : "md:pt-1"
                    }`}
                    aria-label={`Add a post on ${fmtWeekday(d)} ${fmtShort(d)}`}
                  >
                    {empty ? "Nothing planned · Add" : "Add"}
                  </Link>
                )}
                {d < today && empty && <span className="text-[13px] text-ink-soft">Nothing</span>}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
