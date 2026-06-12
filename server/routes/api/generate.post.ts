import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { createGeneration, type GenerateInput } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<GenerateInput>(event);
  const prompt = String(body?.prompt ?? "").trim();

  if (!prompt) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  const generation = createGeneration({ ...body, prompt });

  return {
    ok: true,
    provider: generation.metadata.provider,
    generation,
  };
});
