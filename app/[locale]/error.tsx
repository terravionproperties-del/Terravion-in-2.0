"use client";

/**
 * Route-segment error boundary. Without this file, any runtime error inside a
 * page shows Next's unstyled "Application error" screen — the one surface of
 * the site that would carry no brand at all, at the exact moment a visitor is
 * already having a bad time. Kept deliberately dependency-free (no dictionary
 * loading — the error may BE the dictionary), so English text is acceptable.
 */
export default function RouteError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center bg-ivory px-7 text-center">
      <p className="label text-gold-ink">Something went wrong</p>
      <h1 className="display mt-5 max-w-xl text-4xl leading-tight text-charcoal md:text-5xl">
        This page stumbled. The land is fine.
      </h1>
      <p className="mt-6 max-w-md text-base leading-relaxed text-text-secondary">
        A temporary error stopped this page from rendering. Trying again
        usually fixes it; if it persists, call us instead — a person answers.
      </p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={reset}
          className="rounded-full bg-gold px-8 py-3 text-sm font-semibold uppercase tracking-widest text-charcoal transition-colors hover:bg-gold-dark hover:text-white"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-charcoal/25 px-8 py-3 text-sm font-semibold uppercase tracking-widest text-charcoal transition-colors hover:border-charcoal"
        >
          Go home
        </a>
      </div>
    </main>
  );
}
