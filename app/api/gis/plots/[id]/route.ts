/**
 * app/api/gis/plots/[id]/route.ts
 * GET — read a single plot (DB first, seed fallback).
 *
 * Read-only by design. The GIS surface is a canvas/3D *visualisation* of the
 * sanctioned layout, not an inventory system of record — nothing on the public
 * site edits plot data, so this route exposes no mutation verb.
 *
 * That is also the security posture: an earlier PATCH handler was guarded by a
 * bearer token that (a) fell back to a hardcoded default when unset and (b) was
 * handed to the browser through a NEXT_PUBLIC_ variable, which meant any
 * visitor could read it out of the JS bundle and rewrite plot status and
 * pricing. Deleting the endpoint removes the vulnerability rather than
 * re-guarding it. If plot editing is ever needed, it belongs behind an
 * authenticated staff session in the CRM app, never behind a shipped token.
 */

import { NextResponse } from "next/server";
import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { SANCTUARY_SHANKARPALLY } from "@/lib/data/sanctuary-shankarpally";

export const runtime = "nodejs";

/** Strip fields a public, unauthenticated GET must never disclose. */
function redactPlot<T extends { ownerName?: unknown }>(plot: T) {
  const { ownerName: _omitted, ...publicPlot } = plot;
  return publicPlot;
}

// In-memory plot cache (all projects) — replaced by Prisma when DATABASE_URL is set
const allPlots = [
  ...TERRAVION_SHANKARPALLY.plots,
  ...SANCTUARY_SHANKARPALLY.plots,
];
const plotCache = new Map(allPlots.map((p) => [p.id, { ...p }]));

async function getPlotFromDB(id: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const { prisma } = await import("@/lib/db/prisma");
    const row = await prisma.plot.findUnique({ where: { id } });
    return row;
  } catch {
    return null;
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  // Try DB first
  const dbPlot = await getPlotFromDB(id);
  if (dbPlot) return NextResponse.json({ data: redactPlot(dbPlot), error: null, source: "db" });

  // Seed fallback
  const plot = plotCache.get(id);
  if (!plot) return NextResponse.json({ data: null, error: "Plot not found" }, { status: 404 });
  return NextResponse.json({ data: redactPlot(plot), error: null, source: "seed" });
}
