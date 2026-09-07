import { query, queryOne, transaction, type TransactionQuery } from "@/lib/db";
import type { Scope } from "@/lib/rbac";
import type { RequestContext } from "@/lib/request-context";

export type ActivityContext = RequestContext;

/* ── shapes ─────────────────────────────────────────────────────────── */

export const LEAD_STAGES = [
  "NEW", "CONTACTED", "INTERESTED", "SITE_VISIT_SCHEDULED", "SITE_VISIT_COMPLETED",
  "NEGOTIATION", "BOOKING_AMOUNT_PAID", "AGREEMENT", "REGISTRATION", "COMPLETED",
  "LOST", "CANCELLED",
] as const;
export type LeadStage = (typeof LEAD_STAGES)[number];

export const LEAD_SOURCES = [
  "WEBSITE", "WHATSAPP", "GOOGLE_ADS", "META_ADS", "ORGANIC", "PHONE",
  "WALK_IN", "BROKER", "REFERRAL", "MANUAL", "PORTAL", "OTHER",
] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

export interface LeadListRow {
  Id: string;
  Reference: string;
  Name: string;
  Phone: string;
  Email: string | null;
  Stage: LeadStage;
  Source: LeadSource;
  Quality: string;
  BudgetMin: number | null;
  BudgetMax: number | null;
  ProjectName: string | null;
  OwnerName: string | null;
  NextFollowUpAt: Date | null;
  LastActivityAt: Date | null;
  CreatedAt: Date;
  TotalCount?: number;
}

export interface LeadFilters {
  search?: string;
  stage?: LeadStage;
  source?: LeadSource;
  ownerId?: string;
  projectId?: string;
  budgetMin?: number;
  budgetMax?: number;
  from?: Date;
  to?: Date;
  page?: number;
  pageSize?: number;
}

export function normalisePhone(raw: string, defaultCountry = "91"): string {
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (raw.trim().startsWith("+")) return `+${digits}`;
  if (digits.length === 10) return `+${defaultCountry}${digits}`;
  if (digits.length > 10 && digits.startsWith(defaultCountry)) return `+${digits}`;
  return `+${digits}`;
}

/* ── list ───────────────────────────────────────────────────────────── */

export async function listLeads(
  filters: LeadFilters,
  scope: Scope,
  viewerId: string
): Promise<{ rows: LeadListRow[]; total: number; page: number; pageSize: number }> {
  if (scope === "none") return { rows: [], total: 0, page: 1, pageSize: 0 };

  const page = Math.max(1, filters.page ?? 1);
  const pageSize = Math.min(100, Math.max(10, filters.pageSize ?? 25));
  const offset = (page - 1) * pageSize;

  const ownerScopeId = scope === "own" ? viewerId : null;
  const search = filters.search?.trim() || null;
  const searchDigits = search ? search.replace(/\D/g, "") : "";
  const namePrefix = search ? `${search}%` : null;
  const phoneSuffix = searchDigits ? `%${searchDigits}` : null;

  const countRows = await query<{ n: number }>`
    SELECT COUNT(*) AS n
    FROM leads AS l
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
  `;
  const total = Number(countRows[0]?.n ?? 0);

  const rows = await query<LeadListRow>`
    SELECT
      l.id AS Id, l.reference AS Reference, l.name AS Name, l.phone AS Phone, l.email AS Email,
      l.stage AS Stage, l.source AS Source, l.quality AS Quality,
      l.budget_min AS BudgetMin, l.budget_max AS BudgetMax,
      l.next_follow_up_at AS NextFollowUpAt, l.last_activity_at AS LastActivityAt, l.created_at AS CreatedAt,
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
    LIMIT ${pageSize} OFFSET ${offset}
  `;

  return { rows, total, page, pageSize };
}

/* ── detail ─────────────────────────────────────────────────────────── */

