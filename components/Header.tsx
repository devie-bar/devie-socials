"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ESTATE } from "@/lib/estate";
import { createClient } from "@/lib/supabase/client";

/*
 * DESIGN.md 3.1, 3.7 and 3.8, following the Library header.
 * Wordmark left (opens the estate launcher), the app's sections in PP Editorial
 * capitals, account on the right. Two-tier: the green bar carries the top-level
 * sections (Content, Setup); each section's pages sit in the cream secondary bar
 * underneath and preview in a hover flyout (desktop). Below 840px the sections
 * collapse into the two-line Menu button.
 */

type Item = { href: string; label: string };
type Group = { key: string; label: string; items: Item[] };

const GROUPS: Group[] = [
  { key: "content", label: "Content", items: [
    { href: "/plan", label: "Plan" },
    { href: "/pipeline", label: "Pipeline" },
    { href: "/posted", label: "Posted" },
  ] },
  { key: "setup", label: "Setup", items: [
    { href: "/rhythm", label: "Rhythm" },
    { href: "/settings", label: "Settings" },
  ] },
];
const ALL_PAGES: Item[] = GROUPS.flatMap((g) => g.items);

function useTheme() {
  const [dark, setDark] = useState(false);
  useEffect(() => { setDark(document.documentElement.getAttribute("data-theme") === "dark"); }, []);
  const toggle = () => {
    const next = !dark;
    setDark(next);
    const el = document.documentElement;
    if (next) el.setAttribute("data-theme", "dark"); else el.removeAttribute("data-theme");
    try { localStorage.setItem("theme", next ? "dark" : "light"); } catch {}
  };
  return [dark, toggle] as const;
}

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
  const [dark, toggleTheme] = useTheme();
  const initials = who.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "·";

  useDismiss(navOpen, () => setNavOpen(false), [navBtn, navPanel] as React.RefObject<HTMLElement>[]);
  useDismiss(appsOpen, () => setAppsOpen(false), [apps]);
  useDismiss(acctOpen, () => setAcctOpen(false), [acct]);
  useEffect(() => {
    setNavOpen(false);
    setAppsOpen(false);
    setAcctOpen(false);
  }, [pathname]);

  const active = (href: string) => pathname === href || pathname.startsWith(href + "/");
  const isGroupActive = (g: Group) => g.items.some((it) => active(it.href));
  const activeGroup = GROUPS.find(isGroupActive) || GROUPS[0];

  async function signOut() {
    await createClient().auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <>
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
            {GROUPS.map((g) => (
              <div className="dv-navgroup" key={g.key}>
                <Link href={g.items[0].href} className="dv-tab" aria-current={isGroupActive(g) ? "page" : undefined}>
                  {g.label}
                </Link>
                {g.items.length > 1 && (
                  <div className="dv-navdrop">
                    {g.items.map((it) => (
                      <Link key={it.href} href={it.href} className={active(it.href) ? "on" : undefined}>
                        {it.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          <div className="md:hidden" />

          <div className="flex items-center justify-end">
            <div className="relative hidden md:block" ref={acct}>
              <button type="button" className="dv-profilebtn" aria-expanded={acctOpen} aria-haspopup="menu" onClick={() => setAcctOpen((o) => !o)}>
                <span className="av" aria-hidden>{initials}</span>
                <span className="nm">{who}</span>
                <span className="cx" aria-hidden>&#9662;</span>
              </button>
              {acctOpen && (
                <div role="menu" className="dv-menu right-0">
                  <div className="px-3 py-2 text-sm text-ink-soft">{who}</div>
                  <button role="menuitemcheckbox" aria-checked={dark} type="button" className="dv-um-row" onClick={toggleTheme}>
                    <span>Dark mode</span>
                    <span className={"dv-sw" + (dark ? " on" : "")}><i /></span>
                  </button>
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
      </header>

      {activeGroup.items.length > 1 && (
        <nav className="dv-subnav" aria-label={`${activeGroup.label} pages`}>
          <div className="dv-subnav-in">
            {activeGroup.items.map((it) => (
              <Link
                key={it.href}
                href={it.href}
                className={"dv-subtab" + (active(it.href) ? " on" : "")}
                aria-current={active(it.href) ? "page" : undefined}
              >
                {it.label}
              </Link>
            ))}
          </div>
        </nav>
      )}

      {navOpen && (
        <nav id="dv-navpanel" ref={navPanel} className="dv-navpanel md:hidden" aria-label="Socials sections">
          <div className="dv-navpanel-in">
            {ALL_PAGES.map((s) => (
              <Link key={s.href} href={s.href} className="dv-navpanel-item" aria-current={active(s.href) ? "page" : undefined}>
                {s.label}
              </Link>
            ))}
            <div className="mt-2 border-t border-paper-line pt-2">
              <div className="px-3 py-2 text-sm text-ink-soft">{who}</div>
              <button type="button" className="dv-navpanel-item dv-um-row" role="menuitemcheckbox" aria-checked={dark} onClick={toggleTheme}>
                <span>Dark mode</span>
                <span className={"dv-sw" + (dark ? " on" : "")}><i /></span>
              </button>
              <button type="button" className="dv-navpanel-item" onClick={signOut}>
                Sign Out
              </button>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
