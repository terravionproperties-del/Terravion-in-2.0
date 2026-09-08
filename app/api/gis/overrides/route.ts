/**
 * app/api/gis/overrides/route.ts
 * Fetches real-time plot overrides from CRM inventory database
 * and securely serves them to the public GIS digital twin.
 */

import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "sanctuary";
  const crmUrl =
    process.env.CRM_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_CRM_URL ||
    "https://crm.terravionproperties.in";

  try {
    const res = await fetch(
      `${crmUrl}/api/inventory/plots?project=${encodeURIComponent(projectSlug)}`,
      {
        cache: "no-store",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (res.ok) {
      const data = await res.json();
      return NextResponse.json(data, {
        headers: {
          "Cache-Control": "public, s-maxage=5, stale-while-revalidate=15",
        },
      });
    }

    return NextResponse.json(
      { success: true, project: projectSlug, overrides: {} },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (error) {
    console.error("[gis/overrides] Failed to fetch overrides from CRM:", error);
    return NextResponse.json(
      { success: true, project: projectSlug, overrides: {} },
      { headers: { "Cache-Control": "no-store" } }
    );
  }
}
