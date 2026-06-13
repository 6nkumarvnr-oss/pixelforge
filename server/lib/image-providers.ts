import { getPixelForgeConfig } from "./config";
import { createGeneration, type GenerateInput, type Generation, type GenerationMetadata } from "./pixelforge-store";

const imageSizeForAspect = (aspect?: string) => {
  if (aspect === "16:9") return "1792x1024";
  if (aspect === "9:16") return "1024x1792";
  return "1024x1024";
};

const makeRealGeneration = ({
  input,
  imageUrl,
  provider,
}: {
  input: GenerateInput;
  imageUrl: string;
  provider: "sdxl" | "dalle";
}): Generation => {
  const metadata: GenerationMetadata = {
    model: String(input.model ?? (provider === "dalle" ? "dall-e-3" : "sdxl")),
    aspect: String(input.aspect ?? "1:1"),
    resolution: String(input.resolution ?? "1024px"),
    seed: Number(input.seed ?? Math.floor(1000 + Math.random() * 8999)),
    sampler: String(input.sampler ?? "Balanced"),
    creativity: Number(input.creativity ?? 72),
    upscale: Boolean(input.upscale ?? true),
    removeBackground: Boolean(input.removeBackground ?? false),
    colorBoost: Boolean(input.colorBoost ?? true),
    provider,
    style: String(input.style ?? "Custom"),
  };

  return {
    id: `gen_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`,
    prompt: String(input.prompt ?? ""),
    negative: String(input.negative ?? ""),
    imageUrl,
    metadata,
    userId: input.userId ? String(input.userId) : null,
    favorite: false,
    createdAt: new Date().toISOString(),
  };
};

const generateWithDalle = async (input: GenerateInput) => {
  const config = getPixelForgeConfig();
  if (!config.openAiApiKey) return null;

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${config.openAiApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "dall-e-3",
      prompt: input.prompt,
      n: 1,
      size: imageSizeForAspect(input.aspect),
      quality: input.upscale ? "hd" : "standard",
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { data?: Array<{ url?: string; b64_json?: string }> };
  const image = data.data?.[0];
  const imageUrl = image?.url ?? (image?.b64_json ? `data:image/png;base64,${image.b64_json}` : null);
  return imageUrl ? makeRealGeneration({ input, imageUrl, provider: "dalle" }) : null;
};

const generateWithSdxl = async (input: GenerateInput) => {
  const config = getPixelForgeConfig();
  if (!config.sdxlApiUrl) return null;

  const response = await fetch(config.sdxlApiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(config.sdxlApiKey ? { Authorization: `Bearer ${config.sdxlApiKey}` } : {}),
    },
    body: JSON.stringify({
      prompt: input.prompt,
      negative_prompt: input.negative,
      aspect_ratio: input.aspect,
      seed: input.seed,
      sampler: input.sampler,
      output_format: "png",
    }),
  });

  if (!response.ok) return null;
  const data = (await response.json()) as { imageUrl?: string; url?: string; output?: string[]; image?: string };
  const imageUrl = data.imageUrl ?? data.url ?? data.output?.[0] ?? data.image;
  return imageUrl ? makeRealGeneration({ input, imageUrl, provider: "sdxl" }) : null;
};

export const generateImageWithProvider = async (input: GenerateInput, options: { persistFallback?: boolean } = {}) => {
  const provider = input.provider;

  if (provider === "dalle") {
    const generation = await generateWithDalle(input);
    if (generation) return generation;
  }

  if (provider === "sdxl") {
    const generation = await generateWithSdxl(input);
    if (generation) return generation;
  }

  return createGeneration({ ...input, provider: "fallback" }, { persist: options.persistFallback ?? true });
};
