"use client";
/**
 * crm/app/(app)/inventory/page.tsx
 * GIS Inventory Manager — Pure Luxury White Theme.
 * ADMIN / SALES_MANAGER / FINANCE can change plot status, price, assign owner.
 */

import { useState, useCallback, useMemo } from "react";
import { TERRAVION_SHANKARPALLY } from "@/lib/terravion-shankarpally";
import { SANCTUARY_SHANKARPALLY } from "@/lib/sanctuary-shankarpally";
import type { Plot, PlotStatus, Project } from "@/lib/gis-types";
import { PLOT_STATUS_COLORS } from "@/lib/gis-types";
import { computeStats, formatINR, sortPlots } from "@/lib/PlotEngine";

const ALL_STATUSES: PlotStatus[] = ["AVAILABLE", "BOOKED", "SOLD", "RESERVED", "PREMIUM", "COMMERCIAL"];

const STATUS_LIGHT_STYLES: Record<PlotStatus, { bg: string; border: string; text: string; dot: string }> = {
  AVAILABLE: { bg: "bg-emerald-50", border: "border-emerald-200", text: "text-emerald-700", dot: "bg-emerald-500" },
  BOOKED: { bg: "bg-orange-50", border: "border-orange-200", text: "text-orange-700", dot: "bg-orange-500" },
  SOLD: { bg: "bg-rose-50", border: "border-rose-200", text: "text-rose-700", dot: "bg-rose-500" },
  RESERVED: { bg: "bg-purple-50", border: "border-purple-200", text: "text-purple-700", dot: "bg-purple-500" },
  PREMIUM: { bg: "bg-amber-50", border: "border-amber-200", text: "text-amber-700", dot: "bg-amber-500" },
  COMMERCIAL: { bg: "bg-blue-50", border: "border-blue-200", text: "text-blue-700", dot: "bg-blue-500" },
};

const PROJECTS: { label: string; key: string; data: Project }[] = [
  { label: "Sanctuary — Shankarpally", key: "sanctuary", data: SANCTUARY_SHANKARPALLY as unknown as Project },
  { label: "Terravion — Shankarpally", key: "shankarpally", data: TERRAVION_SHANKARPALLY as unknown as Project },
];

type SortKey = "number" | "price_asc" | "price_desc" | "area_asc" | "area_desc";
type ViewMode = "grid" | "table";


