import Link from "next/link";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const metadata = { title: "Calendar & Visits — Terravion OS" };
export const dynamic = "force-dynamic";

interface VisitEvent {
  id: string;
  lead_id: string;
  lead_name: string;
  lead_phone: string;
  project_name: string | null;
  type: string;
  occurred_at: string;
  body: string | null;
  user_name: string | null;
}

export default async function CalendarPage() {
  const session = await auth();

  const events = await query<VisitEvent>`
    SELECT
      a.id, a.lead_id, a.type, a.occurred_at, a.body,
      l.name AS lead_name, l.phone AS lead_phone,
      p.name AS project_name,
      u.name AS user_name
    FROM lead_activities a
    JOIN leads l ON l.id = a.lead_id
    LEFT JOIN projects p ON p.id = l.project_id
    LEFT JOIN users u ON u.id = a.user_id
    WHERE a.type IN ('SITE_VISIT', 'CALL', 'MEETING')
    ORDER BY a.occurred_at DESC
    LIMIT 50
  `;

  return (
    <div className="px-8 py-7 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Site Visits & Calendar Schedule</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#946c0b] border border-amber-200">
              Active Timeline
            </span>
          </h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-normal">
            Track site visit bookings, buyer appointments, and sales team follow-up commitments.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c59b27] to-[#a67c1e] px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition-all hover:brightness-105"
          >
            <span>+ Schedule New Visit</span>
          </Link>
        </div>
      </header>

      {/* Summary KPI Counters */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Scheduled This Week</p>
          <p className="mt-1.5 text-2xl font-bold text-[#946c0b]">14</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-emerald-600">8 VIP Shankarpally Tours</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Completed Visits</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">42</p>
          <p className="mt-1 text-[0.6875rem] text-slate-500 font-medium">Last 30 Days</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Visit-to-Booking Ratio</p>
          <p className="mt-1.5 text-2xl font-bold text-emerald-600">33.3%</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-emerald-600">1 in 3 converts</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Shuttle / Cab Bookings</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">6</p>
          <p className="mt-1 text-[0.6875rem] text-slate-400">From Hitec City & Gachibowli</p>
        </div>
      </div>

      {/* Events Table */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <h2 className="text-[1.05rem] font-bold text-slate-900">Upcoming & Recent Appointments</h2>
          <span className="text-xs font-medium text-slate-400">Synchronized with CRM timeline</span>
        </div>

        {events.length === 0 ? (
          <div className="py-12 text-center">
            <span className="text-3xl">📅</span>
            <p className="mt-3 text-sm font-semibold text-slate-700">No scheduled visits logged yet.</p>
            <p className="mt-1 text-xs text-slate-500">
              When site visits or follow-ups are added to a lead, they will automatically appear here.
            </p>
            <Link
              href="/leads"
              className="mt-4 inline-block rounded-lg bg-amber-50 border border-amber-200 px-4 py-2 text-xs font-bold text-[#946c0b] hover:bg-amber-100 transition-colors"
            >
              Go to Leads Pipeline
            </Link>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {events.map((evt) => (
              <div key={evt.id} className="flex flex-wrap items-center justify-between gap-4 py-3.5">
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-50 text-amber-700 border border-amber-200 font-mono text-sm shadow-2xs">
                    {evt.type === "SITE_VISIT" ? "🚗" : "📞"}
                  </span>
                  <div>
                    <Link
                      href={`/leads/${evt.lead_id}`}
                      className="font-bold text-slate-900 hover:text-[#946c0b] transition-colors text-sm"
                    >
                      {evt.lead_name}
                    </Link>
                    <p className="text-xs text-slate-500 font-normal mt-0.5">
                      {evt.lead_phone} {evt.project_name ? `· 📍 ${evt.project_name}` : ""}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="rounded bg-slate-100 px-2.5 py-0.5 text-[0.6875rem] font-semibold text-slate-700 border border-slate-200">
                    {evt.type.replace(/_/g, " ")}
                  </span>
                  <p className="text-xs text-slate-400 mt-1">
                    Assigned: {evt.user_name || "Sales Executive"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
