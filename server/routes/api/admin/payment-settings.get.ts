import { defineHandler } from "nitro";
import { createError } from "nitro/h3";
import { isSuperAdmin } from "../../../lib/admin";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getPixelForgeConfig } from "../../../lib/config";
import { getAdminPaymentSettings } from "../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!isSuperAdmin(authUser)) {
    throw createError({ statusCode: 403, statusMessage: "Super admin access is required" });
  }

  const config = getPixelForgeConfig();
  const settings = await getAdminPaymentSettings();

  return {
    ok: true,
    settings,
    stripe: {
      secretKeyConfigured: Boolean(config.stripeSecretKey),
      proPriceConfigured: Boolean(config.stripeProPriceId),
      studioPriceConfigured: Boolean(config.stripeStudioPriceId),
      webhookSecretConfigured: Boolean(config.stripeWebhookSecret),
    },
  };
});
