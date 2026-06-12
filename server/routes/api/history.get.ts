import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { listHistory } from "../../lib/pixelforge-store";

export default defineHandler((event) => {
  const query = getQuery(event);
  const limit = Number(query.limit ?? 20);
  const favoritesOnly = query.favorites === "true";
  const history = listHistory({ limit, favoritesOnly });

  return {
    ok: true,
    count: history.length,
    history,
  };
});
