import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { createStudioBrief } from "../../../lib/production-studio";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!authUser) throw createError({ statusCode: 401, statusMessage: "Login required to create creative briefs" });

  const body = await readBody(event);
  const brief = await createStudioBrief(authUser, body);
  if (!brief) throw createError({ statusCode: 503, statusMessage: "Studio database tables are not ready yet" });

  return { ok: true, brief };
});
