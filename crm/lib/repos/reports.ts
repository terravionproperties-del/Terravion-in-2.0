import { query } from "@/lib/db";
import type { Scope } from "@/lib/rbac";
import type { LeadFilters, LeadSource } from "@/lib/repos/leads";

/* ── shapes ─────────────────────────────────────────────────────────── */

export const REPORT_PERIODS = ["DAY", "WEEK", "MONTH", "QUARTER", "YEAR"] as const;
export type ReportPeriod = (typeof REPORT_PERIODS)[number];

export interface ReportRange {
  period: ReportPeriod;
  from: Date;
  to: Date;
  projectId?: string | null;
  ownerId?: string | null;
  source?: LeadSource | null;
  mine?: string | null;
}

export interface BucketRow {
  Bucket: Date | string;
  Leads: number;
  Visits: number;
  Bookings: number;
  Lost: number;
  Conversion: number | null;
}

export interface SourceBreakdownRow {
  Source: string;
  Leads: number;
  Visits: number;
  Bookings: number;
  Lost: number;
  Conversion: number | null;
}

export interface ExecutiveBreakdownRow {
  OwnerId: string;
  Name: string;
  Leads: number;
  Bookings: number;
  Lost: number;
  Calls: number;
  Conversion: number | null;
}

export interface FilterOption {
  Id: string;
  Name: string;
}

const MAX_SPAN_DAYS: Record<ReportPeriod, number> = {
  DAY: 400,
  WEEK: 1400,
  MONTH: 3700,
  QUARTER: 11000,
  YEAR: 36600,
};

const DAY_MS = 86_400_000;

export function clampRange(
  period: ReportPeriod,
  from: Date,
  to: Date
): { from: Date; to: Date; clamped: boolean } {
  let start = from;
  let end = to;
  if (start.getTime() > end.getTime()) [start, end] = [end, start];

  const limit = MAX_SPAN_DAYS[period] * DAY_MS;
  if (end.getTime() - start.getTime() > limit) {
    return { from: new Date(end.getTime() - limit), to: end, clamped: true };
  }
  return { from: start, to: end, clamped: false };
}

/* ── the bucketed report ────────────────────────────────────────────── */

export function bucketedReport(r: ReportRange) {
  const project = r.projectId ?? null;
  const owner = r.ownerId ?? null;
  const source = r.source ?? null;
  const mine = r.mine ?? null;
  const fromStr = typeof r.from === "string" ? r.from : r.from.toISOString().slice(0, 10);
  const toStr   = typeof r.to   === "string" ? r.to   : r.to.toISOString().slice(0, 10);

  return query<BucketRow>`
    WITH RECURSIVE days(d) AS (
      SELECT ${fromStr}
      UNION ALL
      SELECT date(d, '+1 day') FROM days WHERE d < ${toStr}
    ),
    captured AS (
      SELECT strftime('%Y-%m-%d', l.created_at) AS Bucket, COUNT(*) AS N
      FROM leads AS l
      WHERE l.merged_into_id IS NULL
        AND l.created_at >= ${r.from} AND l.created_at <= ${r.to}
        AND (${mine} IS NULL OR l.owner_id = ${mine})
        AND (${owner} IS NULL OR l.owner_id = ${owner})
        AND (${project} IS NULL OR l.project_id = ${project})
        AND (${source} IS NULL OR l.source = ${source})
      GROUP BY strftime('%Y-%m-%d', l.created_at)
    ),
    outcomes AS (
      SELECT strftime('%Y-%m-%d', l.updated_at) AS Bucket,
             SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END) AS Bookings,
             SUM(CASE WHEN l.stage IN ('LOST','CANCELLED') THEN 1 ELSE 0 END) AS Lost
      FROM leads AS l
      WHERE l.merged_into_id IS NULL
        AND l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED','LOST','CANCELLED')
        AND l.updated_at >= ${r.from} AND l.updated_at <= ${r.to}
        AND (${mine} IS NULL OR l.owner_id = ${mine})
        AND (${owner} IS NULL OR l.owner_id = ${owner})
        AND (${project} IS NULL OR l.project_id = ${project})
        AND (${source} IS NULL OR l.source = ${source})
      GROUP BY strftime('%Y-%m-%d', l.updated_at)
    ),
    visits AS (
      SELECT strftime('%Y-%m-%d', a.occurred_at) AS Bucket, COUNT(*) AS N
      FROM lead_activities AS a
      JOIN leads AS l ON l.id = a.lead_id
      WHERE a.type = 'SITE_VISIT'
        AND a.occurred_at >= ${r.from} AND a.occurred_at <= ${r.to}
        AND l.merged_into_id IS NULL
        AND (${mine} IS NULL OR l.owner_id = ${mine})
        AND (${owner} IS NULL OR l.owner_id = ${owner})
        AND (${project} IS NULL OR l.project_id = ${project})
        AND (${source} IS NULL OR l.source = ${source})
      GROUP BY strftime('%Y-%m-%d', a.occurred_at)
    )
    SELECT
      bk.d AS Bucket,
      COALESCE(c.N, 0)        AS Leads,
      COALESCE(v.N, 0)        AS Visits,
      COALESCE(o.Bookings, 0) AS Bookings,
      COALESCE(o.Lost, 0)     AS Lost,
      CASE WHEN (COALESCE(o.Bookings, 0) + COALESCE(o.Lost, 0)) > 0
           THEN CAST(ROUND(100.0 * COALESCE(o.Bookings, 0) / (COALESCE(o.Bookings, 0) + COALESCE(o.Lost, 0))) AS INT)
           ELSE NULL END AS Conversion
    FROM days AS bk
    LEFT JOIN captured AS c ON c.Bucket = bk.d
    LEFT JOIN outcomes AS o ON o.Bucket = bk.d
    LEFT JOIN visits   AS v ON v.Bucket = bk.d
    ORDER BY bk.d
  `;
}

