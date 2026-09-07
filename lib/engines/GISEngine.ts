/**
 * lib/engines/GISEngine.ts
 * Core GIS engine — project loading, GeoJSON parsing, coordinate transforms.
 */

import type { Project, Plot, GeoCoordinates } from "@/lib/types/gis";

// ─── Coordinate Math ───────────────────────────────────────────────────────────

/** Convert lat/lng offset from center to local 3D XZ coordinates (meters) */
export function geoToLocal(center: GeoCoordinates, point: GeoCoordinates): [number, number] {
  const R = 6_371_000; // Earth radius in meters
  const dLat = ((point.lat - center.lat) * Math.PI) / 180;
  const dLng = ((point.lng - center.lng) * Math.PI) / 180;
  const x = dLng * R * Math.cos((center.lat * Math.PI) / 180);
  const z = -dLat * R; // negate because Three.js Z is towards viewer
  return [x, z];
}

/** Convert local 3D XZ coordinates back to lat/lng */
export function localToGeo(center: GeoCoordinates, x: number, z: number): GeoCoordinates {
  const R = 6_371_000;
  const dLat = (-z / R) * (180 / Math.PI);
  const dLng = (x / (R * Math.cos((center.lat * Math.PI) / 180))) * (180 / Math.PI);
  return { lat: center.lat + dLat, lng: center.lng + dLng };
}

// ─── GeoJSON Parser ────────────────────────────────────────────────────────────

export interface GeoJSONFeature {
  type: "Feature";
  properties: Record<string, unknown>;
  geometry: {
    type: string;
    coordinates: number[][][] | number[][];
  };
}

export interface ParsedLayout {
  plots: ParsedPlot[];
  roads: ParsedRoad[];
  amenities: ParsedAmenity[];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
}

export interface ParsedPlot {
  plotNumber: string;
  vertices: [number, number][];  // local XZ
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

export interface ParsedRoad {
  id: string;
  path: [number, number][];
  widthFt: number;
}

export interface ParsedAmenity {
  id: string;
  type: string;
  centerX: number;
  centerZ: number;
  width: number;
  depth: number;
}

export function parseGeoJSON(
  geojson: { type: string; features: GeoJSONFeature[] },
  center: GeoCoordinates
): ParsedLayout {
  const plots: ParsedPlot[] = [];
  const roads: ParsedRoad[] = [];
  const amenities: ParsedAmenity[] = [];

  let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;

  for (const feature of geojson.features) {
    const props = feature.properties ?? {};
    const geomType = feature.geometry.type;

    if (geomType === "Polygon") {
      const ring = feature.geometry.coordinates[0] as number[][];
      const vertices = ring.map(([lng, lat]) => geoToLocal(center, { lat, lng }) as [number, number]);

      // Compute centroid
      const cx = vertices.reduce((s, [x]) => s + x, 0) / vertices.length;
      const cz = vertices.reduce((s, [, z]) => s + z, 0) / vertices.length;

      // Compute bounding box
      const xs = vertices.map(([x]) => x);
      const zs = vertices.map(([, z]) => z);
      const bMinX = Math.min(...xs), bMaxX = Math.max(...xs);
      const bMinZ = Math.min(...zs), bMaxZ = Math.max(...zs);

      minX = Math.min(minX, bMinX); maxX = Math.max(maxX, bMaxX);
      minZ = Math.min(minZ, bMinZ); maxZ = Math.max(maxZ, bMaxZ);

      const layer = String(props.layer ?? props.type ?? "").toLowerCase();

      if (layer.includes("plot") || props.plotNumber || props.plot_no) {
        plots.push({
          plotNumber: String(props.plotNumber ?? props.plot_no ?? props.name ?? plots.length + 1),
          vertices,
          centerX: cx,
          centerZ: cz,
          width: bMaxX - bMinX,
          depth: bMaxZ - bMinZ,
        });
      } else if (layer.includes("road") || layer.includes("street")) {
        roads.push({
          id: String(props.id ?? roads.length),
          path: vertices,
          widthFt: Number(props.width ?? 30),
        });
      } else {
        amenities.push({
          id: String(props.id ?? amenities.length),
          type: layer || "AMENITY",
          centerX: cx,
          centerZ: cz,
          width: bMaxX - bMinX,
          depth: bMaxZ - bMinZ,
        });
      }
    }

    if (geomType === "LineString") {
      const coords = feature.geometry.coordinates as number[][];
      const path = coords.map(([lng, lat]) => geoToLocal(center, { lat, lng }) as [number, number]);
      roads.push({
        id: String(props.id ?? roads.length),
        path,
        widthFt: Number(props.width ?? 20),
      });
    }
  }

  return { plots, roads, amenities, bounds: { minX, maxX, minZ, maxZ } };
}

// ─── Scale Normalizer ──────────────────────────────────────────────────────────

/** Normalize a parsed layout to fit within a target bounding box (default ±100 units) */
export function normalizeLayout(layout: ParsedLayout, targetSize = 200): ParsedLayout {
  const { bounds } = layout;
  const scaleX = targetSize / (bounds.maxX - bounds.minX || 1);
  const scaleZ = targetSize / (bounds.maxZ - bounds.minZ || 1);
  const scale = Math.min(scaleX, scaleZ);
  const offX = -(bounds.minX + bounds.maxX) / 2;
  const offZ = -(bounds.minZ + bounds.maxZ) / 2;

  const tx = (v: number) => (v + offX) * scale;
  const tz = (v: number) => (v + offZ) * scale;

  return {
    plots: layout.plots.map((p) => ({
      ...p,
      vertices: p.vertices.map(([x, z]) => [tx(x), tz(z)] as [number, number]),
      centerX: tx(p.centerX),
      centerZ: tz(p.centerZ),
      width: p.width * scale,
      depth: p.depth * scale,
    })),
    roads: layout.roads.map((r) => ({
      ...r,
      path: r.path.map(([x, z]) => [tx(x), tz(z)] as [number, number]),
    })),
    amenities: layout.amenities.map((a) => ({
      ...a,
      centerX: tx(a.centerX),
      centerZ: tz(a.centerZ),
      width: a.width * scale,
      depth: a.depth * scale,
    })),
    bounds: {
      minX: tx(bounds.minX),
      maxX: tx(bounds.maxX),
      minZ: tz(bounds.minZ),
      maxZ: tz(bounds.maxZ),
    },
  };
}

// ─── Project Fetcher ───────────────────────────────────────────────────────────

export async function fetchProject(slug: string): Promise<Project | null> {
  try {
    const res = await fetch(`/api/gis/projects/${slug}`, { next: { revalidate: 30 } });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data as Project;
  } catch {
    return null;
  }
}

export async function fetchProjects(): Promise<Project[]> {
  try {
    const res = await fetch("/api/gis/projects", { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data as Project[];
  } catch {
    return [];
  }
}
