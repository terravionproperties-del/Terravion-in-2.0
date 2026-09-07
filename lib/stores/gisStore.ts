/**
 * lib/stores/gisStore.ts
 * Zustand global state store for the GIS platform.
 * Single source of truth for filters, selected plot, camera, map mode.
 */
"use client";

import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import type {
  GISState,
  Project,
  Plot,
  PlotFilters,
  MapMode,
  DayMode,
  CameraView,
  InventoryStats,
} from "@/lib/types/gis";
import { DEFAULT_FILTERS, PLOT_STATUS_COLORS } from "@/lib/types/gis";
import { applyFilters, searchPlots, computeStats } from "@/lib/engines/PlotEngine";

interface GISActions {
  // Data loading
  loadProject: (project: Project) => void;
  updatePlot: (plot: Plot) => void;

  // Selection
  selectPlot: (plot: Plot | null) => void;
  setHoveredPlotId: (id: string | null) => void;

  // Filters
  setFilters: (filters: Partial<PlotFilters>) => void;
  resetFilters: () => void;
  setSearchQuery: (q: string) => void;

  // Map/Scene
  setMapMode: (mode: MapMode) => void;
  setDayMode: (mode: DayMode) => void;
  setCameraView: (view: CameraView) => void;
  setSatelliteOpacity: (opacity: number) => void;

  // Panels
  toggleFilterPanel: () => void;
  toggleDetailPanel: () => void;
  toggleNearbyPlaces: () => void;

  // Loading
  setLoading: (v: boolean) => void;
}

type GISStore = GISState & GISActions;

export const useGISStore = create<GISStore>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    project: null,
    plots: [],
    filteredPlots: [],
    selectedPlot: null,
    hoveredPlotId: null,
    filters: DEFAULT_FILTERS,
    mapMode: "layout" as MapMode,
    dayMode: "morning" as DayMode,
    cameraView: "bird_eye" as CameraView,
    satelliteOpacity: 0.7,
    showFilterPanel: true,
    showDetailPanel: false,
    showNearbyPlaces: false,
    stats: null,
    isLoading: false,
    searchQuery: "",

    // Actions
    loadProject: (project) => {
      const plots = project.plots;
      const filteredPlots = applyFilters(plots, DEFAULT_FILTERS);
      const stats = computeStats(plots);
      set({ project, plots, filteredPlots, stats, isLoading: false });
    },

    updatePlot: (updatedPlot) => {
      const { plots, filters, searchQuery } = get();
      const newPlots = plots.map((p) => (p.id === updatedPlot.id ? updatedPlot : p));
      const filtered = searchQuery
        ? searchPlots(applyFilters(newPlots, filters), searchQuery)
        : applyFilters(newPlots, filters);
      const stats = computeStats(newPlots);
      set({ plots: newPlots, filteredPlots: filtered, stats });
    },

    selectPlot: (plot) =>
      set({ selectedPlot: plot, showDetailPanel: plot !== null }),

    setHoveredPlotId: (id) => set({ hoveredPlotId: id }),

    setFilters: (partial) => {
      const { plots, filters, searchQuery } = get();
      const newFilters = { ...filters, ...partial };
      const filtered = searchQuery
        ? searchPlots(applyFilters(plots, newFilters), searchQuery)
        : applyFilters(plots, newFilters);
      set({ filters: newFilters, filteredPlots: filtered });
    },

    resetFilters: () => {
      const { plots } = get();
      set({ filters: DEFAULT_FILTERS, filteredPlots: applyFilters(plots, DEFAULT_FILTERS), searchQuery: "" });
    },

    setSearchQuery: (q) => {
      const { plots, filters } = get();
      const filtered = searchPlots(applyFilters(plots, filters), q);
      set({ searchQuery: q, filteredPlots: filtered });
    },

    setMapMode: (mode) => set({ mapMode: mode }),
    setDayMode: (mode) => set({ dayMode: mode }),
    setCameraView: (view) => set({ cameraView: view }),
    setSatelliteOpacity: (opacity) => set({ satelliteOpacity: opacity }),

    toggleFilterPanel: () => set((s) => ({ showFilterPanel: !s.showFilterPanel })),
    toggleDetailPanel: () => set((s) => ({ showDetailPanel: !s.showDetailPanel })),
    toggleNearbyPlaces: () => set((s) => ({ showNearbyPlaces: !s.showNearbyPlaces })),

    setLoading: (v) => set({ isLoading: v }),
  }))
);

/** Derive plot color from current store state */
export function getPlotColor(plot: Plot, hoveredId: string | null, selectedPlot: Plot | null): number {
  if (hoveredId === plot.id) return 0xffffff;
  if (selectedPlot?.id === plot.id) return 0xffd700;
  return PLOT_STATUS_COLORS[plot.status]?.hex ?? 0x888888;
}
