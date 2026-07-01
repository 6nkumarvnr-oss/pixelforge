import type { AuthUser } from "./auth";

// ValorStruct / Meiveeram ecosystem admin emails — both bypass all limits and have super-admin access.
export const ADMIN_EMAILS = ["6nkumar.vnr@gmail.com", "arun@valorstruct.com"];

// Kept for backward compatibility with any code still importing the singular constant.
export const SUPER_ADMIN_EMAIL = ADMIN_EMAILS[0];

export const isSuperAdmin = (authUser: AuthUser | null) =>
  !!authUser?.email && ADMIN_EMAILS.includes(authUser.email.toLowerCase());
