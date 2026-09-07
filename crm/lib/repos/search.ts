import { query } from "@/lib/db";
import { can, canAny, scopeFor } from "@/lib/rbac";
import type { Role } from "@/lib/auth.config";
import { humanise, normalisePhone } from "@/lib/repos/leads";

export type SearchKind = "lead" | "project";

export type SearchMatch =
  | "REFERENCE"
  | "PHONE"
  | "WHATSAPP"
  | "NAME"
  | "EMAIL"
  | "REMARKS"
  | "SLUG";

export interface LeadHit {
  kind: "lead";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  matchedOn: SearchMatch;
}

export interface ProjectHit {
  kind: "project";
  id: string;
  title: string;
  subtitle: string;
  href: string;
  matchedOn: SearchMatch;
}

export type SearchHit = LeadHit | ProjectHit;

export const MIN_TERM_LENGTH = 2;

interface HitRow {
  Kind: SearchKind;
  Id: string;
  Title: string;
  Ref: string | null;
  Phone: string | null;
  Stage: string | null;
  ProjectName: string | null;
  Slug: string | null;
  Status: string | null;
  MatchedOn: SearchMatch;
  Weight: number;
}

function escapeLike(term: string): string {
  return term.replace(/([\\%_[])/g, "\\$1");
}

const REFERENCE = /^tvn-?(\d{1,6})$/i;

function asReference(term: string): string | null {
  const m = REFERENCE.exec(term);
  return m ? `TVN-${m[1].padStart(6, "0")}` : null;
}

interface PhoneTerm {
  exact: string;
  suffix: string;
}

function asPhone(term: string): PhoneTerm | null {
  if (!/^\+?[\d\s().-]+$/.test(term)) return null;
  const digits = term.replace(/\D/g, "");
  if (digits.length < 5) return null;
  return { exact: normalisePhone(term), suffix: `%${digits}` };
}

export async function searchAll(
  term: string,
  role: Role | undefined,
  userId: string,
  limit = 20
): Promise<SearchHit[]> {
  const trimmed = term.trim();
  if (trimmed.length < MIN_TERM_LENGTH) return [];

  const scope = scopeFor(role, "lead");
  const leadsVisible = can(role, "lead:read") && scope !== "none" ? 1 : 0;
  const projectsVisible = canAny(role, ["lead:read", "inventory:read"]) ? 1 : 0;
  if (!leadsVisible && !projectsVisible) return [];

  const ownerScopeId = scope === "own" ? userId : null;
  const reference = asReference(trimmed);
  const phone = asPhone(trimmed);
  const phoneExact = phone?.exact ?? null;
  const phoneSuffix = phone?.suffix ?? null;
  const escaped = escapeLike(trimmed);
  const anywhere = `%${escaped}%`;
  const prefix = `${escaped}%`;
  const top = Math.min(100, Math.max(1, limit));

  const rows = await query<HitRow>`
    WITH hits AS (
      SELECT
        'lead'                                    AS Kind,
        l.id                                      AS Id,
        l.name                                    AS Title,
        l.reference                               AS Ref,
        l.phone                                   AS Phone,
        l.stage                                   AS Stage,
        p.name                                    AS ProjectName,
        NULL                                      AS Slug,
        NULL                                      AS Status,
        CASE
          WHEN ${reference} IS NOT NULL AND l.reference = ${reference}       THEN 'REFERENCE'
          WHEN ${phoneExact} IS NOT NULL AND l.phone = ${phoneExact}         THEN 'PHONE'
          WHEN ${phoneSuffix} IS NOT NULL AND l.phone LIKE ${phoneSuffix}    THEN 'PHONE'
          WHEN ${phoneSuffix} IS NOT NULL AND l.whatsapp LIKE ${phoneSuffix} THEN 'WHATSAPP'
          WHEN l.name LIKE ${anywhere} ESCAPE '\\'                           THEN 'NAME'
          WHEN l.email LIKE ${anywhere} ESCAPE '\\'                          THEN 'EMAIL'
          ELSE 'REMARKS'
        END                                       AS MatchedOn,
        CASE
          WHEN ${reference} IS NOT NULL AND l.reference = ${reference} THEN 0
          WHEN ${phoneExact} IS NOT NULL AND l.phone = ${phoneExact}   THEN 1
          WHEN l.name LIKE ${prefix} ESCAPE '\\'                       THEN 2
          ELSE 4
        END                                       AS Weight,
        COALESCE(l.last_activity_at, l.created_at) AS SortAt
      FROM leads AS l
      LEFT JOIN projects AS p ON p.id = l.project_id
      WHERE ${leadsVisible} = 1
        AND l.merged_into_id IS NULL
        AND (${ownerScopeId} IS NULL OR l.owner_id = ${ownerScopeId})
        AND (
             (${reference} IS NOT NULL AND l.reference = ${reference})
          OR (${phoneExact} IS NOT NULL AND (l.phone = ${phoneExact} OR l.whatsapp = ${phoneExact}))
          OR (${phoneSuffix} IS NOT NULL AND (l.phone LIKE ${phoneSuffix} OR l.whatsapp LIKE ${phoneSuffix}))
          OR l.name    LIKE ${anywhere} ESCAPE '\\'
          OR l.email   LIKE ${anywhere} ESCAPE '\\'
          OR l.remarks LIKE ${anywhere} ESCAPE '\\'
        )

      UNION ALL

      SELECT
        'project',
        pr.id,
        pr.name,
        NULL,
        NULL,
        NULL,
        NULL,
        pr.slug,
        pr.status,
        CASE
          WHEN pr.name LIKE ${anywhere} ESCAPE '\\' THEN 'NAME'
          ELSE 'SLUG'
        END,
        CASE WHEN pr.name LIKE ${prefix} ESCAPE '\\' THEN 3 ELSE 5 END,
        pr.created_at
      FROM projects AS pr
      WHERE ${projectsVisible} = 1
        AND (pr.name LIKE ${anywhere} ESCAPE '\\' OR pr.slug LIKE ${anywhere} ESCAPE '\\')
    )
    SELECT
      Kind, Id, Title, Ref, Phone, Stage, ProjectName, Slug, Status, MatchedOn, Weight
    FROM hits
    ORDER BY Weight, SortAt DESC
    LIMIT ${top}
  `;

  return rows.map(toHit);
}

function toHit(row: HitRow): SearchHit {
  if (row.Kind === "lead") {
    return {
      kind: "lead",
      id: row.Id,
      title: row.Title,
      subtitle: join([
        row.Ref,
        row.Phone,
        row.Stage ? humanise(row.Stage) : null,
        row.ProjectName,
      ]),
      href: `/leads/${row.Id}`,
      matchedOn: row.MatchedOn,
    };
  }

  return {
    kind: "project",
    id: row.Id,
    title: row.Title,
    subtitle: join([row.Status ? humanise(row.Status) : null, row.Slug]),
    href: `/leads?projectId=${row.Id}`,
    matchedOn: row.MatchedOn,
  };
}

function join(parts: (string | null)[]): string {
  return parts.filter((p): p is string => Boolean(p)).join(" · ");
}
