import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import {
  searchAll,
  MIN_TERM_LENGTH,
  type SearchHit,
  type SearchKind,
} from "@/lib/repos/search";

export const metadata = { title: "Search — Terravion OS" };
export const dynamic = "force-dynamic";

const KIND_LABEL: Record<SearchKind, string> = {
  lead: "Leads",
  project: "Projects",
};

/**
 * Everything the palette had to leave out.
 *
 * The palette stops at twenty rows because that is what fits above the fold.
 * This shows a hundred, and it has a URL — so a search can be sent to a
 * colleague, and the back button behaves.
 */
export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const sp = await searchParams;
  const term = (sp.q ?? "").trim().slice(0, 120);
  const hits =
    term.length >= MIN_TERM_LENGTH
      ? await searchAll(term, session.user.role, session.user.id, 100)
      : [];

  const groups = groupByKind(hits);

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <h1 className="text-[1.4rem] font-medium tracking-tight">Search</h1>
        <p className="mt-1 text-[0.8125rem] text-ivory/45">
          {term.length < MIN_TERM_LENGTH
            ? "Two characters or more."
            : `${hits.length} ${hits.length === 1 ? "match" : "matches"} for “${term}”`}
        </p>
      </header>

      <form method="GET" className="panel mb-5 flex flex-wrap items-end gap-3 p-4">
        <div className="min-w-[260px] flex-1">
          <label htmlFor="q" className="label mb-1.5 block">
            Term
          </label>
          <input
            id="q"
            name="q"
            defaultValue={term}
            maxLength={120}
            placeholder="Name, phone, reference, email, remark or project"
            className="field"
          />
        </div>
        <button type="submit" className="btn">
          Search
        </button>
      </form>

      {hits.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-[0.9375rem]">
            {term.length < MIN_TERM_LENGTH
              ? "Nothing searched yet."
              : `Nothing matches “${term}”.`}
          </p>
          <p className="mx-auto mt-2 max-w-[56ch] text-[0.8125rem] leading-relaxed text-ivory/40">
            Leads are matched on name, reference, phone, WhatsApp, email and
            remarks; projects on name and slug. A phone number is normalised
            first, so 9876543210 finds +919876543210. Press{" "}
            <kbd className="rounded border border-white/[0.08] px-1 py-0.5 text-[0.6875rem]">
              /
            </kbd>{" "}
            anywhere to search without leaving the screen you are on.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map((group) => (
            <section key={group.kind} className="panel overflow-hidden">
              <h2 className="label border-b border-white/10 px-4 py-3">
                {KIND_LABEL[group.kind]}
                <span className="ml-2 text-ivory/25">{group.items.length}</span>
              </h2>
              <ul>
                {group.items.map((hit) => (
                  <li
                    key={`${hit.kind}-${hit.id}`}
                    className="border-b border-white/5 last:border-0"
                  >
                    <Link
                      href={hit.href}
                      className="flex items-baseline justify-between gap-6 px-4 py-3 transition-colors hover:bg-white/5"
                    >
                      <span className="min-w-0">
                        <span className="block truncate text-[0.875rem]">{hit.title}</span>
                        {hit.subtitle && (
                          <span className="block truncate text-[0.75rem] tabular-nums text-ivory/45">
                            {hit.subtitle}
                          </span>
                        )}
                      </span>
                      <span className="label shrink-0">{hit.matchedOn.toLowerCase()}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

/** Preserves the rank order the repo returned, within each group. */
function groupByKind(hits: SearchHit[]): { kind: SearchKind; items: SearchHit[] }[] {
  const order: SearchKind[] = [];
  const byKind = new Map<SearchKind, SearchHit[]>();
  for (const hit of hits) {
    let bucket = byKind.get(hit.kind);
    if (!bucket) {
      bucket = [];
      byKind.set(hit.kind, bucket);
      order.push(hit.kind);
    }
    bucket.push(hit);
  }
  return order.map((kind) => ({ kind, items: byKind.get(kind) ?? [] }));
}
