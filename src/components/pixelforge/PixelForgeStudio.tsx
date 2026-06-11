import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import {
  Aperture,
  BadgeCheck,
  Box,
  BrainCircuit,
  Brush,
  Camera,
  Check,
  ChevronRight,
  Cpu,
  Crown,
  Download,
  Eraser,
  Expand,
  Eye,
  Heart,
  ImagePlus,
  Layers3,
  Lightbulb,
  Palette,
  PenTool,
  RefreshCw,
  Search,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Stars,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

type Preset = {
  id: string;
  category: string;
  title: string;
  prompt: string;
  color: string;
  icon: LucideIcon;
  tags: string[];
};

type GeneratedImage = {
  id: string;
  title: string;
  prompt: string;
  negativePrompt: string;
  model: string;
  ratio: string;
  resolution: string;
  sampler: string;
  seed: string;
  quality: number;
  favorite: boolean;
  image: string;
  createdAt: string;
};

const presets: Preset[] = [
  {
    id: "photography",
    category: "Photography",
    title: "Editorial product shot",
    prompt:
      "premium studio product photography, sculptural lighting, reflective acrylic surface, tasteful shadows, commercial campaign composition",
    color: "bg-violet-100 text-violet-700",
    icon: Camera,
    tags: ["photo", "commerce"],
  },
  {
    id: "portrait",
    category: "Portrait",
    title: "Cinematic creator portrait",
    prompt:
      "cinematic portrait of a designer in a neon-lit studio, confident expression, shallow depth of field, editorial color grade",
    color: "bg-coral-100 text-coral-700",
    icon: Aperture,
    tags: ["people", "brand"],
  },
  {
    id: "cyberpunk",
    category: "Cyberpunk",
    title: "Rainy future district",
    prompt:
      "futuristic cyberpunk alley with holographic signs, rain reflections, intricate architecture, cinematic atmosphere, high detail",
    color: "bg-cyan-100 text-cyan-700",
    icon: Zap,
    tags: ["scene", "neon"],
  },
  {
    id: "anime",
    category: "Anime",
    title: "Dreamy anime landscape",
    prompt:
      "lush anime landscape, floating islands, soft clouds, magical sunrise, expressive painterly detail, emotional adventure mood",
    color: "bg-pink-100 text-pink-700",
    icon: Stars,
    tags: ["stylized", "world"],
  },
  {
    id: "architecture",
    category: "Architecture",
    title: "Biophilic gallery interior",
    prompt:
      "biophilic museum gallery interior, warm stone, indoor trees, skylight beams, elegant minimal furniture, architectural visualization",
    color: "bg-emerald-100 text-emerald-700",
    icon: Layers3,
    tags: ["space", "archviz"],
  },
  {
    id: "fantasy",
    category: "Fantasy",
    title: "Mythic forge temple",
    prompt:
      "mythic forge temple carved into a mountain, glowing crystal machinery, ancient artisans, epic scale, fantasy concept art",
    color: "bg-amber-100 text-amber-700",
    icon: Crown,
    tags: ["concept", "epic"],
  },
];

const trendingPrompts = [
  "iridescent materials, soft volumetric light, premium campaign art",
  "clean interface mockup floating in a glass creative studio",
  "limited palette poster design, bold negative space, gallery-ready",
  "macro texture study, tactile surface, editorial composition",
];

const models = ["PixelForge Vision XL", "SDXL Creative", "DALL-E Studio", "Flux Product Pro"];
const ratios = ["1:1", "4:5", "16:9", "9:16", "3:2"];
const resolutions = ["1024", "1536", "2048", "4096"];
const samplers = ["Euler Aura", "DPM++ Sharp", "Karras Smooth", "Creative Blend"];

const starterImages: GeneratedImage[] = [
  {
    id: "sample-1",
    title: "Prismatic studio concept",
    prompt: "glass creative studio with floating concept art boards and luminous pixel dust",
    negativePrompt: "low contrast, blurry, watermark",
    model: "PixelForge Vision XL",
    ratio: "16:9",
    resolution: "1536",
    sampler: "Euler Aura",
    seed: "48291",
    quality: 86,
    favorite: true,
    image: createGeneratedSvg({
      prompt: "glass creative studio with floating concept art boards and luminous pixel dust",
      seed: "48291",
      ratio: "16:9",
      palette: ["#7C3AED", "#22D3EE", "#FB7185"],
      label: "Prismatic studio concept",
    }),
    createdAt: "Just now",
  },
  {
    id: "sample-2",
    title: "Editorial product frame",
    prompt: "premium product cube on reflective acrylic with sculptural lighting",
    negativePrompt: "busy background, extra text",
    model: "SDXL Creative",
    ratio: "4:5",
    resolution: "2048",
    sampler: "DPM++ Sharp",
    seed: "73018",
    quality: 78,
    favorite: false,
    image: createGeneratedSvg({
      prompt: "premium product cube on reflective acrylic with sculptural lighting",
      seed: "73018",
      ratio: "4:5",
      palette: ["#0F766E", "#A78BFA", "#F59E0B"],
      label: "Editorial product frame",
    }),
    createdAt: "2 min ago",
  },
];

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function hashText(text: string) {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(index);
    hash |= 0;
  }
  return Math.abs(hash);
}

