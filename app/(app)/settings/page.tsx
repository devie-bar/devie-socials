import { getConnection, getPillars, getTargets } from "@/lib/data";
import { disconnectInstagram, savePillar, saveTargets } from "@/app/actions";
import { fmtDateTime, parisDate, todayParis, diffDays } from "@/lib/dates";
import { FORMAT_LABEL, FORMATS } from "@/lib/types";
import { SyncButton } from "@/components/SyncButton";

export const dynamic = "force-dynamic";

export default async function SettingsPage({ searchParams }: { searchParams: { ig?: string; msg?: string } }) {
  const [conn, targets, pillars] = await Promise.all([getConnection(), getTargets(), getPillars()]);
  const days = conn?.token_expires_at ? diffDays(parisDate(conn.token_expires_at), todayParis()) : null;
  const failed = conn?.last_sync_result?.startsWith("Failed");

  return (
    <>
      <h1 className="display-xl">Settings</h1>

      {searchParams.ig === "connected" && (
        <p role="status" className="mt-6 max-w-[70ch] rounded-inner border border-good-line bg-good-tint px-4 py-3 text-good">
          Instagram is connected and the first sync has run.
        </p>
      )}
      {searchParams.ig === "error" && (
        <p role="alert" className="mt-6 max-w-[70ch] rounded-inner border border-danger-line bg-danger-tint px-4 py-3 text-danger">
          Instagram did not connect. {searchParams.msg}
        </p>
      )}

      <section className="mt-10 max-w-[70ch]" aria-labelledby="ig-h">
        <h2 id="ig-h" className="display-m">
          Instagram
        </h2>
        {conn?.connected ? (
          <>
            <p className="mt-3">
              Connected as <strong>@{conn.username}</strong>.{" "}
              {days !== null && (
                <span className={days < 10 ? "text-danger" : "text-ink-soft"}>
                  Access renews on each sync; it lapses in {days} days if nothing syncs.
                </span>
              )}
            </p>
            <p className={`mt-2 text-sm ${failed ? "text-danger" : "text-ink-soft"}`}>
              {conn.last_sync_at ? `Last sync ${fmtDateTime(conn.last_sync_at)}. ${conn.last_sync_result ?? ""}` : "Not synced yet."}
            </p>
            <p className="mt-2 text-sm text-ink-soft">
              Syncs every morning, and whenever you open Plan or Posted after three hours away. Stories only show while they are live,
              so a Story is caught if the app syncs within its 24 hours.
            </p>
            <div className="mt-4 flex flex-wrap items-start gap-2">
              <SyncButton />
              <SyncButton deep />
              <form action={disconnectInstagram}>
                <button className="dv-btn danger">Disconnect</button>
              </form>
            </div>
          </>
        ) : (
          <>
            <p className="mt-3">
              Connect @devie.bar so posts are marked live by themselves and matched to what you planned. It needs a Business or Creator
              account and the Meta app keys set in Vercel.
            </p>
            <a href="/api/instagram/connect" className="dv-btn primary mt-4">
              Connect Instagram
            </a>
          </>
        )}
      </section>

      <section className="mt-12 max-w-[70ch]" aria-labelledby="t-h">
        <h2 id="t-h" className="display-m">
          Weekly targets
        </h2>
        <p className="mt-2 text-sm text-ink-soft">
          The rhythm you are aiming for. Pick numbers you can hold every week, then raise them. A target you miss every week teaches you to
          ignore it.
        </p>
        <form action={saveTargets} className="mt-4">
          <div className="grid grid-cols-2 gap-x-4 sm:grid-cols-4">
            {FORMATS.map((f) => (
              <label key={f} className="dv-field">
                <span className="label">{FORMAT_LABEL[f]}</span>
                <input
                  type="number"
                  name={f}
                  min={0}
                  max={50}
                  inputMode="numeric"
                  defaultValue={targets.find((t) => t.format === f)?.per_week ?? 0}
                  className="nums"
                />
              </label>
            ))}
          </div>
          <button className="dv-btn primary">Save Targets</button>
        </form>
      </section>

      <section className="mt-12" aria-labelledby="p-h">
        <h2 id="p-h" className="display-m">
          Pillars
        </h2>
        <p className="mt-2 max-w-[70ch] text-sm text-ink-soft">
          The themes content is tagged with, taken from the folders in DV - Content on the shared drive. Rhythm shows the mix.
        </p>
        <ul className="mt-4 max-w-[900px]">
          {pillars.map((p) => (
            <li key={p.key} className="border-b border-paper-line py-3">
              <form action={savePillar} className="grid items-end gap-3 md:grid-cols-[160px_1fr_1fr_auto_auto]">
                <input type="hidden" name="key" value={p.key} />
                <label className="block">
                  <span className="sr-only">Name</span>
                  <input name="label" defaultValue={p.label} className="dv-input" aria-label="Pillar name" />
                </label>
                <label className="block">
                  <span className="sr-only">Description</span>
                  <input name="blurb" defaultValue={p.blurb ?? ""} className="dv-input" aria-label="Description" />
                </label>
                <label className="block">
                  <span className="sr-only">Drive folder</span>
                  <input name="drive_folder" defaultValue={p.drive_folder ?? ""} className="dv-input" aria-label="Drive folder" />
                </label>
                <label className="flex min-h-[44px] items-center gap-2 text-sm">
                  <input type="checkbox" name="active" defaultChecked={p.active} className="h-4 w-4 accent-[#025B4C]" />
                  In Use
                </label>
                <button className="dv-btn small">Save</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={savePillar} className="mt-6 flex max-w-[640px] flex-wrap items-end gap-3">
          <label className="dv-field mb-0 min-w-[200px] flex-1">
            <span className="label">New pillar</span>
            <input name="label" required placeholder="e.g. Behind the bar" />
          </label>
          <button className="dv-btn">Add Pillar</button>
        </form>
      </section>
    </>
  );
}
