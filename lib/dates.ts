import { TZ } from "@/lib/config";

/** YYYY-MM-DD for an instant, in Paris time. */
export function parisDate(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
}
export function todayParis(): string {
  return parisDate(new Date());
}

/** Calendar maths on plain YYYY-MM-DD strings (no time zone drift). */
function toUTC(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}
function fromUTC(d: Date): string {
  return d.toISOString().slice(0, 10);
}
export function addDays(s: string, n: number): string {
  const d = toUTC(s);
  d.setUTCDate(d.getUTCDate() + n);
  return fromUTC(d);
}
export function diffDays(a: string, b: string): number {
  return Math.round((toUTC(a).getTime() - toUTC(b).getTime()) / 86_400_000);
}
/** Monday of the week containing s. */
export function weekStart(s: string): string {
  const d = toUTC(s);
  const dow = (d.getUTCDay() + 6) % 7; // Mon = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return fromUTC(d);
}
/** ISO week number. */
export function isoWeek(s: string): number {
  const d = toUTC(s);
  const dow = (d.getUTCDay() + 6) % 7;
  d.setUTCDate(d.getUTCDate() - dow + 3);
  const firstThu = new Date(Date.UTC(d.getUTCFullYear(), 0, 4));
  return 1 + Math.round(((d.getTime() - firstThu.getTime()) / 86_400_000 - 3 + ((firstThu.getUTCDay() + 6) % 7)) / 7);
}

const fmt = (opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { timeZone: "UTC", ...opts });
export const fmtDay = (s: string) => fmt({ weekday: "short", day: "numeric", month: "short" }).format(toUTC(s));
export const fmtShort = (s: string) => fmt({ day: "numeric", month: "short" }).format(toUTC(s));
export const fmtWeekday = (s: string) => fmt({ weekday: "short" }).format(toUTC(s));
export const fmtDayNum = (s: string) => fmt({ day: "numeric" }).format(toUTC(s));
export const fmtMonth = (s: string) => fmt({ month: "long", year: "numeric" }).format(toUTC(s));
export function fmtDateTime(iso: string): string {
  return new Intl.DateTimeFormat("en-GB", { timeZone: TZ, day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).format(new Date(iso));
}
export function relDays(n: number): string {
  if (n === 0) return "today";
  if (n === 1) return "yesterday";
  return `${n} days ago`;
}
