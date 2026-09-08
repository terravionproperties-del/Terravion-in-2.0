/**
 * app/api/gis/projects/[slug]/route.ts
 * GET /api/gis/projects/:slug — returns full project with all plots, amenities, updates.
 */

import { NextResponse } from "next/server";
import { TERRAVION_SHANKARPALLY } from "@/lib/data/terravion-shankarpally";
import { SANCTUARY_SHANKARPALLY } from "@/lib/data/sanctuary-shankarpally";
import { RAGHUNATH_COUNTY } from "@/lib/data/raghunath-county";
import type { Project } from "@/lib/types/gis";

export const runtime = "nodejs";
export const revalidate = 10;

const PROJECT_MAP: Record<string, Project> = {
  shankarpally: TERRAVION_SHANKARPALLY as unknown as Project,
  sanctuary: SANCTUARY_SHANKARPALLY,
  "raghunath-county": RAGHUNATH_COUNTY,
  raghunath: RAGHUNATH_COUNTY,
};

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const project = PROJECT_MAP[slug];

  if (!project) {
    return NextResponse.json(
      { data: null, error: "Project not found", timestamp: new Date().toISOString() },
      { status: 404 }
    );
  }

  // Public endpoint: strip per-plot buyer PII before it leaves the server.
  const publicProject = {
    ...project,
    plots: project.plots.map(({ ownerName: _omitted, ...plot }) => plot),
  };

  return NextResponse.json({
    data: publicProject,
    error: null,
    timestamp: new Date().toISOString(),
  });
}
