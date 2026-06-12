import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { createPreset, type Preset } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<Partial<Preset>>(event);

  if (!String(body?.name ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "name is required" });
  }

  if (!String(body?.prompt ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  const preset = createPreset(body);

  return {
    ok: true,
    preset,
  };
});
