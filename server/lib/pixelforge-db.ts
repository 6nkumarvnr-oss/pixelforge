import { getPrisma } from "./prisma";
import { isSuperAdmin } from "./admin";
import { listPresets as listFallbackPresets, type Generation, type GenerateInput, type Preset } from "./pixelforge-store";
import type { AuthUser } from "./auth";

export type UserProfile = {
  id: string;
  email: string;
  credits: number | null;
  plan: "FREE" | "PRO" | "STUDIO";
  subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  favorites: string[];
  role: "SUPER_ADMIN" | "USER";
  unlimitedCredits: boolean;
};

export type AdminPaymentSettings = {
  supportEmail: string;
  businessName: string;
  currency: string;
  proPlanLabel: string;
  studioPlanLabel: string;
  paymentNote: string;
  bankTransferNote: string;
  updatedAt: string;
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
  const prisma = getPrisma();
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

  const superAdmin = isSuperAdmin(authUser);

  return {
    id: user.id,
    email: user.email,
    credits: superAdmin ? null : user.credits,
    plan: superAdmin ? "STUDIO" : user.plan,
    subscriptionStatus: superAdmin ? "ACTIVE" : user.subscriptionStatus,
    favorites: toStringArray(user.favorites),
    role: superAdmin ? "SUPER_ADMIN" : "USER",
    unlimitedCredits: superAdmin,
  };
};

export const listPresetsFromDatabase = async (authUser: AuthUser | null, category?: string): Promise<Preset[] | null> => {
  const prisma = getPrisma();
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
  const dbPresets = customPresets.map((preset) => ({
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
  const prisma = getPrisma();
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
  const prisma = getPrisma();
  if (!prisma || !authUser) return { allowed: true, user: null, unlimited: false };

  const user = await ensureUser(authUser);
  if (!user) return { allowed: true, user: null, unlimited: false };
  if (isSuperAdmin(authUser)) return { allowed: true, user, unlimited: true };
  if (user.credits <= 0) return { allowed: false, user, unlimited: false };

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: 1 } },
  });

  return { allowed: true, user: updated, unlimited: false };
};

export const saveGenerationToDatabase = async (authUser: AuthUser | null, generation: Generation) => {
  const prisma = getPrisma();
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
  const prisma = getPrisma();
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

  return items.map((item) => ({
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
  const prisma = getPrisma();
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
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  // Ownership check: only the generation's owner (or anonymous owner for null userId) may update it.
  const owned = await prisma.generation.findFirst({
    where: { id: generationId, userId: user ? user.id : null },
  });
  if (!owned) return null;

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
  const prisma = getPrisma();
  if (!prisma) return null;

  const user = await ensureUser(authUser);
  const where = user ? { userId: user.id } : { userId: null };
  const [generations, favorites, presets, recent] = await Promise.all([
    prisma.generation.count({ where }),
    prisma.generation.count({ where: { ...where, favorite: true } }),
    prisma.preset.count({ where: user ? { OR: [{ userId: user.id }, { userId: null }] } : { userId: null } }),
    prisma.generation.findMany({ where, take: 100, orderBy: { createdAt: "desc" } }),
  ]);

  const readMetadataLabel = (metadata: unknown, key: "model" | "style", fallback: string) => {
    if (!metadata || typeof metadata !== "object") return fallback;
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === "string" && value.trim() ? value : fallback;
  };

  const modelUsage = recent.reduce<Record<string, number>>((usage, item) => {
    const model = readMetadataLabel(item.metadata, "model", "Unknown");
    usage[model] = (usage[model] ?? 0) + 1;
    return usage;
  }, {});
  const styleUsage = recent.reduce<Record<string, number>>((usage, item) => {
    const style = readMetadataLabel(item.metadata, "style", "Custom");
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
          credits: isSuperAdmin(authUser) ? null : user.credits,
          plan: isSuperAdmin(authUser) ? "STUDIO" : user.plan,
          subscriptionStatus: isSuperAdmin(authUser) ? "ACTIVE" : user.subscriptionStatus,
          role: isSuperAdmin(authUser) ? "SUPER_ADMIN" : "USER",
          unlimitedCredits: isSuperAdmin(authUser),
        }
      : null,
    updatedAt: new Date().toISOString(),
  };
};

export const getAdminPaymentSettings = async (): Promise<AdminPaymentSettings | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  const rows = await prisma.$queryRaw<Array<{
    support_email: string;
    business_name: string;
    currency: string;
    pro_plan_label: string;
    studio_plan_label: string;
    payment_note: string;
    bank_transfer_note: string;
    updated_at: Date;
  }>>`SELECT support_email, business_name, currency, pro_plan_label, studio_plan_label, payment_note, bank_transfer_note, updated_at FROM public.admin_payment_settings WHERE id = 'payment' LIMIT 1`;

  const row = rows[0];
  if (!row) return null;

  return {
    supportEmail: row.support_email,
    businessName: row.business_name,
    currency: row.currency,
    proPlanLabel: row.pro_plan_label,
    studioPlanLabel: row.studio_plan_label,
    paymentNote: row.payment_note,
    bankTransferNote: row.bank_transfer_note,
    updatedAt: row.updated_at.toISOString(),
  };
};

export const updateAdminPaymentSettings = async (input: Partial<AdminPaymentSettings>): Promise<AdminPaymentSettings | null> => {
  const prisma = getPrisma();
  if (!prisma) return null;

  await prisma.$executeRaw`
    INSERT INTO public.admin_payment_settings (
      id, support_email, business_name, currency, pro_plan_label, studio_plan_label, payment_note, bank_transfer_note, updated_at
    ) VALUES (
      'payment',
      ${String(input.supportEmail ?? "6nkumar.vnr@gmail.com")},
      ${String(input.businessName ?? "PixelForge Studio")},
      ${String(input.currency ?? "USD")},
      ${String(input.proPlanLabel ?? "Pro Creator")},
      ${String(input.studioPlanLabel ?? "Studio Team")},
      ${String(input.paymentNote ?? "Stripe Checkout handles card payments securely. Bank payout details should be managed inside the Stripe dashboard.")},
      ${String(input.bankTransferNote ?? "For manual bank transfer or payout changes, verify ownership and update bank details only inside Stripe Dashboard payouts settings.")},
      NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
      support_email = EXCLUDED.support_email,
      business_name = EXCLUDED.business_name,
      currency = EXCLUDED.currency,
      pro_plan_label = EXCLUDED.pro_plan_label,
      studio_plan_label = EXCLUDED.studio_plan_label,
      payment_note = EXCLUDED.payment_note,
      bank_transfer_note = EXCLUDED.bank_transfer_note,
      updated_at = NOW()
  `;

  return getAdminPaymentSettings();
};

export const getStripeCustomerId = async (authUser: AuthUser | null) => {
  const prisma = getPrisma();
  if (!prisma || !authUser) return null;

  const user = await ensureUser(authUser);
  return user?.stripeCustomerId ?? null;
};

export const setStripeCustomerId = async (authUser: AuthUser | null, stripeCustomerId: string) => {
  const prisma = getPrisma();
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
  const prisma = getPrisma();
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
