import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody } from "nitro/h3";
import { isSuperAdmin } from "../../../../../lib/admin";
import { getAuthenticatedUser } from "../../../../../lib/auth";
import { deactivateManualUser } from "../../../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!isSuperAdmin(authUser) || !authUser) {
    throw createError({ statusCode: 403, statusMessage: "Super admin access is required" });
  }

  const id = getRouterParam(event, "id");
  if (!id) throw createError({ statusCode: 400, statusMessage: "User id is required" });

  const body = await readBody<{ reason?: string }>(event);
  const user = await deactivateManualUser(authUser, id, body.reason ?? "Manual deactivation by admin");
  if (!user) throw createError({ statusCode: 404, statusMessage: "User was not found" });

  return { ok: true, user };
});
