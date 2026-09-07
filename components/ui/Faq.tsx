import type { Faq as FaqItem } from "@/lib/types";

/**
 * Accessible FAQ accordion built on native <details>/<summary> — keyboard
 * and screen-reader behaviour for free, zero JS shipped.
 */
export default function Faq({ items }: { items: FaqItem[] }) {
  return (
    <div className="divide-y divide-ink/10">
      {items.map((f) => (
        <details key={f.q} className="group py-2">
          <summary
            className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-4 text-lg font-medium marker:hidden text-ink"
          >
            <span>{f.q}</span>
            <span
              aria-hidden="true"
              className="display shrink-0 text-2xl transition-transform duration-300 group-open:rotate-45 text-gold-ink"
            >
              +
            </span>
          </summary>
          <p
            className="max-w-3xl pb-6 text-base leading-relaxed text-text-secondary"
          >
            {f.a}
          </p>
        </details>
      ))}
    </div>
  );
}
