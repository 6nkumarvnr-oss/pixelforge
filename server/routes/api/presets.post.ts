import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../lib/auth";
import { createPresetInDatabase } from "../../lib/pixelforge-db";
import { createPreset, type Preset } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<Partial<Preset>>(event);

  if (!String(body?.name ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  if (!String(body?.prompt ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  const authUser = await getAuthenticatedUser(event);
  const preset = (await createPresetInDatabase(authUser, body)) ?? createPreset({ ...body, userId: authUser?.id });

  return {
    ok: true,
    preset,
  };
});
