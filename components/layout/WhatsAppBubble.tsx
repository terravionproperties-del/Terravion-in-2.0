"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { site } from "@/lib/site";
import { stripLocale } from "@/lib/i18n/config";

/**
 * The floating WhatsApp entry point.
 *
 * Distinct from the WhatsApp icon inside StickyCta, which only appears after
 * the visitor is 60% down the first viewport, is desktop-only, and shares a
 * pill with two competing CTAs. This one is present immediately, on every
 * breakpoint, and does one thing.
 *
 * It opens as a small card rather than firing straight into WhatsApp. Tapping
 * a bare icon and being thrown into another app is jarring, and on desktop it
 * lands the visitor in WhatsApp Web with no idea what they were about to send.
 * The card says who answers and what happens next, so leaving the site is a
 * decision rather than an accident. The card's button is a plain link, so it
 * still works once open even if the toggle's JS never ran.
 *
 * The prefilled message carries the page the visitor was reading. A sales team
 * that opens a chat already knowing the enquiry is about Raghunath County
 * starts the conversation a step ahead of one that has to ask.
 */
export interface WhatsAppStrings {
  /** Accessible name for the closed bubble. */
  openAria: string;
  /** Accessible name for the close control. */
  closeAria: string;
  /** Card heading, e.g. "Chat with us". */
  title: string;
  /** One line on who replies and when. */
  body: string;
  /** Button label, e.g. "Start WhatsApp chat". */
  cta: string;
  /** Opening line pre-filled into WhatsApp. */
  message: string;
}

export default function WhatsAppBubble({ strings }: { strings: WhatsAppStrings }) {
  const pathname = usePathname();
  const canonicalPath = stripLocale(pathname).path;
  const [open, setOpen] = useState(false);
  const [pageUrl, setPageUrl] = useState("");
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Read in an effect, not during render: `window` does not exist on the
  // server, and referencing it inline would make the server and client markup
  // disagree on the href — a hydration mismatch.
  useEffect(() => {
    setPageUrl(window.location.href);
  }, [pathname]);

  // Escape closes, and focus returns to the trigger rather than being dropped
  // at the top of the document.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !buttonRef.current?.contains(t)) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onPointer);
    };
  }, [open]);

  // The 3D twin is a full-bleed canvas; a floating bubble over it is in the way.
  if (canonicalPath.startsWith("/gis")) return null;

  const href = `${site.whatsapp}?text=${encodeURIComponent(
    pageUrl ? `${strings.message}\n\n${pageUrl}` : strings.message
  )}`;

  return (
    <div className="whatsapp-bubble fixed bottom-24 left-5 z-40 flex flex-col items-start gap-3 lg:bottom-7">
      {open && (
        <div
          ref={panelRef}
          role="dialog"
          aria-label={strings.title}
          className="w-[17rem] rounded-2xl border border-charcoal/10 bg-white p-5 shadow-[0_24px_50px_-16px_rgba(10,9,7,0.28)]"
        >
          <p className="display text-lg leading-snug text-charcoal">
            {strings.title}
          </p>
          <p className="mt-2 text-[0.8rem] leading-relaxed text-text-secondary">
            {strings.body}
          </p>
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => setOpen(false)}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-full px-4 py-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-white transition-opacity hover:opacity-90"
            style={{ background: "#1FA855" }}
          >
            <WhatsAppIcon size={15} />
            {strings.cta}
          </a>
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? strings.closeAria : strings.openAria}
        className="flex h-14 w-14 items-center justify-center rounded-full text-white shadow-[0_16px_34px_-10px_rgba(31,168,85,0.6)] transition-transform duration-300 hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#1FA855]"
        style={{ background: "#1FA855" }}
      >
        {open ? <CloseIcon /> : <WhatsAppIcon size={27} />}
      </button>
    </div>
  );
}

function WhatsAppIcon({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M17.5 14.4c-.3-.2-1.8-.9-2-.9-.3-.1-.5-.2-.7.1-.2.3-.8.9-.9 1.1-.2.2-.3.2-.6.1-.3-.2-1.3-.5-2.4-1.5-.9-.8-1.5-1.8-1.7-2.1-.2-.3 0-.5.1-.6l.5-.5c.1-.2.2-.3.3-.5.1-.2 0-.4 0-.5l-.9-2.2c-.2-.6-.5-.5-.7-.5h-.6c-.2 0-.5.1-.8.4-.3.3-1 1-1 2.5s1.1 2.9 1.2 3.1c.2.2 2.1 3.2 5.1 4.5.7.3 1.3.5 1.7.6.7.2 1.4.2 1.9.1.6-.1 1.8-.7 2-1.4.3-.7.3-1.3.2-1.4-.1-.2-.3-.2-.7-.4zM12 21.8c-1.8 0-3.5-.5-5-1.4l-.4-.2-3.7 1 1-3.6-.2-.4a9.8 9.8 0 0 1-1.5-5.2c0-5.4 4.4-9.8 9.8-9.8a9.8 9.8 0 0 1 9.8 9.8c0 5.4-4.4 9.8-9.8 9.8zm8.3-18.1A11.7 11.7 0 0 0 12 .2C5.5.2.2 5.5.2 12c0 2.1.5 4.1 1.6 5.9L.1 24l6.2-1.6A11.8 11.8 0 0 0 12 23.8c6.5 0 11.8-5.3 11.8-11.8 0-3.2-1.2-6.1-3.5-8.3z" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
