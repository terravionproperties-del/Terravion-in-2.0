import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { getProjectPlotOverrides, upsertPlotOverride } from "@/lib/repos/inventory";
import { can } from "@/lib/rbac";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, PATCH, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Cache-Control": "no-store, no-cache, must-revalidate",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

export async function GET(req: NextRequest) {
  const projectSlug = req.nextUrl.searchParams.get("project") || "sanctuary";

  try {
    const overrides = getProjectPlotOverrides(projectSlug);
    return NextResponse.json(
      { success: true, project: projectSlug, overrides },
      { headers: CORS_HEADERS }
    );
  } catch (error) {
    console.error("[inventory] GET error:", error);
    return NextResponse.json(
      { error: "Failed to fetch inventory overrides" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: CORS_HEADERS });
  }

  // Verify permission: ADMIN, SALES_MANAGER, or roles holding inventory:update
  const role = session.user.role;
  if (role !== "ADMIN" && !can(role, "inventory:update")) {
    return NextResponse.json({ error: "Forbidden: insufficient permissions" }, { status: 403, headers: CORS_HEADERS });
  }

  try {
    const body = await req.json();
    const {
      projectSlug = "sanctuary",
      plotNumber,
      status,
      facing,
      areaSqYards,
      pricePerSqYard,
      totalPrice,
      isCorner,
      isPremium,
      remarks,
    } = body;

    if (!plotNumber) {
      return NextResponse.json({ error: "plotNumber is required" }, { status: 400, headers: CORS_HEADERS });
    }

    const updated = upsertPlotOverride({
      projectSlug,
      plotNumber: String(plotNumber),
      status,
      facing,
      areaSqYards: areaSqYards !== undefined ? Number(areaSqYards) : undefined,
      pricePerSqYard: pricePerSqYard !== undefined ? Number(pricePerSqYard) : undefined,
      totalPrice: totalPrice !== undefined ? Number(totalPrice) : undefined,
      isCorner,
      isPremium,
      remarks,
      userId: session.user.id,
    });

    return NextResponse.json({ success: true, plot: updated }, { headers: CORS_HEADERS });
  } catch (error) {
    console.error("[inventory] PATCH error:", error);
    return NextResponse.json(
      { error: "Failed to update plot inventory" },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