/* ── breakdowns over the same range ─────────────────────────────────── */

export function sourceBreakdown(r: ReportRange) {
  const project = r.projectId ?? null;
  const owner = r.ownerId ?? null;
  const source = r.source ?? null;
  const mine = r.mine ?? null;

  return query<SourceBreakdownRow>`
    SELECT
      l.source AS Source,
      COUNT(*) AS Leads,
      (SELECT COUNT(*) FROM lead_activities a WHERE a.lead_id = l.id AND a.type = 'SITE_VISIT') AS Visits,
      SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END) AS Bookings,
      SUM(CASE WHEN l.stage IN ('LOST','CANCELLED') THEN 1 ELSE 0 END) AS Lost,
      CASE WHEN SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED','LOST','CANCELLED') THEN 1 ELSE 0 END) > 0
           THEN CAST(ROUND(100.0 * SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END)
                / SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED','LOST','CANCELLED') THEN 1 ELSE 0 END)) AS INT)
           ELSE NULL END AS Conversion
    FROM leads AS l
    WHERE l.merged_into_id IS NULL
      AND l.created_at >= ${r.from} AND l.created_at <= ${r.to}
      AND (${mine} IS NULL OR l.owner_id = ${mine})
      AND (${owner} IS NULL OR l.owner_id = ${owner})
      AND (${project} IS NULL OR l.project_id = ${project})
      AND (${source} IS NULL OR l.source = ${source})
    GROUP BY l.source
    ORDER BY Leads DESC
  `;
}

export function executiveBreakdown(r: ReportRange) {
  const project = r.projectId ?? null;
  const owner = r.ownerId ?? null;
  const source = r.source ?? null;
  const mine = r.mine ?? null;

  return query<ExecutiveBreakdownRow>`
    SELECT
      u.id AS OwnerId,
      u.name AS Name,
      COUNT(l.id) AS Leads,
      SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END) AS Bookings,
      SUM(CASE WHEN l.stage IN ('LOST','CANCELLED') THEN 1 ELSE 0 END) AS Lost,
      (SELECT COUNT(*) FROM lead_activities AS a
        WHERE a.user_id = u.id AND a.type = 'CALL'
          AND a.occurred_at >= ${r.from} AND a.occurred_at <= ${r.to}) AS Calls,
      CASE WHEN SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED','LOST','CANCELLED') THEN 1 ELSE 0 END) > 0
           THEN CAST(ROUND(100.0 * SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END)
                / SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED','LOST','CANCELLED') THEN 1 ELSE 0 END)) AS INT)
           ELSE NULL END AS Conversion
    FROM users AS u
    LEFT JOIN leads AS l
           ON l.owner_id = u.id
          AND l.merged_into_id IS NULL
          AND l.created_at >= ${r.from} AND l.created_at <= ${r.to}
          AND (${project} IS NULL OR l.project_id = ${project})
          AND (${source} IS NULL OR l.source = ${source})
    WHERE u.is_active = 1
      AND u.role IN ('SALES_EXECUTIVE','SALES_MANAGER','TELECALLER')
      AND (${mine} IS NULL OR u.id = ${mine})
      AND (${owner} IS NULL OR u.id = ${owner})
    GROUP BY u.id, u.name
    ORDER BY Bookings DESC, Leads DESC
  `;
}

