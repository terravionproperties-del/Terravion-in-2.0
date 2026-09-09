import Link from "next/link";
import { auth } from "@/lib/auth";
import { query } from "@/lib/db";

export const metadata = { title: "Projects — Terravion OS" };
export const dynamic = "force-dynamic";

interface ProjectCard {
  id: string;
  slug: string;
  name: string;
  status: string;
  location: string | null;
  total_acres: number | null;
  rera_number: string | null;
  total_plots?: number;
  available_plots?: number;
  booked_plots?: number;
  total_leads?: number;
}

export default async function ProjectsPage() {
  const session = await auth();

  const projects = await query<ProjectCard>`
    SELECT
      p.id, p.slug, p.name, p.status, p.location, p.total_acres, p.rera_number,
      (SELECT COUNT(*) FROM leads l WHERE l.project_id = p.id AND l.merged_into_id IS NULL) AS total_leads
    FROM projects p
    ORDER BY p.name
  `;

  return (
    <div className="px-8 py-7 space-y-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-[1.6rem] font-serif font-semibold tracking-tight text-slate-900 flex items-center gap-2.5">
            <span>Residential Communities & Projects</span>
            <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-bold text-[#946c0b] border border-amber-200">
              {projects.length} Active
            </span>
          </h1>
          <p className="mt-1 text-[0.8125rem] text-slate-500 font-normal">
            Master-planned gated villa communities and plotted development corridors.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/inventory"
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#c59b27] to-[#a67c1e] px-4 py-2 text-[0.8125rem] font-semibold text-white shadow-sm transition-all hover:brightness-105"
          >
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            <span>Open 3D GIS Map</span>
          </Link>
        </div>
      </header>

      {/* Projects Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {projects.map((p) => {
          const isSanctuary = p.slug === "sanctuary";
          const isRaghunath = p.slug === "raghunath-county";
          const acres = isSanctuary ? "45 Acres" : isRaghunath ? "19 Acres" : p.total_acres ? `${p.total_acres} Acres` : "20+ Acres";
          const plotsCount = isSanctuary ? 475 : isRaghunath ? 202 : 98;
          const priceRate = isSanctuary ? "₹29,999/SY" : isRaghunath ? "₹22,999/SY" : "On Request";
          const plotSizes = isSanctuary ? "202 – 750 SY" : isRaghunath ? "220 – 500 SY" : "Custom";
          const approvalBadge = isSanctuary ? "HMDA Approved" : isRaghunath ? "DTCP Approved" : "Approvals in progress";

          return (
            <div
              key={p.id}
              className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-6 shadow-xs transition-all hover:border-amber-300 hover:shadow-md"
            >
              <div>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="inline-block rounded-md bg-amber-50 px-2 py-0.5 text-[0.6875rem] font-bold tracking-wider uppercase text-[#946c0b] border border-amber-200">
                      {p.status.replace(/_/g, " ")}
                    </span>
                    <h2 className="mt-2.5 text-[1.2rem] font-serif font-bold text-slate-900 group-hover:text-[#946c0b] transition-colors">
                      {p.name}
                    </h2>
                  </div>

                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 border border-amber-200 text-lg shadow-2xs">
                    🏛️
                  </span>
                </div>

                <p className="mt-2 text-[0.8125rem] text-slate-500 line-clamp-2">
                  {p.location || "Hyderabad West Growth Corridor, Telangana"}
                </p>

                {/* Specs */}
                <div className="mt-5 grid grid-cols-3 gap-2 border-y border-slate-100 py-3.5 text-center bg-slate-50/50 rounded-lg">
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase text-slate-400">Total Extent</p>
                    <p className="mt-0.5 text-[0.875rem] font-bold text-slate-800">{acres}</p>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase text-slate-400">Plots / Sizes</p>
                    <p className="mt-0.5 text-[0.875rem] font-bold text-slate-800">{plotsCount} ({plotSizes})</p>
                  </div>
                  <div>
                    <p className="text-[0.6875rem] font-semibold uppercase text-slate-400">Price Rate</p>
                    <p className="mt-0.5 text-[0.875rem] font-bold text-[#946c0b]">{priceRate}</p>
                  </div>
                </div>

                {/* Feature Tags */}
                <div className="mt-4 flex flex-wrap gap-1.5">
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-[0.6875rem] font-medium text-slate-600 border border-slate-200">
                    100% Vaastu
                  </span>
                  <span className="rounded bg-slate-100 px-2.5 py-1 text-[0.6875rem] font-medium text-slate-600 border border-slate-200">
                    {approvalBadge}
                  </span>
                  <span className="rounded bg-emerald-50 px-2.5 py-1 text-[0.6875rem] font-bold text-emerald-700 border border-emerald-200">
                    {priceRate}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 flex items-center gap-2.5 pt-4 border-t border-slate-100">
                <Link
                  href="/inventory"
                  className="flex-1 rounded-lg bg-slate-900 px-3 py-2 text-center text-[0.75rem] font-semibold text-white transition-colors hover:bg-[#b88d23]"
                >
                  View Inventory
                </Link>
                <Link
                  href={`/leads?projectId=${p.id}`}
                  className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-center text-[0.75rem] font-semibold text-slate-700 transition-colors hover:bg-slate-50 hover:text-slate-900"
                >
                  Leads ({p.total_leads || 0})
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
