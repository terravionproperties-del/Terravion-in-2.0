"use client";
/**
 * crm/app/(app)/inventory/InventoryClient.tsx
 * Pure Luxury White GIS Inventory Manager for Terravion CRM.
 * ADMIN / SALES_MANAGER / FINANCE can view, filter, sort, and edit plot inventory.
 */

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SANCTUARY_SHANKARPALLY } from "@/lib/sanctuary-shankarpally";
import { RAGHUNATH_COUNTY } from "@/lib/raghunath-county";
import type { Plot, PlotStatus, Project } from "@/lib/gis-types";
import { computeStats, formatINR, sortPlots } from "@/lib/PlotEngine";

const ALL_STATUSES: PlotStatus[] = [
  "AVAILABLE",
  "BOOKED",
  "SOLD",
  "RESERVED",
  "PREMIUM",
  "COMMERCIAL",
];

const STATUS_LIGHT_STYLES: Record<
  PlotStatus,
  { bg: string; border: string; text: string; dot: string }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50",
    border: "border-emerald-200",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  BOOKED: {
    bg: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
  SOLD: {
    bg: "bg-rose-50",
    border: "border-rose-200",
    text: "text-rose-700",
    dot: "bg-rose-500",
  },
  RESERVED: {
    bg: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  PREMIUM: {
    bg: "bg-amber-50",
    border: "border-amber-200",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  COMMERCIAL: {
    bg: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
};

const PROJECTS: { label: string; key: "sanctuary" | "raghunath-county"; data: Project }[] = [
  {
    label: "Sanctuary — Shankarpally (475 Plots · 45 Acres)",
    key: "sanctuary",
    data: SANCTUARY_SHANKARPALLY as unknown as Project,
  },
  {
    label: "Raghunath County — Shankarpally (202 Plots · 19 Acres)",
    key: "raghunath-county",
    data: RAGHUNATH_COUNTY as unknown as Project,
  },
];

type SortKey = "number" | "price_asc" | "price_desc" | "area_asc" | "area_desc";
type ViewMode = "grid" | "table";

export function InventoryClient({
  initialProject,
}: {
  initialProject: "sanctuary" | "raghunath-county";
}) {
  const router = useRouter();
  const [activeProjectKey, setActiveProjectKey] = useState<"sanctuary" | "raghunath-county">(initialProject);

  const activeProject =
    PROJECTS.find((p) => p.key === activeProjectKey) ?? PROJECTS[0];

  const [plots, setPlots] = useState<Plot[]>(activeProject.data.plots);
  const [filterStatus, setFilterStatus] = useState<PlotStatus | "ALL">("ALL");
  const [filterFacing, setFilterFacing] = useState<string>("ALL");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("number");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [savingId, setSavingId] = useState<string | null>(null);

  // Drawer edit state
  const [editPlot, setEditPlot] = useState<Plot | null>(null);
  const [draftStatus, setDraftStatus] = useState<PlotStatus>("AVAILABLE");
  const [draftPrice, setDraftPrice] = useState<number>(0);
  const [draftOwnerName, setDraftOwnerName] = useState<string>("");
  const [draftSalesExec, setDraftSalesExec] = useState<string>("");
  const [draftPhone, setDraftPhone] = useState<string>("");
  const [draftNotes, setDraftNotes] = useState<string>("");
  const [drawerSaved, setDrawerSaved] = useState(false);

  // Open drawer helper
  const handleOpenDrawer = useCallback((plot: Plot) => {
    setEditPlot(plot);
    setDraftStatus(plot.status);
    setDraftPrice(plot.price);
    setDraftOwnerName(plot.ownerName ?? "");
    setDraftSalesExec(plot.salesExecutive ?? "");
    setDraftPhone(plot.customerPhone ?? "");
    setDraftNotes(plot.notes ?? "");
    setDrawerSaved(false);
  }, []);

  // Fetch overrides from database when activeProjectKey changes
  useEffect(() => {
    let isCancelled = false;
    async function loadOverrides() {
      try {
        const res = await fetch(`/api/inventory/plots?project=${activeProjectKey}`);
        if (!res.ok) return;
        const data = await res.json();
        if (data.overrides && !isCancelled) {
          const proj = PROJECTS.find((p) => p.key === activeProjectKey);
          if (!proj) return;
          setPlots(
            proj.data.plots.map((p) => {
              const override = data.overrides[p.plotNumber] || data.overrides[p.id];
              if (!override) return p;
              return {
                ...p,
                status: (override.status as PlotStatus) || p.status,
                facing: override.facing || p.facing,
                dimension: {
                  ...p.dimension,
                  areaSqYards: override.areaSqYards ?? p.dimension.areaSqYards,
                },
                price: override.pricePerSqYard ?? p.price,
                totalPrice: override.totalPrice ?? p.totalPrice,
                notes: override.remarks ?? p.notes,
              };
            })
          );
        }
      } catch (err) {
        console.error("Failed to load inventory overrides", err);
      }
    }
    loadOverrides();
    return () => {
      isCancelled = true;
    };
  }, [activeProjectKey]);

  const stats = useMemo(() => computeStats(plots), [plots]);

  const displayed = useMemo(() => {
    let result = plots;
    if (filterStatus !== "ALL") {
      if (filterStatus === "PREMIUM") {
        result = result.filter((p) => p.status === "PREMIUM" || p.isPremium);
      } else {
        result = result.filter((p) => p.status === filterStatus);
      }
    }
    if (filterFacing !== "ALL") {
      result = result.filter((p) => p.facing === filterFacing);
    }
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
   * Persists plot updates to CRM SQLite database
   */
  const patchPlot = useCallback(
    async (plotId: string, payload: Partial<Plot>) => {
      setSavingId(plotId);
      // Calculate totalPrice if price was updated
      const current = plots.find((p) => p.id === plotId);
      const computedTotalPrice =
        payload.price && current?.dimension?.areaSqYards
          ? payload.price * current.dimension.areaSqYards
          : payload.totalPrice;

      const mergedPayload = {
        ...payload,
        ...(computedTotalPrice ? { totalPrice: computedTotalPrice } : {}),
      };

      // Optimistic state update
      setPlots((prev) =>
        prev.map((p) => (p.id === plotId ? { ...p, ...mergedPayload } : p))
      );
      if (editPlot?.id === plotId) {
        setEditPlot((prev) => (prev ? { ...prev, ...mergedPayload } : null));
      }

      try {
        const targetPlot = plots.find((p) => p.id === plotId);
        const plotNum = targetPlot?.plotNumber;
        if (plotNum) {
          const res = await fetch("/api/inventory/plots", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectSlug: activeProjectKey,
              plotNumber: plotNum,
              status: mergedPayload.status,
              facing: mergedPayload.facing,
              areaSqYards: mergedPayload.dimension?.areaSqYards,
              pricePerSqYard: mergedPayload.price,
              totalPrice: mergedPayload.totalPrice,
              remarks: mergedPayload.notes,
              isCorner: mergedPayload.isCorner,
              isPremium: mergedPayload.isPremium,
            }),
          });
          if (!res.ok) {
            console.error("Failed to persist plot to database");
          }
        }
      } catch (err) {
        console.error("Error persisting plot to database:", err);
      } finally {
        setSavingId(null);
      }
    },
    [editPlot, plots, activeProjectKey]
  );

  // Save changes from Edit Drawer
  const handleDrawerSave = async () => {
    if (!editPlot) return;
    const computedTotal = draftPrice * editPlot.dimension.areaSqYards;
    await patchPlot(editPlot.id, {
      status: draftStatus,
      price: draftPrice,
      totalPrice: computedTotal,
      ownerName: draftOwnerName,
      salesExecutive: draftSalesExec,
      customerPhone: draftPhone,
      notes: draftNotes,
    });
    setDrawerSaved(true);
    setTimeout(() => setDrawerSaved(false), 2500);
  };

  const facings = useMemo(
    () => ["ALL", ...new Set(plots.map((p) => p.facing))],
    [plots]
  );

  return (
    <div className="flex flex-col h-screen overflow-hidden bg-[#f8fafc] text-slate-900 font-sans">
      {/* ── PAGE HEADER ────────────────────────────────────────── */}
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
          {/* Segmented project selector tabs */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-slate-100 p-0.5 shadow-2xs">
            {PROJECTS.map((p) => {
              const isActive = activeProjectKey === p.key;
              return (
                <button
                  key={p.key}
                  type="button"
                  id={`project-tab-${p.key}`}
                  onClick={() => {
                    setActiveProjectKey(p.key);
                    const proj = PROJECTS.find((pr) => pr.key === p.key)!;
                    setPlots(proj.data.plots);
                    setFilterStatus("ALL");
                    setFilterFacing("ALL");
                    setSearchQ("");
                    try {
                      window.history.replaceState(null, "", `/inventory?project=${p.key}`);
                    } catch {}
                    router.replace(`/inventory?project=${p.key}`, { scroll: false });
                  }}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs transition-all cursor-pointer ${
                    isActive
                      ? "bg-white text-slate-900 shadow-xs border border-slate-200/60 font-bold"
                      : "text-slate-600 hover:text-slate-900 font-medium hover:bg-slate-200/60"
                  }`}
                >
                  <span>{p.key === "sanctuary" ? "🏛️" : "🌳"}</span>
                  <span>{p.key === "sanctuary" ? "Sanctuary (475 Plots)" : "Raghunath County (202 Plots)"}</span>
                </button>
              );
            })}
          </div>

          {/* Search input */}
          <div className="relative">
            <input
              type="text"
              id="inventory-search-input"
              placeholder="Search plot#, owner..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="pl-8 pr-3 py-2 rounded-lg text-xs text-slate-900 placeholder-slate-400 bg-white border border-slate-300 outline-none w-48 focus:border-[#b88d23] transition-colors"
            />
            <svg
              className="absolute left-2.5 top-2.5 text-slate-400 pointer-events-none"
              width="13"
              height="13"
              viewBox="0 0 13 13"
              fill="none"
            >
              <circle cx="5.5" cy="5.5" r="4" stroke="currentColor" strokeWidth="1.5" />
              <path d="M9 9l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            {searchQ && (
              <button
                type="button"
                onClick={() => setSearchQ("")}
                className="absolute right-2 top-2 text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <select
            id="inventory-sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortKey)}
            className="px-3 py-2 rounded-lg text-xs font-medium text-slate-700 bg-white border border-slate-300 outline-none cursor-pointer focus:border-[#b88d23] transition-colors"
          >
            <option value="number">Plot #</option>
            <option value="price_asc">Price ↑</option>
            <option value="price_desc">Price ↓</option>
            <option value="area_asc">Area ↑</option>
            <option value="area_desc">Area ↓</option>
          </select>

          {/* View toggle (Grid / Table) */}
          <div className="flex rounded-lg overflow-hidden border border-slate-300 bg-white shadow-2xs">
            {(["grid", "table"] as ViewMode[]).map((v) => (
              <button
                key={v}
                type="button"
                id={`view-toggle-${v}`}
                onClick={() => setViewMode(v)}
                className={`px-3 py-1.5 text-xs font-bold capitalize transition-all cursor-pointer ${
                  viewMode === v
                    ? "bg-[#b88d23] text-white"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                {v}
              </button>
            ))}
          </div>

          {/* Open live 3D Map */}
          <a
            id="btn-view-3d-map"
            href={`${process.env.NEXT_PUBLIC_SITE_URL ?? "https://terravionproperties.in"}/gis/${activeProjectKey}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold bg-gradient-to-r from-[#c59b27] to-[#a67c1e] text-white shadow-xs hover:brightness-105 active:scale-[0.98] transition-all"
          >
            🗺️ View 3D Live Map
          </a>
        </div>
      </div>

      {/* ── STATS BAR ───────────────────────────────────────── */}
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
            <p className="text-base font-bold mt-0.5" style={{ color }}>
              {value}
            </p>
          </div>
        ))}
      </div>

      {/* ── FILTER TABS ───────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center gap-2 px-8 py-2.5 bg-slate-50 border-b border-slate-200 overflow-x-auto scrollbar-none">
        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold flex-shrink-0 mr-1">
          Status:
        </span>
        {["ALL", ...ALL_STATUSES].map((s) => {
          const active = filterStatus === s;
          const count =
            s === "ALL"
              ? plots.length
              : s === "PREMIUM"
              ? plots.filter((p) => p.status === "PREMIUM" || p.isPremium).length
              : plots.filter((p) => p.status === s).length;

          const style =
            s === "ALL"
              ? active
                ? "bg-slate-900 text-white border-slate-900 font-bold"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100"
              : active
              ? `${STATUS_LIGHT_STYLES[s as PlotStatus].bg} ${STATUS_LIGHT_STYLES[s as PlotStatus].text} ${STATUS_LIGHT_STYLES[s as PlotStatus].border} font-bold shadow-xs`
              : `bg-white ${STATUS_LIGHT_STYLES[s as PlotStatus].text} border-slate-200 hover:bg-slate-100`;

          return (
            <button
              key={s}
              type="button"
              id={`filter-status-${s.toLowerCase()}`}
              onClick={() => setFilterStatus(s as PlotStatus | "ALL")}
              className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] border transition-all cursor-pointer ${style}`}
            >
              {s !== "ALL" && (
                <span className={`w-2 h-2 rounded-full ${STATUS_LIGHT_STYLES[s as PlotStatus].dot}`} />
              )}
              <span>{s}</span>
              <span className="text-slate-400 font-normal">({count})</span>
            </button>
          );
        })}

        <span className="text-[11px] text-slate-500 uppercase tracking-wider font-bold flex-shrink-0 ml-4 mr-1">
          Facing:
        </span>
        {facings.map((f) => (
          <button
            key={f}
            type="button"
            id={`filter-facing-${f.toLowerCase()}`}
            onClick={() => setFilterFacing(f)}
            className={`flex-shrink-0 px-3 py-1 rounded-full text-[11px] border transition-all cursor-pointer ${
              filterFacing === f
                ? "bg-[#b88d23] text-white border-[#b88d23] font-bold shadow-xs"
                : "bg-white text-slate-700 border-slate-200 hover:bg-slate-100 font-medium"
            }`}
          >
            {f}
          </button>
        ))}
        <span className="text-xs font-semibold text-slate-500 ml-auto flex-shrink-0">
          {displayed.length} plots shown
        </span>
      </div>

      {/* ── CONTENT (Grid & Cards / Table) ───────────────────────────────── */}
      <div className="flex-1 overflow-y-auto p-8">
        {viewMode === "grid" ? (
          <div
            className="grid gap-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fill, minmax(210px, 1fr))" }}
          >
            {displayed.map((plot) => {
              const statusStyle =
                STATUS_LIGHT_STYLES[plot.status] ?? STATUS_LIGHT_STYLES.AVAILABLE;
              const isSaving = savingId === plot.id;
              return (
                <div
                  key={plot.id}
                  id={`plot-card-${plot.plotNumber}`}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between gap-3 transition-all hover:border-amber-400 hover:shadow-md cursor-pointer group"
                  onClick={() => handleOpenDrawer(plot)}
                >
                  {/* Header */}
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-slate-900 font-serif font-black text-xl group-hover:text-[#946c0b] transition-colors">
                          #{plot.plotNumber}
                        </span>
                        {plot.isCorner && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 font-bold border border-blue-200">
                            Corner
                          </span>
                        )}
                        {plot.isPremium && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 font-bold border border-amber-200">
                            Premium
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="text-slate-500 text-[11px] font-medium mt-1">
                      {plot.facing} · {plot.dimension.areaSqYards} Sq. Yds · {plot.roadWidth}ft Road
                    </p>
                  </div>

                  {/* Price */}
                  <div>
                    <p className="text-[0.9375rem] font-bold text-emerald-600">
                      {formatINR(plot.totalPrice)}
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      ₹{plot.price.toLocaleString("en-IN")}/sq.yd
                    </p>
                  </div>

                  {/* Status dropdown */}
                  <div className="relative pt-1 border-t border-slate-100">
                    <select
                      value={plot.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => {
                        e.stopPropagation();
                        patchPlot(plot.id, { status: e.target.value as PlotStatus });
                      }}
                      disabled={isSaving}
                      className={`w-full px-2.5 py-1.5 rounded-lg text-xs font-bold border cursor-pointer ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                    >
                      {ALL_STATUSES.map((s) => (
                        <option key={s} value={s} className="bg-white text-slate-900 font-medium">
                          {s}
                        </option>
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
                  {["Plot#", "Area (SY)", "Facing", "Road Width", "Total Price", "Status", "Owner", "Actions"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayed.map((plot) => {
                  const statusStyle =
                    STATUS_LIGHT_STYLES[plot.status] ?? STATUS_LIGHT_STYLES.AVAILABLE;
                  const isSaving = savingId === plot.id;
                  return (
                    <tr
                      key={plot.id}
                      className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                      onClick={() => handleOpenDrawer(plot)}
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
                          onChange={(e) => {
                            e.stopPropagation();
                            patchPlot(plot.id, { status: e.target.value as PlotStatus });
                          }}
                          disabled={isSaving}
                          className={`px-2 py-1 rounded text-[11px] font-bold border cursor-pointer ${statusStyle.bg} ${statusStyle.border} ${statusStyle.text}`}
                        >
                          {ALL_STATUSES.map((s) => (
                            <option key={s} value={s} className="bg-white text-slate-900">
                              {s}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-medium">{plot.ownerName ?? "—"}</td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenDrawer(plot);
                          }}
                          className="px-2.5 py-1 rounded-md text-[11px] font-semibold text-slate-700 bg-slate-100 hover:bg-amber-100 hover:text-[#946c0b] transition-colors cursor-pointer"
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

      {/* ── EDIT DRAWER (Slide-Over with explicit Save & Live Recalculation) ─── */}
      {editPlot && (
        <>
          <div
            className="fixed inset-0 bg-slate-900/40 z-40 backdrop-blur-2xs"
            onClick={() => setEditPlot(null)}
          />
          <div className="fixed right-0 top-0 h-full w-full max-w-sm z-50 flex flex-col bg-white border-l border-slate-200 shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="flex items-center justify-between p-6 border-b border-slate-100 bg-slate-50">
              <div>
                <p className="text-slate-900 font-serif font-bold text-xl">Plot #{editPlot.plotNumber}</p>
                <p className="text-slate-500 text-xs font-medium">
                  {editPlot.facing} · {editPlot.dimension.areaSqYards} Sq. Yards
                </p>
              </div>
              <button
                type="button"
                id="btn-close-drawer"
                onClick={() => setEditPlot(null)}
                className="h-8 w-8 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-200 hover:text-slate-700 text-lg transition-colors cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-4 flex-1">
              {/* Status */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Plot Status
                </label>
                <select
                  id="drawer-status-select"
                  value={draftStatus}
                  onChange={(e) => setDraftStatus(e.target.value as PlotStatus)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm font-bold border border-slate-300 bg-white text-slate-900 outline-none focus:border-[#b88d23] transition-colors"
                >
                  {ALL_STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price per Sq. Yard */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Price per Sq Yard (₹)
                </label>
                <input
                  type="number"
                  id="drawer-price-input"
                  value={draftPrice}
                  onChange={(e) => setDraftPrice(Number(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23] transition-colors"
                />
                <p className="text-xs font-bold text-emerald-600 mt-1.5">
                  Total Value: {formatINR(draftPrice * editPlot.dimension.areaSqYards)}
                </p>
              </div>

              {/* Owner name */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Buyer / Owner Name
                </label>
                <input
                  type="text"
                  id="drawer-owner-input"
                  value={draftOwnerName}
                  onChange={(e) => setDraftOwnerName(e.target.value)}
                  placeholder="e.g. S. Venkatesh"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23] transition-colors"
                />
              </div>

              {/* Sales executive */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Assigned Sales Executive
                </label>
                <input
                  type="text"
                  id="drawer-sales-input"
                  value={draftSalesExec}
                  onChange={(e) => setDraftSalesExec(e.target.value)}
                  placeholder="Assign executive"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23] transition-colors"
                />
              </div>

              {/* Customer Phone */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Customer Phone
                </label>
                <input
                  type="tel"
                  id="drawer-phone-input"
                  value={draftPhone}
                  onChange={(e) => setDraftPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none focus:border-[#b88d23] transition-colors"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block mb-1.5">
                  Plot Notes
                </label>
                <textarea
                  rows={3}
                  id="drawer-notes-input"
                  value={draftNotes}
                  onChange={(e) => setDraftNotes(e.target.value)}
                  placeholder="Notes about booking, token advance, or preferences..."
                  className="w-full px-3.5 py-2.5 rounded-lg text-sm text-slate-900 border border-slate-300 bg-white outline-none resize-none focus:border-[#b88d23] transition-colors"
                />
              </div>

              {/* Technical Specs Summary */}
              <div className="rounded-xl p-4 space-y-2 bg-slate-50 border border-slate-200">
                <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-2">
                  Technical Specs
                </p>
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

            {/* Drawer Actions Footer */}
            <div className="p-6 border-t border-slate-200 bg-white space-y-2">
              {drawerSaved && (
                <div className="flex items-center justify-center gap-2 p-2 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200 animate-fadeIn">
                  ✓ Plot #{editPlot.plotNumber} saved successfully!
                </div>
              )}
              <div className="flex gap-3">
                <button
                  type="button"
                  id="btn-cancel-drawer"
                  onClick={() => setEditPlot(null)}
                  className="flex-1 py-2.5 px-4 rounded-lg border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-100 active:scale-[0.98] transition-all cursor-pointer"
                >
                  Close
                </button>
                <button
                  type="button"
                  id="btn-save-drawer"
                  onClick={handleDrawerSave}
                  disabled={savingId === editPlot.id}
                  className="flex-1 py-2.5 px-4 rounded-lg bg-gradient-to-r from-[#c59b27] to-[#a67c1e] text-white text-xs font-bold shadow-sm hover:brightness-105 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  {savingId === editPlot.id ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <span>Save Changes</span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
