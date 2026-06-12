import { defineHandler } from "nitro";
import { getAnalytics } from "../../lib/pixelforge-store";

export default defineHandler(() => ({
  ok: true,
  analytics: getAnalytics(),
}));
