import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSocialUser } from "@/lib/auth";
import { authorizeUrl } from "@/lib/instagram";

export async function GET(request: Request) {
  const origin = new URL(request.url).origin;
  const user = await getSocialUser();
  if (!user?.allowed) return NextResponse.redirect(`${origin}/settings?ig=denied`);
  const state = crypto.randomUUID();
  cookies().set("ig_state", state, { httpOnly: true, secure: true, sameSite: "lax", maxAge: 600, path: "/" });
  try {
    return NextResponse.redirect(authorizeUrl(`${origin}/api/instagram/callback`, state));
  } catch (e) {
    return NextResponse.redirect(`${origin}/settings?ig=error&msg=${encodeURIComponent(e instanceof Error ? e.message : "Unknown error")}`);
  }
}
