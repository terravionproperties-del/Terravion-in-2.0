/**
 * app/[locale]/admin/page.tsx
 * Admin dashboard — overview stats, quick actions, recent activity.
 */

import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { computeStats, formatINR } from "@/lib/engines/PlotEngine";
import { PLOT_STATUS_COLORS } from "@/lib/types/gis";
import Link from "next/link";

export default function AdminDashboardPage() {
  const project = TERRAVION_SHANKARPALLY;
  const stats = computeStats(project.plots);

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-8 py-8">
        <p className="text-xs font-bold uppercase tracking-widest text-amber-400 mb-2">Admin Dashboard</p>
        <h1 className="text-3xl font-black text-white">Good morning. 👋</h1>
        <p className="text-white/40 mt-1 text-sm">Here&apos;s what&apos;s happening with Terravion Shankarpally today.</p>
      </div>

      <div className="px-8 pb-12 space-y-8">
        {/* Key stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: "Total Plots", value: stats.total, color: "#e2e8f0", icon: "📊", bg: "#e2e8f020" },
            { label: "Available", value: stats.available, color: "#22c55e", icon: "✅", bg: "#22c55e20" },
            { label: "Booked", value: stats.booked, color: "#f97316", icon: "📋", bg: "#f9731620" },
            { label: "Sold", value: stats.sold, color: "#ef4444", icon: "🏷️", bg: "#ef444420" },
            { label: "Revenue", value: formatINR(stats.soldValue), color: "#60a5fa", icon: "💰", bg: "#60a5fa20" },
            { label: "Inventory Value", value: formatINR(stats.totalInventoryValue), color: "#fbbf24", icon: "🏦", bg: "#fbbf2420" },
            { label: "Avg Price/SY", value: `₹${stats.avgPricePerSqYard.toLocaleString("en-IN")}`, color: "#a78bfa", icon: "📐", bg: "#a78bfa20" },
            { label: "Corner Plots", value: stats.corner, color: "#7dd3fc", icon: "🔷", bg: "#7dd3fc20" },
          ].map(({ label, value, color, icon, bg }) => (
            <div
              key={label}
              className="rounded-2xl p-5 border"
              style={{ background: bg, borderColor: `${color}25` }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">{icon}</span>
                <span className="text-xs font-bold uppercase tracking-widest text-white/30">{label}</span>
              </div>
              <p className="text-2xl font-black" style={{ color }}>{value}</p>
            </div>
          ))}
        </div>

        {/* Inventory bar */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Inventory Breakdown</p>
          <div className="flex h-4 rounded-full overflow-hidden gap-0.5 mb-4">
            {[
              { status: "AVAILABLE", count: stats.available },
              { status: "BOOKED", count: stats.booked },
              { status: "SOLD", count: stats.sold },
              { status: "RESERVED", count: stats.reserved },
              { status: "PREMIUM", count: stats.premium },
              { status: "COMMERCIAL", count: stats.commercial },
            ].map(({ status, count }) => {
              const pct = (count / stats.total) * 100;
              const color = PLOT_STATUS_COLORS[status as keyof typeof PLOT_STATUS_COLORS]?.fill ?? "#666";
              return pct > 0 ? (
                <div key={status} style={{ width: `${pct}%`, background: color }} title={`${status}: ${count}`} />
              ) : null;
            })}
          </div>
          <div className="flex flex-wrap gap-4">
            {[
              { status: "AVAILABLE", count: stats.available },
              { status: "BOOKED", count: stats.booked },
              { status: "SOLD", count: stats.sold },
              { status: "RESERVED", count: stats.reserved },
              { status: "PREMIUM", count: stats.premium },
            ].map(({ status, count }) => {
              const color = PLOT_STATUS_COLORS[status as keyof typeof PLOT_STATUS_COLORS]?.fill ?? "#666";
              const pct = Math.round((count / stats.total) * 100);
              return (
                <div key={status} className="flex items-center gap-2 text-xs">
                  <div className="w-2.5 h-2.5 rounded-sm" style={{ background: color }} />
                  <span style={{ color }}>{status}</span>
                  <span className="text-white/30">{count} ({pct}%)</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div>
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Quick Actions</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {[
              { label: "Manage Inventory", href: "/admin/projects/shankarpally/plots", icon: "📋", color: "#f97316" },
              { label: "View 3D Twin", href: "/gis/shankarpally", icon: "🗺️", color: "#60a5fa" },
              { label: "Construction Updates", href: "/admin/projects/shankarpally", icon: "🏗️", color: "#22c55e" },
              { label: "View Leads", href: "/admin/leads", icon: "👥", color: "#a855f7" },
            ].map(({ label, href, icon, color }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-semibold transition-all hover:-translate-y-0.5"
                style={{
                  background: `${color}10`,
                  borderColor: `${color}25`,
                  color,
                }}
              >
                <span className="text-lg">{icon}</span>
                {label}
              </Link>
            ))}
          </div>
        </div>

        {/* Construction progress */}
        <div
          className="rounded-2xl p-6 border"
          style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.06)" }}
        >
          <p className="text-xs font-bold uppercase tracking-widest text-white/30 mb-4">Construction Progress</p>
          <div className="space-y-4">
            {project.constructionUpdates.map((update) => (
              <div key={update.id}>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <p className="text-sm font-semibold text-white">{update.title}</p>
                    <p className="text-xs text-white/30">{update.month}</p>
                  </div>
                  <span className="text-sm font-black text-amber-400">{update.progressPercent}%</span>
                </div>
                <div className="h-1.5 rounded-full bg-white/5">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${update.progressPercent}%`,
                      background: "linear-gradient(90deg, #fbbf24, #f59e0b)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
