"use client";
/**
 * app/[locale]/admin/projects/[id]/plots/page.tsx
 * Plot inventory grid — an internal preview tool.
 *
 * Edits are local to this browser session and are NOT persisted. The GIS
 * surface is a canvas/3D visualisation of the sanctioned layout rather than a
 * system of record, so there is no write endpoint to call. This page also
 * returns 404 in production unless ADMIN_ENABLED=true (see middleware.ts),
 * because it has no staff authentication of its own.
 */

import { useState, useEffect, useCallback } from "react";
import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { computeStats, formatINR, sortPlots } from "@/lib/engines/PlotEngine";
import { PLOT_STATUS_COLORS } from "@/lib/types/gis";
import type { Plot, PlotStatus } from "@/lib/types/gis";

const ALL_STATUSES: PlotStatus[] = ["AVAILABLE", "BOOKED", "SOLD", "RESERVED", "PREMIUM", "COMMERCIAL"];


export default function AdminPlotsPage() {
  const [plots, setPlots] = useState<Plot[]>(TERRAVION_SHANKARPALLY.plots);
  const [filterStatus, setFilterStatus] = useState<PlotStatus | "ALL">("ALL");
  const [sortBy, setSortBy] = useState<"number" | "price_asc" | "price_desc" | "area_asc">("number");
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlot, setEditingPlot] = useState<string | null>(null);

  const stats = computeStats(plots);

  const displayed = plots
    .filter((p) => filterStatus === "ALL" || p.status === filterStatus)
    .sort((a, b) => {
      if (sortBy === "number") return parseInt(a.plotNumber) - parseInt(b.plotNumber);
      if (sortBy === "price_asc") return a.totalPrice - b.totalPrice;
      if (sortBy === "price_desc") return b.totalPrice - a.totalPrice;
      if (sortBy === "area_asc") return a.dimension.areaSqYards - b.dimension.areaSqYards;
      return 0;
    });

  /**
   * Session-local only. There is deliberately no write API to call — see the
   * file header. Changes vanish on reload, which is the honest behaviour for a
   * preview tool sitting on top of a read-only visualisation.
   */
  const updateStatus = useCallback((plotId: string, newStatus: PlotStatus) => {
    setSaving(plotId);
    setPlots((prev) =>
      prev.map((p) => (p.id === plotId ? { ...p, status: newStatus } : p))
    );
    setSaving(null);
  }, []);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div
        className="flex-shrink-0 px-8 py-5 border-b flex items-center justify-between"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        <div>
          <h1 className="text-xl font-black text-white">Plot Inventory</h1>
          <p className="text-white/40 text-sm mt-0.5">Terravion Shankarpally · {stats.total} plots</p>
        </div>

        <div className="flex items-center gap-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
            className="px-3 py-2 rounded-xl text-xs text-white bg-white/5 border border-white/10 outline-none"
          >
            <option value="number">Sort: Plot #</option>
            <option value="price_asc">Sort: Price ↑</option>
            <option value="price_desc">Sort: Price ↓</option>
            <option value="area_asc">Sort: Area ↑</option>
          </select>
        </div>
      </div>

      {/* Stats strip */}
      <div
        className="flex-shrink-0 flex gap-6 px-8 py-4 border-b overflow-x-auto"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {[
          { label: "Total", value: stats.total, color: "#e2e8f0" },
          { label: "Available", value: stats.available, color: "#22c55e" },
          { label: "Booked", value: stats.booked, color: "#f97316" },
          { label: "Sold", value: stats.sold, color: "#ef4444" },
          { label: "Reserved", value: stats.reserved, color: "#a855f7" },
          { label: "Premium", value: stats.premium, color: "#eab308" },
          { label: "Revenue", value: formatINR(stats.soldValue), color: "#60a5fa" },
        ].map(({ label, value, color }) => (
          <div key={label} className="flex-shrink-0">
            <p className="text-[10px] text-white/30 uppercase tracking-widest">{label}</p>
            <p className="text-lg font-black" style={{ color }}>{value}</p>
          </div>
        ))}
      </div>

      {/* Status filter tabs */}
      <div
        className="flex-shrink-0 flex gap-2 px-8 py-3 border-b overflow-x-auto"
        style={{ borderColor: "rgba(255,255,255,0.06)" }}
      >
        {["ALL", ...ALL_STATUSES].map((s) => {
          const active = filterStatus === s;
          const color = s === "ALL" ? "#e2e8f0" : PLOT_STATUS_COLORS[s as PlotStatus]?.fill ?? "#666";
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s as PlotStatus | "ALL")}
              className="flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-bold transition-all"
              style={{
                background: active ? `${color}25` : "rgba(255,255,255,0.04)",
                border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
                color: active ? color : "rgba(255,255,255,0.4)",
              }}
            >
              {s} {s !== "ALL" && `(${plots.filter((p) => p.status === s).length})`}
            </button>
          );
        })}
      </div>

      {/* Plot Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
          {displayed.map((plot) => {
            const color = PLOT_STATUS_COLORS[plot.status]?.fill ?? "#666";
            const isSaving = saving === plot.id;

            return (
              <div
                key={plot.id}
                className="rounded-2xl p-4 border transition-all"
                style={{
                  background: `linear-gradient(135deg, ${color}0d, ${color}06)`,
                  borderColor: `${color}30`,
                }}
              >
                {/* Plot number */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-white font-black text-lg leading-none">#{plot.plotNumber}</p>
                    <p className="text-white/30 text-xs mt-0.5">{plot.facing} · {plot.dimension.areaSqYards} SY</p>
                  </div>
                  <div className="flex gap-1">
                    {plot.isCorner && <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-400">CRN</span>}
                    {plot.isPremium && <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400">PRE</span>}
                  </div>
                </div>

                {/* Price */}
                <p className="text-sm font-bold mb-3" style={{ color: "#22c55e" }}>
                  {formatINR(plot.totalPrice)}
                </p>

                {/* Status change dropdown */}
                <div className="relative">
                  <select
                    value={plot.status}
                    onChange={(e) => updateStatus(plot.id, e.target.value as PlotStatus)}
                    disabled={isSaving}
                    className="w-full px-3 py-2 rounded-xl text-xs font-bold outline-none transition-all appearance-none"
                    style={{
                      background: `${color}18`,
                      border: `1px solid ${color}40`,
                      color,
                      opacity: isSaving ? 0.6 : 1,
                    }}
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s} style={{ background: "#0a0a14", color: "#fff" }}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {isSaving && (
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 rounded-full border border-white/30 border-t-white animate-spin" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
