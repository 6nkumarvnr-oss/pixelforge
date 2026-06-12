import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Aperture,
  BadgeCheck,
  Bot,
  Brush,
  Camera,
  ChevronRight,
  Cpu,
  Download,
  Eraser,
  Expand,
  Heart,
  Image as ImageIcon,
  Layers,
  Palette,
  RefreshCcw,
  Rocket,
  Search,
  Share2,
  ShieldCheck,
  Sparkles,
  Wand2,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  fetchPixelForgeAnalytics,
  fetchPixelForgeHistory,
  fetchPixelForgePresets,
  generatePixelForgeImage,
  type ApiAnalytics,
  type ApiGeneration,
  type ApiPreset,
} from "@/lib/pixelforge-api";
import { toast } from "sonner";

type Preset = Omit<ApiPreset, "userId"> & {
  userId?: string | null;
  icon: typeof Camera;
  color: string;
};

type GeneratedImage = {
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

const presets: Preset[] = [
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

const models = ["PixelForge SDXL", "DALL-E Studio", "DreamWeaver Pro", "Open Canvas XL"];
const samplers = ["Balanced", "Cinematic", "Sharp detail", "Soft diffusion"];
const aspects = ["1:1", "4:5", "16:9", "9:16", "3:2"];
const resolutions = ["1024px", "1536px", "2048px", "4K"];
const styleBoosters = ["volumetric light", "award-winning composition", "high-detail materials", "bold color harmony"];

const escapeXml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&apos;");

const hashText = (value: string) =>
  value.split("").reduce((hash, char) => (hash * 31 + char.charCodeAt(0)) >>> 0, 2166136261);

const makeGeneratedArt = ({
  prompt,
  negative,
  model,
  aspect,
  seed,
  sampler,
  intensity,
  upscale,
  removeBackground,
  colorBoost,
}: {
  prompt: string;
  negative: string;
  model: string;
  aspect: string;
  seed: number;
  sampler: string;
  intensity: number;
  upscale: boolean;
  removeBackground: boolean;
  colorBoost: boolean;
}) => {
  const hash = hashText(`${prompt}-${negative}-${model}-${aspect}-${seed}-${sampler}`);
  const palettes = [
    ["#7C3AED", "#06B6D4", "#FB7185", "#FDE68A"],
    ["#4F46E5", "#14B8A6", "#F97316", "#E0E7FF"],
    ["#9333EA", "#22D3EE", "#F43F5E", "#DCFCE7"],
    ["#2563EB", "#A855F7", "#F59E0B", "#F8FAFC"],
  ];
  const palette = palettes[hash % palettes.length];
  const [wRatio, hRatio] = aspect.split(":").map(Number);
  const width = 900;
  const height = Math.round((900 * hRatio) / wRatio);
  const title = escapeXml(prompt.slice(0, 82) || "Untitled creative prompt");
  const subtitle = escapeXml(`${model} • ${sampler} • seed ${seed}`);
  const sharpness = upscale ? "contrast(1.12) saturate(1.16)" : "contrast(1.02)";
  const saturation = colorBoost ? "saturate(1.38)" : "saturate(1.05)";
  const bgOpacity = removeBackground ? "0.18" : "1";
  const orbitCount = 7 + (hash % 6);
  const circles = Array.from({ length: orbitCount }, (_, index) => {
    const x = 90 + ((hash >> (index % 12)) % 720);
    const y = 100 + ((hash >> ((index + 5) % 13)) % Math.max(160, height - 180));
    const r = 34 + ((hash >> ((index + 2) % 10)) % 92);
    const color = palette[index % palette.length];
    const opacity = 0.18 + ((index % 4) * 0.08);
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
      <filter id="grain"><feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="${seed}"/><feColorMatrix type="saturate" values="0"/><feComponentTransfer><feFuncA type="table" tableValues="0 0.12"/></feComponentTransfer></filter>
    </defs>
    <rect width="100%" height="100%" rx="42" fill="url(#bg)" opacity="${bgOpacity}"/>
    <rect width="100%" height="100%" rx="42" fill="#121026" opacity="${removeBackground ? 0.16 : 0.28}"/>
    <g style="filter:${sharpness} ${saturation}">
      <circle cx="${width * 0.72}" cy="${height * 0.26}" r="${190 + intensity}" fill="url(#glow)" filter="url(#soft)"/>
      ${circles}
      ${paths}
      <rect x="${width * 0.1}" y="${height * 0.15}" width="${width * 0.8}" height="${height * 0.62}" rx="36" fill="#ffffff" opacity="0.13" stroke="#ffffff" stroke-opacity="0.32"/>
      <path d="M${width * 0.18} ${height * 0.72} L${width * 0.36} ${height * 0.42} L${width * 0.5} ${height * 0.58} L${width * 0.64} ${height * 0.36} L${width * 0.82} ${height * 0.72} Z" fill="#fff" opacity="0.23"/>
      <circle cx="${width * 0.68}" cy="${height * 0.3}" r="42" fill="#fff" opacity="0.38"/>
    </g>
    <rect x="36" y="${height - 152}" width="${width - 72}" height="112" rx="28" fill="#0F102A" opacity="0.78"/>
    <text x="66" y="${height - 98}" font-family="Inter, Arial, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF">${title}</text>
    <text x="66" y="${height - 58}" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="600" fill="#CFFAFE">${subtitle}</text>
    <rect width="100%" height="100%" rx="42" fill="transparent" filter="url(#grain)"/>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const presetVisuals: Record<string, Pick<Preset, "icon" | "color">> = {
  Photography: { icon: Camera, color: "bg-cyan-100 text-cyan-700 border-cyan-200" },
  "Concept Art": { icon: Zap, color: "bg-violet-100 text-violet-700 border-violet-200" },
  Portrait: { icon: Aperture, color: "bg-rose-100 text-rose-700 border-rose-200" },
  Anime: { icon: Sparkles, color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-200" },
  Architecture: { icon: Layers, color: "bg-amber-100 text-amber-700 border-amber-200" },
  Vector: { icon: Brush, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  Custom: { icon: Brush, color: "bg-emerald-100 text-emerald-700 border-emerald-200" },
};

const decoratePreset = (preset: ApiPreset): Preset => {
  const visual = presetVisuals[preset.category] ?? presetVisuals.Custom;
  return { ...preset, icon: visual.icon, color: visual.color };
};

const mapApiGeneration = (generation: ApiGeneration): GeneratedImage => ({
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

const loadHistory = (): GeneratedImage[] => {
  try {
    const stored = localStorage.getItem("pixelforge-history");
    return stored ? (JSON.parse(stored) as GeneratedImage[]) : [];
  } catch {
    return [];
  }
};

const Index = () => {
  const [prompt, setPrompt] = useState(presets[0].prompt);
  const [negative, setNegative] = useState(presets[0].negative);
  const [model, setModel] = useState(models[0]);
  const [sampler, setSampler] = useState(samplers[0]);
  const [aspect, setAspect] = useState("1:1");
  const [resolution, setResolution] = useState("1536px");
  const [seed, setSeed] = useState(4207);
  const [creativity, setCreativity] = useState([72]);
  const [upscale, setUpscale] = useState(true);
  const [removeBackground, setRemoveBackground] = useState(false);
  const [colorBoost, setColorBoost] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [history, setHistory] = useState<GeneratedImage[]>(() => loadHistory());
  const [presetLibrary, setPresetLibrary] = useState<Preset[]>(presets);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [apiStatus, setApiStatus] = useState<"connecting" | "online" | "fallback">("connecting");
  const [activeFilter, setActiveFilter] = useState("All");
  const [search, setSearch] = useState("");

  useEffect(() => {
    let isMounted = true;

    Promise.all([fetchPixelForgePresets(), fetchPixelForgeHistory(), fetchPixelForgeAnalytics()])
      .then(([apiPresets, apiHistory, apiAnalytics]) => {
        if (!isMounted) return;
        setPresetLibrary(apiPresets.map(decoratePreset));
        if (apiHistory.length > 0) {
          setHistory(apiHistory.map(mapApiGeneration));
        }
        setAnalytics(apiAnalytics);
        setApiStatus("online");
      })
      .catch(() => {
        if (!isMounted) return;
        setApiStatus("fallback");
        toast.warning("Using local fallback mode until the API is available.");
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    localStorage.setItem("pixelforge-history", JSON.stringify(history));
  }, [history]);

  const qualityScore = useMemo(() => {
    const lengthScore = Math.min(45, prompt.length / 4);
    const commaScore = Math.min(20, prompt.split(",").length * 3);
    const detailScore = styleBoosters.reduce((score, booster) => (prompt.includes(booster) ? score + 7 : score), 0);
    const negativeScore = negative.length > 12 ? 13 : 4;
    return Math.min(100, Math.round(lengthScore + commaScore + detailScore + negativeScore));
  }, [negative, prompt]);

  const currentPreview = useMemo(
    () =>
      makeGeneratedArt({
        prompt,
        negative,
        model,
        aspect,
        seed,
        sampler,
        intensity: creativity[0],
        upscale,
        removeBackground,
        colorBoost,
      }),
    [aspect, colorBoost, creativity, model, negative, prompt, removeBackground, sampler, seed, upscale],
  );

  const categories = ["All", ...Array.from(new Set(presetLibrary.map((preset) => preset.category)))];
  const visiblePresets = presetLibrary.filter((preset) => {
    const matchesFilter = activeFilter === "All" || preset.category === activeFilter;
    const matchesSearch = `${preset.name} ${preset.category} ${preset.tags.join(" ")}`.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });
  const favorites = history.filter((item) => item.favorite);
  const creditsRemaining = Math.max(0, 248 - (analytics?.totals.creditsUsed ?? history.length));

  const applyPreset = (preset: Preset) => {
    setPrompt(preset.prompt);
    setNegative(preset.negative);
    setSearch("");
    toast.success(`${preset.name} preset loaded`);
  };

  const enhancePrompt = () => {
    const missingBoosters = styleBoosters.filter((booster) => !prompt.includes(booster));
    const addition = missingBoosters.slice(0, 2).join(", ");
    if (!addition) {
      toast.info("This prompt is already richly enhanced.");
      return;
    }
    setPrompt(`${prompt.trim()}, ${addition}, professional art direction, clean focal point`);
    toast.success("Prompt enhanced with production details");
  };

  const randomizeSeed = () => {
    setSeed(Math.floor(1000 + Math.random() * 8999));
  };

  const generateImage = async () => {
    if (!prompt.trim()) {
      toast.error("Add a prompt before generating.");
      return;
    }

    setIsGenerating(true);
    try {
      const generation = await generatePixelForgeImage({
        prompt,
        negative,
        model,
        aspect,
        resolution,
        seed,
        sampler,
        creativity: creativity[0],
        upscale,
        removeBackground,
        colorBoost,
        provider: "fallback",
        style: activeFilter === "All" ? "Custom" : activeFilter,
      });
      const generated = mapApiGeneration(generation);
      setHistory((items) => [generated, ...items].slice(0, 18));
      fetchPixelForgeAnalytics().then(setAnalytics).catch(() => undefined);
      setApiStatus("online");
      toast.success("Image generated through the Nitro API");
    } catch {
      const url = makeGeneratedArt({
        prompt,
        negative,
        model,
        aspect,
        seed,
        sampler,
        intensity: creativity[0],
        upscale,
        removeBackground,
        colorBoost,
      });
      const generated: GeneratedImage = {
        id: crypto.randomUUID(),
        prompt,
        negative,
        model,
        aspect,
        resolution,
        seed,
        sampler,
        createdAt: new Date().toISOString(),
        url,
        favorite: false,
        style: activeFilter === "All" ? "Custom" : activeFilter,
      };
      setHistory((items) => [generated, ...items].slice(0, 18));
      setApiStatus("fallback");
      toast.warning("API unavailable, generated with local fallback.");
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleFavorite = (id: string) => {
    setHistory((items) => items.map((item) => (item.id === id ? { ...item, favorite: !item.favorite } : item)));
  };

  const remix = (item: GeneratedImage) => {
    setPrompt(item.prompt);
    setNegative(item.negative);
    setModel(item.model);
    setAspect(item.aspect);
    setResolution(item.resolution);
    setSeed(item.seed + 17);
    setSampler(item.sampler);
    toast.success("Prompt remixed into the builder");
  };

  const downloadCurrent = () => {
    const link = document.createElement("a");
    link.href = currentPreview;
    link.download = `pixelforge-${seed}.svg`;
    link.click();
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F6F2FF] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[url('/assets/pixelforge-bg.png')] bg-cover bg-center opacity-35" />
      <div className="fixed inset-0 -z-10 bg-[radial-gradient(circle_at_20%_12%,rgba(124,58,237,0.22),transparent_34%),radial-gradient(circle_at_88%_18%,rgba(6,182,212,0.2),transparent_28%),radial-gradient(circle_at_42%_90%,rgba(251,113,133,0.2),transparent_32%)]" />

      <header className="mx-auto flex w-full max-w-[1560px] flex-col gap-4 px-4 pb-4 pt-5 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8">
        <div className="flex items-center gap-3">
          <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-3xl border border-white/70 bg-white/80 shadow-xl shadow-violet-200/50 backdrop-blur">
            <img src="/assets/pixelforge-logo.png" alt="PixelForge logo" className="h-12 w-12 object-cover" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">PixelForge</h1>
              <Badge className="rounded-full border-0 bg-violet-600 px-3 py-1 text-white hover:bg-violet-600">Beta Studio</Badge>
            </div>
            <p className="text-sm font-medium text-slate-600">Prompt, generate, refine, favorite, and remix designer-ready visuals.</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 rounded-[2rem] border border-white/70 bg-white/70 p-2 shadow-lg shadow-violet-100/70 backdrop-blur sm:grid-cols-4 md:flex md:items-center">
          {[
            ["Credits", String(creditsRemaining)],
            ["Plan", "Free"],
            ["API", apiStatus],
            ["Favorites", String(favorites.length)],
          ].map(([label, value]) => (
            <div key={label} className="rounded-3xl bg-white px-4 py-2 text-center shadow-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
              <p className="text-sm font-black capitalize text-slate-900">{value}</p>
            </div>
          ))}
        </div>
      </header>

      <section className="mx-auto grid w-full max-w-[1560px] gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)_360px] lg:px-8">
        <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">Discover</p>
              <h2 className="text-xl font-black">Preset Library</h2>
            </div>
            <Button size="icon" className="rounded-2xl bg-slate-950 text-white hover:bg-violet-700">
              <Sparkles className="h-4 w-4" />
            </Button>
          </div>

          <div className="relative mb-4">
            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search styles..."
              className="h-12 rounded-2xl border-violet-100 bg-white pl-11 font-semibold shadow-sm"
            />
          </div>

          <div className="mb-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <Button
                key={category}
                variant="ghost"
                onClick={() => setActiveFilter(category)}
                className={`h-9 rounded-full px-4 text-xs font-black ${
                  activeFilter === category ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white" : "bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>

          <ScrollArea className="h-[520px] pr-3 lg:h-[calc(100vh-285px)]">
            <div className="space-y-3">
              {visiblePresets.map((preset) => {
                const Icon = preset.icon;
                return (
                  <Card key={preset.id} className="group rounded-[1.6rem] border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-100">
                    <div className="mb-3 flex items-start justify-between gap-3">
                      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-2xl border ${preset.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <Badge variant="outline" className="rounded-full border-violet-100 bg-violet-50 text-[10px] font-black text-violet-700">
                        {preset.category}
                      </Badge>
                    </div>
                    <h3 className="font-black text-slate-950">{preset.name}</h3>
                    <p className="mt-1 line-clamp-2 text-sm font-medium leading-6 text-slate-600">{preset.prompt}</p>
                    <div className="my-3 flex flex-wrap gap-1.5">
                      {preset.tags.map((tag) => (
                        <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-bold text-slate-500">
                          #{tag}
                        </span>
                      ))}
                    </div>
                    <Button onClick={() => applyPreset(preset)} className="h-10 w-full rounded-2xl bg-slate-950 font-black text-white hover:bg-violet-700">
                      Load preset <ChevronRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </aside>

        <div className="space-y-4">
          <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/80 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl sm:p-5">
            <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-4">
                <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300/60">
                  <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <Badge className="mb-3 rounded-full border-0 bg-cyan-300 px-3 py-1 font-black text-slate-950 hover:bg-cyan-300">
                        <Bot className="mr-1 h-3.5 w-3.5" /> AI Prompt Builder
                      </Badge>
                      <h2 className="text-3xl font-black tracking-tight sm:text-4xl">Create the image brief.</h2>
                      <p className="mt-2 max-w-xl text-sm font-medium leading-6 text-slate-300">
                        Combine curated presets, negative prompts, model controls, and one-click enhancement for production-grade concepts.
                      </p>
                    </div>
                    <Button onClick={enhancePrompt} className="rounded-2xl bg-white px-5 font-black text-slate-950 hover:bg-cyan-100">
                      <Wand2 className="mr-2 h-4 w-4" /> Enhance
                    </Button>
                  </div>

                  <Label className="text-xs font-black uppercase tracking-[0.22em] text-cyan-200">Positive prompt</Label>
                  <Textarea
                    value={prompt}
                    onChange={(event) => setPrompt(event.target.value)}
                    className="mt-2 min-h-36 rounded-[1.35rem] border-white/10 bg-white/10 p-4 text-base font-semibold leading-7 text-white placeholder:text-slate-400 focus-visible:ring-cyan-300"
                    placeholder="Describe the image, subject, composition, lighting, lens, mood, and style..."
                  />

                  <div className="mt-4 grid gap-4 md:grid-cols-[1fr_220px]">
                    <div>
                      <Label className="text-xs font-black uppercase tracking-[0.22em] text-rose-200">Negative prompt</Label>
                      <Textarea
                        value={negative}
                        onChange={(event) => setNegative(event.target.value)}
                        className="mt-2 min-h-24 rounded-[1.35rem] border-white/10 bg-white/10 p-4 font-semibold leading-6 text-white placeholder:text-slate-400 focus-visible:ring-rose-300"
                        placeholder="Exclude artifacts, blur, malformed hands, low quality..."
                      />
                    </div>
                    <div className="rounded-[1.35rem] bg-white/10 p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <Label className="text-xs font-black uppercase tracking-[0.2em] text-white">Quality</Label>
                        <span className="text-2xl font-black text-cyan-200">{qualityScore}</span>
                      </div>
                      <Progress value={qualityScore} className="h-3 bg-white/10" />
                      <p className="mt-3 text-xs font-semibold leading-5 text-slate-300">
                        Add subject, lighting, camera/style, composition, and exclusions to improve prompt strength.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <ControlSelect label="Model" value={model} onValueChange={setModel} options={models} icon={<Cpu className="h-4 w-4" />} />
                  <ControlSelect label="Aspect" value={aspect} onValueChange={setAspect} options={aspects} icon={<Expand className="h-4 w-4" />} />
                  <ControlSelect label="Resolution" value={resolution} onValueChange={setResolution} options={resolutions} icon={<ImageIcon className="h-4 w-4" />} />
                  <ControlSelect label="Sampler" value={sampler} onValueChange={setSampler} options={samplers} icon={<Palette className="h-4 w-4" />} />
                </div>

                <div className="grid gap-4 md:grid-cols-[1fr_220px]">
                  <Card className="rounded-[1.75rem] border-white/80 bg-white/90 p-5 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <Label className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">Creativity</Label>
                        <p className="font-black text-slate-950">Guidance strength: {creativity[0]}%</p>
                      </div>
                      <Sparkles className="h-5 w-5 text-violet-600" />
                    </div>
                    <Slider value={creativity} onValueChange={setCreativity} min={10} max={100} step={1} className="py-3" />
                  </Card>

                  <Card className="rounded-[1.75rem] border-white/80 bg-white/90 p-5 shadow-sm">
                    <Label className="text-xs font-black uppercase tracking-[0.22em] text-violet-600">Seed</Label>
                    <div className="mt-2 flex gap-2">
                      <Input value={seed} onChange={(event) => setSeed(Number(event.target.value) || 0)} className="h-11 rounded-2xl font-black" />
                      <Button onClick={randomizeSeed} size="icon" variant="outline" className="h-11 w-11 rounded-2xl border-violet-100 bg-violet-50 text-violet-700 hover:bg-violet-100">
                        <RefreshCcw className="h-4 w-4" />
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>

              <div className="rounded-[1.75rem] border border-white/80 bg-[#120F2A] p-4 text-white shadow-xl shadow-violet-200/50">
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Live Canvas</p>
                    <h3 className="text-xl font-black">Generated Preview</h3>
                  </div>
                  <Badge className="rounded-full border-0 bg-white/15 text-white hover:bg-white/15">{aspect}</Badge>
                </div>

                <div className="relative overflow-hidden rounded-[1.5rem] border border-white/15 bg-white/5 p-3">
                  <img src={history[0]?.url || currentPreview || "/assets/pixelforge-hero.png"} alt="Generated PixelForge preview" className="aspect-square w-full rounded-[1.15rem] object-cover shadow-2xl" />
                  {isGenerating && (
                    <div className="absolute inset-3 grid place-items-center rounded-[1.15rem] bg-slate-950/70 backdrop-blur-sm">
                      <div className="text-center">
                        <Sparkles className="mx-auto mb-3 h-8 w-8 animate-pulse text-cyan-200" />
                        <p className="text-sm font-black uppercase tracking-[0.22em] text-white">Forging pixels...</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-3">
                  <EditToggle label="2x upscale" checked={upscale} onCheckedChange={setUpscale} icon={<Rocket className="h-4 w-4" />} />
                  <EditToggle label="Remove bg" checked={removeBackground} onCheckedChange={setRemoveBackground} icon={<Eraser className="h-4 w-4" />} />
                  <EditToggle label="Color boost" checked={colorBoost} onCheckedChange={setColorBoost} icon={<Palette className="h-4 w-4" />} />
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-[1fr_auto]">
                  <Button onClick={generateImage} disabled={isGenerating} className="h-14 rounded-2xl bg-violet-500 text-base font-black text-white hover:bg-violet-400">
                    <Sparkles className="mr-2 h-5 w-5" /> {isGenerating ? "Generating..." : "Generate Image"}
                  </Button>
                  <Button onClick={downloadCurrent} variant="outline" className="h-14 rounded-2xl border-white/15 bg-white/10 px-5 font-black text-white hover:bg-white/20 hover:text-white">
                    <Download className="h-5 w-5" />
                  </Button>
                </div>
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Content safety", copy: "Prompt guardrails and commercial-ready guidance built into the workflow." },
              { icon: Share2, title: "Community remix", copy: "Save favorite generations and remix winning prompts back into the builder." },
              { icon: BadgeCheck, title: "Creator workflow", copy: "Model, sampler, seed, ratio, resolution, and edit toggles in one focused studio." },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <Card key={feature.title} className="rounded-[1.75rem] border-white/80 bg-white/75 p-5 shadow-lg shadow-violet-100/50 backdrop-blur">
                  <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-violet-100 text-violet-700">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-black text-slate-950">{feature.title}</h3>
                  <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{feature.copy}</p>
                </Card>
              );
            })}
          </div>
        </div>

        <aside className="rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.25em] text-violet-600">Output</p>
              <h2 className="text-xl font-black">History & Favorites</h2>
            </div>
            <Badge className="rounded-full border-0 bg-cyan-100 px-3 py-1 font-black text-cyan-700 hover:bg-cyan-100">{history.length} saved</Badge>
          </div>

          <div className="mb-4 overflow-hidden rounded-[1.6rem] border border-white/80 bg-slate-950 p-3 text-white">
            <div className="relative overflow-hidden rounded-[1.2rem]">
              <img src="/assets/pixelforge-hero.png" alt="Creative AI canvas illustration" className="h-36 w-full object-cover opacity-90" />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
              <p className="absolute bottom-3 left-3 right-3 text-sm font-black">Community-ready galleries, remix paths, and creator packs.</p>
            </div>
          </div>

          <div className="mb-4 grid grid-cols-2 gap-2">
            <div className="rounded-[1.4rem] bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-violet-700">{favorites.length}</p>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Favorites</p>
            </div>
            <div className="rounded-[1.4rem] bg-white p-4 text-center shadow-sm">
              <p className="text-2xl font-black text-cyan-700">{Object.keys(analytics?.modelUsage ?? {}).length || models.length}</p>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Models</p>
            </div>
          </div>

          <Separator className="my-4 bg-violet-100" />

          <ScrollArea className="h-[560px] pr-3 lg:h-[calc(100vh-385px)]">
            {history.length === 0 ? (
              <div className="rounded-[1.75rem] border border-dashed border-violet-200 bg-white/70 p-6 text-center">
                <ImageIcon className="mx-auto mb-3 h-10 w-10 text-violet-400" />
                <h3 className="font-black text-slate-950">No generated images yet</h3>
                <p className="mt-2 text-sm font-medium leading-6 text-slate-600">Click Generate Image to start building your API-backed studio history.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {history.map((item) => (
                  <Card key={item.id} className="overflow-hidden rounded-[1.55rem] border-white/80 bg-white p-3 shadow-sm">
                    <div className="grid grid-cols-[92px_1fr] gap-3">
                      <img src={item.url} alt={item.prompt} className="h-24 w-24 rounded-[1.15rem] object-cover" />
                      <div className="min-w-0">
                        <div className="mb-1 flex items-start justify-between gap-2">
                          <Badge variant="outline" className="rounded-full border-violet-100 bg-violet-50 text-[10px] font-black text-violet-700">
                            {item.style}
                          </Badge>
                          <Button onClick={() => toggleFavorite(item.id)} variant="ghost" size="icon" className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600">
                            <Heart className={`h-4 w-4 ${item.favorite ? "fill-current" : ""}`} />
                          </Button>
                        </div>
                        <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-800">{item.prompt}</p>
                        <p className="mt-1 text-xs font-semibold text-slate-400">{item.model} • {item.aspect} • {item.resolution}</p>
                      </div>
                    </div>
                    <div className="mt-3 flex gap-2">
                      <Button onClick={() => remix(item)} className="h-9 flex-1 rounded-2xl bg-slate-950 text-xs font-black text-white hover:bg-violet-700">
                        <RefreshCcw className="mr-1 h-3.5 w-3.5" /> Remix
                      </Button>
                      <Button variant="outline" className="h-9 rounded-2xl border-violet-100 bg-violet-50 px-3 text-xs font-black text-violet-700 hover:bg-violet-100">
                        <Share2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </aside>
      </section>
    </main>
  );
};

const ControlSelect = ({
  label,
  value,
  onValueChange,
  options,
  icon,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: string[];
  icon: ReactNode;
}) => (
  <Card className="rounded-[1.6rem] border-white/80 bg-white/90 p-4 shadow-sm">
    <Label className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-violet-600">
      {icon} {label}
    </Label>
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger className="h-11 rounded-2xl border-violet-100 bg-violet-50 font-black text-slate-950">
        <SelectValue />
      </SelectTrigger>
      <SelectContent className="rounded-2xl border-violet-100">
        {options.map((option) => (
          <SelectItem key={option} value={option} className="font-bold">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </Card>
);

const EditToggle = ({
  label,
  checked,
  onCheckedChange,
  icon,
}: {
  label: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: ReactNode;
}) => (
  <div className="rounded-2xl bg-white/10 p-3">
    <div className="mb-2 flex items-center gap-2 text-sm font-black text-white">
      <span className="text-cyan-200">{icon}</span>
      {label}
    </div>
    <Switch checked={checked} onCheckedChange={onCheckedChange} />
  </div>
);

export default Index;
