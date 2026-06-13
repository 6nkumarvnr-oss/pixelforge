import { defineHandler } from "nitro";
import { createError, getRouterParam, readBody } from "nitro/h3";
import { getAuthenticatedUser } from "../../../lib/auth";
import { updateGenerationFavorite } from "../../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const id = getRouterParam(event, "id");
  const body = await readBody<{ favorite?: boolean }>(event);

  if (!id) {
    throw createError({ statusCode: 400, statusMessage: "generation id is required" });
  }

  const authUser = await getAuthenticatedUser(event);

  if (!authUser) {
    return {
      ok: true,
      item: null,
      fallback: true,
    };
  }

  const updated = await updateGenerationFavorite(authUser, id, Boolean(body.favorite));

  if (!updated) {
    return {
      ok: true,
      item: null,
      fallback: true,
    };
  }

  return {
    ok: true,
    item: updated,
  };
});
