import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, scopeFor } from "@/lib/rbac";
import {
  listLeads,
  LEAD_STAGES,
  LEAD_SOURCES,
  humanise,
  type LeadStage,
  type LeadSource,
} from "@/lib/repos/leads";

export const metadata = { title: "Leads — Terravion OS" };
export const dynamic = "force-dynamic";

const stageTone: Record<string, string> = {
  NEW: "text-[#946c0b] font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200",
  CONTACTED: "text-blue-700 font-semibold bg-blue-50 px-2 py-0.5 rounded border border-blue-200",
  INTERESTED: "text-indigo-700 font-semibold bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200",
  SITE_VISIT_SCHEDULED: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  SITE_VISIT_COMPLETED: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  NEGOTIATION: "text-amber-700 font-bold bg-amber-50 px-2 py-0.5 rounded border border-amber-200",
  BOOKING_AMOUNT_PAID: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  AGREEMENT: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  REGISTRATION: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  COMPLETED: "text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200",
  LOST: "text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200",
  CANCELLED: "text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded border border-rose-200",
};

export default async function LeadsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "lead:read")) redirect("/");

  const sp = await searchParams;
  const scope = scopeFor(session.user.role, "lead");

  const { rows, total, page, pageSize } = await listLeads(
    {
      search: sp.q,
      stage: LEAD_STAGES.includes(sp.stage as LeadStage)
        ? (sp.stage as LeadStage)
        : undefined,
      source: LEAD_SOURCES.includes(sp.source as LeadSource)
        ? (sp.source as LeadSource)
        : undefined,
      from: sp.from ? new Date(sp.from) : undefined,
      to: sp.to ? new Date(`${sp.to}T23:59:59.999Z`) : undefined,
      projectId: /^[0-9a-f-]{36}$/i.test(sp.projectId ?? "") ? sp.projectId : undefined,
      page: sp.page ? Number(sp.page) : 1,
    },
    scope,
    session.user.id
  );

  const pages = Math.max(1, Math.ceil(total / pageSize));
  const qs = (patch: Record<string, string | undefined>) => {
    const next = new URLSearchParams();
    for (const [k, v] of Object.entries({ ...sp, ...patch })) {
      if (v) next.set(k, v);
    }
    return `/leads?${next.toString()}`;
  };

  const filtered = Boolean(sp.q || sp.stage || sp.source || sp.from || sp.to);

  return (
    <div className="px-8 py-7 space-y-6">
      <header className="flex flex-wrap items-baseline justify-between gap-6 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900">Leads Pipeline</h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-medium">
            {total.toLocaleString("en-IN")} {total === 1 ? "record" : "records"}
            {scope === "own" ? " assigned to you" : " across all projects"}
          </p>
        </div>
        {can(session.user.role, "lead:create") && (
          <Link href="/leads/new" className="btn btn-primary shadow-sm">
            + Add New Lead
          </Link>
        )}
      </header>

      {/* Filters form */}
      <form method="GET" className="rounded-xl border border-slate-200 bg-white p-4.5 shadow-xs flex flex-wrap items-end gap-3.5">
        <div className="min-w-[220px] flex-1">
          <label htmlFor="q" className="label mb-1.5 block text-slate-500">
            Search
          </label>
          <input
            id="q"
            name="q"
            defaultValue={sp.q ?? ""}
            placeholder="Name, phone, reference or email"
            className="field"
          />
        </div>
        <div>
          <label htmlFor="stage" className="label mb-1.5 block text-slate-500">
            Stage
          </label>
          <select id="stage" name="stage" defaultValue={sp.stage ?? ""} className="field cursor-pointer">
            <option value="">Any</option>
            {LEAD_STAGES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="source" className="label mb-1.5 block text-slate-500">
            Source
          </label>
          <select id="source" name="source" defaultValue={sp.source ?? ""} className="field cursor-pointer">
            <option value="">Any</option>
            {LEAD_SOURCES.map((s) => (
              <option key={s} value={s}>
                {humanise(s)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="from" className="label mb-1.5 block text-slate-500">
            From
          </label>
          <input id="from" name="from" type="date" defaultValue={sp.from ?? ""} className="field" />
        </div>
        <div>
          <label htmlFor="to" className="label mb-1.5 block text-slate-500">
            To
          </label>
          <input id="to" name="to" type="date" defaultValue={sp.to ?? ""} className="field" />
        </div>
        <button type="submit" className="btn btn-primary">
          Filter
        </button>
        {filtered && (
          <Link href="/leads" className="btn">
            Clear
          </Link>
        )}
      </form>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-xs">
          <p className="text-[1rem] font-bold text-slate-800">No leads match this view.</p>
          <p className="mt-1 text-[0.8125rem] text-slate-500">
            Enquiries from the website and campaigns arrive here automatically.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                {[
                  "Reference",
                  "Name",
                  "Phone",
                  "Stage",
                  "Source",
                  "Project",
                  "Owner",
                  "Created",
                ].map((h) => (
                  <th key={h} className="px-4 py-3.5 text-[0.6875rem] font-bold uppercase tracking-wider text-slate-500">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {rows.map((l) => (
                <tr
                  key={l.Id}
                  className="transition-colors hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.Id}`} className="tabular-nums font-bold text-[#946c0b] hover:underline">
                      {l.Reference}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    <Link href={`/leads/${l.Id}`} className="font-semibold text-slate-900 hover:text-[#946c0b] transition-colors">
                      {l.Name}
                    </Link>
                  </td>
                  <td className="px-4 py-3 tabular-nums font-medium text-slate-600">{l.Phone}</td>
                  <td className="px-4 py-3">
                    <span className={stageTone[l.Stage] ?? "text-slate-600"}>
                      {humanise(l.Stage)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{humanise(l.Source)}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{l.ProjectName ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-600 font-medium">{l.OwnerName ?? "Unassigned"}</td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(l.CreatedAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "short",
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <nav className="flex items-center justify-between text-[0.8125rem] pt-2">
          <span className="text-slate-500 font-medium">
            Page {page} of {pages}
          </span>
          <span className="flex gap-2">
            {page > 1 && (
              <Link href={qs({ page: String(page - 1) })} className="btn">
                Previous
              </Link>
            )}
            {page < pages && (
              <Link href={qs({ page: String(page + 1) })} className="btn">
                Next
              </Link>
            )}
          </span>
        </nav>
      )}
    </div>
  );
}
