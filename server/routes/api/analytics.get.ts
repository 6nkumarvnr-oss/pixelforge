import { defineHandler } from "nitro";
import { getAuthenticatedUser } from "../../lib/auth";
import { getAnalyticsFromDatabase } from "../../lib/pixelforge-db";
import { getAnalytics } from "../../lib/pixelforge-store";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  const analytics = (await getAnalyticsFromDatabase(authUser)) ?? getAnalytics();

  return {
    ok: true,
    analytics,
  };
});
