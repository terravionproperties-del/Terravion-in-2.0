"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { usePointerLight } from "@/components/ui/usePointerLight";
import { site } from "@/lib/site";
import { localizePath, stripLocale, type Locale } from "@/lib/i18n/config";

/**
 * Desktop lead cluster: a floating glass pill that appears once the visitor is
 * past the opening viewport, and gets out of the way entirely while the film
 * is playing (html.film-active). Phones use MobileDock instead — a bottom bar
 * and a floating pill would be two competing CTAs on one small screen.
 */
export default function StickyCta({
  locale,
  label,
  whatsappAria,
  callAria,
}: {
  locale: Locale;
  label: string;
  whatsappAria: string;
  callAria: string;
}) {
  const pathname = usePathname();
  const canonicalPath = stripLocale(pathname).path;
  const [visible, setVisible] = useState(false);
  const light = usePointerLight<HTMLDivElement>();

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (canonicalPath.startsWith("/gis/") || canonicalPath === "/site-visit") {
    return null;
  }

  return (
    <div
      ref={light.ref}
      onPointerMove={light.onPointerMove}
      onPointerLeave={light.onPointerLeave}
      className={`sticky-cta sheen fixed bottom-7 right-7 z-40 hidden items-center gap-1 rounded-full p-2 transition-all duration-500 lg:flex ${
        visible
          ? "translate-y-0 opacity-100"
          : "pointer-events-none translate-y-8 opacity-0"
      }`}
      style={{
        background: "rgba(253,252,250,0.92)",
        backdropFilter: "blur(28px) saturate(1.7)",
        WebkitBackdropFilter: "blur(28px) saturate(1.7)",
        border: "1px solid rgba(29,29,29,0.10)",
        boxShadow:
          "0 24px 50px -16px rgba(10,9,7,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <a
        href={site.whatsapp}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={whatsappAria}
        className="relative z-[2] flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-charcoal/[0.06] hover:text-charcoal"
      >
        <WhatsAppIcon />
      </a>
      <a
        href={site.phoneHref}
        aria-label={`${callAria} ${site.phone}`}
        className="relative z-[2] flex h-11 w-11 items-center justify-center rounded-full text-text-secondary transition-colors hover:bg-charcoal/[0.06] hover:text-charcoal"
      >
        <PhoneIcon />
      </a>
      <Link
        href={localizePath("/site-visit", locale)}
        className="label relative z-[2] ms-1 rounded-full px-6 py-3.5 text-charcoal transition-transform duration-500"
        style={{
          background: "linear-gradient(145deg,#e6d0a4,#c9a96a 60%,#b08d46)",
          boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
        }}
      >
        {label}
      </Link>
    </div>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.7-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8zm8.3-18.1A11.7 11.7 0 0 0 12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 24l6.2-1.6A11.8 11.8 0 0 0 12 23.8c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.3z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true">
      <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 2 .7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.9.6 2.8.7a2 2 0 0 1 1.7 2z" />
    </svg>
  );
}
