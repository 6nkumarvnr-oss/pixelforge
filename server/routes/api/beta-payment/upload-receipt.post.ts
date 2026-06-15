import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { submitManualPaymentReceipt } from "../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!authUser) {
    throw createError({ statusCode: 401, statusMessage: "Login is required before submitting a manual payment receipt" });
  }

  const body = await readBody<Record<string, unknown>>(event);
  const payment = await submitManualPaymentReceipt(authUser, body);
  if (!payment) {
    throw createError({ statusCode: 500, statusMessage: "Manual payment receipt could not be saved" });
  }

  return { ok: true, payment };
});
