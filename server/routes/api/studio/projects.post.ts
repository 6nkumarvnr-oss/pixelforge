import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { createStudioProject } from "../../../lib/production-studio";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  if (!authUser) throw createError({ statusCode: 401, statusMessage: "Login required to create projects" });

  const body = await readBody(event);
  const project = await createStudioProject(authUser, body);
  if (!project) throw createError({ statusCode: 503, statusMessage: "Studio database tables are not ready yet" });

  return { ok: true, project };
});
