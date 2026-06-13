import { createRequire } from "module";
import { getPixelForgeConfig } from "./config";
import type { PrismaClient as PrismaClientInstance } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __pixelforgePrisma: PrismaClientInstance | undefined;
}

const require = createRequire(import.meta.url);

export const isDatabaseConfigured = () => Boolean(getPixelForgeConfig().databaseUrl);

export const getPrisma = () => {
  if (!isDatabaseConfigured()) return null;

  try {
    const { PrismaClient } = require("@prisma/client") as {
      PrismaClient: new (options?: { log?: Array<"query" | "info" | "warn" | "error"> }) => PrismaClientInstance;
    };

    globalThis.__pixelforgePrisma ??= new PrismaClient({
      log: ["error"],
    });

    return globalThis.__pixelforgePrisma;
  } catch {
    return null;
  }
};