export interface LeadDetail {
  Id: string;
  Reference: string;
  Name: string;
  Phone: string;
  WhatsApp: string | null;
  Email: string | null;
  Stage: LeadStage;
  Source: LeadSource;
  Quality: string;
  Score: number;
  BudgetMin: number | null;
  BudgetMax: number | null;
  PreferredFacing: string | null;
  PlotSizeMin: number | null;
  PlotSizeMax: number | null;
  Remarks: string | null;
  LostReason: string | null;
  Campaign: string | null;
  UtmSource: string | null;
  UtmMedium: string | null;
  UtmCampaign: string | null;
  Gclid: string | null;
  Fbclid: string | null;
  LandingPage: string | null;
  Referrer: string | null;
  ProjectId: string | null;
  ProjectName: string | null;
  OwnerId: string | null;
  OwnerName: string | null;
  NextFollowUpAt: Date | null;
  FirstContactedAt: Date | null;
  LastActivityAt: Date | null;
  CreatedAt: Date;
}

export function getLead(id: string, scope: Scope, viewerId: string) {
  if (scope === "none") return Promise.resolve(null);
  const ownerScopeId = scope === "own" ? viewerId : null;
  return queryOne<LeadDetail>`
    SELECT
      l.id AS Id, l.reference AS Reference, l.name AS Name, l.phone AS Phone,
      l.whatsapp AS WhatsApp, l.email AS Email, l.stage AS Stage, l.source AS Source,
      l.quality AS Quality, l.score AS Score, l.budget_min AS BudgetMin, l.budget_max AS BudgetMax,
      l.preferred_facing AS PreferredFacing, l.plot_size_min AS PlotSizeMin, l.plot_size_max AS PlotSizeMax,
      l.remarks AS Remarks, l.lost_reason AS LostReason, l.campaign AS Campaign,
      l.utm_source AS UtmSource, l.utm_medium AS UtmMedium, l.utm_campaign AS UtmCampaign,
      l.gclid AS Gclid, l.fbclid AS Fbclid, l.landing_page AS LandingPage, l.referrer AS Referrer,
      l.project_id AS ProjectId, p.name AS ProjectName,
      l.owner_id AS OwnerId, u.name AS OwnerName,
      l.next_follow_up_at AS NextFollowUpAt, l.first_contacted_at AS FirstContactedAt,
      l.last_activity_at AS LastActivityAt, l.created_at AS CreatedAt
    FROM leads AS l
    LEFT JOIN projects AS p ON p.id = l.project_id
    LEFT JOIN users    AS u ON u.id = l.owner_id
    WHERE l.id = ${id}
      AND (${ownerScopeId} IS NULL OR l.owner_id = ${ownerScopeId})
  `;
}

export interface ActivityRow {
  Id: string;
  Type: string;
  Body: string | null;
  MetaJson: string | null;
  OccurredAt: Date;
  UserName: string | null;
  Ip: string | null;
  Browser: string | null;
  Os: string | null;
  DeviceType: string | null;
  City: string | null;
  Country: string | null;
  Channel?: string | null;
  BeforeJson: string | null;
  AfterJson: string | null;
}

export function getTimeline(leadId: string, limit = 200) {
  return query<ActivityRow>`
    SELECT
      a.id AS Id, a.type AS Type, a.body AS Body, a.meta_json AS MetaJson, a.occurred_at AS OccurredAt,
      a.ip AS Ip, a.browser AS Browser, a.os AS Os, a.device_type AS DeviceType, a.city AS City, a.country AS Country,
      a.before_json AS BeforeJson, a.after_json AS AfterJson,
      u.name AS UserName
    FROM lead_activities AS a
    LEFT JOIN users AS u ON u.id = a.user_id
    WHERE a.lead_id = ${leadId}
    ORDER BY a.occurred_at DESC
    LIMIT ${limit}
  `;
}

/* ── writes ─────────────────────────────────────────────────────────── */

