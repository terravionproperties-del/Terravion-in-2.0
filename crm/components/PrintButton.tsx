"use client";

/**
 * Save as PDF.
 *
 * A client component for one line of JavaScript, because the alternative — an
 * inline `<script>` on a server-rendered page — does not run after a soft
 * navigation. React inserts inline scripts into the DOM without executing
 * them, so arriving here from the sidebar produced a button that did nothing,
 * which is worse than no button at all.
 */
export default function PrintButton({ label = "Save as PDF" }: { label?: string }) {
  return (
    <button type="button" onClick={() => window.print()} className="btn">
      {label}
    </button>
  );
}
