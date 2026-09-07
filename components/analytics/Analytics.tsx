"use client";

import { useEffect, useState } from "react";
import Script from "next/script";
import {
  CLARITY_ID,
  CONSENT_EVENT,
  GA_MEASUREMENT_ID,
  GTM_ID,
  isAnalyticsEnabled,
  isClarityEnabled,
  isGaEnabled,
  isGtmEnabled,
  readStoredConsent,
  type ConsentChoice,
  type ConsentState,
} from "@/lib/analytics";

/**
 * Every third-party measurement tag on the site, in one place, each one behind
 * its own environment variable.
 *
 * ### Ordering, which is the only subtle thing here
 *
 * Consent Mode works by command order inside `window.dataLayer`, not by network
 * order. `gtag('consent','default',…)` has to be *queued before* the `config`
 * that fires the first hit — and it is, because `<ConsentBootstrap />` renders
 * first in this tree and `next/script` preserves the order of same-strategy
 * scripts. The gtag.js file itself may well arrive afterwards; when it does, it
 * drains the queue it finds, in order, and sees the denial first.
 *
 * That bootstrap is also where a *returning* visitor's grant is replayed. It
 * reads localStorage synchronously and defaults to `granted` for them, so a
 * visitor who accepted last week is not measured cookielessly for the first few
 * hundred milliseconds of every subsequent visit while React hydrates.
 *
 * ### Why Clarity is gated and GA is not
 *
 * GA4 under Consent Mode with `analytics_storage: 'denied'` still sends a
 * cookieless ping — no identifiers, no storage, modelled in aggregate. That is
 * defensible as non-identifying processing. Microsoft Clarity has no equivalent
 * mode: it records session replays and heatmaps of an actual person's actual
 * scrolling. So its script is not loaded at all until consent is granted, and
 * a decline means it never reaches the page.
 *
 * ### Failure mode
 *
 * All three IDs unset is a supported configuration. This component returns
 * `null`, no network requests are made, and `<ConsentBanner />` stays hidden
 * because there is nothing to consent to.
 */
export default function Analytics() {
  const [consent, setConsent] = useState<ConsentState>(null);

  // Read after mount, never during render: the server has no localStorage, and
  // branching on it in render would be a hydration mismatch.
  useEffect(() => {
    setConsent(readStoredConsent());

    const onChange = (event: Event) => {
      setConsent((event as CustomEvent<ConsentChoice>).detail);
    };
    window.addEventListener(CONSENT_EVENT, onChange);
    return () => window.removeEventListener(CONSENT_EVENT, onChange);
  }, []);

  if (!isAnalyticsEnabled()) return null;

  return (
    <>
      <ConsentBootstrap />

      {isGtmEnabled() && <GoogleTagManager />}
      {isGaEnabled() && <GoogleAnalytics />}
      {isClarityEnabled() && consent === "granted" && <Clarity />}
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Consent Mode v2 defaults
   ───────────────────────────────────────────────────────────────────────── */

/**
 * Creates `dataLayer` and `gtag`, then denies everything non-essential.
 *
 * `wait_for_update: 500` tells Google's tags to hold their first hit for half a
 * second in case an update is coming — which it is, for a returning visitor
 * whose grant arrives from `<ConsentBanner />` a tick later.
 *
 * `ads_data_redaction` strips ad identifiers from any network request made
 * while consent is denied, and `url_passthrough` keeps campaign attribution
 * working across pages without a cookie. Both are the documented pairing for a
 * denied default.
 */
function ConsentBootstrap() {
  const js = `
(function () {
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  if (!window.gtag) window.gtag = gtag;

  var granted = false;
  try { granted = window.localStorage.getItem('tv:analytics-consent') === 'granted'; } catch (e) {}
  var state = granted ? 'granted' : 'denied';

  window.gtag('consent', 'default', {
    ad_storage: state,
    ad_user_data: state,
    ad_personalization: state,
    analytics_storage: state,
    functionality_storage: 'granted',
    security_storage: 'granted',
    wait_for_update: 500
  });
  window.gtag('set', 'ads_data_redaction', !granted);
  window.gtag('set', 'url_passthrough', true);
})();`.trim();

  return (
    <Script
      id="tv-consent-default"
      strategy="afterInteractive"
      dangerouslySetInnerHTML={{ __html: js }}
    />
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Google Tag Manager
   ───────────────────────────────────────────────────────────────────────── */

function GoogleTagManager() {
  // JSON.stringify rather than bare interpolation. The ID comes from an
  // environment variable, and an environment variable is still an input.
  const id = JSON.stringify(GTM_ID);

  const js = `
(function (w, d, s, l, i) {
  w[l] = w[l] || [];
  w[l].push({ 'gtm.start': new Date().getTime(), event: 'gtm.js' });
  var f = d.getElementsByTagName(s)[0],
      j = d.createElement(s),
      dl = l != 'dataLayer' ? '&l=' + l : '';
  j.async = true;
  j.src = 'https://www.googletagmanager.com/gtm.js?id=' + i + dl;
  f.parentNode.insertBefore(j, f);
})(window, document, 'script', 'dataLayer', ${id});`.trim();

  return (
    <>
      <Script id="tv-gtm" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: js }} />
      {/*
        The documented <noscript> fallback. It fires container tags for the
        small share of visitors running without JavaScript — and note that the
        consent default above is JavaScript, so this frame is the one path that
        cannot be gated client-side. Keep the container's own tags configured to
        respect Consent Mode server-side, or leave this out.
      */}
      <noscript>
        <iframe
          src={`https://www.googletagmanager.com/ns.html?id=${encodeURIComponent(GTM_ID ?? "")}`}
          height="0"
          width="0"
          style={{ display: "none", visibility: "hidden" }}
          title="Google Tag Manager"
        />
      </noscript>
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Google Analytics 4
   ───────────────────────────────────────────────────────────────────────── */

function GoogleAnalytics() {
  const id = JSON.stringify(GA_MEASUREMENT_ID);

  return (
    <>
      <Script
        id="tv-ga-src"
        strategy="afterInteractive"
        src={`https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(
          GA_MEASUREMENT_ID ?? ""
        )}`}
      />
      <Script
        id="tv-ga-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
window.gtag('js', new Date());
window.gtag('config', ${id});`.trim(),
        }}
      />
    </>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
   Microsoft Clarity — consent-gated, see the note at the top of this file
   ───────────────────────────────────────────────────────────────────────── */

function Clarity() {
  const id = JSON.stringify(CLARITY_ID);

  const js = `
(function (c, l, a, r, i, t, y) {
  c[a] = c[a] || function () { (c[a].q = c[a].q || []).push(arguments) };
  t = l.createElement(r); t.async = 1;
  t.src = 'https://www.clarity.ms/tag/' + i;
  y = l.getElementsByTagName(r)[0];
  y.parentNode.insertBefore(t, y);
})(window, document, 'clarity', 'script', ${id});
window.clarity('consent', true);`.trim();

  return (
    <Script id="tv-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: js }} />
  );
}