export default function InventoryPage() {
  const [activeProjectKey, setActiveProjectKey] = useState<string>("sanctuary");
  const activeProject = PROJECTS.find((p) => p.key === activeProjectKey)!;
  const [plots, setPlots] = useState<Plot[]>(activeProject.data.plots);
  const [filterStatus, setFilterStatus] = useState<PlotStatus | "ALL">("ALL");
  const [filterFacing, setFilterFacing] = useState<string>("ALL");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("number");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [saving, setSaving] = useState<string | null>(null);

  const [editPlot, setEditPlot] = useState<Plot | null>(null);

  const stats = useMemo(() => computeStats(plots), [plots]);

  const displayed = useMemo(() => {
    let result = plots;
    if (filterStatus !== "ALL") result = result.filter((p) => p.status === filterStatus);
    if (filterFacing !== "ALL") result = result.filter((p) => p.facing === filterFacing);
    if (searchQ.trim()) {
      const q = searchQ.toLowerCase();
      result = result.filter(
        (p) =>
          p.plotNumber.toLowerCase().includes(q) ||
          p.ownerName?.toLowerCase().includes(q) ||
          p.facing.toLowerCase().includes(q)
      );
    }
    return sortPlots(result, sortBy);
  }, [plots, filterStatus, filterFacing, searchQ, sortBy]);

  /**
   * Session-local only.
   *
   * This used to PATCH the marketing site's `/api/gis/plots/:id` using a token
   * read from `NEXT_PUBLIC_GIS_ADMIN_TOKEN` — a value Next inlines into the
   * browser bundle, so the "secret" authorising inventory writes was readable
   * by anyone who opened devtools, and it fell back to a hardcoded default
   * when unset. Both the endpoint and the token have been removed: the GIS
   * surface is a canvas/3D visualisation, not a system of record.
   *
   * When inventory truly needs to persist, it should write to this CRM's own
   * authenticated API (NextAuth session, server-side), never to the public
   * site with a shipped bearer token.
   */
  const patchPlot = useCallback((plotId: string, payload: Partial<Plot>) => {
    setSaving(plotId);
    setPlots((prev) => prev.map((p) => (p.id === plotId ? { ...p, ...payload } : p)));
    if (editPlot?.id === plotId) {
      setEditPlot((prev) => (prev ? { ...prev, ...payload } : null));
    }
    setSaving(null);
  }, [editPlot]);

  const facings = useMemo(() => ["ALL", ...new Set(plots.map((p) => p.facing))], [plots]);

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── PAGE HEADER (White) ────────────────────────────────────────── */}
      <div className="flex-shrink-0 px-8 py-4 bg-white border-b border-slate-200 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-xs font-serif font-black bg-gradient-to-br from-[#c59b27] to-[#a67c1e] text-white shadow-sm">
            GIS
          </div>
          <div>
            <h1 className="text-[1.25rem] font-serif font-bold text-slate-900 tracking-tight">
              Plot Inventory Management
            </h1>
            <p className="text-slate-500 text-xs font-medium">
              {activeProject.label} · {activeProject.data.totalPlots} Total Master Plan Plots
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          {/* Project switcher */}
          <select
            value={activeProjectKey}
            onChange={(e) => {
              const key = e.target.value;
              setActiveProjectKey(key);
              const proj = PROJECTS.find((p) => p.key === key)!;
              setPlots(proj.data.plots);
              setFilterStatus("ALL");
              setFilterFacing("ALL");
              setSearchQ("");
            }}
            className="px-3.5 py-2 rounded-lg text-xs font-bold text-[#946c0b] bg-amber-50 border border-amber-200 outline-none cursor-pointer"
          >
            {PROJECTS.map((p) => (
              <option key={p.key} value={p.key}>{p.label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="relative">
            <input
              type="text"
              placeholder="Search plot#, owner..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg text-xs text-slate-900 placeholder-slate-400 bg-white border border-slate-300 outline-none w-48 focus:border-[#b88d23]"
            />
            <svg className="absolute left-2.5 top-2.5 text-slate-400" width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 outline-none cursor-pointer"
          >
            <option value="number">Plot #</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="area_asc">Area ↑</option>
            <option value="area_desc">Area ↓</option>
          </select>

          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white">
            {(["grid", "table"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-bold capitalize transition-all ${
                  viewMode === v
                    ? "bg-[#b88d23] text-white"
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Open live 3D */}
          <a
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"}/gis/${activeProjectKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#c59b27] to-[#a67c1e] text-white shadow-xs hover:brightness-105 transition-all"
          >
            🗺️ View 3D Live Map
          </a>
        </div>
      </div>

      {/* ── STATS BAR (White Tiles) ───────────────────────────────────────── */}
      <div className="flex-shrink-0 flex gap-0 bg-white border-b border-slate-200 overflow-x-auto scrollbar-none">
        {[
          { label: "Total", value: stats.total, color: "#1e293b", bg: "#ffffff" },
          { label: "Available", value: stats.available, color: "#16a34a", bg: "#f0fdf4" },
          { label: "Booked", value: stats.booked, color: "#ea580c", bg: "#fff7ed" },
          { label: "Sold", value: stats.sold, color: "#dc2626", bg: "#fef2f2" },
          { label: "Reserved", value: stats.reserved, color: "#9333ea", bg: "#faf5ff" },
          { label: "Premium", value: stats.premium, color: "#b45309", bg: "#fffbeb" },
          { label: "Corner", value: stats.corner, color: "#2563eb", bg: "#eff6ff" },
          { label: "Revenue", value: formatINR(stats.soldValue), color: "#16a34a", bg: "#ffffff" },
          { label: "Inventory Value", value: formatINR(stats.totalInventoryValue), color: "#946c0b", bg: "#ffffff" },
        ].map(({ label, value, color, bg }) => (
          <div
            key={label}
            className="flex-shrink-0 px-6 py-3 border-r border-slate-200"
            style={{ backgroundColor: bg }}
          >
            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">{label}</p>
            <p className="text-base font-bold mt-0.5" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-8 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold flex-shrink-0 mr-1">Status:</span>
        {["ALL", ...ALL_STATUSES].map((s) => {
          const active = filterStatus === s;
          const count = s === "ALL" ? plots.length : plots.filter((p) => p.status === s).length;
          const style = s === "ALL"
            ? (active ? "bg-slate-900 text-white border-slate-900 font-bold" : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100")
            : (active ? `${STATUS_LIGHT_STYLES[s as PlotStatus].bg} ${STATUS_LIGHT_STYLES[s as PlotStatus].text} ${STATUS_LIGHT_STYLES[s as PlotStatus].border} font-bold shadow-xs` : `bg-white ${STATUS_LIGHT_STYLES[s as PlotStatus].text} border-slate-200 hover:bg-slate-100`);

          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s as PlotStatus | "ALL")}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border transition-all ${style}`}
            >
              {s !== "ALL" && (
                <span className={`w-2 h-2 rounded-full ${STATUS_LIGHT_STYLES[s as PlotStatus].dot}`} />
              )}
              <span>{s}</span>
              <span className="text-slate-400 font-normal">({count})</span>
            </button>
          );
        })}

        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold flex-shrink-0 ml-4 mr-1">Facing:</span>
        {facings.map((f) => (
          <button
            key={f}
            onClick={() => setFilterFacing(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] border transition-all ${
              filterFacing === f
                ? "bg-[#b88d23] text-white border-[#b88d23] font-bold shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs font-semibold text-slate-500 ml-auto flex-shrink-0">{displayed.length} plots shown</span>
      </div>

      {/* ── CONTENT (Pure White Grid & Cards) ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === "grid" ? (
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
          >
            {displayed.map((plot) => {
              const statusStyle = STATUS_LIGHT_STYLES[plot.status] ?? STATUS_LIGHT_STYLES.AVAILABLE;
              const isSaving = saving === plot.id;
              return (
                <div
                  key={plot.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3 transition-all hover:border-amber-300 hover:shadow-md cursor-pointer"
                  onClick={() => setEditPlot(plot)}
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-serif font-black text-xl">#{plot.plotNumber}</span>
                        {plot.isCorner && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold border border-blue-200">Corner</span>
                        )}
                        {plot.isPremium && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">Premium</span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium mt-1">
                      {plot.facing} · {plot.dimension.areaSqYards} Sq. Yds · {plot.roadWidth}ft Road
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-[0.9375rem] font-bold text-emerald-600">{formatINR(plot.totalPrice)}</p>
                    <p className="text-[10px] text-slate-400 font-medium">₹{plot.price.toLocaleString("en-IN")}/sq.yd</p>
                  </div>

                  {/* Status dropdown */}
                  <div className="relative pt-1 border-t border-slate-100">
                    <select
                      value={plot.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => { e.stopPropagation(); patchPlot(plot.id, { status: e.target.value as PlotStatus }); }}
                      disabled={isSaving}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900 font-medium">{s}</option>
                      ))}
                    </select>
                    {isSaving && (
                      <div className="absolute right-2 top-3 w-3 h-3 border border-slate-400 border-t-transparent rounded-full animate-spin" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          /* TABLE VIEW */
          <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-left bg-slate-50 border-b border-slate-200">
                  {["Plot#", "Area (SY)", "Facing", "Road Width", "Total Price", "Status", "Owner", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((plot) => {
                  const statusStyle = STATUS_LIGHT_STYLES[plot.status] ?? STATUS_LIGHT_STYLES.AVAILABLE;
                  const isSaving = saving === plot.id;
                  return (
                    <tr
                      key={plot.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => setEditPlot(plot)}
                    >
                      <td className="px-4 py-3 font-bold text-slate-900">
                        #{plot.plotNumber}
                        {plot.isCorner && <span className="ml-1 text-[9px] text-blue-600 font-bold">(C)</span>}
                        {plot.isPremium && <span className="ml-1 text-[9px] text-amber-600 font-bold">(P)</span>}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600">{plot.dimension.areaSqYards}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{plot.facing}</td>
                      <td className="px-4 py-3 font-medium text-slate-600">{plot.roadWidth}ft</td>
                      <td className="px-4 py-3 font-bold text-emerald-600">{formatINR(plot.totalPrice)}</td>
                      <td className="px-4 py-3">
                        <select
                          value={plot.status}
                          onClick={(e) => e.stopPropagation()}
                          onChange={(e) => { e.stopPropagation(); patchPlot(plot.id, { status: e.target.value as PlotStatus }); }}
                          disabled={isSaving}
                          className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-slate-900">{s}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{plot.ownerName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditPlot(plot); }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-[#946c0b] transition-colors"
                        >
                          Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── EDIT DRAWER (White Luxury Slide-Over) ─────────────────────────── */}
      {editPlot && (
        <>
          <div className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-2xs" onClick={() => setEditPlot(null)} />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <p className="text-slate-900 font-serif font-bold text-xl">Plot #{editPlot.plotNumber}</p>
                <p className="text-slate-500 text-xs font-medium">{editPlot.facing} · {editPlot.dimension.areaSqYards} Sq. Yards</p>
              </div>
              <button onClick={() => setEditPlot(null)} className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-lg">✕</button>
            </div>

            <div className="p-6 space-y-4 flex-1">
              {/* Status */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Status</label>
                <select
                  value={editPlot.status}
                  onChange={(e) => { patchPlot(editPlot.id, { status: e.target.value as PlotStatus }); setEditPlot((p) => p ? { ...p, status: e.target.value as PlotStatus } : p); }}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-bold border border-slate-300 bg-white text-slate-900 outline-none"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              {/* Price */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Price per Sq Yard (₹)</label>
                <input
                  type="number"
                  defaultValue={editPlot.price}
                  onBlur={(e) => { const v = parseInt(e.target.value); if (v > 0) patchPlot(editPlot.id, { price: v }); }}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23]"
                />
                <p className="text-xs font-bold text-emerald-600 mt-1">Total: {formatINR(editPlot.totalPrice)}</p>
              </div>

              {/* Owner name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Buyer / Owner Name</label>
                <input
                  type="text"
                  defaultValue={editPlot.ownerName ?? ""}
                  onBlur={(e) => patchPlot(editPlot.id, { ownerName: e.target.value })}
                  placeholder="e.g. S. Venkatesh"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23]"
                />
              </div>

              {/* Sales executive */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Assigned Sales Executive</label>
                <input
                  type="text"
                  defaultValue={editPlot.salesExecutive ?? ""}
                  onBlur={(e) => patchPlot(editPlot.id, { salesExecutive: e.target.value })}
                  placeholder="Assign executive"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23]"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Customer Phone</label>
                <input
                  type="tel"
                  defaultValue={editPlot.customerPhone ?? ""}
                  onBlur={(e) => patchPlot(editPlot.id, { customerPhone: e.target.value })}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23]"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">Plot Notes</label>
                <textarea
                  rows={3}
                  defaultValue={editPlot.notes ?? ""}
                  onBlur={(e) => patchPlot(editPlot.id, { notes: e.target.value })}
                  placeholder="Notes about booking, token advance, or preferences..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none resize-none focus:border-[#b88d23]"
                />
              </div>

              {/* Spec summary */}
              <div className="rounded-xl p-4 space-y-2 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">Technical Specs</p>
                {[
                  ["Plot Number", `#${editPlot.plotNumber}`],
                  ["Area", `${editPlot.dimension.areaSqYards} SY (${editPlot.dimension.areaSqFt} sq.ft)`],
                  ["Dimensions", `${editPlot.dimension.length}ft × ${editPlot.dimension.breadth}ft`],
                  ["Facing", editPlot.facing],
                  ["Road Width", `${editPlot.roadWidth} ft`],
                  ["Corner Plot", editPlot.isCorner ? "Yes" : "No"],
                  ["Premium Facing", editPlot.isPremium ? "Yes" : "No"],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between text-xs">
                    <span className="text-slate-500 font-medium">{k}</span>
                    <span className="text-slate-900 font-bold">{v}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
