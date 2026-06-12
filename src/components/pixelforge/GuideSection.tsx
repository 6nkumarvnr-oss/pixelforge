import { Compass, Heart, Search, Sparkles, Wand2 } from "lucide-react";
import { Card } from "@/components/ui/card";

const guideSteps = [
  {
    href: "#preset-library",
    label: "1. Pick a style",
    copy: "Search categories and load a preset to start fast.",
    icon: Search,
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    href: "#prompt-builder",
    label: "2. Edit the brief",
    copy: "Adjust positive/negative prompts, model, size, seed, and creativity.",
    icon: Wand2,
    color: "bg-violet-100 text-violet-700",
  },
  {
    href: "#live-canvas",
    label: "3. Generate",
    copy: "Click Generate Image, then download the preview when you like it.",
    icon: Sparkles,
    color: "bg-rose-100 text-rose-700",
  },
  {
    href: "#history-panel",
    label: "4. Save or remix",
    copy: "Favorite your best outputs or remix them back into the builder.",
    icon: Heart,
    color: "bg-amber-100 text-amber-700",
  },
];

const GuideSection = () => (
  <section aria-label="How to use PixelForge" className="mx-auto w-full max-w-[1560px] px-4 pb-4 sm:px-6 lg:px-8">
    <Card className="overflow-hidden rounded-[2rem] border-white/80 bg-white/80 p-4 shadow-2xl shadow-violet-200/35 backdrop-blur-xl sm:p-5">
      <div className="grid gap-4 xl:grid-cols-[280px_1fr] xl:items-center">
        <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
          <div className="mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-cyan-300 text-slate-950">
            <Compass className="h-5 w-5" />
          </div>
          <p className="text-xs font-black uppercase tracking-[0.24em] text-cyan-200">Quick navigation</p>
          <h2 className="mt-2 text-2xl font-black tracking-tight">How to use this app</h2>
          <p className="mt-2 text-sm font-semibold leading-6 text-slate-300">
            Follow these steps from left to right: choose a preset, refine the brief, generate, then save or remix.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {guideSteps.map((step) => {
            const Icon = step.icon;
            return (
              <a
                key={step.href}
                href={step.href}
                className="group rounded-[1.5rem] border border-violet-100 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:border-violet-200 hover:shadow-xl hover:shadow-violet-100 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2"
              >
                <div className={`mb-3 grid h-11 w-11 place-items-center rounded-2xl ${step.color}`}>
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="font-black text-slate-950 group-hover:text-violet-700">{step.label}</h3>
                <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{step.copy}</p>
              </a>
            );
          })}
        </div>
      </div>
    </Card>
  </section>
);

export default GuideSection;
