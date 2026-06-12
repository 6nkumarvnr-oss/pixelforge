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
  updatedAt: string;
};

export type GenerateRequest = Partial<ApiGenerationMetadata> & {
  prompt: string;
  negative?: string;
  userId?: string;
};

const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
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

export const generatePixelForgeImage = async (input: GenerateRequest) => {
  const data = await requestJson<{ ok: boolean; generation: ApiGeneration }>("/api/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.generation;
};
