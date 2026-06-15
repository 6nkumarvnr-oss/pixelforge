import { defineHandler } from "nitro";
import { getAuthenticatedUser } from "../../lib/auth";
import { getUserProfile } from "../../lib/pixelforge-db";

export default defineHandler(async (event) => {
  const authUser = await getAuthenticatedUser(event);
  const profile = await getUserProfile(authUser);

  return {
    ok: true,
    authenticated: Boolean(authUser),
    user: profile ?? (authUser ? { id: authUser.id, email: authUser.email, credits: null, plan: "FREE", subscriptionStatus: "NONE", paymentStatus: "FREE", paymentReference: null, expiryDate: null, activatedByAdmin: null, role: "USER", unlimitedCredits: false } : null),
  };
});
