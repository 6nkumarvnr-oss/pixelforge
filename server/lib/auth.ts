import { createClient } from "@supabase/supabase-js";
import type { H3Event } from "nitro/h3";
import { getRequestHeaders } from "nitro/h3";
import { getPixelForgeConfig } from "./config";

export type AuthUser = {
  id: string;
  email: string;
};

export const getBearerToken = (event: H3Event) => {
  const headers = getRequestHeaders(event);
  const authorization = headers.authorization ?? headers.Authorization;
  if (!authorization?.startsWith("Bearer ")) return null;
  return authorization.slice("Bearer ".length).trim();
};

export const getAuthenticatedUser = async (event: H3Event): Promise<AuthUser | null> => {
  const token = getBearerToken(event);
  const config = getPixelForgeConfig();

  if (!token || !config.supabaseUrl || !config.supabaseServiceRoleKey) {
    return null;
  }

  const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user?.email) {
    return null;
  }

  return {
    id: data.user.id,
    email: data.user.email,
  };
};
