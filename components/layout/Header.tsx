"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import LuxuryButton from "@/components/ui/LuxuryButton";
import LanguageSelector, {
  type LanguageSelectorStrings,
} from "@/components/i18n/LanguageSelector";
import MegaMenu, { type MenuKey, type MegaMenuStrings } from "./MegaMenu";
import { localizePath, stripLocale, type Locale } from "@/lib/i18n/config";
import type { NavItem } from "@/lib/i18n/nav";

/** Which nav items open a vitrine rather than navigating straight away. */
const MENU_FOR: Record<string, MenuKey> = {
  "/projects": "projects",
  "/locations": "locations",
  "/guides": "guides",
};

export interface HeaderStrings {
  primaryLabel: string;
  mobileLabel: string;
  openMenu: string;
  closeMenu: string;
  bookVisit: string;
  brandSuffix: string;
  homeAriaLabel: string;
}

/**
 * The header.
 *
 * Every label now arrives as a prop from the layout, which is a Server
 * Component. That is the whole i18n contract in one sentence: this file renders
 * strings, it never resolves them, so no dictionary reaches the browser.
 *
 * The one substantive behavioural change is active-state matching. It used to be
 * `pathname.startsWith(item.href)`, which is correct at `/projects` and silently
 * wrong at `/te/projects` — the locale prefix means the pathname never starts
 * with the canonical href, so on Telugu and Hindi *no* nav item would ever light
 * up. Stripping the locale first compares like with like.
 */
