import { defineConfig } from "nitro";

export default defineConfig({
  serverDir: "./server",
  runtimeConfig: {
    supabaseUrl: "",
    supabaseAnonKey: "",
    supabaseServiceRoleKey: "",
    databaseUrl: "",
    stripeSecretKey: "",
    stripeWebhookSecret: "",
    stripeProPriceId: "",
    stripeStudioPriceId: "",
    siteUrl: "",
    openAiApiKey: "",
    sdxlApiUrl: "",
    sdxlApiKey: "",
  },
});
