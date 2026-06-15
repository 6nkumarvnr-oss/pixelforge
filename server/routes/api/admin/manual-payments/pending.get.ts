import { defineHandler } from "nitro";
import { createError, getQuery } from "nitro/h3";
import { isSuperAdmin } from "../../../../lib/admin";
import { getAuthenticatedUser } from "../../../../lib/auth";
import { listManualPaymentQueue } from "../../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!isSuperAdmin(authUser)) {
    throw createError({ statusCode: 403, statusMessage: "Super admin access is required" });
  }

  const query = getQuery(event);
  const limit = Number(query.limit ?? 50);
  const payments = await listManualPaymentQueue(limit);

  return { ok: true, payments: payments ?? [] };
});
