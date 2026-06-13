import { useEffect, useMemo, useState, type ReactNode } from "react";
import {
  BadgeCheck,
  Bot,
  Cpu,
  Download,
  Eraser,
  Expand,
  Image as ImageIcon,
  LockKeyhole,
  Palette,
  RefreshCcw,
  Rocket,
  Share2,
  ShieldCheck,
  Sparkles,
  Wand2,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import AdminPanel from "@/components/pixelforge/AdminPanel";
import GuideSection from "@/components/pixelforge/GuideSection";
import HistoryPanel from "@/components/pixelforge/HistoryPanel";
import PresetLibrary from "@/components/pixelforge/PresetLibrary";
import { makeGeneratedArt } from "@/lib/fallback-art";
import {
  aspects,
  builtinPresets,
  decoratePreset,
  loadStoredHistory,
  mapApiGeneration,
  models,
  resolutions,
  samplers,
  styleBoosters,
  type GeneratedImage,
  type Preset,
} from "@/lib/studio-data";
import {
  createBillingCheckout,
  createBillingPortal,
  fetchAdminPaymentSettings,
  fetchPixelForgeAnalytics,
  fetchPixelForgeHistory,
  fetchPixelForgePresets,
  fetchPixelForgeUser,
  generatePixelForgeImage,
  updateAdminPaymentSettings,
  updatePixelForgeFavorite,
  type ApiAdminPaymentSettings,
  type ApiAdminPaymentStatus,
  type ApiAnalytics,
  type ApiUserProfile,
} from "@/lib/pixelforge-api";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import type { Session } from "@supabase/supabase-js";
import { toast } from "sonner";

const SUPER_ADMIN_EMAIL = "6nkumar.vnr@gmail.com";

const Index = () => {
  const [prompt, setPrompt] = useState(builtinPresets[0].prompt);
  const [negative, setNegative] = useState(builtinPresets[0].negative);
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
  const [history, setHistory] = useState<GeneratedImage[]>(() => loadStoredHistory());
  const [presetLibrary, setPresetLibrary] = useState<Preset[]>(builtinPresets);
  const [analytics, setAnalytics] = useState<ApiAnalytics | null>(null);
  const [userProfile, setUserProfile] = useState<ApiUserProfile | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loginEmail, setLoginEmail] = useState("");
  const [apiStatus, setApiStatus] = useState<"connecting" | "online" | "fallback">("connecting");
  const [activeFilter, setActiveFilter] = useState("All");
  const [activePanel, setActivePanel] = useState<"studio" | "admin">("studio");
  const [search, setSearch] = useState("");
  const [adminPaymentSettings, setAdminPaymentSettings] = useState<ApiAdminPaymentSettings | null>(null);
  const [adminPaymentStatus, setAdminPaymentStatus] = useState<ApiAdminPaymentStatus | null>(null);
  const [isSavingAdminSettings, setIsSavingAdminSettings] = useState(false);
  const [hasGenerated, setHasGenerated] = useState(false);
  const isSuperAdmin =
    userProfile?.role === "SUPER_ADMIN" || userProfile?.unlimitedCredits || session?.user.email?.toLowerCase() === SUPER_ADMIN_EMAIL;
  const isFallback = apiStatus === "fallback" || analytics?.fallbackActive === true;
  const modeLabel = apiStatus === "connecting" ? "Connecting" : isFallback ? "Demo / Fallback" : "Online";

  const refreshWorkspace = async () => {
    const [apiPresets, apiHistory, apiAnalytics, apiUser] = await Promise.all([
      fetchPixelForgePresets(),
      fetchPixelForgeHistory(),
      fetchPixelForgeAnalytics(),
      fetchPixelForgeUser(),
    ]);
    setPresetLibrary(apiPresets.map(decoratePreset));
    if (apiHistory.length > 0) {
      setHistory(apiHistory.map(mapApiGeneration));
    }
    setAnalytics(apiAnalytics);
    setUserProfile(apiUser);
    setApiStatus(apiAnalytics.fallbackActive ? "fallback" : "online");
  };

  useEffect(() => {
    let isMounted = true;

    refreshWorkspace().catch(() => {
      if (!isMounted) return;
      setApiStatus("fallback");
      toast.warning("Using local fallback mode until the API is available.");
    });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user.email) {
        setLoginEmail(data.session.user.email);
      }
    });

    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession?.user.email) {
        setLoginEmail(nextSession.user.email);
      }
      window.setTimeout(() => {
        refreshWorkspace().catch(() => setApiStatus("fallback"));
      }, 0);
    });

    return () => {
      data.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (apiStatus === "fallback") {
      localStorage.setItem("pixelforge-history", JSON.stringify(history));
    }
  }, [apiStatus, history]);

  useEffect(() => {
    if (!isSuperAdmin) {
      setActivePanel("studio");
      setAdminPaymentSettings(null);
      setAdminPaymentStatus(null);
      return;
    }

    fetchAdminPaymentSettings()
      .then((data) => {
        setAdminPaymentSettings(data.settings);
        setAdminPaymentStatus(data.stripe);
      })
      .catch(() => toast.warning("Admin payment settings could not be loaded."));
  }, [isSuperAdmin]);

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
  const creditsRemaining = isSuperAdmin
    ? "Unlimited"
    : String(userProfile?.credits ?? analytics?.user?.credits ?? Math.max(0, 25 - (analytics?.totals.creditsUsed ?? history.length)));
  const currentPlan = isSuperAdmin ? "STUDIO" : userProfile?.plan ?? analytics?.user?.plan ?? "FREE";
  const subscriptionStatus = isSuperAdmin ? "ACTIVE" : userProfile?.subscriptionStatus ?? analytics?.user?.subscriptionStatus ?? "NONE";

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

  const login = async () => {
    if (!supabase) {
      toast.error("Supabase Auth is not configured yet.");
      return;
    }

    if (!loginEmail.trim()) {
      toast.error("Enter your email to receive a magic login link.");
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: loginEmail.trim(),
      options: { emailRedirectTo: window.location.origin },
    });

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Magic login link sent. Check your email.");
  };

  const logout = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
    setUserProfile(null);
    setSession(null);
    toast.success("Logged out of PixelForge.");
  };

  const openBilling = async (plan: "PRO" | "STUDIO") => {
    try {
      const url = currentPlan === "FREE" ? await createBillingCheckout(plan) : await createBillingPortal();
      if (url) window.location.href = url;
    } catch {
      toast.error("Billing is not configured yet.");
    }
  };

  const saveAdminPaymentSettings = async () => {
    if (!adminPaymentSettings) return;

    setIsSavingAdminSettings(true);
    try {
      const settings = await updateAdminPaymentSettings(adminPaymentSettings);
      setAdminPaymentSettings(settings);
      toast.success("Admin payment settings updated.");
    } catch {
      toast.error("Only the super admin can update payment settings.");
    } finally {
      setIsSavingAdminSettings(false);
    }
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
        provider: model.includes("DALL-E") ? "dalle" : model.includes("SDXL") ? "sdxl" : "fallback",
        style: activeFilter === "All" ? "Custom" : activeFilter,
      });
      const generated = mapApiGeneration(generation);
      setHistory((items) => [generated, ...items].slice(0, 18));
      fetchPixelForgeAnalytics().then(setAnalytics).catch(() => undefined);
      fetchPixelForgeUser().then(setUserProfile).catch(() => undefined);
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
      setHasGenerated(true);
    }
  };

  const toggleFavorite = (id: string) => {
    const nextFavorite = !history.find((item) => item.id === id)?.favorite;
    setHistory((items) => items.map((item) => (item.id === id ? { ...item, favorite: nextFavorite } : item)));
    updatePixelForgeFavorite(id, nextFavorite)
      .then((updated) => {
        if (updated) {
          setHistory((items) => items.map((item) => (item.id === id ? mapApiGeneration(updated) : item)));
        }
        fetchPixelForgeAnalytics().then(setAnalytics).catch(() => undefined);
      })
      .catch(() => toast.warning("Favorite saved locally until the database is available."));
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
            <p className="text-sm font-medium text-slate-600">Build image prompts, generate previews, and remix your best results.</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
          <div className="grid grid-cols-2 gap-2 rounded-[2rem] border border-white/70 bg-white/70 p-2 shadow-lg shadow-violet-100/70 backdrop-blur sm:grid-cols-4 md:flex md:items-center">
            {[
              ["Credits", creditsRemaining],
              ["Plan", currentPlan],
              ["Mode", modeLabel],
              ["Favorites", String(favorites.length)],
            ].map(([label, value]) => (
              <div key={label} className="rounded-3xl bg-white px-4 py-2 text-center shadow-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">{label}</p>
                <p className={`text-sm font-black capitalize ${label === "Mode" && isFallback ? "text-amber-600" : "text-slate-900"}`}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          {isSuperAdmin && (
            <div className="flex rounded-[2rem] border border-white/70 bg-white/70 p-2 shadow-lg shadow-violet-100/70 backdrop-blur">
              <Button
                onClick={() => setActivePanel("studio")}
                variant="ghost"
                className={`rounded-2xl px-4 font-black ${activePanel === "studio" ? "bg-slate-950 text-white hover:bg-slate-950 hover:text-white" : "text-slate-700 hover:bg-white"}`}
              >
                Studio
              </Button>
              <Button
                onClick={() => setActivePanel("admin")}
                variant="ghost"
                className={`rounded-2xl px-4 font-black ${activePanel === "admin" ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white" : "text-violet-700 hover:bg-white"}`}
              >
                <LockKeyhole className="mr-2 h-4 w-4" /> Admin
              </Button>
            </div>
          )}

          <div className="rounded-[2rem] border border-white/70 bg-white/70 p-2 shadow-lg shadow-violet-100/70 backdrop-blur">
            {session ? (
              <div className="flex flex-wrap items-center gap-2">
                <div className="rounded-3xl bg-white px-4 py-2 shadow-sm">
                  <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400">Account</p>
                  <p className="max-w-44 truncate text-sm font-black text-slate-900">{session.user.email}</p>
                </div>
                <Button onClick={() => openBilling("PRO")} className="rounded-2xl bg-violet-600 font-black text-white hover:bg-violet-700">
                  {subscriptionStatus === "ACTIVE" ? "Manage" : "Upgrade"}
                </Button>
                <Button onClick={logout} variant="outline" className="rounded-2xl border-violet-100 bg-white font-black text-slate-700 hover:bg-violet-50">
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Input
                    value={loginEmail}
                    onChange={(event) => setLoginEmail(event.target.value)}
                    disabled={!isSupabaseConfigured}
                    placeholder={isSupabaseConfigured ? "Enter email for magic link" : "Add Supabase env vars"}
                    className="h-11 rounded-2xl border-violet-100 bg-white font-semibold"
                  />
                  <Button onClick={login} className="h-11 rounded-2xl bg-slate-950 px-5 font-black text-white hover:bg-violet-700">
                    Login
                  </Button>
                </div>
                <p className="px-1 text-[11px] font-semibold text-slate-500">Login saves history, favorites, and credits.</p>
              </div>
            )}
          </div>
        </div>
      </header>

      <GuideSection />

      {!session && isSupabaseConfigured && (
        <div className="mx-auto w-full max-w-[1560px] px-4 pb-3 sm:px-6 lg:px-8">
          <div className="flex items-center gap-2 rounded-[1.25rem] border border-amber-100 bg-amber-50 px-4 py-2.5">
            <span className="text-sm font-semibold text-amber-800">
              Guest mode — generations are stored locally. Sign in to save history and favorites reliably.
            </span>
          </div>
        </div>
      )}

      {isSuperAdmin && activePanel === "admin" && (
        <AdminPanel
          settings={adminPaymentSettings}
          status={adminPaymentStatus}
          isSaving={isSavingAdminSettings}
          onChange={setAdminPaymentSettings}
          onSave={saveAdminPaymentSettings}
        />
      )}

      <section
        className={`${isSuperAdmin && activePanel === "admin" ? "hidden" : "mx-auto grid w-full max-w-[1560px] gap-4 px-4 pb-8 sm:px-6 lg:grid-cols-[310px_minmax(0,1fr)_360px] lg:px-8"}`}
      >
        <PresetLibrary
          categories={categories}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          search={search}
          onSearchChange={setSearch}
          presets={visiblePresets}
          onApply={applyPreset}
        />

        <div id="prompt-builder" className="scroll-mt-5 space-y-4">
          <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/80 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl sm:p-5">
            <div className="grid grid-cols-1 gap-4">
              <div className="min-w-0 space-y-4">
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

              <div id="live-canvas" className="min-w-0 scroll-mt-5 rounded-[1.75rem] border border-white/80 bg-[#120F2A] p-4 text-white shadow-xl shadow-violet-200/50">
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
                        <p className="text-sm font-black uppercase tracking-[0.22em] text-white">Generating...</p>
                      </div>
                    </div>
                  )}
                  {!isGenerating && !hasGenerated && history.length === 0 && (
                    <div className="absolute inset-3 grid place-items-center rounded-[1.15rem] bg-slate-950/55 backdrop-blur-sm">
                      <div className="px-4 text-center">
                        <ImageIcon className="mx-auto mb-3 h-8 w-8 text-slate-300" />
                        <p className="text-sm font-black text-white">No image generated yet</p>
                        <p className="mt-1 text-xs font-semibold text-slate-300">Choose a preset or edit the prompt, then click Generate.</p>
                      </div>
                    </div>
                  )}
                  {!isGenerating && hasGenerated && isFallback && (
                    <div className="absolute bottom-5 left-5 right-5">
                      <div className="rounded-full bg-amber-500/90 px-3 py-1.5 text-center text-xs font-black text-white backdrop-blur-sm">
                        Fallback SVG preview
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
                {isFallback && (
                  <p className="mt-2 text-center text-xs font-semibold text-slate-400">
                    Demo mode — set <span className="font-mono">OPENAI_API_KEY</span> or <span className="font-mono">SDXL_API_URL</span> for real AI images.
                  </p>
                )}
              </div>
            </div>
          </Card>

          <div className="grid gap-4 md:grid-cols-3">
            {[
              { icon: ShieldCheck, title: "Prompt guidance", copy: "Positive and negative prompts, quality scoring, and one-click enhancement keep briefs on track." },
              { icon: Share2, title: "Remix workflow", copy: "Favorite your best outputs and remix any result back into the builder with one click." },
              { icon: BadgeCheck, title: "Provider options", copy: "Connect OpenAI or SDXL for real AI images. Without a provider key the app runs in demo mode." },
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

        <HistoryPanel
          history={history}
          favoritesCount={favorites.length}
          isAuthenticated={!!session}
          onToggleFavorite={toggleFavorite}
          onRemix={remix}
        />
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
