"use client";

/**
 * Last-resort boundary: catches errors thrown by the root layout itself,
 * where no CSS, fonts, or dictionaries can be assumed. Must render its own
 * <html>/<body>, so styling is inline and self-contained by design.
 */
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
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
          background: "#F7F4EC",
          color: "#1D1D1D",
          fontFamily: "Georgia, 'Times New Roman', serif",
          textAlign: "center",
          padding: "2rem",
        }}
      >
        <p
          style={{
            textTransform: "uppercase",
            letterSpacing: "0.2em",
            fontSize: "0.75rem",
            color: "#B88A44",
          }}
        >
          Terravion Properties
        </p>
        <h1 style={{ fontSize: "2rem", maxWidth: "28ch", lineHeight: 1.2 }}>
          Something went wrong on our side.
        </h1>
        <p
          style={{
            maxWidth: "44ch",
            lineHeight: 1.6,
            color: "#555",
            fontFamily: "system-ui, sans-serif",
            fontSize: "0.95rem",
          }}
        >
          A temporary error stopped the site from rendering. Please try again —
          or call +91 93472 59638 and a person will help.
        </p>
        <button
          onClick={reset}
          style={{
            marginTop: "2rem",
            padding: "0.8rem 2.2rem",
            borderRadius: "999px",
            border: "none",
            background: "#1D1D1D",
            color: "#F7F4EC",
            letterSpacing: "0.15em",
            textTransform: "uppercase",
            fontSize: "0.8rem",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
