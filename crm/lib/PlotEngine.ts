/**
 * lib/engines/PlotEngine.ts
 * Core filtering, sorting and statistics engine for plots.
 * Pure functions — no side effects, fully testable.
 */

import type { Plot, PlotFilters, PlotStatus, InventoryStats } from "@/lib/gis-types";

/** Apply all active filters to a flat plot array — O(n) single pass */
export function applyFilters(plots: Plot[], filters: PlotFilters): Plot[] {
  return plots.filter((plot) => {
    // Status filter
    if (filters.statuses.length > 0 && !filters.statuses.includes(plot.status)) {
      if (!filters.showSold && plot.status === "SOLD") return false;
      if (filters.statuses.length > 0) return false;
    }
    if (!filters.showSold && plot.status === "SOLD") return false;

    // Facing filter
    if (filters.facings.length > 0 && !filters.facings.includes(plot.facing)) return false;

    // Area filter
    const area = plot.dimension.areaSqYards;
    if (area < filters.minArea || area > filters.maxArea) return false;

    // Price filter
    const price = plot.totalPrice;
    if (price < filters.minPrice || price > filters.maxPrice) return false;

    // Road width filter
    if (plot.roadWidth < filters.minRoadWidth) return false;

    // Boolean filters
    if (filters.isCorner !== null && plot.isCorner !== filters.isCorner) return false;
    if (filters.isPremium !== null && plot.isPremium !== filters.isPremium) return false;
    if (filters.isParkFacing !== null && plot.isParkFacing !== filters.isParkFacing) return false;
    if (filters.isClubhouseFacing !== null && plot.isClubhouseFacing !== filters.isClubhouseFacing) return false;
    if (filters.isEntranceFacing !== null && plot.isEntranceFacing !== filters.isEntranceFacing) return false;

    return true;
  });
}

/** Search plots by plot number, owner name or facing */
export function searchPlots(plots: Plot[], query: string): Plot[] {
  const q = query.toLowerCase().trim();
  if (!q) return plots;
  return plots.filter(
    (p) =>
      p.plotNumber.toLowerCase().includes(q) ||
      p.ownerName?.toLowerCase().includes(q) ||
      p.facing.toLowerCase().includes(q) ||
      p.status.toLowerCase().includes(q)
  );
}

/** Compute inventory statistics from a full plot array */
export function computeStats(plots: Plot[]): InventoryStats {
  const now = new Date();
  const monthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

  let available = 0, booked = 0, sold = 0, reserved = 0, premium = 0, commercial = 0, corner = 0;
  let totalArea = 0, totalPrice = 0, soldValue = 0;
  let soldThisMonth = 0, revenueThisMonth = 0;

  for (const p of plots) {
    if (p.status === "AVAILABLE") available++;
    if (p.status === "BOOKED") booked++;
    if (p.status === "SOLD") {
      sold++;
      soldValue += p.totalPrice;
      if (p.bookingDate?.startsWith(monthStr)) {
        soldThisMonth++;
        revenueThisMonth += p.totalPrice;
      }
    }
    if (p.status === "RESERVED") reserved++;
    if (p.status === "PREMIUM") premium++;
    if (p.status === "COMMERCIAL") commercial++;
    if (p.isCorner) corner++;
    totalArea += p.dimension.areaSqYards;
    totalPrice += p.price;
  }

  const n = plots.length || 1;
  return {
    total: plots.length,
    available,
    booked,
    sold,
    reserved,
    premium,
    commercial,
    corner,
    avgAreaSqYards: Math.round(totalArea / n),
    avgPricePerSqYard: Math.round(totalPrice / n),
    totalInventoryValue: plots.reduce((s, p) => s + p.totalPrice, 0),
    soldValue,
    soldThisMonth,
    revenueThisMonth,
  };
}

/** Format INR price for display */
export function formatINR(amount: number): string {
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(2)} Cr`;
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(2)} L`;
  return `₹${amount.toLocaleString("en-IN")}`;
}

/** Calculate monthly EMI */
export function calculateEMI(principal: number, ratePercent: number, tenureMonths: number): number {
  const r = ratePercent / 100 / 12;
  if (r === 0) return Math.round(principal / tenureMonths);
  return Math.round((principal * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));
}

/** Sort plots */
export function sortPlots(plots: Plot[], by: "number" | "price_asc" | "price_desc" | "area_asc" | "area_desc"): Plot[] {
  return [...plots].sort((a, b) => {
    switch (by) {
      case "number":      return parseInt(a.plotNumber) - parseInt(b.plotNumber);
      case "price_asc":   return a.totalPrice - b.totalPrice;
      case "price_desc":  return b.totalPrice - a.totalPrice;
      case "area_asc":    return a.dimension.areaSqYards - b.dimension.areaSqYards;
      case "area_desc":   return b.dimension.areaSqYards - a.dimension.areaSqYards;
      default:            return 0;
    }
  });
}

/** Get min/max bounds for filter sliders from a project's plot array */
export function getFilterBounds(plots: Plot[]) {
  const areas  = plots.map((p) => p.dimension.areaSqYards);
  const prices = plots.map((p) => p.totalPrice);
  const roads  = plots.map((p) => p.roadWidth);
  return {
    minArea:  Math.min(...areas),
    maxArea:  Math.max(...areas),
    minPrice: Math.min(...prices),
    maxPrice: Math.max(...prices),
    roadWidths: [...new Set(roads)].sort((a, b) => a - b),
  };
}

