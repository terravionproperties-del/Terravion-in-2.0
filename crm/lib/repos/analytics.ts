import { query, queryOne } from "@/lib/db";

/**
 * Executive analytics — SQLite version.
 * Returns PascalCase properties for UI components.
 */

export interface Headline {
  LeadsToday: number;
  CallsToday: number;
  VisitsToday: number;
  BookingsToday: number;
  LeadsMonth: number;
  BookingsMonth: number;
  LostMonth: number;
  OpenLeads: number;
  PendingFollowUps: number;
  OverdueFollowUps: number;
}

export function headline(
  dayStart: Date,
  dayEnd: Date,
  monthStart: Date,
  mine: string | null
) {
  return queryOne<Headline>`
    SELECT
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND created_at BETWEEN ${dayStart} AND ${dayEnd}
          AND (${mine} IS NULL OR owner_id = ${mine}))                    AS LeadsToday,
      (SELECT COUNT(*) FROM lead_activities
        WHERE type = 'CALL' AND occurred_at BETWEEN ${dayStart} AND ${dayEnd}
          AND (${mine} IS NULL OR user_id = ${mine}))                     AS CallsToday,
      (SELECT COUNT(*) FROM lead_activities
        WHERE type = 'SITE_VISIT' AND occurred_at BETWEEN ${dayStart} AND ${dayEnd}) AS VisitsToday,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND stage = 'BOOKING_AMOUNT_PAID'
          AND updated_at BETWEEN ${dayStart} AND ${dayEnd})               AS BookingsToday,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND created_at >= ${monthStart}
          AND (${mine} IS NULL OR owner_id = ${mine}))                    AS LeadsMonth,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND updated_at >= ${monthStart}
          AND stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED')) AS BookingsMonth,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND updated_at >= ${monthStart}
          AND stage IN ('LOST','CANCELLED'))                              AS LostMonth,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND stage NOT IN ('COMPLETED','LOST','CANCELLED')
          AND (${mine} IS NULL OR owner_id = ${mine}))                   AS OpenLeads,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND next_follow_up_at IS NOT NULL
          AND (${mine} IS NULL OR owner_id = ${mine}))                   AS PendingFollowUps,
      (SELECT COUNT(*) FROM leads
        WHERE merged_into_id IS NULL AND next_follow_up_at < datetime('now')
          AND stage NOT IN ('COMPLETED','LOST','CANCELLED')
          AND (${mine} IS NULL OR owner_id = ${mine}))                   AS OverdueFollowUps
  `;
}

export interface DayPoint {
  Day: Date | string;
  Leads: number;
  Won: number;
}

export function dailyTrend(from: Date, to: Date, mine: string | null) {
  const fromStr = typeof from === "string" ? from : from.toISOString().slice(0, 10);
  const toStr   = typeof to   === "string" ? to   : to.toISOString().slice(0, 10);
  return query<DayPoint>`
    WITH RECURSIVE days(d) AS (
      SELECT ${fromStr}
      UNION ALL
      SELECT date(d, '+1 day') FROM days WHERE d < ${toStr}
    )
    SELECT
      days.d AS Day,
      (SELECT COUNT(*) FROM leads l
        WHERE l.merged_into_id IS NULL AND strftime('%Y-%m-%d', l.created_at) = days.d
          AND (${mine} IS NULL OR l.owner_id = ${mine}))  AS Leads,
      (SELECT COUNT(*) FROM leads l
        WHERE l.merged_into_id IS NULL AND strftime('%Y-%m-%d', l.updated_at) = days.d
          AND l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED')
          AND (${mine} IS NULL OR l.owner_id = ${mine}))  AS Won
    FROM days
    ORDER BY days.d
  `;
}

export interface SourceRow {
  Source: string;
  Total: number;
  Won: number;
  Lost: number;
}

export function bySource(from: Date, mine: string | null) {
  return query<SourceRow>`
    SELECT source AS Source,
           COUNT(*) AS Total,
           SUM(CASE WHEN stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END) AS Won,
           SUM(CASE WHEN stage IN ('LOST','CANCELLED') THEN 1 ELSE 0 END) AS Lost
    FROM leads
    WHERE merged_into_id IS NULL AND created_at >= ${from}
      AND (${mine} IS NULL OR owner_id = ${mine})
    GROUP BY source
    ORDER BY Total DESC
  `;
}

export interface ExecutiveRow {
  OwnerId: string | null;
  Name: string;
  Total: number;
  Won: number;
  Lost: number;
  OpenCount: number;
  Calls: number;
}

export function byExecutive(from: Date) {
  return query<ExecutiveRow>`
    SELECT u.id AS OwnerId, u.name AS Name,
           COUNT(l.id) AS Total,
           SUM(CASE WHEN l.stage IN ('BOOKING_AMOUNT_PAID','AGREEMENT','REGISTRATION','COMPLETED') THEN 1 ELSE 0 END) AS Won,
           SUM(CASE WHEN l.stage IN ('LOST','CANCELLED') THEN 1 ELSE 0 END) AS Lost,
           SUM(CASE WHEN l.stage NOT IN ('COMPLETED','LOST','CANCELLED') AND l.id IS NOT NULL THEN 1 ELSE 0 END) AS OpenCount,
           (SELECT COUNT(*) FROM lead_activities a
             WHERE a.user_id = u.id AND a.type = 'CALL' AND a.occurred_at >= ${from}) AS Calls
    FROM users AS u
    LEFT JOIN leads AS l
           ON l.owner_id = u.id AND l.merged_into_id IS NULL AND l.created_at >= ${from}
    WHERE u.is_active = 1
      AND u.role IN ('SALES_EXECUTIVE','SALES_MANAGER','TELECALLER')
    GROUP BY u.id, u.name
    ORDER BY Won DESC, Total DESC
  `;
}

export interface FunnelRow {
  Stage: string;
  Count: number;
}

export function funnel(from: Date, mine: string | null) {
  return query<FunnelRow>`
    SELECT stage AS Stage, COUNT(*) AS Count
    FROM leads
    WHERE merged_into_id IS NULL AND created_at >= ${from}
      AND (${mine} IS NULL OR owner_id = ${mine})
    GROUP BY stage
  `;
}

export interface LostReasonRow {
  LostReason: string | null;
  Count: number;
}

export function lostReasons(from: Date) {
  return query<LostReasonRow>`
    SELECT lost_reason AS LostReason, COUNT(*) AS Count
    FROM leads
    WHERE merged_into_id IS NULL AND stage IN ('LOST','CANCELLED') AND updated_at >= ${from}
    GROUP BY lost_reason
    ORDER BY Count DESC
    LIMIT 8
  `;
}

export interface FeedRow {
  Id: string;
  LeadId: string;
  Reference: string;
  LeadName: string;
  Type: string;
  Body: string | null;
  OccurredAt: Date;
  UserName: string | null;
}

export function activityFeed(limit: number, mine: string | null) {
  return query<FeedRow>`
    SELECT
      a.id AS Id, a.lead_id AS LeadId, l.reference AS Reference, l.name AS LeadName,
      a.type AS Type, a.body AS Body, a.occurred_at AS OccurredAt, u.name AS UserName
    FROM lead_activities AS a
    JOIN leads AS l ON l.id = a.lead_id
    LEFT JOIN users AS u ON u.id = a.user_id
    WHERE (${mine} IS NULL OR l.owner_id = ${mine})
    ORDER BY a.occurred_at DESC
    LIMIT ${limit}
  `;
}
