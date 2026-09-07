/**
 * prisma/seed.ts
 * Seeds PostgreSQL with Sanctuary (475 plots) and Shankarpally (150 plots).
 *
 * Run: npm run db:seed
 * Or:  npx ts-node --project tsconfig.json prisma/seed.ts
 *
 * Prerequisite: DATABASE_URL must be set in .env.local
 * and `npx prisma migrate dev` must have been run.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function loadData() {
  // Dynamic import to avoid loading all seed data at module init
  const { SANCTUARY_SHANKARPALLY } = await import("../lib/data/sanctuary-shankarpally");
  const { TERRAVION_SHANKARPALLY } = await import("../lib/data/terravion-shankarpally");
  return [SANCTUARY_SHANKARPALLY, TERRAVION_SHANKARPALLY as any];
}

async function main() {
  console.log("🌱  Seeding Terravion GIS database...\n");

  const projects = await loadData();

  for (const project of projects) {
    // Upsert project
    const dbProject = await prisma.project.upsert({
      where: { slug: project.slug },
      update: {
        name: project.name,
        tagline: project.tagline,
        city: project.city,
        location: project.location,
        totalPlots: project.totalPlots,
        totalAcres: project.totalArea ?? 0,
        centerLat: project.centerCoordinates.lat,
        centerLng: project.centerCoordinates.lng,
        pricePerSqYard: project.pricePerSqYard,
        hmda: project.hmda ?? false,
        dtcpNumber: project.dtcpNumber ?? null,
        reraNumber: project.reraNumber ?? null,
        masterLayoutUrl: project.masterLayoutUrl ?? null,
      },
      create: {
        slug: project.slug,
        name: project.name,
        tagline: project.tagline,
        city: project.city,
        location: project.location,
        totalPlots: project.totalPlots,
        totalAcres: project.totalArea ?? 0,
        centerLat: project.centerCoordinates.lat,
        centerLng: project.centerCoordinates.lng,
        pricePerSqYard: project.pricePerSqYard,
        hmda: project.hmda ?? false,
        dtcpNumber: project.dtcpNumber ?? null,
        reraNumber: project.reraNumber ?? null,
        masterLayoutUrl: project.masterLayoutUrl ?? null,
      },
    });

    console.log(`✅  Project: ${dbProject.name} (${dbProject.id})`);

    // Clean existing data
    await prisma.plot.deleteMany({ where: { projectId: dbProject.id } });

    // Insert all plots
    const plotData = project.plots.map((plot: any) => ({
      projectId: dbProject.id,
      plotNumber: plot.plotNumber,
      areaSqYards: plot.dimension.areaSqYards,
      areaSqFt: plot.dimension.areaSqFt,
      length: plot.dimension.length,
      breadth: plot.dimension.breadth,
      positionX: plot.position3D?.[0] ?? 0,
      positionZ: plot.position3D?.[2] ?? 0,
      status: plot.status,
      price: plot.price,
      totalPrice: plot.totalPrice,
      facing: plot.facing,
      roadWidth: plot.roadWidth,
      isCorner: plot.isCorner,
      isPremium: plot.isPremium,
      isParkFacing: plot.isParkFacing ?? false,
      isMainRoadFacing: plot.isMainRoadFacing ?? false,
      ownerName: plot.ownerName ?? null,
      customerPhone: plot.customerPhone ?? null,
      salesExecutive: plot.salesExecutive ?? null,
      bookingDate: plot.bookingDate ? new Date(plot.bookingDate) : null,
      notes: plot.notes ?? null,
    }));

    await prisma.plot.createMany({ data: plotData });
    console.log(`   ✓  ${plotData.length} plots seeded`);

    // Amenities
    await prisma.amenity.deleteMany({ where: { projectId: dbProject.id } });
    if (project.amenities.length > 0) {
      await prisma.amenity.createMany({
        data: project.amenities.map((a: any) => ({
          projectId: dbProject.id,
          name: a.name,
          type: a.type,
          description: a.description ?? null,
          positionX: a.position3D?.[0] ?? 0,
          positionZ: a.position3D?.[2] ?? 0,
          iconUrl: a.icon ?? null,
        })),
      });
      console.log(`   ✓  ${project.amenities.length} amenities seeded`);
    }

    // Construction updates
    await prisma.constructionUpdate.deleteMany({ where: { projectId: dbProject.id } });
    if (project.constructionUpdates.length > 0) {
      await prisma.constructionUpdate.createMany({
        data: project.constructionUpdates.map((u: any) => ({
          projectId: dbProject.id,
          month: u.month,
          title: u.title,
          description: u.description,
          progressPercent: u.progressPercent,
          publishedAt: new Date(),
        })),
      });
      console.log(`   ✓  ${project.constructionUpdates.length} updates seeded`);
    }

    console.log("");
  }

  console.log("🎉  Database seeded successfully!\n");
}

main()
  .catch((e: Error) => {
    console.error("❌  Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
