"use client";

import { useReportWebVitals } from "next/web-vitals";
import { isGaEnabled, trackEvent } from "@/lib/analytics";

/**
 * Reports Core Web Vitals to GA4.
 *
 * ### Why measure these from the field at all
 *
 * Lighthouse measures one run, on one machine, on a connection nobody has. The
 * numbers that decide ranking and that describe what a buyer in Shankarpally on
 * a 4G phone actually experiences are the field numbers, and these three are
 * the ones Google grades:
 *
 *   · **LCP** — when the main thing finished painting. This site opens on a
 *     cinematic film, which is exactly the kind of hero that quietly wrecks LCP.
 *   · **INP** — the worst interaction latency of the visit. The scroll engine,
 *     the 3D masterplan and the mega menu are all candidates.
 *   · **CLS** — how much the page moved under the reader's thumb.
 *
 * Extend `REPORTED` to add FCP or TTFB; nothing else needs to change.
 *
 * ### The two conversions
 *
 * GA4 event values must be integers, so everything is rounded. CLS is a
 * unitless ratio in the region of 0.05, which rounds to zero and would report
 * a perfect score for every visitor — so it is multiplied by 1000 first and
 * read as thousandths. Every other metric is already in milliseconds.
 *
 * `non_interaction: true` keeps these out of engagement and bounce
 * calculations. A performance beacon is not a visitor doing something.
 */

/** The metrics forwarded to GA4. Anything else is measured and discarded. */
const REPORTED = new Set(["LCP", "INP", "CLS"]);

export default function WebVitals() {
  useReportWebVitals((metric) => {
    // The hook itself is cheap and always runs — calling it conditionally
    // would break the rules of hooks — but with no GA4 property there is
    // nowhere to send anything, and `trackEvent` is a no-op in that case too.
    if (!isGaEnabled()) return;
    if (!REPORTED.has(metric.name)) return;

    trackEvent(metric.name, {
      event_category: "Web Vitals",
      // Distinguishes one page load's samples from another's in GA4.
      event_label: metric.id,
      value: Math.round(metric.name === "CLS" ? metric.value * 1000 : metric.value),
      metric_id: metric.id,
      metric_value: metric.value,
      non_interaction: true,
    });
  });

  return null;
}
