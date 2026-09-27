import Link from "next/link";
import { deletePost, savePost } from "@/app/actions";
import { fmtDateTime, fmtShort } from "@/lib/dates";
import { FORMAT_LABEL, FORMATS, STATUS_LABEL, STATUSES, type DvEvent, type Pillar, type Post } from "@/lib/types";

type Props = {
  post?: Post | null;
  pillars: Pillar[];
  events: DvEvent[];
  back: string;
  defaults?: { date?: string; eventId?: string };
};

export function PostForm({ post, pillars, events, back, defaults }: Props) {
  const isNew = !post;
  const status = post?.status ?? (defaults?.date ? "planned" : "idea");
  const synced = !!post?.ig_media_id;

  return (
    <>
      <form action={savePost} className="max-w-[760px]" id="post-form">
        {post && <input type="hidden" name="id" value={post.id} />}
        {post?.posted_at && <input type="hidden" name="posted_at_keep" value={post.posted_at} />}
        <input type="hidden" name="back" value={back} />

        <label className="dv-field">
          <span className="label">Title</span>
          <input name="title" required defaultValue={post?.title ?? ""} placeholder="What is it? e.g. Mirabelle serve, new autumn menu" autoFocus={isNew} />
        </label>

        <fieldset className="dv-field">
          <legend className="label mb-2 text-copper-deep">Format</legend>
          <div className="dv-seg">
            {FORMATS.map((f) => (
              <label key={f}>
                <input type="radio" name="format" value={f} defaultChecked={(post?.format ?? "feed") === f} />
                {FORMAT_LABEL[f]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <label className="dv-field">
            <span className="label">Date</span>
            <input type="date" name="planned_for" defaultValue={post?.planned_for ?? defaults?.date ?? ""} />
            <span className="dv-hint">Leave empty to keep it as an idea.</span>
          </label>
          <label className="dv-field">
            <span className="label">Time (optional)</span>
            <input type="time" name="planned_time" defaultValue={post?.planned_time?.slice(0, 5) ?? ""} />
          </label>
        </div>

        <div className="grid gap-x-4 sm:grid-cols-2">
          <label className="dv-field">
            <span className="label">Stage</span>
            <select name="status" defaultValue={status}>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {STATUS_LABEL[s]}
                </option>
              ))}
            </select>
          </label>
          <label className="dv-field">
            <span className="label">Pillar</span>
            <select name="pillar" defaultValue={post?.pillar ?? ""}>
              <option value="">None yet</option>
              {pillars
                .filter((p) => p.active || p.key === post?.pillar)
                .map((p) => (
                  <option key={p.key} value={p.key}>
                    {p.label}
                  </option>
                ))}
            </select>
          </label>
        </div>

        <label className="dv-field">
          <span className="label">Linked event</span>
          <select name="event_id" defaultValue={post?.event_id ?? defaults?.eventId ?? ""}>
            <option value="">None</option>
            {events.map((e) => (
              <option key={e.id} value={e.id}>
                {e.name} · {fmtShort(e.start_date)}
              </option>
            ))}
          </select>
          <span className="dv-hint">From the Events app. Guest shifts and brand events are content too.</span>
        </label>

        <label className="dv-field">
          <span className="label">Caption</span>
          <textarea name="caption" defaultValue={post?.caption ?? ""} rows={6} />
        </label>

        <label className="dv-field">
          <span className="label">Assets</span>
          <input name="drive_path" defaultValue={post?.drive_path ?? ""} placeholder="DV - FOOD & DRINK/DRINKS/MIRABELLE_v6" />
          <span className="dv-hint">Folder in DV - Content on the shared drive, or a link.</span>
        </label>

        <label className="dv-field">
          <span className="label">Notes</span>
          <textarea name="notes" defaultValue={post?.notes ?? ""} rows={3} placeholder="Shot list, who is in it, what to check" />
        </label>

        <label className="dv-field">
          <span className="label">Instagram link</span>
          <input name="ig_permalink" type="url" defaultValue={post?.ig_permalink ?? ""} placeholder="Filled in by sync" readOnly={synced} />
          {synced && post?.posted_at && <span className="dv-hint">Synced from Instagram. Went live {fmtDateTime(post.posted_at)}.</span>}
        </label>

        <div className="dv-commit">
          <button className="dv-btn primary">{isNew ? "Create Post" : "Save Changes"}</button>
          <Link href={back} className="dv-btn">
            Cancel
          </Link>
          {post?.ig_permalink && (
            <a href={post.ig_permalink} target="_blank" rel="noreferrer" className="dv-btn">
              Open On Instagram
            </a>
          )}
        </div>
      </form>

      {post && (
        <form action={deletePost} className="mt-10 max-w-[760px] border-t border-paper-line pt-6">
          <input type="hidden" name="id" value={post.id} />
          <input type="hidden" name="back" value={back} />
          <p className="mb-3 text-sm text-ink-soft">
            {synced ? "Deleting removes it from this app only. It stays on Instagram, and will come back as Unplanned on a full history sync." : "Deleting cannot be undone."}
          </p>
          <button className="dv-btn danger">Delete Post</button>
        </form>
      )}
    </>
  );
}
