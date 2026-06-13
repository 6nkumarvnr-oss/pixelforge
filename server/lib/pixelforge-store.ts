export type Preset = {
  id: string;
  name: string;
  category: string;
  tags: string[];
  prompt: string;
  negative: string;
  userId: string | null;
};

export type GenerationMetadata = {
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

export type Generation = {
  id: string;
  prompt: string;
  negative: string;
  imageUrl: string;
  metadata: GenerationMetadata;
  userId: string | null;
  favorite: boolean;
  createdAt: string;
};

export type GenerateInput = Partial<GenerationMetadata> & {
  prompt?: string;
  negative?: string;
  userId?: string;
};

const presets: Preset[] = [
  {
    id: "editorial-product",
    name: "Editorial Product",
    category: "Photography",
    tags: ["commercial", "studio", "clean"],
    prompt: "premium product photograph on a sculptural acrylic plinth, softbox reflections, crisp shadows, luxury campaign, 85mm lens",
    negative: "blurry, warped label, extra objects, low contrast",
    userId: null,
  },
  {
    id: "cyberpunk-alley",
    name: "Neon Cyberpunk",
    category: "Concept Art",
    tags: ["cinematic", "neon", "worldbuilding"],
    prompt: "cinematic cyberpunk alley with holographic signage, rain-slick pavement, magenta and cyan rim lighting, ultra detailed environment art",
    negative: "flat lighting, washed out, text artifacts, malformed cars",
    userId: null,
  },
  {
    id: "fashion-portrait",
    name: "Studio Portrait",
    category: "Portrait",
    tags: ["people", "editorial", "lighting"],
    prompt: "high-fashion portrait of a creative director, expressive pose, luminous skin, dramatic color gels, editorial magazine cover style",
    negative: "extra fingers, asymmetrical eyes, plastic skin, harsh noise",
    userId: null,
  },
  {
    id: "anime-dreamscape",
    name: "Anime Dreamscape",
    category: "Anime",
    tags: ["character", "fantasy", "pastel"],
    prompt: "anime dreamscape over floating islands, pastel clouds, luminous crystals, expressive character silhouette, detailed key visual",
    negative: "muddy colors, bad anatomy, cluttered composition",
    userId: null,
  },
  {
    id: "brutalist-interior",
    name: "Future Interior",
    category: "Architecture",
    tags: ["spaces", "minimal", "premium"],
    prompt: "futuristic brutalist interior with curved concrete walls, warm indirect lighting, monolithic furniture, architectural digest photography",
    negative: "messy room, distorted perspective, dull lighting",
    userId: null,
  },
];

const history: Generation[] = [];

const makeId = (prefix: string) => `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const hashText = (value: string) =>
  value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);

const makeGeneratedArt = (input: Required<Omit<GenerateInput, "userId">>) => {
  const hash = hashText(`${input.prompt}-${input.negative}-${input.model}-${input.aspect}-${input.seed}-${input.sampler}`);
  const palettes = [
    ["#7C3AED", "#06B6D4", "#FB7185", "#FDE68A"],
    ["#4F46E5", "#14B8A6", "#F97316", "#E0E7FF"],
    ["#9333EA", "#22D3EE", "#F43F5E", "#DCFCE7"],
    ["#2563EB", "#A855F7", "#F59E0B", "#F8FAFC"],
  ];
  const palette = palettes[hash % palettes.length];
  const [wRatio, hRatio] = input.aspect.split(":").map(Number);
  const width = 900;
  const height = Number.isFinite(wRatio) && Number.isFinite(hRatio) && wRatio > 0 ? Math.round((900 * hRatio) / wRatio) : 900;
  const title = escapeXml(input.prompt.slice(0, 82) || "Untitled creative prompt");
  const subtitle = escapeXml(`${input.model} • ${input.sampler} • seed ${input.seed}`);
  const sharpness = input.upscale ? "contrast(1.12) saturate(1.16)" : "contrast(1.02)";
  const saturation = input.colorBoost ? "saturate(1.38)" : "saturate(1.05)";
  const bgOpacity = input.removeBackground ? "0.18" : "1";
  const orbitCount = 7 + (hash % 6);
  const circles = Array.from({ length: orbitCount }, (_, index) => {
    const x = 90 + ((hash >> (index % 12)) % 720);
    const y = 100 + ((hash >> ((index + 5) % 13)) % Math.max(160, height - 180));
    const r = 34 + ((hash >> ((index + 2) % 10)) % 92);
    const color = palette[index % palette.length];
    const opacity = 0.18 + (index % 4) * 0.08;
    return `<circle cx="${x}" cy="${y}" r="${r}" fill="${color}" opacity="${opacity}" />`;
  }).join("");
  const paths = Array.from({ length: 4 }, (_, index) => {
    const y = 150 + index * (height / 6);
    const color = palette[(index + 1) % palette.length];
    return `<path d="M ${-80 + index * 20} ${y} C ${width * 0.25} ${y - 150}, ${width * 0.68} ${y + 170}, ${width + 80} ${y - 20}" fill="none" stroke="${color}" stroke-width="${18 + index * 8}" stroke-linecap="round" opacity="${0.18 + index * 0.05}" />`;
  }).join("");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="${palette[0]}"/>
        <stop offset="0.48" stop-color="${palette[1]}"/>
        <stop offset="1" stop-color="${palette[2]}"/>
      </linearGradient>
      <radialGradient id="glow" cx="50%" cy="42%" r="70%">
        <stop offset="0" stop-color="${palette[3]}" stop-opacity="0.92"/>
        <stop offset="0.54" stop-color="${palette[1]}" stop-opacity="0.34"/>
        <stop offset="1" stop-color="${palette[0]}" stop-opacity="0"/>
      </radialGradient>
      <filter id="soft"><feGaussianBlur stdDeviation="22"/></filter>
    </defs>
    <rect width="100%" height="100%" rx="42" fill="url(#bg)" opacity="${bgOpacity}"/>
    <rect width="100%" height="100%" rx="42" fill="#121026" opacity="${input.removeBackground ? 0.16 : 0.28}"/>
    <g style="filter:${sharpness} ${saturation}">
      <circle cx="${width * 0.72}" cy="${height * 0.26}" r="${190 + input.creativity}" fill="url(#glow)" filter="url(#soft)"/>
      ${circles}
      ${paths}
      <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.8}" height="${height * 0.62}" rx="36" fill="#ffffff" opacity="0.13" stroke="#ffffff" stroke-opacity="0.32"/>
      <path d="M${width * 0.18} ${height * 0.72} L${width * 0.36} ${height * 0.42} L${width * 0.5} ${height * 0.58} L${width * 0.64} ${height * 0.36} L${width * 0.82} ${height * 0.72} Z" fill="#fff" opacity="0.23"/>
      <circle cx="${width * 0.68}" cy="${height * 0.3}" r="42" fill="#fff" opacity="0.38"/>
    </g>
    <rect x="36" y="${height - 152}" width="${width - 72}" height="112" rx="28" fill="#0F102A" opacity="0.78"/>
    <text x="66" y="${height - 98}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">${title}</text>
    <text x="66" y="${height - 58}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#CFFAFE">${subtitle}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

export const listPresets = (category?: string) => {
  if (!category || category === "All") {
    return presets;
  }

  return presets.filter((preset) => preset.category.toLowerCase() === category.toLowerCase());
};

export const createPreset = (input: Partial<Preset>) => {
  const preset: Preset = {
    id: makeId("preset"),
    name: String(input.name ?? "Untitled preset").trim(),
    category: String(input.category ?? "Custom").trim(),
    tags: Array.isArray(input.tags) ? input.tags.map(String).slice(0, 8) : [],
    prompt: String(input.prompt ?? "").trim(),
    negative: String(input.negative ?? "").trim(),
    userId: input.userId ? String(input.userId) : null,
  };
  presets.unshift(preset);
  return preset;
};

export const createGeneration = (input: GenerateInput, options: { persist?: boolean } = {}) => {
  const prompt = String(input.prompt ?? "").trim();
  const negative = String(input.negative ?? "").trim();
  const generationInput = {
    prompt,
    negative,
    model: String(input.model ?? "PixelForge Fallback"),
    aspect: String(input.aspect ?? "1:1"),
    resolution: String(input.resolution ?? "1536px"),
    seed: Number(input.seed ?? Math.floor(1000 + Math.random() * 8999)),
    sampler: String(input.sampler ?? "Balanced"),
    creativity: Number(input.creativity ?? 72),
    upscale: Boolean(input.upscale ?? true),
    removeBackground: Boolean(input.removeBackground ?? false),
    colorBoost: Boolean(input.colorBoost ?? true),
    provider: input.provider === "sdxl" || input.provider === "dalle" ? input.provider : "fallback",
    style: String(input.style ?? "Custom"),
  } satisfies Required<Omit<GenerateInput, "userId">>;

  const generation: Generation = {
    id: makeId("gen"),
    prompt,
    negative,
    imageUrl: makeGeneratedArt(generationInput),
    metadata: generationInput,
    userId: input.userId ? String(input.userId) : null,
    favorite: false,
    createdAt: new Date().toISOString(),
  };

  if (options.persist ?? true) {
    history.unshift(generation);
    history.splice(50);
  }
  return generation;
};

export const addHistoryItem = (input: Partial<Generation>) => {
  const item: Generation = {
    id: makeId("gen"),
    prompt: String(input.prompt ?? "").trim(),
    negative: String(input.negative ?? "").trim(),
    imageUrl: String(input.imageUrl ?? ""),
    metadata: {
      model: String(input.metadata?.model ?? "Imported"),
      aspect: String(input.metadata?.aspect ?? "1:1"),
      resolution: String(input.metadata?.resolution ?? "1536px"),
      seed: Number(input.metadata?.seed ?? 0),
      sampler: String(input.metadata?.sampler ?? "Balanced"),
      creativity: Number(input.metadata?.creativity ?? 72),
      upscale: Boolean(input.metadata?.upscale ?? false),
      removeBackground: Boolean(input.metadata?.removeBackground ?? false),
      colorBoost: Boolean(input.metadata?.colorBoost ?? true),
      provider: input.metadata?.provider ?? "fallback",
      style: String(input.metadata?.style ?? "Custom"),
    },
    userId: input.userId ? String(input.userId) : null,
    favorite: Boolean(input.favorite ?? false),
    createdAt: input.createdAt ? String(input.createdAt) : new Date().toISOString(),
  };
  history.unshift(item);
  history.splice(50);
  return item;
};

export const listHistory = ({ limit = 20, favoritesOnly = false }: { limit?: number; favoritesOnly?: boolean }) => {
  const items = favoritesOnly ? history.filter((item) => item.favorite) : history;
  return items.slice(0, Math.min(Math.max(limit, 1), 50));
};

export const getAnalytics = () => {
  const modelUsage = history.reduce<Record<string, number>>((usage, item) => {
    usage[item.metadata.model] = (usage[item.metadata.model] ?? 0) + 1;
    return usage;
  }, {});
  const styleUsage = history.reduce<Record<string, number>>((usage, item) => {
    usage[item.metadata.style] = (usage[item.metadata.style] ?? 0) + 1;
    return usage;
  }, {});

  return {
    totals: {
      presets: presets.length,
      generations: history.length,
      favorites: history.filter((item) => item.favorite).length,
      creditsUsed: history.length,
    },
    modelUsage,
    styleUsage,
    fallbackActive: true,
    updatedAt: new Date().toISOString(),
  };
};
