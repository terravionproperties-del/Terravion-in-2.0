import { query, transaction } from "@/lib/db";
import type { RequestContext } from "@/lib/request-context";

export interface DuplicatePair {
  LeftId: string;
  RightId: string;
  LeftRef: string;
  RightRef: string;
  LeftName: string;
  RightName: string;
  LeftPhone: string;
  RightPhone: string;
  LeftCreated: Date;
  RightCreated: Date;
  MatchedOn: "PHONE" | "WHATSAPP" | "EMAIL" | "NAME";
  Confidence: number;
}

/** Duplicate pairs: same phone, different leads, neither merged. */
export function listDuplicates(limit = 100) {
  return query<DuplicatePair>`
    SELECT
      a.id AS LeftId,  b.id AS RightId,
      a.reference AS LeftRef, b.reference AS RightRef,
      a.name AS LeftName, b.name AS RightName,
      a.phone AS LeftPhone, b.phone AS RightPhone,
      a.created_at AS LeftCreated, b.created_at AS RightCreated,
      'PHONE' AS MatchedOn,
      100 AS Confidence
    FROM leads AS a
    JOIN leads AS b ON b.phone = a.phone AND b.id > a.id
    WHERE a.merged_into_id IS NULL AND b.merged_into_id IS NULL
    ORDER BY Confidence DESC, b.created_at DESC
    LIMIT ${limit}
  `;
}

export async function countDuplicates(): Promise<number> {
  const rows = await query<{ total: number }>`
    SELECT COUNT(*) AS total
    FROM leads AS a
    JOIN leads AS b ON b.phone = a.phone AND b.id > a.id
    WHERE a.merged_into_id IS NULL AND b.merged_into_id IS NULL
  `;
  return Number(rows[0]?.total ?? 0);
}

export interface MergeRecord {
  Id: string;
  SurvivorId: string;
  MergedId: string;
  MatchedOn: string;
  Confidence: number;
  MergedAt: Date;
  MergedByName: string | null;
  MergedRef: string | null;
}

export function mergeHistory(leadId: string) {
  return query<MergeRecord>`
    SELECT m.id AS Id, m.survivor_id AS SurvivorId, m.merged_id AS MergedId,
           m.matched_on AS MatchedOn, m.confidence AS Confidence, m.merged_at AS MergedAt,
           u.name AS MergedByName, l.reference AS MergedRef
    FROM lead_merges AS m
    LEFT JOIN users AS u ON u.id = m.merged_by_id
    LEFT JOIN leads AS l ON l.id = m.merged_id
    WHERE m.survivor_id = ${leadId}
    ORDER BY m.merged_at DESC
  `;
}

export async function mergeLeads(
  survivorId: string,
  loserId: string,
  matchedOn: string,
  confidence: number,
  actorId: string,
  ctx: RequestContext
): Promise<void> {
  if (survivorId === loserId) throw new Error("Cannot merge a lead into itself");

  await transaction(async (tq) => {
    const loserRows = await tq<Record<string, unknown>>`
      SELECT * FROM leads WHERE id = ${loserId} AND merged_into_id IS NULL
    `;
    if (!loserRows.length) throw new Error("Lead already merged or not found");

    const survivorRows = await tq<{ id: string }>`
      SELECT id FROM leads WHERE id = ${survivorId} AND merged_into_id IS NULL
    `;
    if (!survivorRows.length) throw new Error("Survivor not found");

    const loser = loserRows[0];

    await tq`
      INSERT INTO lead_merges
        (survivor_id, merged_id, matched_on, confidence, snapshot_json, merged_by_id)
      VALUES
        (${survivorId}, ${loserId}, ${matchedOn}, ${confidence},
         ${JSON.stringify(loser)}, ${actorId})
    `;

    await tq`
      UPDATE lead_activities SET lead_id = ${survivorId} WHERE lead_id = ${loserId}
    `;

    await tq`
      UPDATE leads
      SET email             = COALESCE(email,          (SELECT email          FROM leads WHERE id = ${loserId})),
          whatsapp          = COALESCE(whatsapp,        (SELECT whatsapp       FROM leads WHERE id = ${loserId})),
          budget_min        = COALESCE(budget_min,      (SELECT budget_min     FROM leads WHERE id = ${loserId})),
          budget_max        = COALESCE(budget_max,      (SELECT budget_max     FROM leads WHERE id = ${loserId})),
          project_id        = COALESCE(project_id,      (SELECT project_id     FROM leads WHERE id = ${loserId})),
          owner_id          = COALESCE(owner_id,        (SELECT owner_id       FROM leads WHERE id = ${loserId})),
          preferred_facing  = COALESCE(preferred_facing,(SELECT preferred_facing FROM leads WHERE id = ${loserId})),
          remarks           = COALESCE(remarks,         (SELECT remarks        FROM leads WHERE id = ${loserId})),
          gclid             = COALESCE(gclid,           (SELECT gclid          FROM leads WHERE id = ${loserId})),
          fbclid            = COALESCE(fbclid,          (SELECT fbclid         FROM leads WHERE id = ${loserId})),
          campaign          = COALESCE(campaign,        (SELECT campaign       FROM leads WHERE id = ${loserId})),
          utm_source        = COALESCE(utm_source,      (SELECT utm_source     FROM leads WHERE id = ${loserId})),
          last_activity_at  = datetime('now'),
          updated_at        = datetime('now')
      WHERE id = ${survivorId}
    `;

    await tq`
      UPDATE leads
      SET merged_into_id = ${survivorId}, updated_at = datetime('now')
      WHERE id = ${loserId}
    `;

    await tq`
      INSERT INTO lead_activities
        (lead_id, user_id, type, body, before_json, after_json)
      VALUES
        (${survivorId}, ${actorId}, 'MERGE',
         ${`Merged ${String(loser.reference ?? loserId)} into this record (matched on ${matchedOn.toLowerCase()}).`},
         ${JSON.stringify({ mergedId: loserId, reference: loser.reference })},
         ${JSON.stringify({ survivorId, matchedOn, confidence })})
    `;

    await tq`
      INSERT INTO audit_log (user_id, action, entity, entity_id, before_json, after_json, ip, user_agent)
      VALUES (${actorId}, 'lead.merge', 'Lead', ${survivorId},
              ${JSON.stringify({ mergedId: loserId })},
              ${JSON.stringify({ survivorId, matchedOn, confidence })},
              ${ctx.ip}, ${ctx.userAgent})
    `;
  });
}
