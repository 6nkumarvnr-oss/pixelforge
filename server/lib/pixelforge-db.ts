import { getPrisma } from "./prisma";
import { listPresets as listFallbackPresets, type Generation, type GenerateInput, type Preset } from "./pixelforge-store";
import type { AuthUser } from "./auth";

export type UserProfile = {
  id: string;
  email: string;
  credits: number;
  plan: "FREE" | "PRO" | "STUDIO";
  subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  favorites: string[];
};

const toStringArray = (value: unknown): string[] => {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
};

const planCredits = {
  FREE: 25,
  PRO: 500,
  STUDIO: 2500,
} as const;

export const ensureUser = async (authUser: AuthUser | null) => {
  const prisma = getPrisma() as any;
  if (!prisma || !authUser) return null;

  return prisma.user.upsert({
    where: { id: authUser.id },
    update: { email: authUser.email },
    create: {
      id: authUser.id,
      email: authUser.email,
      credits: planCredits.FREE,
      favorites: [],
    },
  });
};

export const getUserProfile = async (authUser: AuthUser | null): Promise<UserProfile | null> => {
  const user = await ensureUser(authUser);
  if (!user) return null;

  return {
    id: user.id,
    email: user.email,
    credits: user.credits,
    plan: user.plan,
    subscriptionStatus: user.subscriptionStatus,
    favorites: toStringArray(user.favorites),
  };
};

export const listPresetsFromDatabase = async (authUser: AuthUser | null, category?: string): Promise<Preset[] | null> => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const customPresets = await prisma.preset.findMany({
    where: {
      ...(category && category !== "All" ? { category } : {}),
      OR: [{ userId: null }, ...(user ? [{ userId: user.id }] : [])],
    },
    orderBy: { createdAt: "desc" },
  });

  const fallbackPresets = listFallbackPresets(category).map((preset) => ({ ...preset, userId: null }));
  const dbPresets = customPresets.map((preset: any) => ({
    id: preset.id,
    name: preset.name,
    category: preset.category,
    tags: preset.tags ?? [],
    prompt: preset.prompt,
    negative: preset.negative ?? "",
    userId: preset.userId,
  }));

  return [...dbPresets, ...fallbackPresets];
};

export const createPresetInDatabase = async (authUser: AuthUser | null, input: Partial<Preset>): Promise<Preset | null> => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const preset = await prisma.preset.create({
    data: {
      name: String(input.name ?? "Untitled preset"),
      category: String(input.category ?? "Custom"),
      tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 8) : [],
      prompt: String(input.prompt ?? ""),
      negative: String(input.negative ?? ""),
      userId: user?.id ?? null,
    },
  });

  return {
    id: preset.id,
    name: preset.name,
    category: preset.category,
    tags: preset.tags ?? [],
    prompt: preset.prompt,
    negative: preset.negative ?? "",
    userId: preset.userId,
  };
};

export const consumeGenerationCredit = async (authUser: AuthUser | null) => {
  const prisma = getPrisma() as any;
  if (!prisma || !authUser) return { allowed: true, user: null };

  const user = await ensureUser(authUser);
  if (!user) return { allowed: true, user: null };
  if (user.credits <= 0) return { allowed: false, user };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: 1 } },
  });

  return { allowed: true, user: updated };
};

export const saveGenerationToDatabase = async (authUser: AuthUser | null, generation: Generation) => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const saved = await prisma.generation.create({
    data: {
      prompt: generation.prompt,
      negative: generation.negative,
      imageUrl: generation.imageUrl,
      metadata: generation.metadata,
      favorite: generation.favorite,
      userId: user?.id ?? null,
    },
  });

  return {
    ...generation,
    id: saved.id,
    createdAt: saved.createdAt.toISOString(),
    userId: saved.userId,
  };
};

export const listHistoryFromDatabase = async ({
  authUser,
  limit = 20,
  favoritesOnly = false,
}: {
  authUser: AuthUser | null;
  limit?: number;
  favoritesOnly?: boolean;
}): Promise<Generation[] | null> => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const items = await prisma.generation.findMany({
    where: {
      ...(user ? { userId: user.id } : { userId: null }),
      ...(favoritesOnly ? { favorite: true } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: Math.min(Math.max(limit, 1), 50),
  });

  return items.map((item: any) => ({
    id: item.id,
    prompt: item.prompt,
    negative: item.negative ?? "",
    imageUrl: item.imageUrl,
    metadata: item.metadata,
    userId: item.userId,
    favorite: item.favorite,
    createdAt: item.createdAt.toISOString(),
  }));
};

export const addHistoryItemToDatabase = async (authUser: AuthUser | null, input: Partial<Generation>) => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const item = await prisma.generation.create({
    data: {
      prompt: String(input.prompt ?? ""),
      negative: String(input.negative ?? ""),
      imageUrl: String(input.imageUrl ?? ""),
      metadata: input.metadata ?? {},
      favorite: Boolean(input.favorite ?? false),
      userId: user?.id ?? null,
    },
  });

  return {
    id: item.id,
    prompt: item.prompt,
    negative: item.negative ?? "",
    imageUrl: item.imageUrl,
    metadata: item.metadata,
    userId: item.userId,
    favorite: item.favorite,
    createdAt: item.createdAt.toISOString(),
  };
};

