import { getDb } from "@/lib/db";

export interface PlotOverrideRecord {
  id: string;
  plotNumber: string;
  status: string;
  facing: string | null;
  areaSqYards: number | null;
  pricePerSqYard: number | null;
  totalPrice: number | null;
  isCorner: boolean;
  isPremium: boolean;
  remarks: string | null;
  updatedAt: string;
}

const DEFAULT_PROJECT_NAMES: Record<string, string> = {
  sanctuary: "Sanctuary",
  shankarpally: "Terravion Shankarpally",
  "raghunath-county": "Raghunath County",
  mansanpally: "Terravion Mansanpally",
};

export function ensureProject(slug: string): string {
  const db = getDb();
  const existing = db.prepare("SELECT id FROM projects WHERE slug = ?").get(slug) as { id: string } | undefined;
  if (existing?.id) return existing.id;

  const id = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const name = DEFAULT_PROJECT_NAMES[slug] || slug.charAt(0).toUpperCase() + slug.slice(1);
  db.prepare(`
    INSERT INTO projects (id, slug, name, status, created_at)
    VALUES (?, ?, ?, 'SELLING', datetime('now'))
  `).run(id, slug, name);

  return id;
}

export function getProjectPlotOverrides(projectSlug: string): Record<string, PlotOverrideRecord> {
  const db = getDb();
  const project = db.prepare("SELECT id FROM projects WHERE slug = ?").get(projectSlug) as { id: string } | undefined;
  if (!project?.id) return {};

  const rows = db.prepare(`
    SELECT
      id,
      plot_number AS plotNumber,
      status,
      facing,
      area_sq_yards AS areaSqYards,
      price_per_sq_yard AS pricePerSqYard,
      total_price AS totalPrice,
      is_corner AS isCorner,
      is_premium AS isPremium,
      remarks,
      updated_at AS updatedAt
    FROM plots
    WHERE project_id = ?
  `).all(project.id) as Array<{
    id: string;
    plotNumber: string;
    status: string;
    facing: string | null;
    areaSqYards: number | null;
    pricePerSqYard: number | null;
    totalPrice: number | null;
    isCorner: number;
    isPremium: number;
    remarks: string | null;
    updatedAt: string;
  }>;

  const overrides: Record<string, PlotOverrideRecord> = {};
  for (const row of rows) {
    const record: PlotOverrideRecord = {
      id: row.id,
      plotNumber: row.plotNumber,
      status: row.status,
      facing: row.facing,
      areaSqYards: row.areaSqYards,
      pricePerSqYard: row.pricePerSqYard,
      totalPrice: row.totalPrice,
      isCorner: Boolean(row.isCorner),
      isPremium: Boolean(row.isPremium),
      remarks: row.remarks,
      updatedAt: row.updatedAt,
    };
    overrides[row.plotNumber] = record;
    overrides[row.id] = record;
  }

  return overrides;
}

export interface UpsertPlotParams {
  projectSlug: string;
  plotNumber: string;
  status?: string;
  facing?: string;
  areaSqYards?: number;
  pricePerSqYard?: number;
  totalPrice?: number;
  isCorner?: boolean;
  isPremium?: boolean;
  remarks?: string;
  userId?: string;
}

export function upsertPlotOverride(params: UpsertPlotParams): PlotOverrideRecord {
  const db = getDb();
  const projectId = ensureProject(params.projectSlug);

  const existing = db.prepare(`
    SELECT id, status, price_per_sq_yard, total_price, remarks
    FROM plots
    WHERE project_id = ? AND plot_number = ?
  `).get(projectId, params.plotNumber) as {
    id: string;
    status: string;
    price_per_sq_yard: number | null;
    total_price: number | null;
    remarks: string | null;
  } | undefined;

  let plotId = existing?.id;

  if (existing) {
    db.prepare(`
      UPDATE plots
      SET
        status = COALESCE(?, status),
        facing = COALESCE(?, facing),
        area_sq_yards = COALESCE(?, area_sq_yards),
        price_per_sq_yard = COALESCE(?, price_per_sq_yard),
        total_price = COALESCE(?, total_price),
        remarks = COALESCE(?, remarks),
        updated_at = datetime('now')
      WHERE id = ?
    `).run(
      params.status ?? null,
      params.facing ?? null,
      params.areaSqYards ?? null,
      params.pricePerSqYard ?? null,
      params.totalPrice ?? null,
      params.remarks ?? null,
      existing.id
    );
  } else {
    plotId = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    db.prepare(`
      INSERT INTO plots (
        id, project_id, plot_number, status, facing,
        area_sq_yards, price_per_sq_yard, total_price,
        is_corner, is_premium, remarks, created_at, updated_at
      ) VALUES (
        ?, ?, ?, ?, ?,
        ?, ?, ?,
        ?, ?, ?, datetime('now'), datetime('now')
      )
    `).run(
      plotId,
      projectId,
      params.plotNumber,
      params.status ?? "AVAILABLE",
      params.facing ?? null,
      params.areaSqYards ?? null,
      params.pricePerSqYard ?? null,
      params.totalPrice ?? null,
      params.isCorner ? 1 : 0,
      params.isPremium ? 1 : 0,
      params.remarks ?? null
    );
  }

  // Audit log
  if (params.userId && plotId) {
    try {
      db.prepare(`
        INSERT INTO audit_log (user_id, action, entity, entity_id, before_json, after_json, created_at)
        VALUES (?, 'INVENTORY_UPDATE', 'plots', ?, ?, ?, datetime('now'))
      `).run(
        params.userId,
        plotId,
        existing ? JSON.stringify(existing) : null,
        JSON.stringify(params)
      );
    } catch {
      // Non-blocking audit log
    }
  }

  const updated = db.prepare(`
    SELECT
      id,
      plot_number AS plotNumber,
      status,
      facing,
      area_sq_yards AS areaSqYards,
      price_per_sq_yard AS pricePerSqYard,
      total_price AS totalPrice,
      is_corner AS isCorner,
      is_premium AS isPremium,
      remarks,
      updated_at AS updatedAt
    FROM plots
    WHERE id = ?
  `).get(plotId) as {
    id: string;
    plotNumber: string;
    status: string;
    facing: string | null;
    areaSqYards: number | null;
    pricePerSqYard: number | null;
    totalPrice: number | null;
    isCorner: number;
    isPremium: number;
    remarks: string | null;
    updatedAt: string;
  };

  return {
    id: updated.id,
    plotNumber: updated.plotNumber,
    status: updated.status,
    facing: updated.facing,
    areaSqYards: updated.areaSqYards,
    pricePerSqYard: updated.pricePerSqYard,
    totalPrice: updated.totalPrice,
    isCorner: Boolean(updated.isCorner),
    isPremium: Boolean(updated.isPremium),
    remarks: updated.remarks,
    updatedAt: updated.updatedAt,
  };
}
