import { PREVIEW } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

export type SocialUser = { id: string; email: string | null; name: string | null; allowed: boolean };

// Mirrors public.has_social_access(): an active admin, or an explicit {socials:true} permission.
export async function getSocialUser(): Promise<SocialUser | null> {
  if (PREVIEW) return { id: "preview", email: "alex@devie.bar", name: "Alex Francis", allowed: true };
  const sb = createClient();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) return null;
  const { data: allowed } = await sb.rpc("has_social_access");
  const { data: profile } = await sb.from("profiles").select("email, full_name").eq("id", user.id).maybeSingle();
  return {
    id: user.id,
    email: profile?.email ?? user.email ?? null,
    name: profile?.full_name ?? null,
    allowed: allowed === true,
  };
}
