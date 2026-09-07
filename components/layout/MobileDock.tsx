"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { localizePath, stripLocale, type Locale } from "@/lib/i18n/config";

/**
 * Mobile navigation, designed for the thumb rather than shrunk from desktop.
 *
 * A floating glass dock sits above the safe area with the three destinations
 * that matter on a phone, then the booking capsule. It hides while the film is
 * playing (html.film-active) so the reel keeps the screen, and it hides on the
 * way down / returns on the way up so it never fights a long read.
 */
export interface DockStrings {
  ariaLabel: string;
  homes: string;
  places: string;
  journal: string;
  chat: string;
  chatAria: string;
  visit: string;
}

export default function MobileDock({
  locale,
  strings,
}: {
  locale: Locale;
  strings: DockStrings;
}) {
  const pathname = usePathname();
  const canonicalPath = stripLocale(pathname).path;

  const items = [
    { path: "/projects", label: strings.homes, icon: HomeIcon },
    { path: "/locations", label: strings.places, icon: MapIcon },
    { path: "/blog", label: strings.journal, icon: JournalIcon },
  ];
  const [hidden, setHidden] = useState(false);
  const [typing, setTyping] = useState(false);

  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      // ignore rubber-banding, and always show near the top
      if (y < 80) setHidden(false);
      else if (Math.abs(y - last) > 8) setHidden(y > last);
      last = y;
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    // Get out of the way while a field is being filled — on a phone the
    // keyboard is already taking half the screen, and the dock would sit
    // exactly where the next field is.
    const isField = (t: EventTarget | null) =>
      t instanceof HTMLElement &&
      ["INPUT", "TEXTAREA", "SELECT"].includes(t.tagName);
    const onFocusIn = (e: FocusEvent) => {
      if (isField(e.target)) setTyping(true);
    };
    const onFocusOut = () => setTyping(false);
    document.addEventListener("focusin", onFocusIn);
    document.addEventListener("focusout", onFocusOut);

    return () => {
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("focusin", onFocusIn);
      document.removeEventListener("focusout", onFocusOut);
    };
  }, []);

  if (canonicalPath.startsWith("/gis/")) {
    return null;
  }

  return (
    <nav
      aria-label={strings.ariaLabel}
      className="mobile-dock lg:hidden"
      style={{
        transform: `translateX(-50%) translateY(${hidden || typing ? "160%" : "0"})`,
        opacity: typing ? 0 : 1,
      }}
    >
      {items.map(({ path, label, icon: Icon }) => {
        // Compare the canonical path, not the raw one: on /te/* the prefix means
        // no item would ever match its unprefixed href.
        const active = canonicalPath.startsWith(path);
        return (
          <Link
            key={path}
            href={localizePath(path, locale)}
            data-active={active ? "true" : "false"}
            className="dock-item"
          >
            <Icon />
            <span>{label}</span>
          </Link>
        );
      })}
      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        className="dock-item"
        aria-label={strings.chatAria}
      >
        <WhatsAppIcon />
        <span>{strings.chat}</span>
      </a>
      <Link href={localizePath("/site-visit", locale)} className="dock-cta ms-1">
        {strings.visit}
      </Link>
    </nav>
  );
}

function HomeIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M3 10.5 12 3l9 7.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 9.5V20h13V9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function MapIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.4" />
    </svg>
  );
}

function JournalIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3V4z" strokeLinejoin="round" />
      <path d="M9 8.5h6M9 12h6M9 15.5h3.5" strokeLinecap="round" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.7-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8zm8.3-18.1A11.7 11.7 0 0 0 12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 24l6.2-1.6A11.8 11.8 0 0 0 12 23.8c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.3z" />
    </svg>
  );
}
