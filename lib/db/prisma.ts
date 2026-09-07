/**
 * lib/db/prisma.ts
 * Prisma client singleton — PostgreSQL (Hostinger).
 * Gracefully defers when DATABASE_URL is not set.
 *
 * NOTE: Run `npx prisma generate` after setting DATABASE_URL.
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

const globalForPrisma = globalThis as unknown as { prisma: any };

function createPrismaClient() {
  try {
    // Dynamic require so the module load doesn't crash when prisma hasn't been generated yet
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { PrismaClient } = require("@prisma/client");
    return new PrismaClient({
      log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    });
  } catch {
    return null;
  }
}

export const prisma: any = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production" && prisma) {
  globalForPrisma.prisma = prisma;
}

/** Returns true when the database is reachable */
export async function isDatabaseReady(): Promise<boolean> {
  if (!process.env.DATABASE_URL || !prisma) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}
