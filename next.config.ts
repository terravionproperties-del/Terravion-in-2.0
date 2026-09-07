import type { NextConfig } from "next";

const isProd = process.env.NODE_ENV === "production";

/**
 * Content Security Policy.
 *
 * Two compromises, both stated rather than hidden:
 *
 *   · `'unsafe-inline'` on script-src. The App Router inlines its bootstrap and
 *     flight payload into the document, and every JSON-LD block is an inline
 *     <script type="application/ld+json">. Removing it needs a nonce threaded
 *     through middleware that rewrites every response, which fights static
 *     prerendering of 124 pages. `strict-dynamic` with a nonce is the eventual
 *     fix, and it is a real piece of work rather than a flag.
 *   · `'unsafe-inline'` on style-src, because Tailwind v4 and the film engine
 *     both write inline style attributes during scroll.
 *
 * Everything else is closed: no scheme-wide wildcard, no `data:` in
 * script-src, `frame-ancestors 'none'`, `object-src 'none'`. Maps, Analytics,
 * Clarity and the future CRM origin are named explicitly, so adding a third
 * party is a deliberate edit here and a blocked request shows up as a console
 * violation rather than a silent failure.
 *
 * The four `https://*.host` entries — Supabase, Cloudinary, OpenStreetMap tiles
 * and Clarity's ingest — are subdomain wildcards under a vendor's own apex,
 * used only where the vendor picks the subdomain at runtime. That is a narrower
 * grant than it looks, and each one is annotated where it appears.
 */
const CSP = [
  `default-src 'self'`,
  `base-uri 'self'`,
  `form-action 'self'`,
  `frame-ancestors 'none'`,
  `object-src 'none'`,
  // Clarity is two hosts, not one: www.clarity.ms serves the small loader at
  // /tag/<id>, which then fetches the real recorder from scripts.clarity.ms.
  // Allowing only the first gets you a tag that loads and never records.
  `script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms`,
  `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`,
  `font-src 'self' https://fonts.gstatic.com data:`,
  `img-src 'self' data: blob: https://www.google-analytics.com https://www.googletagmanager.com https://maps.gstatic.com https://maps.googleapis.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org https://api.mapbox.com https://*.cloudinary.com https://res.cloudinary.com`,
  `media-src 'self' blob:`,
  // `*.clarity.ms` alongside the two named hosts, because Clarity uploads to a
  // regional ingest origin chosen at runtime (c.clarity.ms, d.clarity.ms, …).
  // Naming only www and scripts here would let the recorder load and then fail
  // silently on every upload, which looks exactly like "Clarity is broken".
  `connect-src 'self' https://www.google-analytics.com https://region1.google-analytics.com https://www.clarity.ms https://scripts.clarity.ms https://*.clarity.ms https://maps.googleapis.com https://*.supabase.co wss://*.supabase.co https://api.mapbox.com https://events.mapbox.com https://*.cloudinary.com https://tile.openstreetmap.org https://*.tile.openstreetmap.org`,
  // googletagmanager is here for GTM's <noscript> ns.html iframe, which is
  // otherwise blocked — the fallback would be present in the markup and dead.
  `frame-src 'self' https://www.google.com https://www.youtube-nocookie.com https://www.googletagmanager.com`,
  `worker-src 'self' blob:`,
  `manifest-src 'self'`,
].join("; ");

/**
 * `upgrade-insecure-requests` is correct in production and actively harmful
 * against a local HTTP server: it makes the browser rewrite
 * http://localhost:3000 to https://, which nothing is listening on, and Chrome
 * shows an interstitial instead of the page. That is what blocked the first
 * Lighthouse run — not HSTS, which browsers ignore over plain HTTP.
 *
 * Keyed on the canonical site URL rather than NODE_ENV, because `next start`
 * is production mode even when serving a local audit.
 */
const servesHttps = (process.env.NEXT_PUBLIC_SITE_URL ?? "").startsWith("https://");
const CSP_FULL = servesHttps ? `${CSP}; upgrade-insecure-requests` : CSP;

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async headers() {
    return [
      {
        source: "/film/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value:
              "camera=(), microphone=(), geolocation=(), interest-cohort=(), " +
              "payment=(), usb=(), magnetometer=(), accelerometer=()",
          },

          // Report-only outside production: a directive that turns out to be
          // too tight should show up in the console during development, not
          // break the page a developer is looking at.
          {
            key: isProd ? "Content-Security-Policy" : "Content-Security-Policy-Report-Only",
            value: CSP_FULL,
          },

          // Two years, subdomains included, preload-eligible. Safe to send
          // always: RFC 6797 requires browsers to ignore HSTS received over
          // plain HTTP, so a local build cannot pin localhost to https.
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains; preload",
          },

          // Isolates the browsing context. `same-origin` on the opener policy
          // is what actually severs a malicious window.opener reference.
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "Cross-Origin-Resource-Policy", value: "same-origin" },

          // credentialless rather than require-corp: require-corp would block
          // every third-party image and embed that does not send CORP, which
          // includes Maps tiles. This still earns cross-origin isolation.
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },

          { key: "X-DNS-Prefetch-Control", value: "on" },
        ],
      },
    ];
  },
};

export default nextConfig;
