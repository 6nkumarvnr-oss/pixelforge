import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { getAuthenticatedUser } from "../../lib/auth";
import { listPresetsFromDatabase } from "../../lib/pixelforge-db";
import { listPresets } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const category = typeof query.category === "string" ? query.category : undefined;
  const authUser = await getAuthenticatedUser(event);
  const presets = (await listPresetsFromDatabase(authUser, category)) ?? listPresets(category);
  const categories = Array.from(new Set(presets.map((preset) => preset.category)));

  return {
    ok: true,
    count: presets.length,
    categories,
    presets,
  };
});
