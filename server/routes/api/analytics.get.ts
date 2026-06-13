import { defineHandler } from "nitro";
import { getAuthenticatedUser } from "../../lib/auth";
import { getAnalyticsFromDatabase } from "../../lib/pixelforge-db";
import { getAnalytics, listPresets } from "../../lib/pixelforge-store";
import { getPixelForgeConfig } from "../../lib/config";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);

  if (!authUser) {
    const config = getPixelForgeConfig();
    return {
      ok: true,
      analytics: {
        totals: {
          presets: listPresets().length,
          generations: 0,
          favorites: 0,
          creditsUsed: 0,
        },
        modelUsage: {},
        styleUsage: {},
        fallbackActive: !config.openAiApiKey && !config.sdxlApiUrl,
        user: null,
        updatedAt: new Date().toISOString(),
      },
    };
  }

  const analytics = (await getAnalyticsFromDatabase(authUser)) ?? getAnalytics();

  return {
    ok: true,
    analytics,
  };
});
