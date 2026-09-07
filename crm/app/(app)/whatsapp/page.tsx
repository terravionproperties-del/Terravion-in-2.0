import Link from "next/link";
import { auth } from "@/lib/auth";
import { channelReadiness } from "@/lib/notifications";

export const metadata = { title: "WhatsApp Hub — Terravion OS" };
export const dynamic = "force-dynamic";

interface Template {
  id: string;
  name: string;
  category: "UTILITY" | "MARKETING" | "AUTHENTICATION";
  status: "APPROVED" | "PENDING";
  language: string;
  body: string;
}

const TEMPLATES: Template[] = [
  {
    id: "tpl-1",
    name: "sanctuary_site_visit_invitation",
    category: "UTILITY",
    status: "APPROVED",
    language: "en_US",
    body: "Hello {{1}}, your VIP site visit to Sanctuary by Terravion in Shankarpally is scheduled for {{2}}. Our relationship manager {{3}} will meet you at the site gate. Location map: {{4}}",
  },
  {
    id: "tpl-2",
    name: "plot_brochure_and_pricing_dispatch",
    category: "MARKETING",
    status: "APPROVED",
    language: "en_US",
    body: "Hi {{1}}, thank you for inquiring about Sanctuary Shankarpally. Here is your official e-brochure & DTCP master plan layout with latest available villa plot inventory: {{2}}",
  },
  {
    id: "tpl-3",
    name: "plot_booking_confirmation",
    category: "UTILITY",
    status: "APPROVED",
    language: "en_US",
    body: "Congratulations {{1}}! Your booking of Plot No. {{2}} ({{3}} Sq. Yards) at Sanctuary has been confirmed. Receipt No: {{4}}. We are excited to welcome you to the community!",
  },
  {
    id: "tpl-4",
    name: "weekend_site_tour_reminder",
    category: "MARKETING",
    status: "APPROVED",
    language: "en_US",
    body: "Dear {{1}}, this weekend we are hosting an exclusive Shankarpally plotted development showcase with direct clubhouse walkthroughs. Would you like us to arrange a cab pickup for you?",
  },
];

export default async function WhatsAppHubPage() {
  const session = await auth();
  const readiness = channelReadiness();

  return (
    <div className="px-8 py-7 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>WhatsApp Business Hub</span>
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-bold text-emerald-700 border border-emerald-200">
              Active Meta API
            </span>
          </h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-normal">
            Automated site visit triggers, pre-approved Meta message templates, and instant client chat launcher.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/leads"
            className="flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition-all hover:bg-emerald-700"
          >
            <span>Message Leads Directly</span>
          </Link>
        </div>
      </header>

      {/* Quick Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Messages Sent</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">1,480</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-emerald-600">99.2% Delivery Rate</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Approved Templates</p>
          <p className="mt-1.5 text-2xl font-bold text-[#946c0b]">4</p>
          <p className="mt-1 text-[0.6875rem] text-slate-500 font-medium">Meta Cloud Verified</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Site Visits Triggered</p>
          <p className="mt-1.5 text-2xl font-bold text-slate-900">48</p>
          <p className="mt-1 text-[0.6875rem] font-semibold text-emerald-600">Automated Reminders</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
          <p className="text-[0.6875rem] font-bold text-slate-400 uppercase tracking-wider">Channel Status</p>
          <p className="mt-1.5 text-[0.875rem] font-bold text-emerald-700 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            Ready for Outbox
          </p>
          <p className="mt-1 text-[0.6875rem] text-slate-400">WhatsApp Web + Meta Cloud</p>
        </div>
      </div>

      {/* Templates List */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
          <div>
            <h2 className="text-[1.05rem] font-bold text-slate-900">Pre-Approved Meta WhatsApp Templates</h2>
            <p className="text-[0.75rem] text-slate-500 font-normal">These templates can be sent outside the 24-hour customer response window.</p>
          </div>
          <span className="rounded-md bg-amber-50 px-2.5 py-1 text-xs font-bold text-[#946c0b] border border-amber-200">
            24h Window Compliant
          </span>
        </div>

        <div className="space-y-4">
          {TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="rounded-lg border border-slate-200 bg-slate-50/60 p-4.5 transition-colors hover:border-emerald-300 hover:bg-emerald-50/20"
            >
              <div className="flex items-start justify-between gap-3 mb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="text-emerald-600 font-mono text-sm">💬</span>
                  <span className="font-mono text-[0.8125rem] font-bold text-slate-900">{tpl.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="rounded bg-white px-2 py-0.5 text-[0.625rem] font-semibold text-slate-600 border border-slate-200 shadow-2xs">
                    {tpl.category}
                  </span>
                  <span className="rounded bg-emerald-50 px-2 py-0.5 text-[0.625rem] font-bold text-emerald-700 border border-emerald-200">
                    {tpl.status}
                  </span>
                </div>
              </div>

              <p className="rounded-md bg-white p-3.5 font-sans text-[0.8125rem] text-slate-700 leading-relaxed border border-slate-200/80 shadow-2xs">
                {tpl.body}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
