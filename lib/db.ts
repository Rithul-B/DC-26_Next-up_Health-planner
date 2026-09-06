import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const url = process.env.DATABASE_URL?.trim() || "file:./prisma/dev.db";
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = url;
  }
  return new PrismaClient({
    datasources: { db: { url } },
  });
}

export const prisma = globalForPrisma.prisma ?? createClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

let probe: Promise<boolean> | null = null;

export async function dbAvailable(): Promise<boolean> {
  if (!probe) {
    probe = (async () => {
      try {
        await prisma.$connect();
        const { ensureDemoHousehold } = await import("@/lib/demo-seed");
        await ensureDemoHousehold();
        return true;
      } catch {
        try {
          await prisma.household.count();
          return true;
        } catch {
          probe = null;
          return false;
        }
      }
    })();
  }
  return probe;
}
