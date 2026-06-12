import Stripe from "stripe";
import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { getPixelForgeConfig } from "../../../lib/config";
import { getStripeCustomerId, setStripeCustomerId } from "../../../lib/pixelforge-db";

type CheckoutBody = {
  plan?: "PRO" | "STUDIO";
};

export default defineHandler(async (event) => {
  const config = getPixelForgeConfig();
  const authUser = await getAuthenticatedUser(event);
  const body = await readBody<CheckoutBody>(event);
  const plan = body?.plan === "STUDIO" ? "STUDIO" : "PRO";
  const priceId = plan === "STUDIO" ? config.stripeStudioPriceId : config.stripeProPriceId;

  if (!authUser) {
    throw createError({ statusCode: 401, statusMessage: "Login is required for billing" });
  }

  if (!config.stripeSecretKey || !priceId) {
    throw createError({ statusCode: 503, statusMessage: "Stripe billing is not configured" });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  let customerId = await getStripeCustomerId(authUser);

  if (!customerId) {
    const customer = await stripe.customers.create({ email: authUser.email, metadata: { userId: authUser.id } });
    customerId = customer.id;
    await setStripeCustomerId(authUser, customerId);
  }

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${config.siteUrl}/?billing=success`,
    cancel_url: `${config.siteUrl}/?billing=cancelled`,
    metadata: {
      userId: authUser.id,
      email: authUser.email,
      plan,
    },
    subscription_data: {
      metadata: {
        userId: authUser.id,
        email: authUser.email,
        plan,
      },
    },
  });

  return {
    ok: true,
    url: session.url,
  };
});