export default function Header({
  locale,
  nav,
  strings,
  languageStrings,
  megaMenuStrings,
  phone,
  phoneHref,
}: {
  locale: Locale;
  nav: readonly NavItem[];
  strings: HeaderStrings;
  languageStrings: LanguageSelectorStrings;
  megaMenuStrings: MegaMenuStrings;
  phone: string;
  phoneHref: string;
}) {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const listRef = useRef<HTMLDivElement>(null);
  const [menu, setMenu] = useState<MenuKey>(null);
  const closeTimer = useRef<number>(0);

  /** Compare against the canonical path, never the locale-prefixed one. */
  const canonicalPath = stripLocale(pathname).path;

  /** Small grace period so the pointer can cross the gap into the panel. */
  const openMenu = (key: MenuKey) => {
    window.clearTimeout(closeTimer.current);
    setMenu(key);
  };
  const scheduleClose = () => {
    window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => setMenu(null), 180);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    document.documentElement.style.overflow = open ? "hidden" : "";
    return () => {
      document.documentElement.style.overflow = "";
    };
  }, [open]);

  /**
   * Most pages open on a full-bleed frame, so the light editorial routes are the
   * exception rather than the rule — listing those is the shorter and more
   * durable list. Matched against the canonical path so it holds in every
   * language.
   */
  const lightOpen =
    canonicalPath === "/projects" ||
    [
      "/blog",
      "/guides",
      "/locations",
      "/investment",
      "/contact",
      "/testimonials",
      "/amenities",
      "/tools",
    ].some((p) => canonicalPath.startsWith(p));
  const overFilm = !lightOpen && !scrolled && !open;

  // On full-screen 3D Digital Twin projects (/gis/sanctuary, /gis/shankarpally),
  // yield full screen real estate so the interactive 3D/2D controls are unobscured.
  if (canonicalPath.startsWith("/gis/")) {
    return null;
  }

  return (
    <header className="nav-glass fixed inset-x-0 top-0 z-50 transition-all duration-500">
      {/* legibility gradient — only while riding on the film */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 h-32 transition-opacity duration-500"
        style={{
          opacity: overFilm ? 1 : 0,
          background:
            "linear-gradient(to bottom, rgba(247,244,238,.92) 0%, rgba(247,244,238,.62) 45%, transparent 100%)",
        }}
      />

      <div className="relative mx-auto flex h-[var(--header-h)] max-w-[1500px] items-center justify-between px-6 md:px-10">
        <Link
          prefetch={false}
          href={localizePath("/", locale)}
          className="group flex items-center transition-opacity hover:opacity-90 py-1"
          aria-label={strings.homeAriaLabel}
        >
          {/* Official Terravion Logo Graphic */}
          <div className="relative h-12 w-44 md:h-14 md:w-52">
            <img
              src="/terravion-logo.jpeg"
              alt="Terravion Properties"
              className="h-full w-full object-contain filter drop-shadow-sm rounded-lg"
            />
          </div>
        </Link>

        <nav aria-label={strings.primaryLabel} className="hidden items-center gap-4 lg:flex">
          <div
            ref={listRef}
            className="flex items-center gap-5 md:gap-7 lg:gap-8"
            onPointerLeave={scheduleClose}
          >
            {nav.map((item) => {
              const active = canonicalPath.startsWith(item.path);
              return (
                <Link
                  prefetch={false}
                  key={item.path}
                  href={item.href}
                  data-active={active ? "true" : "false"}
                  onPointerEnter={() => openMenu(MENU_FOR[item.path] ?? null)}
                  className={`nav-item ${active ? "is-active" : ""}`}
                >
                  <span>{item.label}</span>
                  <span aria-hidden="true" className="nav-rule" />
                </Link>
              );
            })}
          </div>

          {/* ── Dedicated GIS Master Plan Button ── */}
          <Link
            href={localizePath("/gis", locale)}
            className="flex items-center gap-1.5 rounded-full border border-gold/50 bg-gradient-to-r from-gold/20 to-gold/10 px-3.5 py-1.5 text-[0.7rem] font-bold uppercase tracking-wider text-gold-ink shadow-sm transition-all hover:scale-105 hover:border-gold hover:text-charcoal"
          >
            <span>🗺️</span>
            <span>GIS Master Plan</span>
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-gold opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-gold-dark"></span>
            </span>
          </Link>

          <LanguageSelector locale={locale} strings={languageStrings} className="ms-1" tone="light" />

          {/* ── Book Site Visit Capsule ── */}
          <LuxuryButton
            href={localizePath("/site-visit", locale)}
            variant="gold"
            className="ms-2 whitespace-nowrap !px-5 !py-2.5 !text-[0.72rem] font-bold tracking-wider shadow-md"
          >
            {strings.bookVisit}
          </LuxuryButton>

          {/* CRM Staff Login — rendered only when a CRM URL is configured, so
              production never links visitors to localhost. */}
          {process.env.NEXT_PUBLIC_CRM_URL && (
            <a
              href={process.env.NEXT_PUBLIC_CRM_URL}
              target="_blank"
              rel="noreferrer"
              title="Staff CRM"
              className="ms-1 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full border border-charcoal/20 text-charcoal/50 transition-all hover:border-gold-dark/60 hover:text-gold-ink"
              aria-label="Staff login"
            >
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="7" cy="9.5" r="1" fill="currentColor"/>
              </svg>
            </a>
          )}
        </nav>

        <div className="flex items-center gap-2 lg:hidden">
          <LanguageSelector locale={locale} strings={languageStrings} tone="light" />

          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? strings.closeMenu : strings.openMenu}
            className="relative z-50 flex h-11 w-11 flex-col items-center justify-center gap-1.5 text-charcoal"
          >
            <span
              className={`h-px w-6 bg-current transition-transform duration-300 ${
                open ? "translate-y-[3.5px] rotate-45" : ""
              }`}
            />
            <span
              className={`h-px w-6 bg-current transition-transform duration-300 ${
                open ? "-translate-y-[3.5px] -rotate-45" : ""
              }`}
            />
          </button>
        </div>
      </div>

      {/* The vitrine — floating panels, never a documentation drawer */}
      <div
        className="hidden lg:block"
        onPointerEnter={() => openMenu(menu)}
        onPointerLeave={scheduleClose}
      >
        <MegaMenu open={menu} locale={locale} strings={megaMenuStrings} />
      </div>

      {/* Full-screen menu */}
      <div
        id="mobile-menu"
        className={`fixed inset-0 z-40 flex flex-col justify-between px-7 pb-14 pt-28 transition-[opacity,visibility] duration-500 lg:hidden ${
          open ? "visible opacity-100" : "invisible opacity-0"
        }`}
        style={{ background: "#F7F4EE" }}
      >
        <nav aria-label={strings.mobileLabel} className="flex flex-col gap-1">
          {nav.map((item, i) => (
            <Link
              prefetch={false}
              key={item.path}
              href={item.href}
              className={`display text-[2.6rem] leading-tight text-charcoal transition-all duration-500 ${
                open ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
              }`}
              style={{ transitionDelay: open ? `${90 + i * 55}ms` : "0ms" }}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="flex flex-col gap-5">
          <LuxuryButton href={localizePath("/site-visit", locale)} variant="gold" className="w-full">
            {strings.bookVisit}
          </LuxuryButton>
          {process.env.NEXT_PUBLIC_CRM_URL && (
            <a
              href={process.env.NEXT_PUBLIC_CRM_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-2 rounded-full border border-charcoal/15 py-3 text-[0.7rem] font-medium uppercase tracking-widest text-charcoal/50 transition-all hover:border-gold-dark/40 hover:text-gold-ink"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <rect x="2" y="6" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.3"/>
                <path d="M4.5 6V4a2.5 2.5 0 0 1 5 0v2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                <circle cx="7" cy="9.5" r="1" fill="currentColor"/>
              </svg>
              Staff Login
            </a>
          )}
          <a href={phoneHref} className="text-center text-text-muted">
            {phone}
          </a>
        </div>
      </div>
    </header>
  );
}
