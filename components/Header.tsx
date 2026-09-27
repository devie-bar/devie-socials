"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ESTATE } from "@/lib/estate";
import { createClient } from "@/lib/supabase/client";

/*
 * DESIGN.md 3.1, 3.7 and 3.8, following the Library header.
 * Wordmark left (opens the estate launcher), the app's sections justified in
 * PP Editorial capitals, account on the right. Below 840px the sections
 * collapse into the two-line Menu button, which turns into a cross when open.
 */

const SECTIONS = [
  { href: "/plan", label: "Plan" },
  { href: "/pipeline", label: "Pipeline" },
  { href: "/posted", label: "Posted" },
  { href: "/rhythm", label: "Rhythm" },
  { href: "/settings", label: "Settings" },
];

function useDismiss(open: boolean, close: () => void, refs: React.RefObject<HTMLElement>[]) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onDown = (e: MouseEvent) => {
      if (refs.every((r) => !r.current || !r.current.contains(e.target as Node))) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onDown);
    };
  }, [open, close, refs]);
}

export function Header({ who }: { who: string }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const [appsOpen, setAppsOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);
  const navBtn = useRef<HTMLButtonElement>(null);
  const navPanel = useRef<HTMLElement>(null);
  const apps = useRef<HTMLDivElement>(null);
  const acct = useRef<HTMLDivElement>(null);

  useDismiss(navOpen, () => setNavOpen(false), [navBtn, navPanel] as React.RefObject<HTMLElement>[]);
  useDismiss(appsOpen, () => setAppsOpen(false), [apps]);
  useDismiss(acctOpen, () => setAcctOpen(false), [acct]);
  useEffect(() => {
    setNavOpen(false);
    setAppsOpen(false);
    setAcctOpen(false);
  }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <header className="dv-top">
      <div className="dv-top-in">
        <div className="relative" ref={apps}>
          <button
            type="button"
            className="flex min-h-[44px] items-center gap-2 md:min-h-[32px]"
            aria-expanded={appsOpen}
            aria-haspopup="menu"
            aria-label="De Vie apps"
            onClick={() => setAppsOpen((o) => !o)}
          >
            <img src="/devie-wordmark-white.png" alt="De Vie" className="block h-8 w-auto md:h-9" />
            <span aria-hidden className="text-[12px] text-copper-soft">
              &#9662;
            </span>
          </button>
          {appsOpen && (
            <div role="menu" className="dv-menu left-0">
              {ESTATE.map((a) => {
                const here = a.key === "socials";
                return (
                  <a key={a.key} role="menuitem" href={here ? undefined : a.url} aria-current={here ? "page" : undefined} className={here ? "bg-paper-wash" : ""}>
                    <span className="block text-sm font-semibold">
                      {a.label}
                      {here && <span className="label ml-2 text-ink-soft">You Are Here</span>}
                    </span>
                    <span className="block text-xs text-ink-soft">{a.blurb}</span>
                  </a>
                );
              })}
            </div>
          )}
        </div>

        <nav className="dv-toptabs" aria-label="Socials sections">
          {SECTIONS.map((s) => (
            <Link key={s.href} href={s.href} className="dv-tab" aria-current={active(s.href) ? "page" : undefined}>
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="md:hidden" />

        <div className="flex items-center justify-end">
          <div className="relative hidden md:block" ref={acct}>
            <button type="button" className="dv-headbtn" aria-expanded={acctOpen} aria-haspopup="menu" onClick={() => setAcctOpen((o) => !o)}>
              Account
            </button>
            {acctOpen && (
              <div role="menu" className="dv-menu right-0">
                <div className="px-3 py-2 text-sm text-ink-soft">{who}</div>
                <button role="menuitem" type="button" onClick={signOut}>
                  Sign Out
                </button>
              </div>
            )}
          </div>
          <button
            ref={navBtn}
            type="button"
            className="dv-navbtn md:hidden"
            aria-label={navOpen ? "Close menu" : "Menu"}
            aria-expanded={navOpen}
            aria-controls="dv-navpanel"
            onClick={() => setNavOpen((o) => !o)}
          >
            <span className="dv-burger" aria-hidden>
              <i />
              <i />
            </span>
          </button>
        </div>
      </div>

      {navOpen && (
        <nav id="dv-navpanel" ref={navPanel} className="dv-navpanel md:hidden" aria-label="Socials sections">
          <div className="dv-navpanel-in">
            {SECTIONS.map((s) => (
              <Link key={s.href} href={s.href} className="dv-navpanel-item" aria-current={active(s.href) ? "page" : undefined}>
                {s.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-paper-line pt-2">
              <div className="px-3 py-2 text-sm text-ink-soft">{who}</div>
              <button type="button" className="dv-navpanel-item" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
}
