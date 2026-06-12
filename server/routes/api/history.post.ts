import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { addHistoryItem, type Generation } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<Partial<Generation>>(event);

  if (!String(body?.prompt ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  if (!String(body?.imageUrl ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "imageUrl is required" });
  }

  const item = addHistoryItem(body);

  return {
    ok: true,
    item,
  };
});
