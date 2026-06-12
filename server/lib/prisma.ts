import { PrismaClient } from "@prisma/client";
import { getPixelForgeConfig } from "./config";

declare global {
  // eslint-disable-next-line no-var
  var __pixelforgePrisma: PrismaClient | undefined;
}

export const isDatabaseConfigured = () => Boolean(getPixelForgeConfig().databaseUrl);

export const getPrisma = () => {
  if (!isDatabaseConfigured()) return null;

  globalThis.__pixelforgePrisma ??= new PrismaClient({
    log: ["error"],
  });

  return globalThis.__pixelforgePrisma;
};