export const updateGenerationFavorite = async (authUser: AuthUser | null, generationId: string, favorite: boolean) => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const updated = await prisma.generation.update({
    where: { id: generationId },
    data: { favorite },
  });

  if (user) {
    const favorites = new Set(toStringArray(user.favorites));
    if (favorite) favorites.add(generationId);
    else favorites.delete(generationId);
    await prisma.user.update({
      where: { id: user.id },
      data: { favorites: Array.from(favorites) },
    });
  }

  return {
    id: updated.id,
    prompt: updated.prompt,
    negative: updated.negative ?? "",
    imageUrl: updated.imageUrl,
    metadata: updated.metadata,
    userId: updated.userId,
    favorite: updated.favorite,
    createdAt: updated.createdAt.toISOString(),
  };
};

export const getAnalyticsFromDatabase = async (authUser: AuthUser | null) => {
  const prisma = getPrisma() as any;
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const where = user ? { userId: user.id } : { userId: null };
  const [generations, favorites, presets, recent] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.count({ where: { ...where, favorite: true } }),
    prisma.preset.count({ where: user ? { OR: [{ userId: user.id }, { userId: null }] } : { userId: null } }),
    prisma.generation.findMany({ where, take: 100, orderBy: { createdAt: "desc" } }),
  ]);

  const modelUsage = recent.reduce((usage: Record<string, number>, item: any) => {
    const model = String(item.metadata?.model ?? "Unknown");
    usage[model] = (usage[model] ?? 0) + 1;
    return usage;
  }, {});
  const styleUsage = recent.reduce((usage: Record<string, number>, item: any) => {
    const style = String(item.metadata?.style ?? "Custom");
    usage[style] = (usage[style] ?? 0) + 1;
    return usage;
  }, {});

  return {
    totals: {
      presets: presets + listFallbackPresets().length,
      generations,
      favorites,
      creditsUsed: generations,
    },
    modelUsage,
    styleUsage,
    fallbackActive: false,
    user: user
      ? {
          credits: user.credits,
          plan: user.plan,
          subscriptionStatus: user.subscriptionStatus,
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
};

export const getStripeCustomerId = async (authUser: AuthUser | null) => {
  const prisma = getPrisma() as any;
  if (!prisma || !authUser) return null;

  const user = await ensureUser(authUser);
  return user?.stripeCustomerId ?? null;
};

export const setStripeCustomerId = async (authUser: AuthUser | null, stripeCustomerId: string) => {
  const prisma = getPrisma() as any;
  if (!prisma || !authUser) return null;

  await ensureUser(authUser);
  return prisma.user.update({
    where: { id: authUser.id },
    data: { stripeCustomerId },
  });
};

export const applyBillingPlan = async ({
  email,
  stripeCustomerId,
  stripeSubscriptionId,
  plan,
  active,
}: {
  email?: string | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  plan: "FREE" | "PRO" | "STUDIO";
  active: boolean;
}) => {
  const prisma = getPrisma() as any;
  if (!prisma || !email) return null;

  const credits = active ? planCredits[plan] : planCredits.FREE;

  return prisma.user.upsert({
    where: { email },
    update: {
      plan: active ? plan : "FREE",
      credits,
      subscriptionStatus: active ? "ACTIVE" : "CANCELED",
      stripeCustomerId: stripeCustomerId ?? undefined,
      stripeSubscriptionId: stripeSubscriptionId ?? undefined,
    },
    create: {
      id: `stripe_${crypto.randomUUID()}`,
      email,
      credits,
      favorites: [],
      plan: active ? plan : "FREE",
      subscriptionStatus: active ? "ACTIVE" : "CANCELED",
      stripeCustomerId: stripeCustomerId ?? undefined,
      stripeSubscriptionId: stripeSubscriptionId ?? undefined,
    },
  });
};
