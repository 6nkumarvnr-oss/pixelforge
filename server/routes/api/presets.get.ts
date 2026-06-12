import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { listPresets } from "../../lib/pixelforge-store";

export default defineHandler((event) => {
  const query = getQuery(event);
  const category = typeof query.category === "string" ? query.category : undefined;
  const presets = listPresets(category);
  const categories = Array.from(new Set(listPresets().map((preset) => preset.category)));

  return {
    ok: true,
    count: presets.length,
    categories,
    presets,
  };
});
