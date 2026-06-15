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
    credits: number | null;
    plan: "FREE" | "PRO" | "STUDIO";
    subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
    role?: "SUPER_ADMIN" | "USER";
    unlimitedCredits?: boolean;
  } | null;
  updatedAt: string;
};

export type ApiUserProfile = {
  id: string;
  email: string;
  credits: number | null;
  plan: "FREE" | "PRO" | "STUDIO";
  subscriptionStatus: "NONE" | "ACTIVE" | "PAST_DUE" | "CANCELED";
  paymentStatus?: "FREE" | "PENDING_PAYMENT" | "ACTIVE" | "EXPIRED" | "REJECTED" | "DEACTIVATED";
  paymentReference?: string | null;
  expiryDate?: string | null;
  activatedByAdmin?: string | null;
  favorites?: string[];
  role?: "SUPER_ADMIN" | "USER";
  unlimitedCredits?: boolean;
};

export type ApiManualPaymentRecord = {
  id: string;
  userId: string;
  customerEmail: string;
  customerName: string | null;
  selectedPlan: "PRO" | "STUDIO";
  amount: string | null;
  currency: string;
  paymentMethod: string;
  paymentReference: string | null;
  invoiceNumber: string | null;
  receiptFileName: string | null;
  receiptFileUrl: string | null;
  paymentStatus: string;
  adminVerificationStatus: string;
  verifiedByAdmin: string | null;
  verifiedAt: string | null;
  rejectionReason: string | null;
  activatedPlan: string | null;
  creditsGranted: number | null;
  validFrom: string | null;
  validUntil: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ManualPaymentReceiptInput = {
  selectedPlan: "PRO" | "STUDIO";
  customerName?: string;
  amount?: string;
  currency?: string;
  paymentMethod?: string;
  paymentReference?: string;
  invoiceNumber?: string;
  receiptFileName?: string;
  receiptFileUrl?: string;
  receiptFileStoragePath?: string;
  notes?: string;
};

export type ApiAdminPaymentSettings = {
  supportEmail: string;
  businessName: string;
  currency: string;
  proPlanLabel: string;
  studioPlanLabel: string;
  paymentNote: string;
  bankTransferNote: string;
  updatedAt: string;
};

export type ApiAdminPaymentStatus = {
  secretKeyConfigured: boolean;
  proPriceConfigured: boolean;
  studioPriceConfigured: boolean;
  webhookSecretConfigured: boolean;
};

export type GenerateRequest = Partial<ApiGenerationMetadata> & {
  prompt: string;
  negative?: string;
  userId?: string;
};

export const requestJson = async <T>(path: string, init?: RequestInit): Promise<T> => {
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
  const data = await requestJson<{ ok: boolean; generation: ApiGeneration; provider?: GenerateRequest["provider"]; creditsRemaining: number | null }>("/api/generate", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return { generation: data.generation, provider: data.provider ?? data.generation.metadata.provider };
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

export const fetchAdminPaymentSettings = async () => {
  const data = await requestJson<{
    ok: boolean;
    settings: ApiAdminPaymentSettings | null;
    stripe: ApiAdminPaymentStatus;
  }>("/api/admin/payment-settings");
  return data;
};

export const updateAdminPaymentSettings = async (settings: Partial<ApiAdminPaymentSettings>) => {
  const data = await requestJson<{ ok: boolean; settings: ApiAdminPaymentSettings | null }>("/api/admin/payment-settings", {
    method: "PATCH",
    body: JSON.stringify(settings),
  });
  return data.settings;
};


export const submitManualPaymentReceipt = async (input: ManualPaymentReceiptInput) => {
  const data = await requestJson<{ ok: boolean; payment: ApiManualPaymentRecord }>("/api/beta-payment/upload-receipt", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.payment;
};

export const fetchPendingManualPayments = async () => {
  const data = await requestJson<{ ok: boolean; payments: ApiManualPaymentRecord[] }>("/api/admin/manual-payments/pending");
  return data.payments;
};

export const approveManualPayment = async (
  paymentId: string,
  input: { plan?: "PRO" | "STUDIO"; validUntil?: string; creditsGranted?: number; notes?: string } = {},
) => {
  const data = await requestJson<{ ok: boolean; payment: ApiManualPaymentRecord }>(`/api/admin/manual-payments/${paymentId}/approve`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.payment;
};

export const rejectManualPayment = async (paymentId: string, reason: string) => {
  const data = await requestJson<{ ok: boolean; payment: ApiManualPaymentRecord }>(`/api/admin/manual-payments/${paymentId}/reject`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return data.payment;
};

export const extendManualSubscription = async (userId: string, input: { validUntil?: string; credits?: number; reason?: string }) => {
  const data = await requestJson<{ ok: boolean; user: ApiUserProfile }>(`/api/admin/users/${userId}/extend`, {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
};

export const deactivateManualUser = async (userId: string, reason: string) => {
  const data = await requestJson<{ ok: boolean; user: ApiUserProfile }>(`/api/admin/users/${userId}/deactivate`, {
    method: "POST",
    body: JSON.stringify({ reason }),
  });
  return data.user;
};
