/**
 * lib/types/gis.ts
 * All TypeScript interfaces for the Terravion GIS Platform.
 * Every engine, component and API route imports from here.
 */

// ─── Enums ────────────────────────────────────────────────────────────────────

export type PlotStatus = "AVAILABLE" | "BOOKED" | "SOLD" | "RESERVED" | "PREMIUM" | "COMMERCIAL";
export type PlotFacing = "NORTH" | "SOUTH" | "EAST" | "WEST" | "NORTH_EAST" | "NORTH_WEST" | "SOUTH_EAST" | "SOUTH_WEST";
export type MapMode = "layout" | "satellite" | "terrain" | "hybrid" | "street";
export type DayMode = "morning" | "sunset" | "night";
export type CameraView = "bird_eye" | "entrance" | "park" | "street" | "clubhouse";

// ─── Core Domain Types ────────────────────────────────────────────────────────

export interface GeoCoordinates {
  lat: number;
  lng: number;
  alt?: number;
}

export interface PlotDimension {
  length: number;    // in feet
  breadth: number;   // in feet
  areaSqYards: number;
  areaSqFt: number;
}

export interface Plot {
  id: string;
  projectId: string;
  plotNumber: string;
  dimension: PlotDimension;
  facing: PlotFacing;
  roadWidth: number;      // in feet
  isCorner: boolean;
  isPremium: boolean;
  isParkFacing: boolean;
  isClubhouseFacing: boolean;
  isEntranceFacing: boolean;
  isMainRoadFacing?: boolean;
  status: PlotStatus;
  price: number;          // per sq yard in INR
  totalPrice: number;     // computed
  offerPrice?: number;
  bookingAmount?: number;
  emiMonthly?: number;
  discount?: number;
  plcCharge?: number;     // Preferential Location Charge
  // Ownership
  ownerName?: string;
  salesExecutive?: string;
  customerPhone?: string;
  bookingDate?: string;
  registryDate?: string;
  // Media
  gallery: string[];
  videoUrl?: string;
  documents: string[];
  // GIS
  geoCoordinates?: GeoCoordinates;
  // 3D position (computed from GeoJSON)
  position3D?: [number, number, number];
  rotation3D?: [number, number, number];
  width3D?: number;
  depth3D?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Amenity {
  id: string;
  projectId: string;
  name: string;
  type: "CLUBHOUSE" | "TEMPLE" | "PARK" | "WATER_TANK" | "TRANSFORMER" | "SECURITY" | "PARKING" | "COMMERCIAL" | "GARDEN" | "PLAYGROUND" | "JOGGING_TRACK" | "ENTRANCE";
  description?: string;
  icon: string;
  position3D?: [number, number, number];
  geoCoordinates?: GeoCoordinates;
  imageUrl?: string;
}

export interface Road {
  id: string;
  projectId: string;
  name: string;
  widthFt: number;
  path3D: [number, number, number][];
  type: "MAIN" | "CROSS" | "INTERNAL";
}

export interface ConstructionUpdate {
  id: string;
  projectId: string;
  month: string;          // e.g. "2025-06"
  title: string;
  description: string;
  progressPercent: number;
  droneImages: string[];
  beforeImages: string[];
  afterImages: string[];
  videoUrl?: string;
  createdAt: string;
}

export interface NearbyPlace {
  id: string;
  name: string;
  type: "SCHOOL" | "HOSPITAL" | "TEMPLE" | "METRO" | "AIRPORT" | "TECH_PARK" | "MALL" | "RESTAURANT" | "HIGHWAY" | "SEZ" | "GOVERNMENT";
  distanceKm: number;
  travelTimeMin: number;
  rating?: number;
  openingHours?: string;
  photoUrl?: string;
  googleMapsUrl?: string;
  coordinates: GeoCoordinates;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  city: string;
  location: string;
  tagline: string;
  description: string;
  // GIS
  centerCoordinates: GeoCoordinates;
  geoJsonUrl?: string;
  kmlUrl?: string;
  satelliteAlignmentUrl?: string;
  satelliteOverlayOpacity?: number;
  // Approval
  dtcpNumber?: string;
  reraNumber?: string;
  hmda?: boolean;
  // Media
  masterLayoutUrl?: string;
  droneImages: string[];
  gallery: string[];
  videos: string[];
  brochureUrl?: string;
  documents: string[];
  // Project details
  totalArea: number;       // acres
  totalPlots: number;
  pricePerSqYard: number;
  launchDate?: string;
  completionDate?: string;
  // Relations
  plots: Plot[];
  amenities: Amenity[];
  roads: Road[];
  nearbyPlaces: NearbyPlace[];
  constructionUpdates: ConstructionUpdate[];
  createdAt: string;
  updatedAt: string;
}

// ─── Filter State ──────────────────────────────────────────────────────────────

export interface PlotFilters {
  statuses: PlotStatus[];
  facings: PlotFacing[];
  minArea: number;
  maxArea: number;
  minPrice: number;
  maxPrice: number;
  minRoadWidth: number;
  isCorner: boolean | null;
  isPremium: boolean | null;
  isParkFacing: boolean | null;
  isClubhouseFacing: boolean | null;
  isEntranceFacing: boolean | null;
  showSold: boolean;
}

export const DEFAULT_FILTERS: PlotFilters = {
  statuses: ["AVAILABLE", "BOOKED", "RESERVED", "PREMIUM"],
  facings: [],
  minArea: 0,
  maxArea: 9999,
  minPrice: 0,
  maxPrice: 999999999,
  minRoadWidth: 0,
  isCorner: null,
  isPremium: null,
  isParkFacing: null,
  isClubhouseFacing: null,
  isEntranceFacing: null,
  showSold: true,
};

// ─── Inventory Analytics ───────────────────────────────────────────────────────

export interface InventoryStats {
  total: number;
  available: number;
  booked: number;
  sold: number;
  reserved: number;
  premium: number;
  commercial: number;
  corner: number;
  avgAreaSqYards: number;
  avgPricePerSqYard: number;
  totalInventoryValue: number;
  soldValue: number;
  soldThisMonth: number;
  revenueThisMonth: number;
}

// ─── GIS Store State ───────────────────────────────────────────────────────────

export interface GISState {
  project: Project | null;
  plots: Plot[];
  filteredPlots: Plot[];
  selectedPlot: Plot | null;
  hoveredPlotId: string | null;
  filters: PlotFilters;
  mapMode: MapMode;
  dayMode: DayMode;
  cameraView: CameraView;
  satelliteOpacity: number;
  showFilterPanel: boolean;
  showDetailPanel: boolean;
  showNearbyPlaces: boolean;
  stats: InventoryStats | null;
  isLoading: boolean;
  searchQuery: string;
}

// ─── Plot Color Mapping ────────────────────────────────────────────────────────

export const PLOT_STATUS_COLORS: Record<PlotStatus, { fill: string; hex: number; border: string }> = {
  AVAILABLE: { fill: "#22c55e", hex: 0x22c55e, border: "#16a34a" },
  BOOKED:    { fill: "#f97316", hex: 0xf97316, border: "#ea580c" },
  SOLD:      { fill: "#ef4444", hex: 0xef4444, border: "#dc2626" },
  RESERVED:  { fill: "#a855f7", hex: 0xa855f7, border: "#9333ea" },
  PREMIUM:   { fill: "#eab308", hex: 0xeab308, border: "#ca8a04" },
  COMMERCIAL: { fill: "#3b82f6", hex: 0x3b82f6, border: "#2563eb" },
};


export const PLOT_FACING_COLORS: Record<PlotFacing, string> = {
  EAST:       "#fde047",
  NORTH:      "#7dd3fc",
  WEST:       "#fb923c",
  SOUTH:      "#94a3b8",
  NORTH_EAST: "#a3e635",
  NORTH_WEST: "#38bdf8",
  SOUTH_EAST: "#fb923c",
  SOUTH_WEST: "#94a3b8",
};

// ─── API Response Types ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  error: string | null;
  timestamp: string;
}

export interface PlotUpdatePayload {
  status?: PlotStatus;
  price?: number;
  offerPrice?: number;
  ownerName?: string;
  salesExecutive?: string;
  customerPhone?: string;
  bookingDate?: string;
  registryDate?: string;
  notes?: string;
}
