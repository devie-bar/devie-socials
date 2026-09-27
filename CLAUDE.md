# De Vie Socials (socials.devie.bar)

Instagram planning for @devie.bar: what is planned, what is being made, what went live, and whether the weekly rhythm is holding.

## Before changing any interface in this repo

Read `DESIGN.md` first. It is the De Vie Design Standard, copied from `devie-archive` (the newest version, with the Sept 2026 radii, casing and navigation rules). Do not introduce a hex value, breakpoint or control size that is not in Part 2.

## How it works

- Next.js 14 app router, Tailwind, `@supabase/ssr`, same shape as `devie-finance`.
- Shared Supabase project. Tables live in `public` with a `social_` prefix so no API schema change was needed.
- Sign-in is the estate's email OTP, gated by `public.is_email_allowed`. Data access is `public.has_social_access()`: admin, or `{"socials": true}` in `profiles.permissions`.
- Instagram: `lib/instagram.ts`. Instagram API with Instagram Login, scope `instagram_business_basic`. The long-lived token sits in `social_ig_connection` (service role only) and refreshes on each sync.
- Sync runs: Vercel cron daily at 05:15 UTC (`vercel.json`), on page open when the last sync is over 3 hours old, and from Settings.
- Matching: a new Instagram item links to the closest not-yet-posted plan of the same format within 3 days (feed and carousel count as the same). Anything that matches nothing is saved as Unplanned.

## Sections

Plan (4-week calendar, targets, gaps, events from the Events app), Pipeline (Idea > Planned > Shot > Edited > Ready), Posted (what went live, by month), Rhythm (12 weeks against target, streak, longest gap, pillar mix), Settings (Instagram, targets, pillars).

## Design preview

`DV_PREVIEW=1 npm run dev` renders every screen with sample data and no sign-in (`lib/preview.ts`, `lib/fixtures.ts`). It cannot switch on in a production build.

## Working on this repo through Claude

Claude commits on the current branch and stops there. Pushing and branch switching happen in Alex's terminal.
