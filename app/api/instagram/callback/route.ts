import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSocialUser } from "@/lib/auth";
import { connectWithCode, syncInstagram } from "@/lib/instagram";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const back = (q: string) => NextResponse.redirect(`${origin}/settings?${q}`);

  const user = await getSocialUser();
  if (!user?.allowed) return back("ig=denied");
  const state = cookies().get("ig_state")?.value;
  if (!state || state !== url.searchParams.get("state")) return back("ig=error&msg=" + encodeURIComponent("The sign-in link expired. Try Connect again."));
  const code = url.searchParams.get("code");
  if (!code) return back("ig=error&msg=" + encodeURIComponent(url.searchParams.get("error_description") ?? "Instagram did not return a code."));

  try {
    await connectWithCode(code.replace(/#_$/, ""), `${origin}/api/instagram/callback`);
    await syncInstagram({ deep: true }).catch(() => null);
    return back("ig=connected");
  } catch (e) {
    return back("ig=error&msg=" + encodeURIComponent(e instanceof Error ? e.message : String(e)));
  }
}
