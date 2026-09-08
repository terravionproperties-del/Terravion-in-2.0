"use client";
/**
 * components/gis/GISDigitalTwin.tsx
 *
 * Terravion GIS Platform — Premium layout wrapper.
 * Toggles between:
 *   - 3D Isometric Three.js Scene (TownshipScene3D)
 *   - 2D Canvas top-down map    (TownshipMapCanvas)
 */

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import type { Project, Plot, PlotStatus, PlotFacing } from "@/lib/types/gis";
import { computeStats, formatINR } from "@/lib/engines/PlotEngine";

// Dynamic imports (no SSR for canvas/WebGL)
const TownshipScene3D   = dynamic(() => import("./TownshipScene3D"),   { ssr: false });
const TownshipMapCanvas = dynamic(() => import("./TownshipMapCanvas"), { ssr: false });
const RaghunathCountyMapCanvas = dynamic(() => import("./RaghunathCountyMapCanvas"), { ssr: false });

// ─── Colours ─────────────────────────────────────────────────────────────────
const STATUS_BG: Record<PlotStatus, string> = {
  AVAILABLE:  "rgba(224,65,91,0.15)",
  BOOKED:     "rgba(249,115,22,0.15)",
  SOLD:       "rgba(147,51,234,0.15)",
  RESERVED:   "rgba(37,99,235,0.15)",
  PREMIUM:    "rgba(202,138,4,0.15)",
  COMMERCIAL: "rgba(8,145,178,0.15)",
};
const STATUS_TEXT: Record<PlotStatus, string> = {
  AVAILABLE:  "#e0415b",
  BOOKED:     "#f97316",
  SOLD:       "#9333ea",
  RESERVED:   "#2563eb",
  PREMIUM:    "#ca8a04",
  COMMERCIAL: "#0891b2",
};
const STATUS_DOT: Record<PlotStatus, string> = {
  AVAILABLE:  "#e0415b",
  BOOKED:     "#f97316",
  SOLD:       "#9333ea",
  RESERVED:   "#2563eb",
  PREMIUM:    "#eab308",
  COMMERCIAL: "#06b6d4",
};

const ALL_STATUSES: PlotStatus[] = ["AVAILABLE","BOOKED","SOLD","RESERVED","PREMIUM","COMMERCIAL"];
const ALL_FACINGS: PlotFacing[]  = ["NORTH","SOUTH","EAST","WEST","NORTH_EAST","NORTH_WEST","SOUTH_EAST","SOUTH_WEST"];

