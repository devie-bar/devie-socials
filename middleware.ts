import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";
import { PREVIEW } from "@/lib/preview";

// Refreshes the Supabase session cookie on every request and keeps signed-out
// visitors on /login. The access check (admin or {socials:true}) is in the
// (app) layout and in RLS.
export async function middleware(request: NextRequest) {
  if (PREVIEW) return NextResponse.next({ request });
  let response = NextResponse.next({ request });
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  if (path.startsWith("/auth/")) return response;
  const isLogin = path === "/login";
  if (!user && !isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  if (user && isLogin) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = {
  // /api/cron is authorised by CRON_SECRET, /api/instagram/callback by the session inside the route.
  matcher: ["/((?!_next/static|_next/image|favicon|icon|apple-icon|manifest|fonts|devie-wordmark|api/cron).*)"],
};
