import type { AuthUser } from "./auth";

export const SUPER_ADMIN_EMAIL = "6nkumar.vnr@gmail.com";

export const isSuperAdmin = (authUser: AuthUser | null) =>
  authUser?.email.toLowerCase() === SUPER_ADMIN_EMAIL;
