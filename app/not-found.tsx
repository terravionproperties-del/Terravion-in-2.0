import type { Metadata } from "next";
import { site } from "@/lib/site";

/**
 * Root-level 404.
 *
 * Nearly every request is rewritten into `/[locale]/...` by middleware, so the
 * localised not-found page under `app/[locale]/` is what visitors actually
 * see. This file exists for the paths middleware deliberately bypasses —
 * assets, API routes, metadata files — which resolve outside the `[locale]`
 * tree and therefore inherit no layout metadata.
 *
 * Without it, Next fell back to an implicit root layout with no
 * `metadataBase`, and the built page shipped `http://localhost:3000` as its
 * og:image and twitter:image URL.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: "Page not found",
  robots: { index: false, follow: false },
};

export default function RootNotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#2B2118",
          color: "#F7F4EC",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontSize: "0.72rem",
            color: "#D9B370",
          }}
        >
          Off the masterplan
        </p>
        <h1 style={{ fontSize: "3rem", margin: "1.25rem 0 0" }}>Open land.</h1>
        <p
          style={{
            maxWidth: "42ch",
            lineHeight: 1.6,
            color: "rgba(247,244,236,0.65)",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.95rem",
          }}
        >
          This page doesn&apos;t exist. Like the best plots, the good routes are
          clearly marked.
        </p>
        <a
          href="/"
          style={{
            marginTop: "2rem",
            padding: "0.9rem 2.2rem",
            borderRadius: "999px",
            background: "#B88A44",
            color: "#F7F4EC",
            textDecoration: "none",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            fontFamily: "system-ui, sans-serif",
          }}
        >
          Back to the film
        </a>
      </body>
    </html>
  );
}
