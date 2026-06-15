import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody } from "nitro/h3";
import { isSuperAdmin } from "../../../../../lib/admin";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { rejectManualPayment } from "../../../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!isSuperAdmin(authUser) || !authUser) {
    throw createError({ statusCode: 403, statusMessage: "Super admin access is required" });
  }

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "Payment id is required" });

  const body = await readBody<{ reason?: string }>(event);
  const payment = await rejectManualPayment(authUser, id, body.reason ?? "Manual payment rejected by admin");
  if (!payment) throw createError({ statusCode: 404, statusMessage: "Payment record was not found" });

  return { ok: true, payment };
});