// ─── Plot Detail Card ─────────────────────────────────────────────────────────
function PlotCard({ plot, onClose }: { plot: Plot; onClose: () => void }) {
  const emiEst = useMemo(() => {
    const principal = plot.totalPrice * 0.8;
    const r = 0.09 / 12;
    const n = 120;
    return Math.round((principal * r * Math.pow(1+r,n)) / (Math.pow(1+r,n)-1));
  }, [plot.totalPrice]);

  return (
    <div
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-40 w-[92vw] max-w-[500px] rounded-2xl overflow-hidden pointer-events-auto"
      style={{
        background: "rgba(6,8,16,0.97)",
        border: "1px solid rgba(255,255,255,0.1)",
        boxShadow: "0 32px 100px rgba(0,0,0,0.8), 0 0 0 1px rgba(251,191,36,0.08)",
        backdropFilter: "blur(24px)",
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3.5"
        style={{ background: "rgba(255,255,255,0.025)", borderBottom: "1px solid rgba(255,255,255,0.07)" }}
      >
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-2xl font-black text-white">Plot {plot.plotNumber}</span>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
            style={{ background: STATUS_BG[plot.status], color: STATUS_TEXT[plot.status], border: `1px solid ${STATUS_TEXT[plot.status]}44` }}>
            {plot.status}
          </span>
          {plot.isCorner && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-amber-400 bg-amber-400/10 border border-amber-400/30">⬛ CORNER</span>
          )}
          {plot.isPremium && (
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase text-yellow-300 bg-yellow-300/10 border border-yellow-300/30">★ PREMIUM</span>
          )}
        </div>
        <button onClick={onClose}
          className="w-7 h-7 rounded-full flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all text-lg font-black">
          ×
        </button>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-px" style={{ background: "rgba(255,255,255,0.05)" }}>
        {[
          { label: "AREA",       value: `${plot.dimension.areaSqYards} sq.yds` },
          { label: "SIZE",       value: `${plot.dimension.breadth}′ × ${plot.dimension.length}′` },
          { label: "FACING",     value: plot.facing.replace(/_/g," ") },
          { label: "ROAD WIDTH", value: `${plot.roadWidth}′` },
          { label: "RATE",       value: `₹${(plot.price/1000).toFixed(0)}K/SY` },
          { label: "TOTAL",      value: formatINR(plot.totalPrice) },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center justify-center py-3 px-2 text-center"
            style={{ background: "rgba(6,8,16,0.9)" }}>
            <p className="text-[8px] font-black uppercase tracking-widest text-white/20 mb-1">{label}</p>
            <p className="text-sm font-black text-white leading-tight">{value}</p>
          </div>
        ))}
      </div>

      {/* EMI + flags */}
      <div className="px-5 py-3.5 flex items-center justify-between gap-3">
        <div>
          <p className="text-[9px] text-white/25 uppercase tracking-wider">Est. EMI (80% · 9% · 10yr)</p>
          <p className="text-xl font-black text-amber-400">
            ₹{emiEst.toLocaleString("en-IN")}
            <span className="text-xs font-normal text-white/30">/mo</span>
          </p>
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {plot.isParkFacing      && <span className="px-2 py-1 rounded-lg text-[9px] font-bold text-green-400 bg-green-400/10 border border-green-400/20">🌿 Park View</span>}
          {plot.isClubhouseFacing && <span className="px-2 py-1 rounded-lg text-[9px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20">🏛️ Clubhouse View</span>}
          {plot.isMainRoadFacing  && <span className="px-2 py-1 rounded-lg text-[9px] font-bold text-blue-400 bg-blue-400/10 border border-blue-400/20">🛣️ Main Road</span>}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
export function GISDigitalTwin({ project }: { project: Project }) {
  const [selectedPlot, setSelectedPlot] = useState<Plot | null>(null);
  const [filterStatus, setFilterStatus] = useState<Set<PlotStatus>>(new Set());
  const [filterFacing, setFilterFacing] = useState<Set<PlotFacing>>(new Set());
  const [showFilters, setShowFilters]   = useState(false);
  const [viewMode, setViewMode]         = useState<"3D" | "2D">("3D");
  const [plotOverrides, setPlotOverrides] = useState<
    Record<
      string,
      {
        status?: PlotStatus;
        facing?: PlotFacing;
        areaSqYards?: number;
        pricePerSqYard?: number;
        totalPrice?: number;
        remarks?: string;
      }
    >
  >({});

  useEffect(() => {
    let isCancelled = false;
    async function fetchOverrides() {
      try {
        const res = await fetch(`/api/gis/overrides?project=${project.slug}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.overrides && !isCancelled) {
          setPlotOverrides(data.overrides);
        }
      } catch (err) {
        console.error("Failed to load GIS overrides", err);
      }
    }
    fetchOverrides();
    return () => {
      isCancelled = true;
    };
  }, [project.slug]);

  const activeProject = useMemo<Project>(() => {
    if (!plotOverrides || Object.keys(plotOverrides).length === 0) return project;
    return {
      ...project,
      plots: project.plots.map((p) => {
        const override = plotOverrides[p.plotNumber] || plotOverrides[p.id];
        if (!override) return p;
        return {
          ...p,
          status: (override.status as PlotStatus) || p.status,
          facing: (override.facing as PlotFacing) || p.facing,
          dimension: {
            ...p.dimension,
            areaSqYards: override.areaSqYards ?? p.dimension.areaSqYards,
          },
          price: override.pricePerSqYard ?? p.price,
          totalPrice: override.totalPrice ?? p.totalPrice,
          notes: override.remarks ?? p.notes,
        };
      }),
    };
  }, [project, plotOverrides]);

  const stats = useMemo(() => computeStats(activeProject.plots), [activeProject.plots]);

  const filterFn = useCallback((p: Plot): boolean => {
    if (filterStatus.size > 0 && !filterStatus.has(p.status)) return false;
    if (filterFacing.size > 0 && !filterFacing.has(p.facing))  return false;
    return true;
  }, [filterStatus, filterFacing]);

  const filteredCount = useMemo(() => activeProject.plots.filter(filterFn).length, [activeProject.plots, filterFn]);

  const toggleStatus = (s: PlotStatus) => {
    setFilterStatus((prev) => { const n = new Set(prev); n.has(s) ? n.delete(s) : n.add(s); return n; });
  };
  const toggleFacing = (f: PlotFacing) => {
    setFilterFacing((prev) => { const n = new Set(prev); n.has(f) ? n.delete(f) : n.add(f); return n; });
  };
  const clearFilters = () => { setFilterStatus(new Set()); setFilterFacing(new Set()); };

  const statusCounts: Partial<Record<PlotStatus, number>> = {
    AVAILABLE: stats.available,
    BOOKED:    stats.booked,
    SOLD:      stats.sold,
    RESERVED:  stats.reserved,
    PREMIUM:   stats.premium,
  };

  return (
    <div className="w-screen h-screen overflow-hidden flex flex-col" style={{ background: "#0b0d14" }}>

      {/* ══ TOP BAR ═══════════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center justify-between gap-4 px-4 py-2.5 border-b flex-wrap z-30"
        style={{
          background: "rgba(10,13,20,0.98)",
          borderColor: "rgba(255,255,255,0.1)",
          backdropFilter: "blur(20px)",
          minHeight: 56,
        }}
      >
        {/* Left: Official Logo + Project Details */}
        <div className="flex items-center gap-3.5 flex-shrink-0">
          <Link href="/gis" className="group flex items-center gap-2.5">
            <div className="relative h-8 w-28 overflow-hidden">
              <img
                src="/terravion-logo.jpeg"
                alt="Terravion Properties"
                className="h-full w-full object-contain filter drop-shadow-sm"
              />
            </div>
            <span className="rounded bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-400/40">
              3D GIS
            </span>
          </Link>

          <div className="h-5 w-px bg-white/10 hidden sm:block" />

          <div className="hidden sm:block">
            <p className="text-sm font-bold text-white leading-tight flex items-center gap-2">
              <span>{project.name}</span>
              {project.hmda && (
                <span className="text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/30">
                  HMDA ✓
                </span>
              )}
            </p>
          </div>
        </div>

        {/* Center: Prominent 3D / 2D Mode Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl overflow-hidden border border-amber-400/50 bg-black/80 p-1 shadow-lg">
            <button
              onClick={() => setViewMode("3D")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "3D"
                  ? "bg-gradient-to-r from-[#c59b27] to-[#e5be58] text-black shadow-md font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>🧊</span>
              <span>3D Digital Twin</span>
            </button>
            <button
              onClick={() => setViewMode("2D")}
              className={`flex items-center gap-1.5 px-4 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                viewMode === "2D"
                  ? "bg-gradient-to-r from-[#c59b27] to-[#e5be58] text-black shadow-md font-black"
                  : "text-white/60 hover:text-white hover:bg-white/5"
              }`}
            >
              <span>🗺️</span>
              <span>2D Master Map</span>
            </button>
          </div>
        </div>

        {/* Right: Status Pills, Filter & Exit Link */}
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Status Pills */}
          <div className="hidden xl:flex items-center gap-1.5">
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer"
              style={{
                background: filterStatus.size === 0 ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.04)",
                borderColor: "rgba(255,255,255,0.2)",
                color: "#fff",
              }}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-white" />
              All ({stats.total})
            </button>

            {(Object.entries(statusCounts) as [PlotStatus, number][])
              .filter(([, c]) => c > 0)
              .map(([s, count]) => (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer"
                  style={{
                    background: filterStatus.has(s) ? STATUS_BG[s] : "rgba(255,255,255,0.04)",
                    borderColor: filterStatus.has(s) ? STATUS_TEXT[s] + "88" : "rgba(255,255,255,0.1)",
                    color: filterStatus.has(s) ? STATUS_TEXT[s] : "rgba(255,255,255,0.6)",
                  }}
                >
                  <span className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_DOT[s] }} />
                  {s[0] + s.slice(1).toLowerCase()} ({count})
                </button>
              ))}
          </div>

          {/* Filter Toggle */}
          <button
            onClick={() => setShowFilters((f) => !f)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer"
            style={{
              background: showFilters ? "rgba(251,191,36,0.2)" : "rgba(255,255,255,0.05)",
              borderColor: showFilters ? "rgba(251,191,36,0.5)" : "rgba(255,255,255,0.15)",
              color: showFilters ? "#fbbf24" : "rgba(255,255,255,0.7)",
            }}
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 3h10M3 6h6M5 9h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <span>Facing Filter</span>
          </button>

          {/* Back to Project / Site Link */}
          <Link
            href={`/projects/${project.slug === "shankarpally" ? "sanctuary" : project.slug}`}
            className="flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/15 px-3 py-1.5 text-xs font-bold text-white border border-white/15 transition-all"
          >
            <span>← Project Info</span>
          </Link>
        </div>
      </div>

      {/* ══ FACING FILTER ═════════════════════════════════════════════════════ */}
      {showFilters && (
        <div className="flex-shrink-0 flex items-center gap-2 px-4 py-2 flex-wrap border-b"
          style={{ background: "rgba(6,8,16,0.9)", borderColor: "rgba(255,255,255,0.05)" }}>
          <p className="text-[9px] font-black text-white/25 uppercase tracking-widest mr-1">Facing:</p>
          {ALL_FACINGS.map((f) => (
            <button key={f} onClick={() => toggleFacing(f)}
              className="px-2.5 py-1 rounded-full text-[9px] font-black border transition-all"
              style={{
                background: filterFacing.has(f) ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.04)",
                borderColor: filterFacing.has(f) ? "#3b82f6" : "rgba(255,255,255,0.1)",
                color: filterFacing.has(f) ? "#93c5fd" : "rgba(255,255,255,0.4)",
              }}>
              {f.replace(/_/g," ")}
            </button>
          ))}
        </div>
      )}

      {/* ══ MAP VIEWPORT ══════════════════════════════════════════════════════ */}
      <div className="flex-1 relative overflow-hidden">

        {/* 3D or 2D renderer */}
        {viewMode === "3D" ? (
          <TownshipScene3D
            project={activeProject}
            onPlotSelect={setSelectedPlot}
            selectedPlot={selectedPlot}
            filterFn={filterFn}
          />
        ) : (project.slug === "raghunath-county" || project.slug === "raghunath") ? (
          <RaghunathCountyMapCanvas
            project={activeProject}
            onPlotSelect={setSelectedPlot}
            selectedPlot={selectedPlot}
            filterFn={filterFn}
          />
        ) : (
          <TownshipMapCanvas
            project={activeProject}
            onPlotSelect={setSelectedPlot}
            selectedPlot={selectedPlot}
            filterFn={filterFn}
          />
        )}

        {/* Status legend (bottom-left) */}
        <div
          className="absolute bottom-4 left-3 z-30 rounded-2xl px-3 py-2.5 pointer-events-none"
          style={{ background: "rgba(6,8,16,0.85)", border: "1px solid rgba(255,255,255,0.08)", backdropFilter: "blur(12px)" }}
        >
          <p className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-2">Plot Status</p>
          {(Object.entries(STATUS_DOT) as [PlotStatus, string][]).map(([s, color]) => (
            <div key={s} className="flex items-center gap-2 mb-1">
              <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: color }} />
              <span className="text-[9px] font-semibold text-white/45 capitalize">{s.toLowerCase()}</span>
            </div>
          ))}
        </div>

        {/* Amenity legend (top-left, hidden when plot selected) */}
        {!selectedPlot && viewMode === "2D" && (
          <div
            className="absolute top-3 left-3 z-20 rounded-xl px-3 py-2.5 pointer-events-none"
            style={{ background: "rgba(6,8,16,0.82)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(12px)" }}
          >
            <p className="text-[7px] font-black uppercase tracking-widest text-white/20 mb-2">Amenities</p>
            {[
              { icon: "🏛️", label: "Club House" },
              { icon: "🏊", label: "Swimming Pool" },
              { icon: "🌳", label: "Central Park" },
              { icon: "🎾", label: "Sports Courts" },
              { icon: "🎡", label: "Children's Play" },
              { icon: "🎭", label: "Amphitheater" },
            ].map(({ icon, label }) => (
              <div key={label} className="flex items-center gap-2 mb-1">
                <span className="text-xs">{icon}</span>
                <span className="text-[9px] font-semibold text-white/50">{label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Plot detail card */}
        {selectedPlot && (
          <PlotCard
            plot={activeProject.plots.find((p) => p.id === selectedPlot.id || p.plotNumber === selectedPlot.plotNumber) || selectedPlot}
            onClose={() => setSelectedPlot(null)}
          />
        )}
      </div>

      {/* ══ BOTTOM INFO BAR ════════════════════════════════════════════════════ */}
      <div
        className="flex-shrink-0 flex items-center gap-5 px-4 py-2 overflow-x-auto border-t"
        style={{ background: "rgba(6,8,16,0.95)", borderColor: "rgba(255,255,255,0.07)" }}
      >
        {[
          { label: "Location",  value: project.location },
          { label: "Total Area",value: `${project.totalArea} Acres` },
          { label: "Approval",  value: project.hmda ? "HMDA ✓" : "DTCP ✓" },
          { label: "Price From",value: `₹${project.pricePerSqYard.toLocaleString("en-IN")}/SY` },
          { label: "Available", value: String(stats.available) },
          { label: "Booked",    value: String(stats.booked) },
          { label: "Sold",      value: String(stats.sold) },
        ].map(({ label, value }) => (
          <div key={label} className="flex-shrink-0 text-center">
            <p className="text-[7px] font-black uppercase tracking-widest text-white/18">{label}</p>
            <p className="text-[10px] font-black text-white/60">{value}</p>
          </div>
        ))}
        <div className="ml-auto flex-shrink-0 flex gap-2">
          <Link href="/gis"
            className="px-3 py-1 rounded-lg text-[10px] font-bold text-amber-400 bg-amber-400/10 border border-amber-400/20 hover:bg-amber-400/20 transition-all">
            ← All Projects
          </Link>
        </div>
      </div>
    </div>
  );
}
