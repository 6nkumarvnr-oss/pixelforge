import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { createStudioBrandKit } from "../../../lib/production-studio";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!authUser) throw createError({ statusCode: 401, statusMessage: "Login required to create brand kits" });

  const body = await readBody(event);
  const brandKit = await createStudioBrandKit(authUser, body);
  if (!brandKit) throw createError({ statusCode: 503, statusMessage: "Studio database tables are not ready yet" });

  return { ok: true, brandKit };
});
