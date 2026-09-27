import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "@/lib/config";

// Service-role client for the Instagram sync only (it reads the stored token,
// which no signed-in user can read). Never import this into a client component.
export function createAdminClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not set in Vercel.");
  return createClient(SUPABASE_URL, key, { auth: { persistSession: false } });
}
