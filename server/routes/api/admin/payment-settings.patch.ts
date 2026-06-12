import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { isSuperAdmin } from "../../../lib/admin";
import { getAuthenticatedUser } from "../../../lib/auth";
import { updateAdminPaymentSettings, type AdminPaymentSettings } from "../../../lib/pixelforge-db";

const cleanText = (value: unknown, fallback: string, maxLength = 600) => {
  const text = typeof value === "string" ? value.trim() : "";
  return (text || fallback).slice(0, maxLength);
};

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!isSuperAdmin(authUser)) {
    throw createError({ statusCode: 403, statusMessage: "Super admin access is required" });
  }

  const body = await readBody<Partial<AdminPaymentSettings>>(event);
  const settings = await updateAdminPaymentSettings({
    supportEmail: cleanText(body.supportEmail, "6nkumar.vnr@gmail.com", 120),
    businessName: cleanText(body.businessName, "PixelForge Studio", 120),
    currency: cleanText(body.currency, "USD", 12).toUpperCase(),
    proPlanLabel: cleanText(body.proPlanLabel, "Pro Creator", 80),
    studioPlanLabel: cleanText(body.studioPlanLabel, "Studio Team", 80),
    paymentNote: cleanText(body.paymentNote, "Stripe Checkout handles card payments securely. Bank payout details should be managed inside the Stripe dashboard."),
    bankTransferNote: cleanText(body.bankTransferNote, "For manual bank transfer or payout changes, verify ownership and update bank details only inside Stripe Dashboard payouts settings."),
  });

  return {
    ok: true,
    settings,
  };
});
