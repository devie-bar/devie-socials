import Link from "next/link";
import { getPillars, getPostsBetween, getTargets } from "@/lib/data";
import { STATE_CLASS, STATE_WORD, isLive, longestGridGap, weekSummary, weeksBack } from "@/lib/cadence";
import { addDays, fmtShort, isoWeek, parisDate, todayParis } from "@/lib/dates";
import { FORMAT_LABEL, FORMATS } from "@/lib/types";

export const dynamic = "force-dynamic";

const N = 12;

export default async function RhythmPage() {
  const today = todayParis();
  const weeks = weeksBack(N, today);
  const from = weeks[0];
  const [posts, targets, pillars] = await Promise.all([getPostsBetween(from, today), getTargets(), getPillars()]);
  const live = posts.filter(isLive);
  const active = FORMATS.filter((f) => (targets.find((t) => t.format === f)?.per_week ?? 0) > 0);

  // Completed weeks only, so the running week does not drag the score down on a Monday.
  const done = weeks.slice(0, -1).map((w) => ({ w, s: weekSummary(posts, targets, w, today) }));
  const hitAll = done.filter(({ s }) => s.filter((x) => x.target > 0).every((x) => x.posted >= x.target)).length;
  let streak = 0;
  for (let i = done.length - 1; i >= 0; i--) {
    if (done[i].s.filter((x) => x.target > 0).every((x) => x.posted >= x.target)) streak++;
    else break;
  }
  const gap = longestGridGap(posts, from, today);

  const gridByWeek = weeks.map((w) => {
    const end = addDays(w, 6);
    const n = live.filter((p) => p.format !== "story" && p.posted_at && parisDate(p.posted_at) >= w && parisDate(p.posted_at) <= end).length;
    return { w, n };
  });
  const gridTarget = targets.filter((t) => t.format !== "story").reduce((a, t) => a + t.per_week, 0);
  const maxBar = Math.max(gridTarget, ...gridByWeek.map((g) => g.n), 1);

  const pillarCounts = pillars
    .map((p) => ({ p, n: live.filter((x) => x.pillar === p.key).length }))
    .filter((x) => x.n > 0)
    .sort((a, b) => b.n - a.n);
  const untagged = live.filter((x) => !x.pillar).length;
  const maxPillar = Math.max(1, ...pillarCounts.map((x) => x.n), untagged);

  if (!live.length) {
    return (
      <>
        <h1 className="display-xl">Rhythm</h1>
        <div className="mt-6 max-w-[70ch]">
          <p>No live posts in the last {N} weeks yet. Rhythm reads from what Instagram says went out, so it fills in after the first sync.</p>
          <Link href="/settings" className="dv-btn primary mt-4">
            Connect Instagram
          </Link>
        </div>
      </>
    );
  }

  return (
    <>
      <h1 className="display-xl">Rhythm</h1>
      <p className="mt-3 max-w-[70ch] text-ink-soft">
        The last {N} weeks against your weekly targets. Consistency is weeks on target, not total posts.
      </p>

      <dl className="mt-8 grid grid-cols-2 gap-6 md:grid-cols-3">
        <div>
          <dt className="label text-copper-deep">Weeks on target</dt>
          <dd className="display mt-1 text-[40px] leading-none nums">
            {hitAll} <span className="font-sans text-[15px] tracking-normal text-ink-soft">of {done.length}</span>
          </dd>
        </div>
        <div>
          <dt className="label text-copper-deep">Current streak</dt>
          <dd className="display mt-1 text-[40px] leading-none nums">
            {streak} <span className="font-sans text-[15px] tracking-normal text-ink-soft">{streak === 1 ? "week" : "weeks"}</span>
          </dd>
        </div>
        <div>
          <dt className="label text-copper-deep">Longest grid gap</dt>
          <dd className="display mt-1 text-[40px] leading-none nums">
            {gap?.days ?? 0} <span className="font-sans text-[15px] tracking-normal text-ink-soft">days</span>
          </dd>
          {gap && gap.days > 0 && (
            <dd className="mt-1 text-[12px] text-ink-soft">
              {fmtShort(gap.from)} to {fmtShort(gap.to)}
            </dd>
          )}
        </div>
      </dl>

      <section className="mt-12" aria-labelledby="grid-h">
        <h2 id="grid-h" className="display-m">
          Grid posts per week
        </h2>
        <p className="mt-1 text-sm text-ink-soft">Feed, Reels and carousels. The line is the combined target of {gridTarget}.</p>
        <div className="relative mt-4 flex h-44 items-end gap-1 border-b border-paper-line sm:gap-2" role="img" aria-label={`Grid posts per week, last ${N} weeks`}>
          {gridTarget > 0 && (
            <div className="pointer-events-none absolute inset-x-0 border-t border-dashed border-copper-deep" style={{ bottom: `${(gridTarget / maxBar) * 100}%` }} aria-hidden />
          )}
          {gridByWeek.map(({ w, n }) => (
            <div key={w} className="flex h-full flex-1 flex-col items-center justify-end">
              <span className="nums mb-1 text-[12px] text-ink-soft">{n}</span>
              <div
                className={`w-full max-w-[40px] rounded-t-[4px] ${n >= gridTarget ? "bg-brand" : "bg-brand-mint"}`}
                style={{ height: `${(n / maxBar) * 100}%`, minHeight: n ? 2 : 0 }}
              />
            </div>
          ))}
        </div>
        <div className="mt-1 flex gap-1 sm:gap-2" aria-hidden>
          {gridByWeek.map(({ w }) => (
            <span key={w} className="nums flex-1 text-center text-[12px] text-ink-soft">
              {isoWeek(w)}
            </span>
          ))}
        </div>
        <p className="mt-1 text-[12px] text-ink-soft">Week number. Dark bars met the target.</p>
      </section>

      <section className="mt-12" aria-labelledby="weeks-h">
        <h2 id="weeks-h" className="display-m">
          Week by week
        </h2>
        {/* DESIGN.md 3.2: grouped list below 840, table above. */}
        <div className="mt-4 hidden md:block">
          <table className="w-full text-[13.5px]">
            <thead>
              <tr className="border-b border-paper-line text-left">
                <th className="label py-2 pr-4 font-semibold text-copper-deep">Week</th>
                {active.map((f) => (
                  <th key={f} className="label py-2 pr-4 font-semibold text-copper-deep">
                    {FORMAT_LABEL[f]}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...weeks].reverse().map((w, i) => {
                const s = weekSummary(posts, targets, w, today);
                return (
                  <tr key={w} className={`border-b border-paper-line ${i % 2 ? "bg-paper-wash" : ""}`}>
                    <td className="py-2 pr-4">
                      <span className="font-medium">Week {isoWeek(w)}</span> <span className="text-ink-soft">{fmtShort(w)}</span>
                    </td>
                    {active.map((f) => {
                      const x = s.find((y) => y.format === f)!;
                      return (
                        <td key={f} className="py-2 pr-4">
                          <span className="nums mr-2">
                            {x.posted} of {x.target}
                          </span>
                          <span className={`dv-status ${STATE_CLASS[x.state]}`}>{STATE_WORD[x.state]}</span>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <ul className="mt-4 md:hidden">
          {[...weeks].reverse().map((w) => {
            const s = weekSummary(posts, targets, w, today).filter((x) => x.target > 0);
            return (
              <li key={w} className="border-b border-paper-line py-3">
                <p className="font-medium">
                  Week {isoWeek(w)} <span className="font-normal text-ink-soft">{fmtShort(w)}</span>
                </p>
                <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  {s.map((x) => (
                    <li key={x.format} className="flex items-center gap-2 text-[13px]">
                      {FORMAT_LABEL[x.format]} <span className="nums text-ink-soft">{x.posted}/{x.target}</span>
                      <span className={`dv-status ${STATE_CLASS[x.state]}`}>{STATE_WORD[x.state]}</span>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-12" aria-labelledby="mix-h">
        <h2 id="mix-h" className="display-m">
          Pillar mix
        </h2>
        <p className="mt-1 text-sm text-ink-soft">What the last {N} weeks were about. Synced posts start untagged; tag them from Posted.</p>
        <ul className="mt-4 max-w-[640px]">
          {pillarCounts.map(({ p, n }) => (
            <li key={p.key} className="grid grid-cols-[120px_1fr_40px] items-center gap-3 py-1 text-[13.5px]">
              <span>{p.label}</span>
              <span className="h-2 rounded-chip bg-brand" style={{ width: `${(n / maxPillar) * 100}%` }} aria-hidden />
              <span className="nums text-right">{n}</span>
            </li>
          ))}
          {untagged > 0 && (
            <li className="grid grid-cols-[120px_1fr_40px] items-center gap-3 py-1 text-[13.5px] text-ink-soft">
              <span>Untagged</span>
              <span className="h-2 rounded-chip bg-paper-line" style={{ width: `${(untagged / maxPillar) * 100}%` }} aria-hidden />
              <span className="nums text-right">{untagged}</span>
            </li>
          )}
        </ul>
      </section>
    </>
  );
}
