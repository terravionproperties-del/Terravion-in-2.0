import type { Metadata } from "next";
import Link from "next/link";
import { SANCTUARY_SHANKARPALLY } from "@/lib/data/sanctuary-shankarpally";
import { RAGHUNATH_COUNTY } from "@/lib/data/raghunath-county";
import { computeStats, formatINR } from "@/lib/engines/PlotEngine";
import { PLOT_STATUS_COLORS } from "@/lib/types/gis";
import type { Project } from "@/lib/types/gis";
import { buildPageMetadata } from "@/lib/seo";
import type { Locale } from "@/lib/i18n/config";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: Locale }>;
}): Promise<Metadata> {
  const { locale } = await params;
  return buildPageMetadata({
    title: "GIS Digital Twin — All Projects",
    description:
      "Explore every plot across Terravion projects in an interactive 3D digital twin — an indicative visualisation of the sanctioned layouts, with day/night and satellite views. Confirm availability with our team.",
    path: "/gis",
    locale,
  });
}

// All active projects registered here
const PROJECTS: Project[] = [
  SANCTUARY_SHANKARPALLY,
  RAGHUNATH_COUNTY,
];

// Accent colors per project for visual differentiation
const PROJECT_ACCENT: Record<string, string> = {
  sanctuary: "#fbbf24", // amber — premium gold
  "raghunath-county": "#34d399", // emerald — nature green
  shankarpally: "#38bdf8", // sky — modern blue
};

