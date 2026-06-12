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

const value = (envName: string) => process.env[envName] || process.env[`NITRO_${envName}`];

export const getPixelForgeConfig = (): PixelForgeConfig => ({
  supabaseUrl: value("SUPABASE_URL"),
  supabaseAnonKey: value("SUPABASE_ANON_KEY"),
  supabaseServiceRoleKey: value("SUPABASE_SERVICE_ROLE_KEY"),
  databaseUrl: value("DATABASE_URL"),
  stripeSecretKey: value("STRIPE_SECRET_KEY"),
  stripeWebhookSecret: value("STRIPE_WEBHOOK_SECRET"),
  stripeProPriceId: value("STRIPE_PRO_PRICE_ID"),
  stripeStudioPriceId: value("STRIPE_STUDIO_PRICE_ID"),
  siteUrl: value("SITE_URL") ?? "http://localhost:8080",
  openAiApiKey: value("OPENAI_API_KEY"),
  sdxlApiUrl: value("SDXL_API_URL"),
  sdxlApiKey: value("SDXL_API_KEY"),
});