/* ── filter dropdowns ───────────────────────────────────────────────── */

export function reportProjects() {
  return query<FilterOption>`
    SELECT id AS Id, name AS Name FROM projects ORDER BY name
  `;
}

export function reportOwners() {
  return query<FilterOption>`
    SELECT id AS Id, name AS Name FROM users
    WHERE is_active = 1 AND role IN ('SALES_EXECUTIVE','SALES_MANAGER','TELECALLER')
    ORDER BY name
  `;
}

/* ── export ─────────────────────────────────────────────────────────── */

export const EXPORT_ROW_CAP = 10_000;

export interface ExportLeadRow {
  Reference: string;
  Name: string;
  Phone: string;
  WhatsApp: string | null;
  Email: string | null;
  Stage: string;
  Source: string;
  Quality: string;
  Score: number;
  BudgetMin: number | null;
  BudgetMax: number | null;
  PlotSizeMin: number | null;
  PlotSizeMax: number | null;
  PreferredFacing: string | null;
  ProjectName: string | null;
  OwnerName: string | null;
  Campaign: string | null;
  UtmSource: string | null;
  UtmMedium: string | null;
  UtmCampaign: string | null;
  LostReason: string | null;
  NextFollowUpAt: Date | null;
  FirstContactedAt: Date | null;
  LastActivityAt: Date | null;
  CreatedAt: Date;
}

export async function exportLeads(
  filters: LeadFilters,
  scope: Scope,
  viewerId: string,
  cap: number = EXPORT_ROW_CAP
): Promise<{ rows: ExportLeadRow[]; truncated: boolean }> {
  if (scope === "none") return { rows: [], truncated: false };

  const ownerScopeId = scope === "own" ? viewerId : null;
  const search = filters.search?.trim() || null;
  const searchDigits = search ? search.replace(/\D/g, "") : "";
  const namePrefix = search ? `${search}%` : null;
  const phoneSuffix = searchDigits ? `%${searchDigits}` : null;

  const rows = await query<ExportLeadRow>`
    SELECT
      l.reference AS Reference, l.name AS Name, l.phone AS Phone, l.whatsapp AS WhatsApp, l.email AS Email,
      l.stage AS Stage, l.source AS Source, l.quality AS Quality, l.score AS Score,
      l.budget_min AS BudgetMin, l.budget_max AS BudgetMax, l.plot_size_min AS PlotSizeMin, l.plot_size_max AS PlotSizeMax,
      l.preferred_facing AS PreferredFacing, l.campaign AS Campaign,
      l.utm_source AS UtmSource, l.utm_medium AS UtmMedium, l.utm_campaign AS UtmCampaign,
      l.lost_reason AS LostReason, l.next_follow_up_at AS NextFollowUpAt, l.first_contacted_at AS FirstContactedAt,
      l.last_activity_at AS LastActivityAt, l.created_at AS CreatedAt,
      p.name AS ProjectName,
      u.name AS OwnerName
    FROM leads AS l
    LEFT JOIN projects AS p ON p.id = l.project_id
    LEFT JOIN users    AS u ON u.id = l.owner_id
    WHERE l.merged_into_id IS NULL
      AND (${ownerScopeId} IS NULL OR l.owner_id = ${ownerScopeId})
      AND (${filters.stage ?? null} IS NULL OR l.stage = ${filters.stage ?? null})
      AND (${filters.source ?? null} IS NULL OR l.source = ${filters.source ?? null})
      AND (${filters.ownerId ?? null} IS NULL OR l.owner_id = ${filters.ownerId ?? null})
      AND (${filters.projectId ?? null} IS NULL OR l.project_id = ${filters.projectId ?? null})
      AND (${filters.budgetMin ?? null} IS NULL OR l.budget_max >= ${filters.budgetMin ?? null})
      AND (${filters.budgetMax ?? null} IS NULL OR l.budget_min <= ${filters.budgetMax ?? null})
      AND (${filters.from ?? null} IS NULL OR l.created_at >= ${filters.from ?? null})
      AND (${filters.to ?? null} IS NULL OR l.created_at <= ${filters.to ?? null})
      AND (
        ${search} IS NULL
        OR l.name LIKE ${namePrefix}
        OR l.reference LIKE ${namePrefix}
        OR l.email LIKE ${namePrefix}
        OR (${phoneSuffix} IS NOT NULL AND l.phone LIKE ${phoneSuffix})
      )
    ORDER BY l.created_at DESC
    LIMIT ${cap + 1}
  `;

  return { rows: rows.slice(0, cap), truncated: rows.length > cap };
}
