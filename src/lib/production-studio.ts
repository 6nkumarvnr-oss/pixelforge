import { requestJson } from "@/lib/pixelforge-api";

export type StudioProject = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  updatedAt: string;
};

export type StudioBrief = {
  id: string;
  title: string;
  objective: string;
  audience: string;
  channel: string;
  status: string;
  prompt: string;
  negative: string;
  projectId: string | null;
  brandKitId: string | null;
  updatedAt: string;
};

export type StudioBrandKit = {
  id: string;
  name: string;
  description: string;
  colors: unknown;
  voice: string;
  rules: unknown;
  updatedAt: string;
};

export type StudioAsset = {
  id: string;
  title: string;
  kind: string;
  url: string;
  thumbnailUrl: string | null;
  tags: string[];
  projectId: string | null;
  briefId: string | null;
  generationId: string | null;
  updatedAt: string;
};

export type StudioExportJob = {
  id: string;
  name: string;
  format: string;
  status: string;
  projectId: string | null;
  updatedAt: string;
};

export type StudioWorkspace = {
  authenticated: boolean;
  databaseReady: boolean;
  mode: "demo" | "production-ready";
  providerReady: boolean;
  projects: StudioProject[];
  briefs: StudioBrief[];
  brandKits: StudioBrandKit[];
  assets: StudioAsset[];
  exportJobs: StudioExportJob[];
  versioning: {
    enabled: boolean;
    description: string;
  };
  nextActions: string[];
};

export const fetchStudioWorkspace = async () => {
  const data = await requestJson<{ ok: boolean; workspace: StudioWorkspace }>("/api/studio/workspace");
  return data.workspace;
};
