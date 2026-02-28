import { PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var prisma: PrismaClient | undefined;
}

// Helper function to check if DATABASE_URL is available
function hasDatabaseUrl(): boolean {
  return !!process.env.DATABASE_URL;
}

// Create a singleton Prisma client with error handling
function createPrismaClient(): PrismaClient {
  if (!hasDatabaseUrl()) {
    if (typeof console !== "undefined" && console.warn) {
      console.warn("[prisma] DATABASE_URL not set. Database operations will fail. Set DATABASE_URL in .env and run migrations.");
    }
  }
  
  return new PrismaClient({
    log: hasDatabaseUrl() ? ["error", "warn"] : []
  });
}

export const prisma = global.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  global.prisma = prisma;
}