export interface NewLead {
  name: string;
  phone: string;
  whatsapp?: string | null;
  email?: string | null;
  source: LeadSource;
  projectId?: string | null;
  budgetMin?: number | null;
  budgetMax?: number | null;
  preferredFacing?: string | null;
  plotSizeMin?: number | null;
  plotSizeMax?: number | null;
  remarks?: string | null;
  campaign?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  utmTerm?: string | null;
  utmContent?: string | null;
  gclid?: string | null;
  fbclid?: string | null;
  landingPage?: string | null;
  referrer?: string | null;
  ownerId?: string | null;
}

export interface CreateResult {
  id: string;
  reference: string;
  duplicate: boolean;
}

export async function createLead(
  input: NewLead,
  actorId: string | null,
  ctx: ActivityContext
): Promise<CreateResult> {
  const phone = normalisePhone(input.phone);

  return transaction(async (tq) => {
    const existing = await tq<{ id: string; reference: string }>`
      SELECT id, reference FROM leads
      WHERE phone = ${phone}
        AND merged_into_id IS NULL
        AND ((project_id IS NULL AND ${input.projectId ?? null} IS NULL)
             OR project_id = ${input.projectId ?? null})
    `;

    if (existing.length) {
      const lead = existing[0];
      await tq`
        INSERT INTO lead_activities
          (lead_id, user_id, type, body, meta_json)
        VALUES
          (${lead.id}, ${actorId}, 'NOTE',
           ${`Repeat enquiry via ${input.source}.`},
           ${JSON.stringify({ source: input.source, campaign: input.campaign ?? null, utmSource: input.utmSource ?? null, gclid: input.gclid ?? null })})
      `;
      await tq`
        UPDATE leads
        SET last_activity_at = datetime('now'), updated_at = datetime('now')
        WHERE id = ${lead.id}
      `;
      return { id: lead.id, reference: lead.reference, duplicate: true };
    }

    const created = await tq<{ id: string; reference: string }>`
      INSERT INTO leads
        (name, phone, whatsapp, email, source, project_id, budget_min, budget_max,
         preferred_facing, plot_size_min, plot_size_max, remarks, campaign,
         utm_source, utm_medium, utm_campaign, utm_term, utm_content,
         gclid, fbclid, landing_page, referrer, owner_id, last_activity_at)
      VALUES
        (${input.name}, ${phone}, ${input.whatsapp ?? null}, ${input.email ?? null},
         ${input.source}, ${input.projectId ?? null},
         ${input.budgetMin ?? null}, ${input.budgetMax ?? null},
         ${input.preferredFacing ?? null}, ${input.plotSizeMin ?? null},
         ${input.plotSizeMax ?? null}, ${input.remarks ?? null},
         ${input.campaign ?? null}, ${input.utmSource ?? null},
         ${input.utmMedium ?? null}, ${input.utmCampaign ?? null},
         ${input.utmTerm ?? null}, ${input.utmContent ?? null},
         ${input.gclid ?? null}, ${input.fbclid ?? null},
         ${input.landingPage ?? null}, ${input.referrer ?? null},
         ${input.ownerId ?? null}, datetime('now'))
      RETURNING id, reference
    `;

    const lead = created[0];
    await tq`
      INSERT INTO lead_activities
        (lead_id, user_id, type, body, meta_json)
      VALUES
        (${lead.id}, ${actorId}, 'CREATED',
         ${`Lead captured from ${input.source}.`},
         ${JSON.stringify({ source: input.source, campaign: input.campaign ?? null, utmSource: input.utmSource ?? null, gclid: input.gclid ?? null, landingPage: input.landingPage ?? null })})
    `;
    await writeAudit(tq, actorId, "lead.create", lead.id, null, { name: input.name, phone, source: input.source });

    return { id: lead.id, reference: lead.reference, duplicate: false };
  });
}

