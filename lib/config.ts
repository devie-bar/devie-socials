// Public Supabase config, shared with every De Vie app. The URL and publishable
// key are safe in the client bundle; row access is enforced by RLS.
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://izkvvdlkdywtvzmqmvos.supabase.co";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_KKlRhZx1kpp1lztC4C-bsQ_fQ2pLXoG";

export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://socials.devie.bar";
export const TZ = "Europe/Paris";
