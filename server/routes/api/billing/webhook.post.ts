import Stripe from "stripe";
import { defineHandler } from "nitro";
import { createError, getRequestHeaders, readRawBody } from "nitro/h3";
import { getPixelForgeConfig } from "../../../lib/config";
import { applyBillingPlan } from "../../../lib/pixelforge-db";

const getPlanFromPrice = (priceId: string | null | undefined, config: ReturnType<typeof getPixelForgeConfig>) => {
  if (priceId && priceId === config.stripeStudioPriceId) return "STUDIO" as const;
  if (priceId && priceId === config.stripeProPriceId) return "PRO" as const;
  return "FREE" as const;
};

export default defineHandler(async (event) => {
  const config = getPixelForgeConfig();

  if (!config.stripeSecretKey || !config.stripeWebhookSecret) {
    throw createError({ statusCode: 503, statusMessage: "Stripe webhook is not configured" });
  }

  const rawBody = await readRawBody(event);
  const signature = getRequestHeaders(event)["stripe-signature"];

  if (!rawBody || !signature) {
    throw createError({ statusCode: 400, statusMessage: "Missing Stripe webhook payload" });
  }

  const stripe = new Stripe(config.stripeSecretKey);
  let stripeEvent: Stripe.Event;

  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, signature, config.stripeWebhookSecret);
  } catch {
    throw createError({ statusCode: 400, statusMessage: "Invalid Stripe webhook signature" });
  }

  if (stripeEvent.type === "checkout.session.completed") {
    const session = stripeEvent.data.object as Stripe.Checkout.Session;
    await applyBillingPlan({
      email: session.customer_details?.email ?? session.metadata?.email,
      stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
      stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
      plan: session.metadata?.plan === "STUDIO" ? "STUDIO" : "PRO",
      active: true,
    });
  }

  if (stripeEvent.type === "customer.subscription.updated" || stripeEvent.type === "customer.subscription.deleted") {
    const subscription = stripeEvent.data.object as Stripe.Subscription;
    const priceId = subscription.items.data[0]?.price.id;
    const plan = getPlanFromPrice(priceId, config);
    const active = stripeEvent.type !== "customer.subscription.deleted" && ["active", "trialing"].includes(subscription.status);
    const customer = typeof subscription.customer === "string" ? await stripe.customers.retrieve(subscription.customer) : null;
    const email = customer && !customer.deleted ? customer.email : subscription.metadata.email;

    await applyBillingPlan({
      email,
      stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : null,
      stripeSubscriptionId: subscription.id,
      plan: active ? plan : "FREE",
      active,
    });
  }

  return { ok: true, received: true };
});
