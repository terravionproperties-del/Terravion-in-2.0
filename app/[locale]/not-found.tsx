import type { Metadata } from "next";
import Link from "next/link";
import { site } from "@/lib/site";

/**
 * A 404 still gets shared and unfurled, so it needs an absolute base for its
 * social image. Without `metadataBase` Next resolves the OG image against
 * http://localhost:3000 and ships that URL to production.
 */
export const metadata: Metadata = {
  metadataBase: new URL(site.domain),
  title: "Page not found",
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <section className="flex min-h-svh flex-col items-center justify-center bg-ivory px-6 text-center text-charcoal">
      <p className="label text-gold-ink">Off the masterplan</p>
      <h1 className="display mt-6 text-6xl md:text-8xl">Open land.</h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-text-secondary">
        This page doesn't exist — yet. Like the best plots, the good routes
        are clearly marked.
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-5">
        <Link
          href="/"
          className="label rounded-full bg-brass px-8 py-4 text-white transition-colors hover:bg-gold hover:text-charcoal"
        >
          Back to the film
        </Link>
        <Link
          href="/projects"
          className="label rounded-full border border-charcoal/30 px-8 py-4 text-charcoal transition-colors hover:border-charcoal"
        >
          View projects
        </Link>
      </div>
    </section>
  );
}