export default function GISIndexPage() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "radial-gradient(ellipse at 50% 0%, #0d1525 0%, #080810 60%)" }}
    >
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden pt-28 pb-16 px-6 text-center">
        {/* ambient glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(251,191,36,0.12) 0%, transparent 60%)" }}
        />

        <p className="relative text-[11px] font-black uppercase tracking-[0.4em] text-amber-400/70 mb-5 flex items-center justify-center gap-3">
          <span className="w-8 h-px bg-amber-400/30" />
          GIS Digital Twin Platform
          <span className="w-8 h-px bg-amber-400/30" />
        </p>

        <h1 className="relative text-4xl md:text-6xl lg:text-7xl font-black text-white leading-[1.05] mb-5">
          Every Plot.
          <br />
          <span
            style={{
              background: "linear-gradient(90deg, #fbbf24 0%, #f59e0b 50%, #fbbf24 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            In 3D.
          </span>
        </h1>

        <p className="relative max-w-xl mx-auto text-base text-white/40 leading-relaxed">
          Walk through the township, filter by facing, size and budget — before
          you visit the site. Plot availability is indicative; confirm it with
          our team.
        </p>

        {/* Platform stats */}
        <div className="relative flex flex-wrap justify-center gap-8 mt-10">
          {[
            { value: PROJECTS.reduce((s, p) => s + p.totalPlots, 0), label: "Total Plots" },
            { value: `${PROJECTS.reduce((s, p) => s + p.totalArea, 0)} Acres`, label: "Total Land" },
            { value: PROJECTS.length, label: "Projects" },
            { value: "LIVE", label: "Inventory" },
          ].map(({ value, label }) => (
            <div key={label} className="text-center">
              <p className="text-2xl font-black text-white">{value}</p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── PROJECT CARDS ─────────────────────────────────────────────────── */}
      <div className="max-w-6xl mx-auto px-6 pb-28">
        <div className="grid gap-6 md:grid-cols-2">
          {PROJECTS.map((project) => {
            const stats = computeStats(project.plots);
            const accent = PROJECT_ACCENT[project.slug] ?? "#fbbf24";
            const availPct  = Math.round((stats.available / stats.total) * 100);
            const bookedPct = Math.round((stats.booked   / stats.total) * 100);
            const soldPct   = Math.round((stats.sold     / stats.total) * 100);

            return (
              <Link
                key={project.id}
                href={`/gis/${project.slug}`}
                className="group block rounded-3xl overflow-hidden border transition-all duration-500 hover:-translate-y-1.5"
                style={{
                  background: "linear-gradient(135deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.01) 100%)",
                  borderColor: `${accent}22`,
                  boxShadow: `0 4px 60px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.04)`,
                }}
              >
                {/* ── THUMBNAIL ─────────────────────────────────────── */}
                <div
                  className="relative h-52 overflow-hidden"
                  style={{ background: `radial-gradient(ellipse at 30% 40%, ${accent}18, #080810)` }}
                >
                  {/* Mini plot grid — visual representation */}
                  <div
                    className="absolute inset-4 grid gap-0.5 opacity-75"
                    style={{ gridTemplateColumns: "repeat(20, 1fr)" }}
                  >
                    {project.plots.slice(0, 100).map((plot) => (
                      <div
                        key={plot.id}
                        className="rounded-sm"
                        style={{
                          background: PLOT_STATUS_COLORS[plot.status]?.fill ?? "#555",
                          opacity: plot.status === "SOLD" ? 0.35 : plot.status === "AVAILABLE" ? 0.9 : 0.7,
                          minHeight: "5px",
                        }}
                      />
                    ))}
                  </div>

                  {/* Gradient overlay */}
                  <div
                    className="absolute inset-0"
                    style={{ background: "linear-gradient(135deg, rgba(8,8,16,0.6) 0%, rgba(8,8,16,0.15) 50%, rgba(8,8,16,0.7) 100%)" }}
                  />

                  {/* Top-left badges */}
                  <div className="absolute top-4 left-4 flex gap-2 z-10">
                    {project.hmda && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                        style={{ background: "rgba(251,191,36,0.15)", border: "1px solid rgba(251,191,36,0.3)", color: "#fbbf24" }}
                      >
                        HMDA ✓
                      </span>
                    )}
                    {project.dtcpNumber && (
                      <span
                        className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider"
                        style={{ background: "rgba(34,197,94,0.12)", border: "1px solid rgba(34,197,94,0.3)", color: "#22c55e" }}
                      >
                        DTCP ✓
                      </span>
                    )}
                  </div>

                  {/* Top-right — 3D badge */}
                  <div className="absolute top-4 right-4 z-10">
                    <span
                      className="px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest"
                      style={{ background: `${accent}18`, border: `1px solid ${accent}40`, color: accent }}
                    >
                      3D TWIN
                    </span>
                  </div>

                  {/* Bottom overlay — project name */}
                  <div className="absolute bottom-0 left-0 right-0 p-5 z-10">
                    <p className="text-[10px] font-bold uppercase tracking-widest mb-0.5"
                       style={{ color: `${accent}90` }}>
                      {project.location}
                    </p>
                    <h2 className="text-2xl font-black text-white group-hover:text-amber-300 transition-colors">
                      {project.name}
                    </h2>
                  </div>
                </div>

                {/* ── BODY ──────────────────────────────────────────── */}
                <div className="p-6">
                  <p className="text-sm text-white/35 mb-5 leading-relaxed line-clamp-2">
                    {project.tagline}
                  </p>

                  {/* Inventory bar */}
                  <div className="mb-5">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-white/25">
                        Inventory
                      </p>
                      <p className="text-[10px] font-bold text-white/40">
                        {stats.total} plots · {project.totalArea} acres
                      </p>
                    </div>
                    <div className="flex h-1.5 rounded-full overflow-hidden gap-px">
                      <div className="bg-green-500 rounded-l-full transition-all" style={{ width: `${availPct}%` }} />
                      <div className="bg-orange-400 transition-all"              style={{ width: `${bookedPct}%` }} />
                      <div className="bg-red-500 rounded-r-full transition-all"  style={{ width: `${soldPct}%` }} />
                    </div>
                    <div className="flex gap-4 mt-2">
                      {[
                        { color: "#22c55e", count: stats.available, label: "Available" },
                        { color: "#f97316", count: stats.booked,    label: "Booked" },
                        { color: "#ef4444", count: stats.sold,      label: "Sold" },
                      ].map(({ color, count, label }) => (
                        <span key={label} className="flex items-center gap-1.5 text-[10px] text-white/35">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: color }} />
                          <strong className="text-white/60">{count}</strong> {label}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Stats grid */}
                  <div className="grid grid-cols-3 gap-3 mb-5">
                    {[
                      { label: "Avg Area", value: `${stats.avgAreaSqYards} SY` },
                      { label: "Corner Plots", value: String(stats.corner) },
                      { label: "Premium", value: String(stats.premium) },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl px-3 py-2.5 text-center"
                        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
                      >
                        <p className="text-[10px] text-white/25 uppercase tracking-wider">{label}</p>
                        <p className="text-sm font-black text-white mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>

                  {/* Price + CTA */}
                  <div className="flex items-center justify-between pt-4 border-t" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                    <div>
                      <p className="text-[10px] text-white/25 uppercase tracking-wider mb-0.5">Starting From</p>
                      <p className="text-xl font-black" style={{ color: accent }}>
                        ₹{project.pricePerSqYard.toLocaleString("en-IN")}<span className="text-sm font-bold opacity-70">/SY</span>
                      </p>
                      <p className="text-[10px] text-white/30 mt-0.5">
                        Total value {formatINR(stats.totalInventoryValue)}
                      </p>
                    </div>

                    <div
                      className="flex items-center gap-2 px-5 py-3 rounded-2xl font-bold text-sm transition-all duration-300 group-hover:scale-105"
                      style={{
                        background: `linear-gradient(135deg, ${accent}25, ${accent}10)`,
                        border: `1px solid ${accent}40`,
                        color: accent,
                      }}
                    >
                      Explore 3D
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                        <path d="M2 7h10M8 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* ── LEGEND + PLATFORM INFO ──────────────────────────────────────── */}
        <div className="mt-12 grid md:grid-cols-2 gap-6">
          {/* Legend */}
          <div
            className="rounded-2xl p-5 border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">Plot Status</p>
            <div className="flex flex-wrap gap-4">
              {(Object.entries(PLOT_STATUS_COLORS) as [string, { fill: string }][]).map(([s, { fill }]) => (
                <div key={s} className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-sm flex-shrink-0" style={{ background: fill }} />
                  <span className="text-xs text-white/40 font-semibold capitalize">{s.toLowerCase()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div
            className="rounded-2xl p-5 border"
            style={{ background: "rgba(255,255,255,0.02)", borderColor: "rgba(255,255,255,0.05)" }}
          >
            <p className="text-[10px] font-bold uppercase tracking-widest text-white/25 mb-4">How It Works</p>
            <div className="space-y-2">
              {[
                ["🖱️", "Click any plot to see full specs, price, EMI"],
                ["🔍", "Filter by facing, budget, road width"],
                ["☀️ 🌙", "Switch between day, sunset and night view"],
                ["📐", "Indicative visualisation — the sanctioned layout prevails"],
              ].map(([icon, text]) => (
                <div key={text} className="flex items-start gap-2.5 text-xs text-white/35">
                  <span className="flex-shrink-0">{icon}</span>
                  <span>{text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
