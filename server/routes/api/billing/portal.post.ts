import Stripe from "stripe";
import { defineHandler } from "nitro";
import { createError } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getPixelForgeConfig } from "../../../lib/config";
import { getStripeCustomerId } from "../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const config = getPixelForgeConfig();
  const authUser = await getAuthenticatedUser(event);

  if (!authUser) {
    throw createError({ statusCode: 401, statusMessage: "Login is required for billing" });
  }

  if (!config.stripeSecretKey) {
    throw createError({ statusCode: 503, statusMessage: "Stripe billing is not configured" });
  }

  const customerId = await getStripeCustomerId(authUser);
  if (!customerId) {
    throw createError({ statusCode: 404, statusMessage: "No Stripe customer found" });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  const session = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: config.siteUrl,
  });

  return {
    ok: true,
    url: session.url,
  };
});