function createGeneratedSvg({
  prompt,
  seed,
  ratio,
  palette,
  label,
}: {
  prompt: string;
  seed: string;
  ratio: string;
  palette: string[];
  label: string;
}) {
  const [a, b, c] = palette;
  const hash = hashText(`${prompt}-${seed}-${ratio}`);
  const width = ratio === "9:16" ? 900 : ratio === "4:5" ? 960 : ratio === "1:1" ? 1000 : 1280;
  const height = ratio === "16:9" ? 720 : ratio === "3:2" ? 850 : ratio === "9:16" ? 1280 : ratio === "4:5" ? 1200 : 1000;
  const shapes = Array.from({ length: 10 }, (_, index) => {
    const x = (hash * (index + 17)) % width;
    const y = (hash * (index + 31)) % height;
    const size = 90 + ((hash + index * 73) % 220);
    const opacity = 0.14 + (index % 4) * 0.055;
    return `<circle cx="${x}" cy="${y}" r="${size}" fill="${[a, b, c][index % 3]}" opacity="${opacity}"/>`;
  }).join("");
  const bars = Array.from({ length: 7 }, (_, index) => {
    const x = 100 + index * (width / 8);
    const h = 90 + ((hash + index * 41) % 270);
    return `<rect x="${x}" y="${height - h - 90}" width="${width / 13}" height="${h}" rx="32" fill="${[c, a, b][index % 3]}" opacity="0.58"/>`;
  }).join("");

  const safeLabel = escapeXml(label.slice(0, 38));
  const safePrompt = escapeXml(prompt.slice(0, 82));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#F8F7FF"/>
        <stop offset="0.52" stop-color="#EEF8FF"/>
        <stop offset="1" stop-color="#FFF4F0"/>
      </linearGradient>
      <filter id="blur"><feGaussianBlur stdDeviation="24"/></filter>
    </defs>
    <rect width="${width}" height="${height}" rx="56" fill="url(#bg)"/>
    <g filter="url(#blur)">${shapes}</g>
    <g transform="rotate(-8 ${width / 2} ${height / 2})">${bars}</g>
    <rect x="${width * 0.09}" y="${height * 0.13}" width="${width * 0.82}" height="${height * 0.68}" rx="54" fill="white" opacity="0.42" stroke="${a}" stroke-opacity="0.22"/>
    <path d="M ${width * 0.16} ${height * 0.66} C ${width * 0.31} ${height * 0.35}, ${width * 0.48} ${height * 0.88}, ${width * 0.66} ${height * 0.43} S ${width * 0.86} ${height * 0.5}, ${width * 0.9} ${height * 0.25}" fill="none" stroke="${a}" stroke-width="18" stroke-linecap="round" opacity="0.72"/>
    <path d="M ${width * 0.18} ${height * 0.28} L ${width * 0.29} ${height * 0.2} L ${width * 0.4} ${height * 0.28} L ${width * 0.29} ${height * 0.37} Z" fill="${b}" opacity="0.82"/>
    <rect x="${width * 0.56}" y="${height * 0.19}" width="${width * 0.19}" height="${height * 0.19}" rx="42" fill="${c}" opacity="0.82"/>
    <text x="${width * 0.09}" y="${height * 0.9}" font-family="Inter, Arial, sans-serif" font-size="42" font-weight="800" fill="#28174F">${safeLabel}</text>
    <text x="${width * 0.09}" y="${height * 0.955}" font-family="Inter, Arial, sans-serif" font-size="24" font-weight="500" fill="#5B5570">${safePrompt}</text>
  </svg>`;

  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

function makeTitle(prompt: string) {
  const words = prompt
    .split(/[\s,]+/)
    .filter(Boolean)
    .slice(0, 4)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1));
  return words.length ? words.join(" ") : "Untitled Render";
}

function getQuality(prompt: string, negativePrompt: string, styleStrength: number) {
  const details = ["lighting", "composition", "detail", "cinematic", "studio", "color", "material", "mood"].filter((term) =>
    prompt.toLowerCase().includes(term),
  ).length;
  const lengthScore = Math.min(42, prompt.length / 3.4);
  const negativeScore = negativePrompt.trim().length > 6 ? 12 : 0;
  const styleScore = Math.min(20, styleStrength / 4);
  return Math.min(100, Math.round(24 + lengthScore + details * 4 + negativeScore + styleScore));
}

function choosePalette(prompt: string) {
  const palettes = [
    ["#7C3AED", "#22D3EE", "#FB7185"],
    ["#2563EB", "#A78BFA", "#F97316"],
    ["#0F766E", "#38BDF8", "#F59E0B"],
    ["#BE185D", "#7C3AED", "#14B8A6"],
    ["#4F46E5", "#06B6D4", "#F43F5E"],
  ];
  return palettes[hashText(prompt) % palettes.length];
}

export function PixelForgeStudio() {
  const [prompt, setPrompt] = useState(
    "premium creative studio scene with floating AI-generated artwork, sculptural lighting, polished glass panels, vivid violet and cyan accents",
  );
  const [negativePrompt, setNegativePrompt] = useState("blurry, low quality, watermark, distorted text");
  const [model, setModel] = useState(models[0]);
  const [ratio, setRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1536");
  const [sampler, setSampler] = useState(samplers[0]);
  const [seed, setSeed] = useState("24816");
  const [styleStrength, setStyleStrength] = useState([72]);
  const [creativity, setCreativity] = useState([64]);
  const [upscale, setUpscale] = useState(true);
  const [safeMode, setSafeMode] = useState(true);
  const [search, setSearch] = useState("");
  const [generating, setGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>(() => starterImages);

  useEffect(() => {
    const saved = window.localStorage.getItem("pixelforge-history");
    if (saved) {
      setImages(JSON.parse(saved) as GeneratedImage[]);
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem("pixelforge-history", JSON.stringify(images));
  }, [images]);

  const quality = useMemo(() => getQuality(prompt, negativePrompt, styleStrength[0]), [negativePrompt, prompt, styleStrength]);
  const activeImage = images[0];
  const favoriteCount = images.filter((image) => image.favorite).length;
  const filteredPresets = presets.filter((preset) => {
    const text = `${preset.category} ${preset.title} ${preset.tags.join(" ")}`.toLowerCase();
    return text.includes(search.toLowerCase());
  });

  const applyPreset = (preset: Preset) => {
    setPrompt(`${preset.prompt}, refined for ${preset.category.toLowerCase()}, award-winning art direction`);
  };

  const enhancePrompt = () => {
    const additions = [
      "intentional composition",
      "premium lighting design",
      "cohesive color palette",
      "high-detail materials",
      "designer-grade finish",
    ];
    const missing = additions.filter((addition) => !prompt.toLowerCase().includes(addition));
    setPrompt(`${prompt.trim()}${prompt.trim().endsWith(",") ? "" : ","} ${missing.slice(0, 3).join(", ")}`);
  };

  const randomizeSeed = () => {
    setSeed(String(Math.floor(10000 + Math.random() * 89999)));
  };

  const generateImage = () => {
    setGenerating(true);
    window.setTimeout(() => {
      const finalSeed = seed.trim() || String(Math.floor(10000 + Math.random() * 89999));
      const title = makeTitle(prompt);
      const nextImage: GeneratedImage = {
        id: `${Date.now()}`,
        title,
        prompt,
        negativePrompt,
        model,
        ratio,
        resolution: upscale ? `${resolution} upscaled` : resolution,
        sampler,
        seed: finalSeed,
        quality,
        favorite: false,
        image: createGeneratedSvg({
          prompt,
          seed: finalSeed,
          ratio,
          palette: choosePalette(prompt),
          label: title,
        }),
        createdAt: "Just now",
      };
      setImages((current) => [nextImage, ...current].slice(0, 12));
      setGenerating(false);
    }, 700);
  };

  const toggleFavorite = (id: string) => {
    setImages((current) => current.map((image) => (image.id === id ? { ...image, favorite: !image.favorite } : image)));
  };

  return (
    <main className="min-h-screen overflow-hidden bg-[#F7F3FF] text-slate-950">
      <div className="fixed inset-0 -z-10 bg-[url('/assets/pixelforge-bg.png')] bg-cover bg-center opacity-45" />
      <div className="fixed inset-0 -z-10 bg-[#F7F3FF]/80" />

      <section className="mx-auto flex w-full max-w-[1800px] flex-col gap-5 px-4 py-4 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-[0_24px_80px_rgba(76,29,149,0.14)] backdrop-blur md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-violet-100 bg-white shadow-lg shadow-violet-200/50">
              <img src="/assets/pixelforge-logo.png" alt="PixelForge logo" className="h-full w-full object-cover" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-black tracking-tight text-[#291650] sm:text-3xl">PixelForge</h1>
                <Badge className="rounded-full bg-violet-100 px-3 py-1 text-violet-700 hover:bg-violet-100">Creator Studio</Badge>
              </div>
              <p className="text-sm font-medium text-slate-600">Prompt, generate, refine, upscale, and remix visuals in one competitive AI workspace.</p>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:flex sm:items-center">
            <div className="rounded-2xl bg-violet-50 px-4 py-2 text-center">
              <p className="text-lg font-black text-violet-700">{images.length}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-violet-500">renders</p>
            </div>
            <div className="rounded-2xl bg-cyan-50 px-4 py-2 text-center">
              <p className="text-lg font-black text-cyan-700">{favoriteCount}</p>
              <p className="text-[11px] font-bold uppercase tracking-wide text-cyan-600">saved</p>
            </div>
            <Button className="rounded-2xl bg-[#7C3AED] px-5 py-6 text-white shadow-lg shadow-violet-300 hover:bg-[#6D28D9]" onClick={generateImage} disabled={generating}>
              {generating ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
              Generate
            </Button>
          </div>
        </header>

        <div className="grid gap-5 xl:grid-cols-[320px_minmax(0,1fr)_390px]">
          <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-xl shadow-violet-100/60 backdrop-blur xl:sticky xl:top-4 xl:h-[calc(100vh-8.5rem)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-violet-500">Discover</p>
                <h2 className="text-xl font-black text-[#291650]">Style library</h2>
              </div>
              <Palette className="h-6 w-6 text-violet-600" />
            </div>

            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search presets"
                className="h-12 rounded-2xl border-violet-100 bg-violet-50/60 pl-11 font-medium"
              />
            </div>

            <ScrollArea className="h-[430px] pr-3 xl:h-[calc(100vh-22rem)]">
              <div className="space-y-3">
                {filteredPresets.map((preset) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={preset.id}
                      onClick={() => applyPreset(preset)}
                      className="group w-full rounded-[1.35rem] border border-slate-100 bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-lg hover:shadow-violet-100"
                    >
                      <div className="mb-3 flex items-center gap-3">
                        <span className={cn("flex h-11 w-11 items-center justify-center rounded-2xl", preset.color)}>
                          <Icon className="h-5 w-5" />
                        </span>
                        <div>
                          <p className="text-sm font-black text-slate-900">{preset.title}</p>
                          <p className="text-xs font-bold text-slate-500">{preset.category}</p>
                        </div>
                      </div>
                      <p className="line-clamp-2 text-xs leading-5 text-slate-600">{preset.prompt}</p>
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {preset.tags.map((tag) => (
                          <span key={tag} className="rounded-full bg-slate-100 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>

            <Card className="mt-4 overflow-hidden rounded-[1.5rem] border-none bg-[#291650] p-4 text-white shadow-lg shadow-violet-200">
              <div className="mb-3 flex items-center gap-2">
                <Share2 className="h-4 w-4 text-cyan-200" />
                <p className="text-sm font-black">Community-ready</p>
              </div>
              <img src="/assets/pixelforge-community.png" alt="Community gallery preview" className="mb-3 aspect-[4/3] w-full rounded-[1.1rem] object-cover" />
              <p className="text-xs leading-5 text-violet-100">Designed for future prompt remixing, team workspaces, creator badges, and public galleries.</p>
            </Card>
          </aside>

          <section className="space-y-5">
            <Card className="overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-xl shadow-violet-100/60 backdrop-blur sm:p-6">
              <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <Badge className="mb-3 rounded-full bg-cyan-100 px-3 py-1 text-cyan-700 hover:bg-cyan-100">
                    <BrainCircuit className="mr-1.5 h-3.5 w-3.5" /> Advanced prompt builder
                  </Badge>
                  <h2 className="max-w-2xl text-3xl font-black tracking-tight text-[#291650] sm:text-5xl">Forge production-ready visuals from sharper creative prompts.</h2>
                </div>
                <div className="rounded-[1.5rem] bg-violet-50 p-4 lg:w-56">
                  <div className="mb-2 flex items-center justify-between">
                    <p className="text-sm font-black text-violet-700">Prompt quality</p>
                    <p className="text-sm font-black text-violet-700">{quality}%</p>
                  </div>
                  <Progress value={quality} className="h-2 bg-violet-100" />
                  <p className="mt-2 text-xs font-medium text-violet-600">Add subject, style, lighting, materials, and exclusions to improve output.</p>
                </div>
              </div>

              <Tabs defaultValue="prompt" className="w-full">
                <TabsList className="mb-5 grid h-auto w-full grid-cols-3 rounded-2xl bg-violet-50 p-1">
                  <TabsTrigger value="prompt" className="rounded-xl py-2.5 font-black data-[state=active]:bg-white data-[state=active]:text-violet-700">Prompt</TabsTrigger>
                  <TabsTrigger value="controls" className="rounded-xl py-2.5 font-black data-[state=active]:bg-white data-[state=active]:text-violet-700">Controls</TabsTrigger>
                  <TabsTrigger value="tools" className="rounded-xl py-2.5 font-black data-[state=active]:bg-white data-[state=active]:text-violet-700">Editing</TabsTrigger>
                </TabsList>

                <TabsContent value="prompt" className="mt-0 space-y-4">
                  <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-700">Primary prompt</Label>
                        <Textarea
                          value={prompt}
                          onChange={(event) => setPrompt(event.target.value)}
                          className="min-h-[190px] resize-none rounded-[1.5rem] border-violet-100 bg-violet-50/50 p-5 text-base font-medium leading-7 text-slate-800 focus-visible:ring-violet-400"
                          placeholder="Describe the image, subject, mood, material, lighting, and composition..."
                        />
                      </div>
                      <div className="space-y-2">
                        <Label className="text-sm font-black text-slate-700">Negative prompt</Label>
                        <Input
                          value={negativePrompt}
                          onChange={(event) => setNegativePrompt(event.target.value)}
                          className="rounded-2xl border-violet-100 bg-white px-4 py-6 font-medium"
                          placeholder="Exclude blur, watermark, extra fingers, distorted text..."
                        />
                      </div>
                    </div>

                    <div className="space-y-3">
                      <Button onClick={enhancePrompt} className="w-full rounded-2xl bg-cyan-600 py-6 text-white shadow-lg shadow-cyan-100 hover:bg-cyan-700">
                        <Wand2 className="mr-2 h-4 w-4" /> Enhance prompt
                      </Button>
                      <div className="rounded-[1.5rem] border border-violet-100 bg-white p-4">
                        <div className="mb-3 flex items-center gap-2">
                          <Lightbulb className="h-4 w-4 text-amber-500" />
                          <p className="text-sm font-black text-slate-800">Trending prompt boosts</p>
                        </div>
                        <div className="space-y-2">
                          {trendingPrompts.map((boost) => (
                            <button
                              key={boost}
                              onClick={() => setPrompt(`${prompt.trim()}, ${boost}`)}
                              className="w-full rounded-xl bg-slate-50 px-3 py-2 text-left text-xs font-semibold leading-5 text-slate-600 transition hover:bg-violet-50 hover:text-violet-700"
                            >
                              + {boost}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="controls" className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <ControlSelect label="Model" value={model} onValueChange={setModel} items={models} icon={Cpu} />
                    <ControlSelect label="Aspect ratio" value={ratio} onValueChange={setRatio} items={ratios} icon={Box} />
                    <ControlSelect label="Resolution" value={resolution} onValueChange={setResolution} items={resolutions} suffix="px" icon={Eye} />
                    <ControlSelect label="Sampler" value={sampler} onValueChange={setSampler} items={samplers} icon={SlidersHorizontal} />
                  </div>

                  <div className="mt-4 grid gap-4 lg:grid-cols-2">
                    <SliderCard label="Style strength" value={styleStrength} onValueChange={setStyleStrength} helper="How strongly PixelForge applies preset styling." />
                    <SliderCard label="Creative variance" value={creativity} onValueChange={setCreativity} helper="Higher variance explores bolder compositions." />
                  </div>

                  <div className="mt-4 grid gap-4 md:grid-cols-3">
                    <div className="rounded-[1.4rem] border border-violet-100 bg-white p-4">
                      <Label className="font-black text-slate-700">Seed</Label>
                      <div className="mt-2 flex gap-2">
                        <Input value={seed} onChange={(event) => setSeed(event.target.value)} className="rounded-xl font-bold" />
                        <Button variant="outline" className="rounded-xl border-violet-100" onClick={randomizeSeed}>
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <SwitchCard checked={upscale} onCheckedChange={setUpscale} icon={Expand} title="Upscale" text="Prepare a high-resolution export pass." />
                    <SwitchCard checked={safeMode} onCheckedChange={setSafeMode} icon={ShieldCheck} title="Safe mode" text="Apply prompt and content guardrails." />
                  </div>
                </TabsContent>

                <TabsContent value="tools" className="mt-0">
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    {[
                      { icon: Expand, title: "4x Upscale", text: "Boost clarity for campaign-ready exports." },
                      { icon: Eraser, title: "Background removal", text: "Isolate products and creator assets." },
                      { icon: Brush, title: "Inpaint / outpaint", text: "Extend or repair selected image areas." },
                      { icon: PenTool, title: "Style transfer", text: "Apply saved looks across batches." },
                    ].map((tool) => {
                      const Icon = tool.icon;
                      return (
                        <div key={tool.title} className="rounded-[1.5rem] border border-violet-100 bg-white p-4 shadow-sm">
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
                            <Icon className="h-5 w-5" />
                          </div>
                          <h3 className="font-black text-slate-900">{tool.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{tool.text}</p>
                        </div>
                      );
                    })}
                  </div>
                </TabsContent>
              </Tabs>
            </Card>

            <Card className="grid gap-5 overflow-hidden rounded-[2rem] border border-white/70 bg-white/90 p-4 shadow-xl shadow-violet-100/60 backdrop-blur lg:grid-cols-[1fr_0.88fr] sm:p-6">
              <div>
                <div className="mb-4 flex items-center gap-2">
                  <BadgeCheck className="h-5 w-5 text-violet-600" />
                  <h2 className="text-xl font-black text-[#291650]">Competitive feature stack</h2>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    "Preset and style libraries",
                    "Negative prompts and quality guidance",
                    "Aspect ratio, resolution, seed and sampler control",
                    "History, favorites and batch-ready gallery",
                    "Model selection for different creative jobs",
                    "Roadmap-ready social remixing and plugins",
                  ].map((feature) => (
                    <div key={feature} className="flex items-start gap-3 rounded-2xl bg-violet-50/70 p-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-violet-600 text-white">
                        <Check className="h-3.5 w-3.5" />
                      </span>
                      <p className="text-sm font-bold leading-6 text-slate-700">{feature}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="relative overflow-hidden rounded-[1.6rem] bg-violet-50 p-3">
                <img src="/assets/pixelforge-hero.png" alt="AI image generation canvas" className="aspect-[16/10] h-full w-full rounded-[1.2rem] object-cover shadow-lg" />
              </div>
            </Card>
          </section>

          <aside className="rounded-[2rem] border border-white/70 bg-white/80 p-4 shadow-xl shadow-violet-100/60 backdrop-blur xl:sticky xl:top-4 xl:h-[calc(100vh-8.5rem)]">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.24em] text-coral-600">Output</p>
                <h2 className="text-xl font-black text-[#291650]">Live renders</h2>
              </div>
              <ImagePlus className="h-6 w-6 text-coral-600" />
            </div>

            <div className="overflow-hidden rounded-[1.7rem] border border-violet-100 bg-white p-3 shadow-lg shadow-violet-100/70">
              <div className="relative overflow-hidden rounded-[1.35rem] bg-violet-50">
                {generating && (
                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-white/75 backdrop-blur-sm">
                    <RefreshCw className="mb-3 h-9 w-9 animate-spin text-violet-600" />
                    <p className="text-sm font-black text-violet-700">Forging pixels...</p>
                  </div>
                )}
                <img src={activeImage.image} alt={activeImage.title} className="aspect-[4/3] w-full object-cover" />
              </div>
              <div className="mt-4 flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-black text-slate-900">{activeImage.title}</h3>
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{activeImage.prompt}</p>
                </div>
                <Button variant="outline" size="icon" className="shrink-0 rounded-2xl border-violet-100" onClick={() => toggleFavorite(activeImage.id)}>
                  <Heart className={cn("h-4 w-4", activeImage.favorite && "fill-coral-500 text-coral-500")} />
                </Button>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                <Stat label="Model" value={activeImage.model.split(" ")[0]} />
                <Stat label="Ratio" value={activeImage.ratio} />
                <Stat label="Quality" value={`${activeImage.quality}%`} />
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Button variant="outline" className="rounded-2xl border-violet-100 font-black">
                  <Download className="mr-2 h-4 w-4" /> Export
                </Button>
                <Button variant="outline" className="rounded-2xl border-violet-100 font-black">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </div>
            </div>

            <Separator className="my-4 bg-violet-100" />

            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-black text-[#291650]">History & favorites</h3>
              <Badge className="rounded-full bg-coral-100 text-coral-700 hover:bg-coral-100">{favoriteCount} favorites</Badge>
            </div>
            <ScrollArea className="h-[390px] pr-3 xl:h-[calc(100vh-40rem)]">
              <div className="space-y-3">
                {images.map((image) => (
                  <button
                    key={image.id}
                    onClick={() => setImages((current) => [image, ...current.filter((item) => item.id !== image.id)])}
                    className="group grid w-full grid-cols-[78px_1fr_auto] gap-3 rounded-[1.25rem] border border-slate-100 bg-white p-2 text-left shadow-sm transition hover:border-violet-200 hover:shadow-md"
                  >
                    <img src={image.image} alt={image.title} className="h-20 w-20 rounded-2xl object-cover" />
                    <div className="min-w-0 py-1">
                      <p className="truncate text-sm font-black text-slate-900">{image.title}</p>
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-slate-600">{image.prompt}</p>
                      <p className="mt-1 text-[11px] font-bold text-violet-500">{image.model} · {image.ratio}</p>
                    </div>
                    <ChevronRight className="mt-7 h-4 w-4 text-slate-300 transition group-hover:text-violet-500" />
                  </button>
                ))}
              </div>
            </ScrollArea>
          </aside>
        </div>
      </section>
    </main>
  );
}

function ControlSelect({
  label,
  value,
  onValueChange,
  items,
  icon: Icon,
  suffix,
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  items: string[];
  icon: LucideIcon;
  suffix?: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-violet-100 bg-white p-4">
      <div className="mb-2 flex items-center gap-2">
        <Icon className="h-4 w-4 text-violet-600" />
        <Label className="font-black text-slate-700">{label}</Label>
      </div>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-12 rounded-2xl border-violet-100 bg-violet-50/50 font-bold">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-2xl">
          {items.map((item) => (
            <SelectItem key={item} value={item} className="font-semibold">
              {item}{suffix ? ` ${suffix}` : ""}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SliderCard({
  label,
  value,
  onValueChange,
  helper,
}: {
  label: string;
  value: number[];
  onValueChange: (value: number[]) => void;
  helper: string;
}) {
  return (
    <div className="rounded-[1.4rem] border border-violet-100 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <Label className="font-black text-slate-700">{label}</Label>
        <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-black text-violet-700">{value[0]}%</span>
      </div>
      <Slider value={value} onValueChange={onValueChange} max={100} step={1} className="py-3" />
      <p className="text-xs font-medium text-slate-500">{helper}</p>
    </div>
  );
}

function SwitchCard({
  checked,
  onCheckedChange,
  icon: Icon,
  title,
  text,
}: {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  icon: LucideIcon;
  title: string;
  text: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[1.4rem] border border-violet-100 bg-white p-4">
      <div className="flex gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100 text-violet-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-black text-slate-800">{title}</p>
          <p className="text-xs leading-5 text-slate-500">{text}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-violet-50 p-2">
      <p className="text-xs font-black text-violet-500">{label}</p>
      <p className="truncate text-sm font-black text-slate-900">{value}</p>
    </div>
  );
}
