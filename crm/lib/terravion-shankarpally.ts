/**
 * lib/data/terravion-shankarpally.ts
 * Seed data for Terravion Shankarpally project.
 * Used when no database is configured — gives the 3D viewer real data immediately.
 * Admin can override this by connecting Supabase + Prisma.
 */

import type { Project, Plot, Amenity } from "@/lib/gis-types";

// Generate 150 plots programmatically in a grid layout
function generatePlots(): Plot[] {
  const plots: Plot[] = [];
  const rows = 10;
  const cols = 15;
  const totalPlots = rows * cols;

  const statuses: Array<Plot["status"]> = ["AVAILABLE", "AVAILABLE", "AVAILABLE", "AVAILABLE", "BOOKED", "RESERVED", "SOLD", "PREMIUM"];
  const facings: Array<Plot["facing"]> = ["EAST", "WEST", "NORTH", "SOUTH", "EAST", "NORTH", "EAST", "NORTH"];
  const areas = [200, 250, 300, 400, 200, 300, 150, 240];

  for (let i = 0; i < totalPlots; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    const pricePerSqYard = 28000 + Math.floor(Math.random() * 12000);
    const area = areas[i % areas.length];
    const status = statuses[i % statuses.length];
    const facing = facings[i % facings.length];
    const isCorner = col === 0 || col === cols - 1 || row === 0 || row === rows - 1;
    const isPremium = status === "PREMIUM";
    const isParkFacing = row === rows - 1;
    const isClubhouseFacing = row === 0 && col < 3;

    // 3D grid layout — each plot is 12×12 units with 3-unit roads
    const gridSpacingX = 15;
    const gridSpacingZ = 15;
    const plotWidth = 12;
    const plotDepth = 12;
    const offsetX = -((cols - 1) * gridSpacingX) / 2;
    const offsetZ = -((rows - 1) * gridSpacingZ) / 2;

    plots.push({
      id: `plot-${i + 1}`,
      projectId: "terravion-shankarpally",
      plotNumber: String(i + 1),
      dimension: {
        length: Math.round(Math.sqrt(area * 9) * 1.2),
        breadth: Math.round(Math.sqrt(area * 9) / 1.2),
        areaSqYards: area,
        areaSqFt: area * 9,
      },
      facing,
      roadWidth: [20, 30, 40][i % 3],
      isCorner,
      isPremium,
      isParkFacing,
      isClubhouseFacing,
      isEntranceFacing: col < 2 && row === 0,
      status,
      price: pricePerSqYard,
      totalPrice: pricePerSqYard * area,
      offerPrice: status === "AVAILABLE" ? Math.round(pricePerSqYard * area * 0.95) : undefined,
      bookingAmount: Math.round(pricePerSqYard * area * 0.1),
      emiMonthly: Math.round((pricePerSqYard * area * 0.8 * 0.09 / 12) / (1 - Math.pow(1 + 0.09/12, -120))),
      discount: status === "AVAILABLE" ? 5 : 0,
      plcCharge: isCorner ? 50000 : isParkFacing ? 30000 : 0,
      gallery: [],
      documents: [],
      position3D: [
        offsetX + col * gridSpacingX,
        0,
        offsetZ + row * gridSpacingZ,
      ],
      rotation3D: [0, 0, 0],
      width3D: plotWidth,
      depth3D: plotDepth,
      notes: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  }
  return plots;
}

export const TERRAVION_SHANKARPALLY: Project = {
  id: "terravion-shankarpally",
  name: "Terravion Shankarpally",
  slug: "shankarpally",
  city: "Hyderabad",
  location: "Shankarpally, West Hyderabad",
  tagline: "Where Hyderabad's Future Begins",
  description: "HMDA & DTCP approved villa plots at Shankarpally with world-class amenities, 40ft wide roads, 25,000 sq.ft clubhouse and 100% vastu-compliant layouts.",
  centerCoordinates: { lat: 17.4399, lng: 78.1243 },
  dtcpNumber: "DTCP/P/2024/SHK/001",
  reraNumber: "P02400001234",
  hmda: true,
  masterLayoutUrl: "/illustrations/terravion-master-layout.png",
  droneImages: [],
  gallery: [],
  videos: [],
  documents: [],
  totalArea: 12.5,
  totalPlots: 150,
  pricePerSqYard: 28000,
  launchDate: "2024-01-15",
  completionDate: "2026-06-30",
  plots: generatePlots(),
  amenities: [
    {
      id: "amen-clubhouse",
      projectId: "terravion-shankarpally",
      name: "25,000 Sq.Ft Grand Clubhouse",
      type: "CLUBHOUSE",
      icon: "🏛️",
      description: "Luxury clubhouse with swimming pool, gym, banquet hall, indoor games and landscaped gardens.",
      position3D: [-90, 0, -80],
      imageUrl: "/illustrations/blog-clubhouse-lifestyle.png",
    },
    {
      id: "amen-temple",
      projectId: "terravion-shankarpally",
      name: "Community Temple",
      type: "TEMPLE",
      icon: "🛕",
      description: "Vastu-aligned Sri Venkateswara Swami Temple at the heart of the community.",
      position3D: [80, 0, -60],
    },
    {
      id: "amen-park",
      projectId: "terravion-shankarpally",
      name: "Central Park",
      type: "PARK",
      icon: "🌳",
      description: "2-acre landscaped park with jogging tracks, seating alcoves and play area.",
      position3D: [0, 0, 100],
    },
    {
      id: "amen-water",
      projectId: "terravion-shankarpally",
      name: "Underground Water Tank",
      type: "WATER_TANK",
      icon: "💧",
      description: "2 lakh litre underground sump with 24/7 RO treated water supply.",
      position3D: [-60, 0, 80],
    },
    {
      id: "amen-gate",
      projectId: "terravion-shankarpally",
      name: "Grand Entrance Gate",
      type: "ENTRANCE",
      icon: "🚪",
      description: "30ft wide double-lane entrance with security cabin, CCTV and biometric access.",
      position3D: [0, 0, -100],
    },
    {
      id: "amen-parking",
      projectId: "terravion-shankarpally",
      name: "Visitor Parking",
      type: "PARKING",
      icon: "🅿️",
      description: "40-car visitor parking with EV charging stations.",
      position3D: [30, 0, -90],
    },
  ] as Amenity[],
  roads: [],
  nearbyPlaces: [
    {
      id: "np-orr",
      name: "Outer Ring Road (Exit 3)",
      type: "HIGHWAY",
      distanceKm: 2.1,
      travelTimeMin: 5,
      coordinates: { lat: 17.432, lng: 78.110 },
    },
    {
      id: "np-iit",
      name: "IIT Hyderabad, Kandi",
      type: "TECH_PARK",
      distanceKm: 8.5,
      travelTimeMin: 15,
      rating: 4.8,
      coordinates: { lat: 17.531, lng: 78.028 },
    },
    {
      id: "np-airport",
      name: "Rajiv Gandhi International Airport",
      type: "AIRPORT",
      distanceKm: 32,
      travelTimeMin: 40,
      rating: 4.5,
      coordinates: { lat: 17.231, lng: 78.430 },
    },
    {
      id: "np-glendale",
      name: "Glendale International School",
      type: "SCHOOL",
      distanceKm: 4.2,
      travelTimeMin: 10,
      rating: 4.7,
      coordinates: { lat: 17.462, lng: 78.095 },
    },
    {
      id: "np-continental",
      name: "Continental Hospital",
      type: "HOSPITAL",
      distanceKm: 12,
      travelTimeMin: 20,
      rating: 4.6,
      coordinates: { lat: 17.448, lng: 78.358 },
    },
    {
      id: "np-financial",
      name: "Financial District / Nanakramguda",
      type: "TECH_PARK",
      distanceKm: 22,
      travelTimeMin: 30,
      coordinates: { lat: 17.419, lng: 78.346 },
    },
  ],
  constructionUpdates: [
    {
      id: "cu-1",
      projectId: "terravion-shankarpally",
      month: "2025-07",
      title: "Compound Wall — 100% Complete",
      description: "The 6-foot compound wall around the entire 12.5-acre layout is complete. Plastering and painting in progress.",
      progressPercent: 72,
      droneImages: [],
      beforeImages: [],
      afterImages: [],
      createdAt: new Date().toISOString(),
    },
    {
      id: "cu-2",
      projectId: "terravion-shankarpally",
      month: "2025-06",
      title: "Internal Roads — Laying in Progress",
      description: "40ft main road BT work complete. 30ft cross roads laying ongoing. Expected completion: August 2025.",
      progressPercent: 65,
      droneImages: [],
      beforeImages: [],
      afterImages: [],
      createdAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};