export async function changeStage(
  leadId: string,
  next: LeadStage,
  actorId: string,
  ctx: ActivityContext,
  note?: string
) {
  return transaction(async (tq) => {
    const before = await tq<{ stage: LeadStage }>`
      SELECT stage FROM leads WHERE id = ${leadId}
    `;
    if (!before.length) throw new Error("Lead not found");
    const from = before[0].stage;
    if (from === next) return;

    await tq`
      UPDATE leads
      SET stage = ${next},
          lost_reason = CASE WHEN ${next} IN ('LOST','CANCELLED') THEN ${note ?? null} ELSE lost_reason END,
          first_contacted_at = CASE WHEN first_contacted_at IS NULL AND ${next} != 'NEW'
                                    THEN datetime('now') ELSE first_contacted_at END,
          last_activity_at = datetime('now'),
          updated_at = datetime('now')
      WHERE id = ${leadId}
    `;
    await tq`
      INSERT INTO lead_activities
        (lead_id, user_id, type, body, meta_json, before_json, after_json)
      VALUES
        (${leadId}, ${actorId}, 'STAGE_CHANGE',
         ${`${humanise(from)} → ${humanise(next)}${note ? `. ${note}` : ""}`},
         ${JSON.stringify({ from, to: next })},
         ${JSON.stringify({ stage: from })}, ${JSON.stringify({ stage: next })})
    `;
    await writeAudit(tq, actorId, "lead.stage_change", leadId, { stage: from }, { stage: next });
  });
}

export async function assignLead(
  leadId: string,
  ownerId: string,
  actorId: string,
  ctx: ActivityContext
) {
  return transaction(async (tq) => {
    const before = await tq<{ owner_id: string | null }>`
      SELECT owner_id FROM leads WHERE id = ${leadId}
    `;
    const owner = await tq<{ name: string }>`
      SELECT name FROM users WHERE id = ${ownerId}
    `;
    await tq`
      UPDATE leads
      SET owner_id = ${ownerId}, last_activity_at = datetime('now'), updated_at = datetime('now')
      WHERE id = ${leadId}
    `;
    await tq`
      INSERT INTO lead_activities
        (lead_id, user_id, type, body, before_json, after_json)
      VALUES
        (${leadId}, ${actorId}, 'ASSIGNMENT',
         ${`Assigned to ${owner[0]?.name ?? "unknown"}.`},
         ${JSON.stringify({ ownerId: before[0]?.owner_id ?? null })},
         ${JSON.stringify({ ownerId })})
    `;
    await writeAudit(tq, actorId, "lead.assign", leadId,
      { ownerId: before[0]?.owner_id ?? null }, { ownerId });
  });
}

export async function addActivity(
  leadId: string,
  type: string,
  body: string,
  actorId: string,
  ctx: ActivityContext,
  nextFollowUpAt?: Date | null,
  meta?: Record<string, unknown>
) {
  return transaction(async (tq) => {
    await tq`
      INSERT INTO lead_activities
        (lead_id, user_id, type, body, meta_json)
      VALUES
        (${leadId}, ${actorId}, ${type}, ${body}, ${meta ? JSON.stringify(meta) : null})
    `;
    await tq`
      UPDATE leads
      SET last_activity_at = datetime('now'),
          next_follow_up_at = ${nextFollowUpAt ?? null},
          first_contacted_at = CASE WHEN first_contacted_at IS NULL AND ${type} IN ('CALL','WHATSAPP','EMAIL','MEETING')
                                    THEN datetime('now') ELSE first_contacted_at END,
          updated_at = datetime('now')
      WHERE id = ${leadId}
    `;
  });
}

async function writeAudit(
  tq: TransactionQuery,
  userId: string | null,
  action: string,
  entityId: string,
  before: unknown,
  after: unknown
) {
  await tq`
    INSERT INTO audit_log (user_id, action, entity, entity_id, before_json, after_json)
    VALUES (${userId}, ${action}, 'Lead', ${entityId},
            ${before ? JSON.stringify(before) : null},
            ${after ? JSON.stringify(after) : null})
  `;
}

export function humanise(stage: string) {
  return stage
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());
}
