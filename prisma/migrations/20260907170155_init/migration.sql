-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "postgis";

-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateEnum
CREATE TYPE "PlotStatus" AS ENUM ('AVAILABLE', 'BOOKED', 'SOLD', 'RESERVED', 'PREMIUM', 'COMMERCIAL');

-- CreateEnum
CREATE TYPE "PlotFacing" AS ENUM ('EAST', 'NORTH', 'WEST', 'SOUTH', 'NORTH_EAST', 'NORTH_WEST', 'SOUTH_EAST', 'SOUTH_WEST');

-- CreateEnum
CREATE TYPE "AmenityType" AS ENUM ('PARK', 'CLUBHOUSE', 'ENTRANCE', 'ROAD', 'COMMERCIAL', 'TEMPLE', 'SCHOOL', 'PLAYGROUND', 'WATER_BODY', 'GYM', 'SWIMMING_POOL');

-- CreateEnum
CREATE TYPE "LeadSource" AS ENUM ('WEBSITE', 'WHATSAPP', 'PHONE', 'WALK_IN', 'REFERENCE', 'META_ADS', 'GOOGLE_ADS', 'YOUTUBE', 'BROKER', 'SITE_VISIT');

-- CreateEnum
CREATE TYPE "LeadStage" AS ENUM ('NEW', 'CONTACTED', 'SITE_VISIT_SCHEDULED', 'SITE_VISIT_DONE', 'NEGOTIATING', 'BOOKED', 'REGISTERED', 'LOST');

-- CreateTable
CREATE TABLE "projects" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tagline" TEXT,
    "city" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "totalPlots" INTEGER NOT NULL,
    "totalAcres" DOUBLE PRECISION NOT NULL,
    "centerLat" DOUBLE PRECISION NOT NULL,
    "centerLng" DOUBLE PRECISION NOT NULL,
    "pricePerSqYard" INTEGER NOT NULL,
    "priceRangeMin" INTEGER NOT NULL,
    "priceRangeMax" INTEGER NOT NULL,
    "hmda" BOOLEAN NOT NULL DEFAULT false,
    "dtcpNumber" TEXT,
    "reraNumber" TEXT,
    "masterLayoutUrl" TEXT,
    "heroImageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "launchDate" TIMESTAMP(3),
    "completionDate" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "plots" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL,
    "plotNumber" TEXT NOT NULL,
    "gridRow" INTEGER NOT NULL,
    "gridCol" INTEGER NOT NULL,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionZ" DOUBLE PRECISION NOT NULL,
    "areaSqYards" DOUBLE PRECISION NOT NULL,
    "areaSqFt" DOUBLE PRECISION NOT NULL,
    "length" DOUBLE PRECISION NOT NULL,
    "breadth" DOUBLE PRECISION NOT NULL,
    "status" "PlotStatus" NOT NULL DEFAULT 'AVAILABLE',
    "price" INTEGER NOT NULL,
    "totalPrice" INTEGER NOT NULL,
    "facing" "PlotFacing" NOT NULL,
    "roadWidth" INTEGER NOT NULL,
    "isCorner" BOOLEAN NOT NULL DEFAULT false,
    "isPremium" BOOLEAN NOT NULL DEFAULT false,
    "isParkFacing" BOOLEAN NOT NULL DEFAULT false,
    "isMainRoadFacing" BOOLEAN NOT NULL DEFAULT false,
    "ownerName" TEXT,
    "customerPhone" TEXT,
    "salesExecutive" TEXT,
    "bookingDate" TIMESTAMP(3),
    "registrationDate" TIMESTAMP(3),
    "notes" TEXT,
    "broadcastChannel" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plots_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "amenities" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "type" "AmenityType" NOT NULL,
    "description" TEXT,
    "positionX" DOUBLE PRECISION NOT NULL,
    "positionZ" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION,
    "depth" DOUBLE PRECISION,
    "iconUrl" TEXT,
    "imageUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "amenities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "construction_updates" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "projectId" UUID NOT NULL,
    "month" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "progressPercent" INTEGER NOT NULL,
    "images" TEXT[],
    "publishedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "construction_updates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "leads" (
    "id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT,
    "location" TEXT,
    "source" "LeadSource" NOT NULL DEFAULT 'WEBSITE',
    "stage" "LeadStage" NOT NULL DEFAULT 'NEW',
    "interestedInProject" TEXT,
    "budgetMin" INTEGER,
    "budgetMax" INTEGER,
    "preferredFacing" TEXT,
    "areaMin" DOUBLE PRECISION,
    "areaMax" DOUBLE PRECISION,
    "assignedTo" TEXT,
    "nextFollowUp" TIMESTAMP(3),
    "notes" TEXT,
    "utmSource" TEXT,
    "utmMedium" TEXT,
    "utmCampaign" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "projects_slug_key" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "projects_slug_idx" ON "projects"("slug");

-- CreateIndex
CREATE INDEX "plots_projectId_status_idx" ON "plots"("projectId", "status");

-- CreateIndex
CREATE INDEX "plots_projectId_facing_idx" ON "plots"("projectId", "facing");

-- CreateIndex
CREATE UNIQUE INDEX "plots_projectId_plotNumber_key" ON "plots"("projectId", "plotNumber");

-- CreateIndex
CREATE INDEX "construction_updates_projectId_idx" ON "construction_updates"("projectId");

-- CreateIndex
CREATE INDEX "leads_stage_idx" ON "leads"("stage");

-- CreateIndex
CREATE INDEX "leads_assignedTo_idx" ON "leads"("assignedTo");

-- AddForeignKey
ALTER TABLE "plots" ADD CONSTRAINT "plots_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "amenities" ADD CONSTRAINT "amenities_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "construction_updates" ADD CONSTRAINT "construction_updates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
