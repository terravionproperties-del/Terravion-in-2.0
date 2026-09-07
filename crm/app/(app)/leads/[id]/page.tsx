import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { can, scopeFor } from "@/lib/rbac";
import { query } from "@/lib/db";
import { getLead, getTimeline, humanise, LEAD_STAGES } from "@/lib/repos/leads";

/**
 * Render a before/after snapshot as a short phrase.
 *
 * Snapshots are written by whichever writer produced the entry, so the shape
 * varies — a stage change stores `{stage}`, an assignment `{ownerId}`, a merge
 * a whole record. Anything unrecognised is summarised by its field names
 * rather than dumped as JSON; an operator reading a dispute needs to know
 * *what* moved, and the full payload is in the database if it matters.
 */
function describe(raw: string | null | undefined): string | null {
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as Record<string, unknown>;
    if (typeof v.stage === "string") return humanise(v.stage);
    if ("ownerId" in v) return v.ownerId ? "assigned" : "unassigned";
    const keys = Object.keys(v);
    if (keys.length === 0) return null;
    if (keys.length <= 3) return keys.map(humanise).join(", ");
    return `${keys.length} fields`;
  } catch {
    return null;
  }
}
import { logActivity, moveStage, reassign } from "./actions";

export const dynamic = "force-dynamic";

const inr = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const typeLabel: Record<string, string> = {
  CREATED: "Captured",
  NOTE: "Note",
  CALL: "Call",
  WHATSAPP: "WhatsApp",
  EMAIL: "Email",
  MEETING: "Meeting",
  SITE_VISIT: "Site visit",
  DOCUMENT: "Document",
  BOOKING: "Booking",
  PAYMENT: "Payment",
  ASSIGNMENT: "Assignment",
  STAGE_CHANGE: "Stage",
  MERGE: "Merge",
};

