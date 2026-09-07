import { NextResponse, type NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { can, scopeFor } from "@/lib/rbac";
import {
  LEAD_STAGES,
  LEAD_SOURCES,
  type LeadStage,
  type LeadSource,
} from "@/lib/repos/leads";
import { exportLeads, EXPORT_ROW_CAP, type ExportLeadRow } from "@/lib/repos/reports";
import { toCsv, toSpreadsheetXml, type Column } from "@/lib/export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Lead export.
 *
 * Takes the same query string the Leads screen uses, so "export what I am
 * looking at" is a link rather than a second filter UI to keep in step.
 *
 * The row-level scope is applied inside the query, not to the result. That is
 * the whole security argument: a sales executive who types this URL by hand
 * gets their own leads, because `exportLeads` never selected anyone else's.
 */

/** Header order is the column order in the file. */
const COLUMNS: Column<ExportLeadRow>[] = [
  { key: "Reference", header: "Reference" },
  { key: "Name", header: "Name" },
  { key: "Phone", header: "Phone" },
  { key: "WhatsApp", header: "WhatsApp" },
  { key: "Email", header: "Email" },
  { key: "Stage", header: "Stage" },
  { key: "Source", header: "Source" },
  { key: "Quality", header: "Quality" },
  { key: "Score", header: "Score" },
  { key: "ProjectName", header: "Project" },
  { key: "OwnerName", header: "Owner" },
  { key: "BudgetMin", header: "Budget min" },
  { key: "BudgetMax", header: "Budget max" },
  { key: "PlotSizeMin", header: "Plot size min" },
  { key: "PlotSizeMax", header: "Plot size max" },
  { key: "PreferredFacing", header: "Preferred facing" },
  { key: "Campaign", header: "Campaign" },
  { key: "UtmSource", header: "UTM source" },
  { key: "UtmMedium", header: "UTM medium" },
  { key: "UtmCampaign", header: "UTM campaign" },
  { key: "LostReason", header: "Lost reason" },
  { key: "NextFollowUpAt", header: "Next follow-up (UTC)" },
  { key: "FirstContactedAt", header: "First contacted (UTC)" },
  { key: "LastActivityAt", header: "Last activity (UTC)" },
  { key: "CreatedAt", header: "Created (UTC)" },
];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }
  // `lead:export` is defined in the matrix, so the narrower permission wins.
  // Gating on report:read would let every telecaller walk out with the
  // customer list, which is the one thing an export must not allow.
  if (!can(session.user.role, "lead:export")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const sp = req.nextUrl.searchParams;
  const csv = sp.get("format") !== "xlsx";

  const stage = sp.get("stage");
  const source = sp.get("source");
  const from = sp.get("from");
  const to = sp.get("to");

  const { rows, truncated } = await exportLeads(
    {
      search: sp.get("q") ?? undefined,
      // An unrecognised value is dropped, not refused: a stale bookmark should
      // return the unfiltered list rather than an error page.
      stage: LEAD_STAGES.includes(stage as LeadStage) ? (stage as LeadStage) : undefined,
      source: LEAD_SOURCES.includes(source as LeadSource) ? (source as LeadSource) : undefined,
      ownerId: sp.get("ownerId") ?? undefined,
      projectId: sp.get("projectId") ?? undefined,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(`${to}T23:59:59.999Z`) : undefined,
    },
    scopeFor(session.user.role, "lead"),
    session.user.id
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const body = csv
    ? toCsv(rows, COLUMNS)
    : toSpreadsheetXml(rows, COLUMNS, `Leads ${stamp}`);

  // SpreadsheetML is XML, not the zipped OOXML that .xlsx means. Naming it
  // .xlsx makes Excel refuse the file outright, so ?format=xlsx returns .xls,
  // which Excel opens after a one-time "the format differs" prompt.
  const filename = `terravion-leads-${stamp}.${csv ? "csv" : "xls"}`;

  return new NextResponse(new TextEncoder().encode(body), {
    headers: {
      "Content-Type": csv
        ? "text/csv; charset=utf-8"
        : "application/vnd.ms-excel; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      // Truncation is announced rather than silent. A file that quietly stops
      // at ten thousand rows is worse than no file.
      "X-Export-Row-Cap": String(EXPORT_ROW_CAP),
      "X-Export-Row-Count": String(rows.length),
      "X-Export-Truncated": truncated ? "true" : "false",
      // Customer contact details. No proxy keeps a copy.
      "Cache-Control": "no-store, private",
    },
  });
}
