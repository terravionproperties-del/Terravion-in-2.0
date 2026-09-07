import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can } from "@/lib/rbac";
import { listDuplicates } from "@/lib/repos/duplicates";
import { merge } from "./actions";

export const metadata = { title: "Duplicates — Terravion OS" };
export const dynamic = "force-dynamic";

const matchTone: Record<string, string> = {
  PHONE: "text-bad",
  WHATSAPP: "text-warn",
  EMAIL: "text-warn",
  NAME: "text-ivory/50",
};

/**
 * Duplicate review.
 *
 * Nothing merges automatically. Even a phone-number match can be two family
 * members sharing a handset, and an automatic merge of those is unrecoverable
 * in practice — so every pair is proposed and a person decides. The older
 * record is offered first because it carries the longer history, but either
 * side can be kept.
 */
export default async function DuplicatesPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "lead:merge")) redirect("/");

  const pairs = await listDuplicates(100);

  return (
    <div className="px-8 py-7">
      <header className="mb-6">
        <h1 className="text-[1.4rem] font-medium tracking-tight">Possible duplicates</h1>
        <p className="mt-1 max-w-[70ch] text-[0.8125rem] leading-relaxed text-ivory/45">
          {pairs.length === 0
            ? "None found."
            : `${pairs.length} pair${pairs.length === 1 ? "" : "s"} share a phone, WhatsApp number, email, or a name within the same project.`}{" "}
          Merging keeps one record, moves the other&rsquo;s entire timeline onto
          it, and fills only the blanks. Nothing is deleted and every merge is
          reversible from its snapshot.
        </p>
      </header>

      {pairs.length === 0 ? (
        <div className="panel p-10 text-center">
          <p className="text-[0.9375rem]">No duplicates detected.</p>
          <p className="mt-2 text-[0.8125rem] text-ivory/40">
            The website already rejects a repeat enquiry from the same number on
            the same project, so these are rarer than they used to be.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {pairs.map((p) => (
            <li key={`${p.LeftId}-${p.RightId}`} className="panel p-4">
              <div className="mb-3 flex items-center gap-3">
                <span className={`label ${matchTone[p.MatchedOn] ?? ""}`}>
                  {p.MatchedOn.toLowerCase()} match
                </span>
                <span className="text-[0.6875rem] text-ivory/30">
                  {p.Confidence}% confidence
                </span>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {[
                  {
                    id: p.LeftId,
                    ref: p.LeftRef,
                    name: p.LeftName,
                    phone: p.LeftPhone,
                    created: p.LeftCreated,
                    older: true,
                  },
                  {
                    id: p.RightId,
                    ref: p.RightRef,
                    name: p.RightName,
                    phone: p.RightPhone,
                    created: p.RightCreated,
                    older: false,
                  },
                ].map((side) => (
                  <div key={side.id} className="rounded-lg border border-white/10 p-3">
                    <div className="flex items-baseline justify-between gap-3">
                      <Link href={`/leads/${side.id}`} className="text-[0.875rem] hover:underline">
                        {side.name}
                      </Link>
                      <span className="text-[0.6875rem] tabular-nums text-gold-light">
                        {side.ref}
                      </span>
                    </div>
                    <p className="mt-1 text-[0.75rem] tabular-nums text-ivory/50">{side.phone}</p>
                    <p className="mt-1 text-[0.6875rem] text-ivory/30">
                      {side.older ? "Older record · " : ""}
                      created{" "}
                      {new Date(side.created).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-3 flex flex-wrap items-center gap-2">
                <form action={merge}>
                  <input type="hidden" name="survivorId" value={p.LeftId} />
                  <input type="hidden" name="loserId" value={p.RightId} />
                  <input type="hidden" name="matchedOn" value={p.MatchedOn} />
                  <input type="hidden" name="confidence" value={p.Confidence} />
                  <button type="submit" className="btn">
                    Keep {p.LeftRef} (older)
                  </button>
                </form>
                <form action={merge}>
                  <input type="hidden" name="survivorId" value={p.RightId} />
                  <input type="hidden" name="loserId" value={p.LeftId} />
                  <input type="hidden" name="matchedOn" value={p.MatchedOn} />
                  <input type="hidden" name="confidence" value={p.Confidence} />
                  <button type="submit" className="btn">
                    Keep {p.RightRef} (newer)
                  </button>
                </form>
                <span className="text-[0.6875rem] text-ivory/25">
                  {p.MatchedOn === "NAME"
                    ? "Same name and project — check before merging; namesakes are common."
                    : "Verify these are the same person before merging."}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
