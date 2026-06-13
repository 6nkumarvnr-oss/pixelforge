import { getPixelForgeConfig } from "./config";
import { ensureUser, type AuthUser } from "./pixelforge-db";
import { getPrisma } from "./prisma";

type StudioProject = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  updatedAt: string;
};

type StudioBrief = {
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

type StudioBrandKit = {
  id: string;
  name: string;
  description: string;
  colors: unknown;
  voice: string;
  rules: unknown;
  updatedAt: string;
};

type StudioAsset = {
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

type StudioExportJob = {
  id: string;
  name: string;
  format: string;
  status: string;
  projectId: string | null;
  updatedAt: string;
};

type ProjectRow = {
  id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  updated_at: Date | string;
};

type BriefRow = {
  id: string;
  title: string;
  objective: string;
  audience: string;
  channel: string;
  status: string;
  prompt: string;
  negative: string;
  project_id: string | null;
  brand_kit_id: string | null;
  updated_at: Date | string;
};

type BrandKitRow = {
  id: string;
  name: string;
  description: string;
  colors: unknown;
  voice: string;
  rules: unknown;
  updated_at: Date | string;
};

type AssetRow = {
  id: string;
  title: string;
  kind: string;
  url: string;
  thumbnail_url: string | null;
  tags: string[];
  project_id: string | null;
  brief_id: string | null;
  generation_id: string | null;
  updated_at: Date | string;
};

type ExportJobRow = {
  id: string;
  name: string;
  format: string;
  status: string;
  project_id: string | null;
  updated_at: Date | string;
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

const iso = (value?: Date | string | null) => (value ? new Date(value).toISOString() : new Date().toISOString());

const demoWorkspace = (authenticated: boolean, databaseReady = false): StudioWorkspace => {
  const config = getPixelForgeConfig();
  const now = new Date().toISOString();

  return {
    authenticated,
    databaseReady,
    mode: databaseReady ? "production-ready" : "demo",
    providerReady: Boolean(config.openAiApiKey || config.sdxlApiUrl),
    projects: [
      {
        id: "demo-product-launch",
        name: "Premium Product Launch",
        description: "Campaign workspace for product visuals, social ads, and ecommerce hero images.",
        category: "Marketing",
        status: "ACTIVE",
        updatedAt: now,
      },
      {
        id: "demo-education-pack",
        name: "Education Visual Pack",
        description: "Classroom-ready diagrams, posters, and explainer visuals generated from structured briefs.",
        category: "Education",
        status: "PLANNING",
        updatedAt: now,
      },
    ],
    briefs: [
      {
        id: "demo-brief-perfume-ad",
        title: "Luxury perfume Instagram ad",
        objective: "Create a premium campaign visual with soft reflections and strong brand recall.",
        audience: "Young professionals interested in luxury lifestyle products.",
        channel: "Instagram",
        status: "DRAFT",
        prompt: "premium perfume bottle on sculptural glass plinth, cinematic softbox reflections, luxury editorial campaign, violet and cyan highlights",
        negative: "warped bottle, unreadable label, clutter, harsh shadows, low quality",
        projectId: "demo-product-launch",
        brandKitId: "demo-brand-kit-luxury",
        updatedAt: now,
      },
    ],
    brandKits: [
      {
        id: "demo-brand-kit-luxury",
        name: "Luxury Violet Brand",
        description: "Premium visual language for elegant campaigns and product photography.",
        colors: ["#7C3AED", "#06B6D4", "#F8FAFC", "#020617"],
        voice: "Elegant, precise, aspirational, clean.",
        rules: {
          avoid: ["cheap plastic look", "overcrowded backgrounds", "random typography"],
          prefer: ["soft reflections", "balanced negative space", "premium editorial lighting"],
        },
        updatedAt: now,
      },
    ],
    assets: [],
    exportJobs: [
      {
        id: "demo-export-campaign-pack",
        name: "Social Campaign Pack",
        format: "PNG+PROMPT",
        status: "READY_TEMPLATE",
        projectId: "demo-product-launch",
        updatedAt: now,
      },
    ],
    versioning: {
      enabled: true,
      description: "The migration adds parent/version fields so remixes can become a traceable visual version tree after database approval.",
    },
    nextActions: [
      "Apply the new Prisma/SQL migration to Supabase after human approval.",
      "Connect a real AI provider for production generation.",
      "Test authenticated projects, briefs, brand kits, assets, and exports end-to-end.",
    ],
  };
};

export const getStudioWorkspace = async (authUser: AuthUser | null): Promise<StudioWorkspace> => {
  const prisma = getPrisma();
  const user = await ensureUser(authUser);

  if (!prisma || !user) return demoWorkspace(Boolean(authUser));

  try {
    const [projects, briefs, brandKits, assets, exportJobs] = await Promise.all([
      prisma.$queryRaw<ProjectRow[]>`select id, name, description, category, status, updated_at from projects where owner_id = ${user.id} order by updated_at desc limit 20`,
      prisma.$queryRaw<BriefRow[]>`select id, title, objective, audience, channel, status, prompt, negative, project_id, brand_kit_id, updated_at from creative_briefs where owner_id = ${user.id} order by updated_at desc limit 20`,
      prisma.$queryRaw<BrandKitRow[]>`select id, name, description, colors, voice, rules, updated_at from brand_kits where owner_id = ${user.id} order by updated_at desc limit 20`,
      prisma.$queryRaw<AssetRow[]>`select id, title, kind, url, thumbnail_url, tags, project_id, brief_id, generation_id, updated_at from assets where owner_id = ${user.id} order by updated_at desc limit 30`,
      prisma.$queryRaw<ExportJobRow[]>`select id, name, format, status, project_id, updated_at from export_jobs where owner_id = ${user.id} order by updated_at desc limit 20`,
    ]);
    const fallback = demoWorkspace(true, true);

    return {
      ...fallback,
      mode: "production-ready",
      projects: projects.map((project) => ({
        id: project.id,
        name: project.name,
        description: project.description,
        category: project.category,
        status: project.status,
        updatedAt: iso(project.updated_at),
      })),
      briefs: briefs.map((brief) => ({
        id: brief.id,
        title: brief.title,
        objective: brief.objective,
        audience: brief.audience,
        channel: brief.channel,
        status: brief.status,
        prompt: brief.prompt,
        negative: brief.negative,
        projectId: brief.project_id,
        brandKitId: brief.brand_kit_id,
        updatedAt: iso(brief.updated_at),
      })),
      brandKits: brandKits.map((brandKit) => ({
        id: brandKit.id,
        name: brandKit.name,
        description: brandKit.description,
        colors: brandKit.colors,
        voice: brandKit.voice,
        rules: brandKit.rules,
        updatedAt: iso(brandKit.updated_at),
      })),
      assets: assets.map((asset) => ({
        id: asset.id,
        title: asset.title,
        kind: asset.kind,
        url: asset.url,
        thumbnailUrl: asset.thumbnail_url,
        tags: asset.tags,
        projectId: asset.project_id,
        briefId: asset.brief_id,
        generationId: asset.generation_id,
        updatedAt: iso(asset.updated_at),
      })),
      exportJobs: exportJobs.map((job) => ({
        id: job.id,
        name: job.name,
        format: job.format,
        status: job.status,
        projectId: job.project_id,
        updatedAt: iso(job.updated_at),
      })),
    };
  } catch {
    return demoWorkspace(true, false);
  }
};

export const createStudioProject = async (authUser: AuthUser | null, input: Partial<StudioProject>) => {
  const prisma = getPrisma();
  const user = await ensureUser(authUser);
  if (!prisma || !user) return null;

  const rows = await prisma.$queryRaw<ProjectRow[]>`
    insert into projects (name, description, category, status, owner_id)
    values (${String(input.name ?? "Untitled Creative Project").trim()}, ${String(input.description ?? "")}, ${String(input.category ?? "Creative")}, ${String(input.status ?? "ACTIVE")}, ${user.id})
    returning id, name, description, category, status, updated_at
  `;

  return rows[0] ?? null;
};

export const createStudioBrandKit = async (authUser: AuthUser | null, input: Partial<StudioBrandKit>) => {
  const prisma = getPrisma();
  const user = await ensureUser(authUser);
  if (!prisma || !user) return null;

  const rows = await prisma.$queryRaw<BrandKitRow[]>`
    insert into brand_kits (name, description, colors, voice, rules, owner_id)
    values (${String(input.name ?? "Untitled Brand Kit").trim()}, ${String(input.description ?? "")}, ${input.colors ?? []}, ${String(input.voice ?? "")}, ${input.rules ?? {}}, ${user.id})
    returning id, name, description, colors, voice, rules, updated_at
  `;

  return rows[0] ?? null;
};

export const createStudioBrief = async (authUser: AuthUser | null, input: Partial<StudioBrief>) => {
  const prisma = getPrisma();
  const user = await ensureUser(authUser);
  if (!prisma || !user) return null;

  const rows = await prisma.$queryRaw<BriefRow[]>`
    insert into creative_briefs (title, objective, audience, channel, status, prompt, negative, owner_id, project_id, brand_kit_id)
    values (${String(input.title ?? "Untitled Creative Brief").trim()}, ${String(input.objective ?? "")}, ${String(input.audience ?? "")}, ${String(input.channel ?? "General")}, ${String(input.status ?? "DRAFT")}, ${String(input.prompt ?? "")}, ${String(input.negative ?? "")}, ${user.id}, ${input.projectId ?? null}, ${input.brandKitId ?? null})
    returning id, title, objective, audience, channel, status, prompt, negative, project_id, brand_kit_id, updated_at
  `;

  return rows[0] ?? null;
};
