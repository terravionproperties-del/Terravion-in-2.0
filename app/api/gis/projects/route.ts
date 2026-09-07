/**
 * app/api/gis/projects/route.ts
 * GET /api/gis/projects — returns all projects with stats.
 * Falls back to seed data when no database is configured.
 */

import { NextResponse } from "next/server";
import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { SANCTUARY_SHANKARPALLY } from "@/lib/data/sanctuary-shankarpally";
import { computeStats } from "@/lib/engines/PlotEngine";
import type { Project } from "@/lib/types/gis";


export const runtime = "nodejs";
export const revalidate = 30;

export async function GET() {
  try {
    // Try to load from database (Prisma + Supabase)
    // When DATABASE_URL is configured, this will return live data.
    // For now, return seed data.
    const projects: Project[] = [TERRAVION_SHANKARPALLY, SANCTUARY_SHANKARPALLY];


    const summary = projects.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      city: p.city,
      location: p.location,
      tagline: p.tagline,
      centerCoordinates: p.centerCoordinates,
      masterLayoutUrl: p.masterLayoutUrl,
      totalPlots: p.totalPlots,
      pricePerSqYard: p.pricePerSqYard,
      dtcpNumber: p.dtcpNumber,
      reraNumber: p.reraNumber,
      stats: computeStats(p.plots),
    }));

    return NextResponse.json({ data: summary, error: null, timestamp: new Date().toISOString() });
  } catch (error) {
    return NextResponse.json(
      { data: [], error: "Failed to load projects", timestamp: new Date().toISOString() },
      { status: 500 }
    );
  }
}
