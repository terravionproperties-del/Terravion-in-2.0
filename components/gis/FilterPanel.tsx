"use client";
/**
 * components/gis/FilterPanel.tsx
 * Advanced filter engine — status, facing, size, price, road width, special attributes.
 * All filters are instant (no submit button), updating the 3D scene in realtime.
 */

import { useCallback } from "react";
import { useGISStore } from "@/lib/stores/gisStore";
import type { PlotStatus, PlotFacing } from "@/lib/types/gis";
import { PLOT_STATUS_COLORS, PLOT_FACING_COLORS } from "@/lib/types/gis";
import { formatINR } from "@/lib/engines/PlotEngine";

const ALL_STATUSES: PlotStatus[] = ["AVAILABLE", "BOOKED", "SOLD", "RESERVED", "PREMIUM", "COMMERCIAL"];
const ALL_FACINGS: PlotFacing[] = ["NORTH", "SOUTH", "EAST", "WEST", "NORTH_EAST", "NORTH_WEST"];
const AREA_OPTIONS = [150, 200, 240, 250, 300, 400];
const ROAD_OPTIONS = [20, 30, 40];

export function FilterPanel() {
  const { filters, stats, filteredPlots, setFilters, resetFilters } = useGISStore();

  const toggleStatus = useCallback(
    (s: PlotStatus) => {
      const current = filters.statuses;
      const next = current.includes(s) ? current.filter((x) => x !== s) : [...current, s];
      setFilters({ statuses: next });
    },
    [filters.statuses, setFilters]
  );

  const toggleFacing = useCallback(
    (f: PlotFacing) => {
      const current = filters.facings;
      const next = current.includes(f) ? current.filter((x) => x !== f) : [...current, f];
      setFilters({ facings: next });
    },
    [filters.facings, setFilters]
  );

  const setMinArea = (v: number) => setFilters({ minArea: v });
  const setMaxArea = (v: number) => setFilters({ maxArea: v });
  const setMinPrice = (v: number) => setFilters({ minPrice: v });
  const setMaxPrice = (v: number) => setFilters({ maxPrice: v });
  const setRoadWidth = (v: number) => setFilters({ minRoadWidth: v });

  return (
    <div
      className="flex flex-col gap-5 w-72 h-full overflow-y-auto"
      style={{
        background: "linear-gradient(180deg, rgba(10,10,20,0.97) 0%, rgba(15,15,30,0.97) 100%)",
        borderRight: "1px solid rgba(255,215,0,0.1)",
      }}
    >
      {/* Header */}
      <div className="px-5 pt-5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">Filters</span>
          <button
            onClick={resetFilters}
            className="text-xs text-white/40 hover:text-white/80 transition-colors"
          >
            Reset All
          </button>
        </div>
        <p className="text-white/40 text-xs mt-1">
          Showing {filteredPlots.length} of {stats?.total ?? 0} plots
        </p>
      </div>

      <div className="px-5 space-y-6 pb-8">
        {/* Status Filter */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Status</p>
          <div className="grid grid-cols-2 gap-2">
            {ALL_STATUSES.map((s) => {
              const active = filters.statuses.includes(s);
              const color = PLOT_STATUS_COLORS[s]?.fill ?? "#666";
              const countMap: Record<string, number | undefined> = {
                AVAILABLE: stats?.available,
                BOOKED: stats?.booked,
                SOLD: stats?.sold,
                RESERVED: stats?.reserved,
                PREMIUM: stats?.premium,
                COMMERCIAL: stats?.commercial,
              };
              const count = countMap[s];
              return (
                <button
                  key={s}
                  onClick={() => toggleStatus(s)}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? `${color}25` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
                    color: active ? color : "rgba(255,255,255,0.4)",
                    boxShadow: active ? `0 0 12px ${color}30` : "none",
                  }}
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: color }} />
                  <span>{s}</span>
                  {typeof count === "number" && (
                    <span className="ml-auto opacity-60">{count}</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Facing Filter */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Facing</p>
          <div className="grid grid-cols-3 gap-2">
            {ALL_FACINGS.map((f) => {
              const active = filters.facings.includes(f);
              const color = PLOT_FACING_COLORS[f] ?? "#888";
              return (
                <button
                  key={f}
                  onClick={() => toggleFacing(f)}
                  className="px-2 py-2 rounded-xl text-[10px] font-bold uppercase transition-all"
                  style={{
                    background: active ? `${color}25` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? color : "rgba(255,255,255,0.08)"}`,
                    color: active ? color : "rgba(255,255,255,0.4)",
                  }}
                >
                  {f.replace("_", "-")}
                </button>
              );
            })}
          </div>
        </div>

        {/* Area Quick Picks */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Plot Size (Sq Yards)</p>
          <div className="flex gap-2 flex-wrap">
            {AREA_OPTIONS.map((a) => {
              const active = filters.minArea === a && filters.maxArea === a + 49;
              return (
                <button
                  key={a}
                  onClick={() =>
                    active
                      ? setFilters({ minArea: 0, maxArea: 9999 })
                      : setFilters({ minArea: a, maxArea: a + 49 })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? "#fbbf2425" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "#fbbf24" : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#fbbf24" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {a} SY
                </button>
              );
            })}
          </div>
        </div>

        {/* Budget Range */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Budget Range</p>
          <div className="space-y-2">
            {[
              { label: "Under ₹50L", min: 0, max: 5_000_000 },
              { label: "₹50L – ₹1Cr", min: 5_000_000, max: 10_000_000 },
              { label: "₹1Cr – ₹2Cr", min: 10_000_000, max: 20_000_000 },
              { label: "Above ₹2Cr", min: 20_000_000, max: 999_999_999 },
            ].map(({ label, min, max }) => {
              const active = filters.minPrice === min && filters.maxPrice === max;
              return (
                <button
                  key={label}
                  onClick={() =>
                    active
                      ? setFilters({ minPrice: 0, maxPrice: 999_999_999 })
                      : setFilters({ minPrice: min, maxPrice: max })
                  }
                  className="w-full text-left px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? "#22c55e18" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "#22c55e" : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#22c55e" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Road Width */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Min Road Width</p>
          <div className="flex gap-2">
            {ROAD_OPTIONS.map((r) => {
              const active = filters.minRoadWidth === r;
              return (
                <button
                  key={r}
                  onClick={() => setRoadWidth(active ? 0 : r)}
                  className="flex-1 py-2 rounded-xl text-xs font-bold transition-all"
                  style={{
                    background: active ? "#60a5fa25" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "#60a5fa" : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#60a5fa" : "rgba(255,255,255,0.4)",
                  }}
                >
                  {r}ft
                </button>
              );
            })}
          </div>
        </div>

        {/* Special attributes */}
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Special</p>
          <div className="space-y-2">
            {[
              { label: "Corner Plot", key: "isCorner" as const, icon: "🔷" },
              { label: "Premium Plot", key: "isPremium" as const, icon: "⭐" },
              { label: "Park Facing", key: "isParkFacing" as const, icon: "🌳" },
              { label: "Clubhouse Facing", key: "isClubhouseFacing" as const, icon: "🏛️" },
            ].map(({ label, key, icon }) => {
              const active = filters[key] === true;
              return (
                <button
                  key={key}
                  onClick={() => setFilters({ [key]: active ? null : true })}
                  className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                  style={{
                    background: active ? "rgba(251,191,36,0.12)" : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? "#fbbf24" : "rgba(255,255,255,0.08)"}`,
                    color: active ? "#fbbf24" : "rgba(255,255,255,0.4)",
                  }}
                >
                  <span>{icon}</span>
                  <span>{label}</span>
                  {active && <span className="ml-auto text-amber-400">✓</span>}
                </button>
              );
            })}

            {/* Show Sold toggle */}
            <button
              onClick={() => setFilters({ showSold: !filters.showSold })}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
              style={{
                background: filters.showSold ? "rgba(239,68,68,0.1)" : "rgba(255,255,255,0.04)",
                border: `1px solid ${filters.showSold ? "#ef4444" : "rgba(255,255,255,0.08)"}`,
                color: filters.showSold ? "#ef4444" : "rgba(255,255,255,0.4)",
              }}
            >
              <span>🏷️</span>
              <span>Show Sold Plots</span>
              {filters.showSold && <span className="ml-auto text-red-400">✓</span>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
