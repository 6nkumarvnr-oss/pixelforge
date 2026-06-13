import { defineHandler } from "nitro";
import { createError, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../lib/auth";
import { addHistoryItemToDatabase } from "../../lib/pixelforge-db";
import { addHistoryItem, type Generation } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const body = await readBody<Partial<Generation>>(event);

  if (!String(body?.prompt ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "prompt is required" });
  }

  if (!String(body?.imageUrl ?? "").trim()) {
    throw createError({ statusCode: 400, statusMessage: "imageUrl is required" });
  }

  const authUser = await getAuthenticatedUser(event);

  if (!authUser) {
    return {
      ok: true,
      item: null,
      fallback: true,
    };
  }

  const item = (await addHistoryItemToDatabase(authUser, body)) ?? addHistoryItem({ ...body, userId: authUser.id });

  return {
    ok: true,
    item,
  };
});
