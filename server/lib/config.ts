import { useRuntimeConfig } from "nitro";

export type PixelForgeConfig = {
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  supabaseServiceRoleKey?: string;
  databaseUrl?: string;
  stripeSecretKey?: string;
  stripeWebhookSecret?: string;
  stripeProPriceId?: string;
  stripeStudioPriceId?: string;
  siteUrl: string;
  openAiApiKey?: string;
  sdxlApiUrl?: string;
  sdxlApiKey?: string;
};

const value = (runtimeValue: unknown, envName: string) => {
  if (typeof runtimeValue === "string" && runtimeValue.length > 0) return runtimeValue;
  return process.env[envName] || process.env[`NITRO_${envName}`];
};

export const getPixelForgeConfig = (): PixelForgeConfig => {
  const runtimeConfig = useRuntimeConfig() as Record<string, unknown>;

  return {
    supabaseUrl: value(runtimeConfig.supabaseUrl, "SUPABASE_URL"),
    supabaseAnonKey: value(runtimeConfig.supabaseAnonKey, "SUPABASE_ANON_KEY"),
    supabaseServiceRoleKey: value(runtimeConfig.supabaseServiceRoleKey, "SUPABASE_SERVICE_ROLE_KEY"),
    databaseUrl: value(runtimeConfig.databaseUrl, "DATABASE_URL"),
    stripeSecretKey: value(runtimeConfig.stripeSecretKey, "STRIPE_SECRET_KEY"),
    stripeWebhookSecret: value(runtimeConfig.stripeWebhookSecret, "STRIPE_WEBHOOK_SECRET"),
    stripeProPriceId: value(runtimeConfig.stripeProPriceId, "STRIPE_PRO_PRICE_ID"),
    stripeStudioPriceId: value(runtimeConfig.stripeStudioPriceId, "STRIPE_STUDIO_PRICE_ID"),
    siteUrl: value(runtimeConfig.siteUrl, "SITE_URL") ?? "http://localhost:8080",
    openAiApiKey: value(runtimeConfig.openAiApiKey, "OPENAI_API_KEY"),
    sdxlApiUrl: value(runtimeConfig.sdxlApiUrl, "SDXL_API_URL"),
    sdxlApiKey: value(runtimeConfig.sdxlApiKey, "SDXL_API_KEY"),
  };
};
