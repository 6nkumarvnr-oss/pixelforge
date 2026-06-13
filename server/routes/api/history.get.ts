import { defineHandler } from "nitro";
import { getQuery } from "nitro/h3";
import { getAuthenticatedUser } from "../../lib/auth";
import { listHistoryFromDatabase } from "../../lib/pixelforge-db";
import { listHistory } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const query = getQuery(event);
  const limit = Number(query.limit ?? 20);
  const favoritesOnly = query.favorites === "true";
  const authUser = await getAuthenticatedUser(event);

  if (!authUser) {
    return {
      ok: true,
      count: 0,
      history: [],
    };
  }

  const history = (await listHistoryFromDatabase({ authUser, limit, favoritesOnly })) ?? listHistory({ limit, favoritesOnly });

  return {
    ok: true,
    count: history.length,
    history,
  };
});
