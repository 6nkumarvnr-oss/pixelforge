import { Aperture, Brush, Camera, Layers, Sparkles, Zap, type LucideIcon } from "lucide-react";
import type { ApiGeneration, ApiPreset } from "@/lib/pixelforge-api";

export type Preset = Omit<ApiPreset, "userId"> & {
  userId?: string | null;
  icon: LucideIcon;
  color: string;
};

export type GeneratedImage = {
  id: string;
  prompt: string;
  negative: string;
  model: string;
  aspect: string;
  resolution: string;
  seed: number;
  sampler: string;
  createdAt: string;
  url: string;
  favorite: boolean;
  style: string;
};

export const models = ["PixelForge SDXL", "DALL-E Studio", "DreamWeaver Pro", "Open Canvas XL"];
export const samplers = ["Balanced", "Cinematic", "Sharp detail", "Soft diffusion"];
export const aspects = ["1:1", "4:5", "16:9", "9:16", "3:2"];
export const resolutions = ["1024px", "1536px", "2048px", "4K"];
export const styleBoosters = ["volumetric light", "award-winning composition", "high-detail materials", "bold color harmony"];

export const builtinPresets: Preset[] = [
  {
    id: "editorial-product",
    name: "Editorial Product",
    category: "Photography",
    icon: Camera,
    color: "bg-cyan-100 text-cyan-700 border-cyan-200",
    prompt:
      "premium product photograph on a sculptural acrylic plinth, softbox reflections, crisp shadows, luxury campaign, 85mm lens",
    negative: "blurry, warped label, extra objects, low contrast",
    tags: ["commercial", "studio", "clean"],
  },
  {
    id: "cyberpunk-alley",
    name: "Neon Cyberpunk",
    category: "Concept Art",
    icon: Zap,
    color: "bg-violet-100 text-violet-700 border-violet-200",
    prompt:
      "cinematic cyberpunk alley with holographic signage, rain-slick pavement, magenta and cyan rim lighting, ultra detailed environment art",
    negative: "flat lighting, washed out, text artifacts, malformed cars",
    tags: ["cinematic", "neon", "worldbuilding"],
  },
  {
    id: "fashion-portrait",
    name: "Studio Portrait",
    category: "Portrait",
    icon: Aperture,
    color: "bg-rose-100 text-rose-700 border-rose-200",
    prompt:
      "high-fashion portrait of a creative director, expressive pose, luminous skin, dramatic color gels, editorial magazine cover style",
    negative: "extra fingers, asymmetrical eyes, plastic skin, harsh noise",
    tags: ["people", "editorial", "lighting"],
  },
  {
    id: "anime-dreamscape",
    name: "Anime Dreamscape",
    category: "Anime",
    icon: Sparkles,
    color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200",
    prompt:
      "anime dreamscape over floating islands, pastel clouds, luminous crystals, expressive character silhouette, detailed key visual",
    negative: "muddy colors, bad anatomy, cluttered composition",
    tags: ["character", "fantasy", "pastel"],
  },
  {
    id: "brutalist-interior",
    name: "Future Interior",
    category: "Architecture",
    icon: Layers,
    color: "bg-amber-100 text-amber-700 border-amber-200",
    prompt:
      "futuristic brutalist interior with curved concrete walls, warm indirect lighting, monolithic furniture, architectural digest photography",
    negative: "messy room, distorted perspective, dull lighting",
    tags: ["spaces", "minimal", "premium"],
  },
  {
    id: "brand-mascot",
    name: "Brand Mascot",
    category: "Vector",
    icon: Brush,
    color: "bg-emerald-100 text-emerald-700 border-emerald-200",
    prompt:
      "friendly geometric mascot for a creative AI brand, rounded vector shapes, expressive eyes, bold violet cyan coral palette, sticker-ready",
    negative: "overly complex, thin lines, scary expression, noisy texture",
    tags: ["logo", "vector", "playful"],
  },
];

const presetVisuals: Record<string, Pick<Preset, "icon" | "color">> = {
  Photography: { icon: Camera, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  "Concept Art": { icon: Zap, color: "bg-violet-100 text-violet-700 border-violet-200" },
  Portrait: { icon: Aperture, color: "bg-rose-100 text-rose-700 border-rose-200" },
  Anime: { icon: Sparkles, color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
  Architecture: { icon: Layers, color: "bg-amber-100 text-amber-700 border-amber-200" },
  Vector: { icon: Brush, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Custom: { icon: Brush, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

export const decoratePreset = (preset: ApiPreset): Preset => {
  const visual = presetVisuals[preset.category] ?? presetVisuals.Custom;
  return { ...preset, icon: visual.icon, color: visual.color };
};

export const mapApiGeneration = (generation: ApiGeneration): GeneratedImage => ({
  id: generation.id,
  prompt: generation.prompt,
  negative: generation.negative,
  model: generation.metadata.model,
  aspect: generation.metadata.aspect,
  resolution: generation.metadata.resolution,
  seed: generation.metadata.seed,
  sampler: generation.metadata.sampler,
  createdAt: generation.createdAt,
  url: generation.imageUrl,
  favorite: generation.favorite,
  style: generation.metadata.style,
});

export const loadStoredHistory = (): GeneratedImage[] => {
  try {
    const stored = localStorage.getItem("pixelforge-history");
    return stored ? (JSON.parse(stored) as GeneratedImage[]) : [];
  } catch {
    return [];
  }
};
