"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { localizePath, type Locale } from "@/lib/i18n/config";
import { isAnalyticsEnabled, readStoredConsent, writeConsent } from "@/lib/analytics";

export interface ConsentStrings {
  /** Small brass eyebrow, e.g. "Your privacy". */
  eyebrow: string;
  /** One or two sentences. Says what is measured and that it is optional. */
  body: string;
  accept: string;
  decline: string;
  /** Link label pointing at /privacy-policy. */
  privacy: string;
  /** Accessible name for the banner region. */
  ariaLabel: string;
}

/**
 * The consent ask, shown once.
 *
 * ### Why it exists
 *
 * The DPDP Act 2023 requires free, specific, informed and unambiguous consent
 * before non-essential processing, and it requires the notice to be available
 * in the languages of the Eighth Schedule — which is why the copy arrives as
 * props from the layout's dictionary rather than being written in English here.
 * Analytics and session replay are non-essential by any reading. So the tags
 * boot denied (see `<Analytics />`), this asks, and only an explicit tap on
 * Accept moves anything.
 *
 * ### Three deliberate refusals
 *
 * · **No pre-ticked anything, and no "continuing means you agree".** Consent
 *   under the DPDP Act cannot be inferred from scrolling.
 * · **Decline is a real button, not a link in the corner.** It sits beside
 *   Accept at the same size. Making refusal harder than acceptance is the
 *   pattern regulators name specifically.
 * · **No dismissal without an answer.** There is no × that leaves the question
 *   open, because "closed the banner" is not a lawful basis. It is two taps,
 *   once, and then it is gone for good.
 *
 * ### Why it is not a modal
 *
 * A blocking overlay on a property site is a bounce. This is a small panel in
 * the corner: it never covers the content, it never traps focus, and a visitor
 * who wants to read three articles first can. It appears a beat after load so
 * it does not compete with the hero, and it hides entirely while the cinematic
 * film is playing — the same `html.film-active` rule the dock and the sticky
 * CTA already obey.
 */
export default function ConsentBanner({
  locale,
  strings,
}: {
  locale: Locale;
  strings: ConsentStrings;
}) {
  // `asked` starts true so the server renders nothing at all. The answer lives
  // in localStorage, and guessing it would flash the wrong state on hydration.
  const [visible, setVisible] = useState(false);
  const [asked, setAsked] = useState(true);

  useEffect(() => {
    if (!isAnalyticsEnabled()) return;
    if (readStoredConsent() !== null) return;

    setAsked(false);
    // A beat, so the first thing a visitor sees is the property, not a
    // compliance panel. Long enough to be polite, short enough to be honest.
    const timer = window.setTimeout(() => setVisible(true), 1200);
    return () => window.clearTimeout(timer);
  }, []);

  if (asked || !isAnalyticsEnabled()) return null;

  const answer = (choice: "granted" | "denied") => {
    writeConsent(choice);
    setVisible(false);
    // Unmount after the exit transition rather than during it.
    window.setTimeout(() => setAsked(true), 400);
  };

  return (
    <aside
      aria-label={strings.ariaLabel}
      className={`consent-banner fixed z-[60] transition-all duration-500 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-6 opacity-0"
      } bottom-[6.5rem] left-4 right-4 rounded-2xl p-5 lg:bottom-7 lg:left-7 lg:right-auto lg:w-[24rem] lg:p-6`}
      style={{
        background: "rgba(253,252,250,0.94)",
        backdropFilter: "blur(28px) saturate(1.6)",
        WebkitBackdropFilter: "blur(28px) saturate(1.6)",
        border: "1px solid rgba(184,138,68,0.28)",
        boxShadow: "0 24px 50px -16px rgba(10,9,7,0.18), inset 0 1px 0 rgba(255,255,255,0.8)",
      }}
    >
      <p
        className="text-[0.625rem] font-semibold uppercase tracking-[0.22em]"
        style={{ color: "#8A6736" }}
      >
        {strings.eyebrow}
      </p>

      <p className="mt-2.5 text-[0.8125rem] leading-[1.65]" style={{ color: "#595959" }}>
        {strings.body}{" "}
        <Link
          href={localizePath("/privacy-policy", locale)}
          className="underline underline-offset-2 transition-colors hover:text-[#8A6736]"
          style={{ color: "#B88A44" }}
        >
          {strings.privacy}
        </Link>
      </p>

      <div className="mt-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => answer("granted")}
          className="rounded-full px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] text-charcoal transition-transform duration-300 hover:-translate-y-0.5"
          style={{
            background: "linear-gradient(145deg,#e6d0a4,#c9a96a 60%,#b08d46)",
            boxShadow: "inset 0 1px 0 rgba(255,255,255,0.5)",
          }}
        >
          {strings.accept}
        </button>

        <button
          type="button"
          onClick={() => answer("denied")}
          className="rounded-full px-5 py-2.5 text-[0.6875rem] font-semibold uppercase tracking-[0.16em] transition-colors duration-300"
          style={{
            color: "#595959",
            border: "1px solid rgba(29,29,29,0.18)",
          }}
        >
          {strings.decline}
        </button>
      </div>
    </aside>
  );
}