export default async function LeadPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) redirect("/login");
  if (!can(session.user.role, "lead:read")) redirect("/");

  const { id } = await params;
  const lead = await getLead(id, scopeFor(session.user.role, "lead"), session.user.id);
  if (!lead) notFound();

  const [timeline, owners] = await Promise.all([
    getTimeline(lead.Id),
    can(session.user.role, "lead:assign")
      ? query<{ Id: string; Name: string }>`
          SELECT id AS Id, name AS Name FROM users
          WHERE is_active = 1
            AND role IN ('SALES_EXECUTIVE','SALES_MANAGER','TELECALLER')
          ORDER BY name
        `
      : Promise.resolve([] as { Id: string; Name: string }[]),
  ]);

  const budget =
    lead.BudgetMin || lead.BudgetMax
      ? `${lead.BudgetMin ? inr.format(lead.BudgetMin) : "—"} – ${
          lead.BudgetMax ? inr.format(lead.BudgetMax) : "—"
        }`
      : "Not stated";

  return (
    <div className="px-8 py-7">
      <nav className="mb-5 text-[0.8125rem] text-ivory/40">
        <Link href="/leads" className="hover:text-ivory">
          Leads
        </Link>
        <span className="mx-2">/</span>
        <span className="tabular-nums">{lead.Reference}</span>
      </nav>

      <header className="mb-7 flex flex-wrap items-start justify-between gap-5">
        <div>
          <h1 className="text-[1.5rem] font-medium tracking-tight">{lead.Name}</h1>
          <p className="mt-1.5 flex flex-wrap items-center gap-3 text-[0.8125rem] text-ivory/50">
            <a href={`tel:${lead.Phone}`} className="tabular-nums hover:text-ivory">
              {lead.Phone}
            </a>
            {lead.Email && (
              <a href={`mailto:${lead.Email}`} className="hover:text-ivory">
                {lead.Email}
              </a>
            )}
            <span>·</span>
            <span>{humanise(lead.Source)}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`https://wa.me/${lead.Phone.replace(/\D/g, "")}`}
            target="_blank"
            rel="noopener noreferrer"
            className="btn"
          >
            WhatsApp
          </a>
          <a href={`tel:${lead.Phone}`} className="btn btn-primary">
            Call
          </a>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_330px]">
        {/* ── timeline ── */}
        <section className="min-w-0">
          {can(session.user.role, "activity:create") && (
            <form
              action={logActivity.bind(null, lead.Id)}
              className="panel mb-5 space-y-3 p-4"
            >
              <div className="flex gap-3">
                <select
                  name="type"
                  defaultValue="CALL"
                  className="field w-[150px]"
                  aria-label="Activity type"
                >
                  <option value="CALL">Call</option>
                  <option value="WHATSAPP">WhatsApp</option>
                  <option value="EMAIL">Email</option>
                  <option value="MEETING">Meeting</option>
                  <option value="SITE_VISIT">Site visit</option>
                  <option value="NOTE">Note</option>
                </select>
                <input
                  name="body"
                  required
                  maxLength={4000}
                  placeholder="What happened?"
                  className="field flex-1"
                  aria-label="What happened"
                />
              </div>
              <div className="flex items-center gap-3">
                <label htmlFor="followUp" className="label shrink-0">
                  Next follow-up
                </label>
                <input
                  id="followUp"
                  name="followUp"
                  type="datetime-local"
                  className="field w-[220px]"
                />
                <button type="submit" className="btn btn-primary ml-auto">
                  Log
                </button>
              </div>
            </form>
          )}

          <ol className="panel divide-y divide-white/5">
            {timeline.length === 0 && (
              <li className="p-6 text-center text-[0.8125rem] text-ivory/40">
                Nothing recorded yet.
              </li>
            )}
            {timeline.map((a) => {
              const before = describe(a.BeforeJson);
              const after = describe(a.AfterJson);
              const place = [a.City, a.Country].filter(Boolean).join(", ");
              const agent = [a.Browser, a.Os].filter(Boolean).join(" on ");

              return (
                <li key={a.Id} className="flex gap-4 p-4">
                  <span className="label w-[86px] shrink-0 pt-0.5 text-gold-light">
                    {typeLabel[a.Type] ?? a.Type}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[0.875rem] leading-relaxed">{a.Body}</span>

                    {(before || after) && (
                      <span className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[0.75rem]">
                        {before && (
                          <span className="rounded border border-white/10 px-1.5 py-0.5 text-ivory/40 line-through decoration-ivory/25">
                            {before}
                          </span>
                        )}
                        {before && after && <span className="text-ivory/25">→</span>}
                        {after && (
                          <span className="rounded border border-gold/25 bg-gold/5 px-1.5 py-0.5 text-gold-light">
                            {after}
                          </span>
                        )}
                      </span>
                    )}

                    <span className="mt-1 block text-[0.6875rem] text-ivory/35">
                      {new Date(a.OccurredAt).toLocaleString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                        hour: "numeric",
                        minute: "2-digit",
                        second: "2-digit",
                      })}
                      {a.UserName ? ` · ${a.UserName}` : " · system"}
                      {a.Channel ? ` · ${a.Channel.toLowerCase()}` : ""}
                    </span>

                    {/*
                      Forensics sit on their own muted line. They are needed for
                      a dispute — "who changed this, from where" — and read as
                      noise the other 99% of the time, so they never compete
                      with the note itself.
                    */}
                    {(a.Ip || agent || place || a.DeviceType) && (
                      <span className="mt-0.5 block text-[0.6875rem] text-ivory/22">
                        {[a.Ip, agent, a.DeviceType?.toLowerCase(), place]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
        </section>

        {/* ── side rail ── */}
        <aside className="space-y-4">
          <div className="panel p-4">
            <p className="label mb-3">Stage</p>
            {can(session.user.role, "lead:update") ? (
              <form action={moveStage.bind(null, lead.Id)} className="space-y-2.5">
                <select name="stage" defaultValue={lead.Stage} className="field" aria-label="Stage">
                  {LEAD_STAGES.map((s) => (
                    <option key={s} value={s}>
                      {humanise(s)}
                    </option>
                  ))}
                </select>
                <input
                  name="note"
                  placeholder="Reason (optional)"
                  className="field"
                  aria-label="Reason"
                />
                <button type="submit" className="btn w-full">
                  Update stage
                </button>
              </form>
            ) : (
              <p className="text-[0.875rem]">{humanise(lead.Stage)}</p>
            )}
          </div>

          <div className="panel p-4">
            <p className="label mb-3">Owner</p>
            {can(session.user.role, "lead:assign") && owners.length ? (
              <form action={reassign.bind(null, lead.Id)} className="space-y-2.5">
                <select
                  name="ownerId"
                  defaultValue={lead.OwnerId ?? ""}
                  className="field"
                  aria-label="Owner"
                >
                  <option value="" disabled>
                    Unassigned
                  </option>
                  {owners.map((u) => (
                    <option key={u.Id} value={u.Id}>
                      {u.Name}
                    </option>
                  ))}
                </select>
                <button type="submit" className="btn w-full">
                  Assign
                </button>
              </form>
            ) : (
              <p className="text-[0.875rem]">{lead.OwnerName ?? "Unassigned"}</p>
            )}
          </div>

          <dl className="panel space-y-3 p-4 text-[0.8125rem]">
            <Row label="Budget" value={budget} />
            <Row label="Project" value={lead.ProjectName ?? "Not stated"} />
            <Row
              label="Facing"
              value={lead.PreferredFacing ? humanise(lead.PreferredFacing) : "Any"}
            />
            <Row
              label="Plot size"
              value={
                lead.PlotSizeMin || lead.PlotSizeMax
                  ? `${lead.PlotSizeMin ?? "—"} – ${lead.PlotSizeMax ?? "—"} sq yd`
                  : "Not stated"
              }
            />
            <Row
              label="Next follow-up"
              value={
                lead.NextFollowUpAt
                  ? new Date(lead.NextFollowUpAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "numeric",
                      minute: "2-digit",
                    })
                  : "None set"
              }
            />
            <Row
              label="Created"
              value={new Date(lead.CreatedAt).toLocaleString("en-IN", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            />
          </dl>

          {(lead.UtmSource || lead.Gclid || lead.Fbclid || lead.Campaign || lead.LandingPage) && (
            <dl className="panel space-y-3 p-4 text-[0.8125rem]">
              <p className="label">Attribution</p>
              {lead.Campaign && <Row label="Campaign" value={lead.Campaign} />}
              {lead.UtmSource && <Row label="utm_source" value={lead.UtmSource} />}
              {lead.UtmMedium && <Row label="utm_medium" value={lead.UtmMedium} />}
              {lead.UtmCampaign && <Row label="utm_campaign" value={lead.UtmCampaign} />}
              {lead.Gclid && <Row label="gclid" value="present" />}
              {lead.Fbclid && <Row label="fbclid" value="present" />}
              {lead.LandingPage && <Row label="Landing" value={lead.LandingPage} />}
            </dl>
          )}
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="shrink-0 text-ivory/40">{label}</dt>
      <dd className="min-w-0 truncate text-right">{value}</dd>
    </div>
  );
}
