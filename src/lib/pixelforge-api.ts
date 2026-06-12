import { getSupabaseAccessToken } from "@/lib/supabaseClient";

export type ApiPreset = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  prompt: string;
  negative: string;
  userId: string | null;
};

export type ApiGenerationMetadata = {
  model: string;
  aspect: string;
  resolution: string;
  seed: number;
  sampler: string;
  creativity: number;
  upscale: boolean;
  removeBackground: boolean;
  colorBoost: boolean;
  provider: "fallback" | "sdxl" | "dalle";
  style: string;
};

export type ApiGeneration = {
  id: string;
  prompt: string;
  negative: string;
  imageUrl: string;
  metadata: ApiGenerationMetadata;
  userId: string | null;
  favorite: boolean;
  createdAt: string;
};

export type ApiAnalytics = {
  totals: {
    presets: number;
    generations: number;
    favorites: number;
    creditsUsed: number;
  };
  modelUsage: Record<string, number>;
  styleUsage: Record<string, number>;
  fallbackActive: boolean;
  user?: {
    credits: number;
    plan: "FREE" | "PRO" | "STUDIO";
    subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  } | null;
  updatedAt: string;
};

export type ApiUserProfile = {
  id: string;
  email: string;
  credits: number | null;
  plan: "FREE" | "PRO" | "STUDIO";
  subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  favorites?: string[];
};

export type GenerateRequest = Partial<ApiGenerationMetadata> & {
  prompt: string;
  negative?: string;
  userId?: string;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const token = await getSupabaseAccessToken();
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || `Request failed with status ${response.status}`);
  }

  return response.json() as Promise<T>;
};

export const fetchPixelForgePresets = async () => {
  const data = await requestJson<{ ok: boolean; presets: ApiPreset[] }>("/api/presets");
  return data.presets;
};

export const fetchPixelForgeHistory = async () => {
  const data = await requestJson<{ ok: boolean; history: ApiGeneration[] }>("/api/history?limit=18");
  return data.history;
};

export const fetchPixelForgeAnalytics = async () => {
  const data = await requestJson<{ ok: boolean; analytics: ApiAnalytics }>("/api/analytics");
  return data.analytics;
};

export const fetchPixelForgeUser = async () => {
  const data = await requestJson<{ ok: boolean; authenticated: boolean; user: ApiUserProfile | null }>("/api/me");
  return data.user;
};

export const generatePixelForgeImage = async (input: GenerateRequest) => {
  const data = await requestJson<{ ok: boolean; generation: ApiGeneration; creditsRemaining: number | null }>("/api/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.generation;
};

export const updatePixelForgeFavorite = async (id: string, favorite: boolean) => {
  const data = await requestJson<{ ok: boolean; item: ApiGeneration | null; fallback?: boolean }>(`/api/history/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ favorite }),
  });
  return data.item;
};

export const createBillingCheckout = async (plan: "PRO" | "STUDIO") => {
  const data = await requestJson<{ ok: boolean; url: string | null }>("/api/billing/checkout", {
    method: "POST",
    body: JSON.stringify({ plan }),
  });
  return data.url;
};

export const createBillingPortal = async () => {
  const data = await requestJson<{ ok: boolean; url: string }>("/api/billing/portal", {
    method: "POST",
    body: JSON.stringify({}),
  });
  return data.url;
};
