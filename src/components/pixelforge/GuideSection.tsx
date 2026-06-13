import { Search, Sparkles, Wand2 } from "lucide-react";

const steps = [
  {
    label: "Choose a preset",
    copy: "Pick a style from the library on the left.",
    icon: Search,
    color: "bg-cyan-100 text-cyan-700",
  },
  {
    label: "Edit the prompt",
    copy: "Adjust wording, model, seed, and settings.",
    icon: Wand2,
    color: "bg-violet-100 text-violet-700",
  },
  {
    label: "Generate",
    copy: "Click Generate — download or remix the result.",
    icon: Sparkles,
    color: "bg-rose-100 text-rose-700",
  },
];

const GuideSection = () => (
  <section aria-label="How to use PixelForge" className="mx-auto w-full max-w-[1560px] px-4 pb-4 sm:px-6 lg:px-8">
    <div className="grid gap-3 sm:grid-cols-3">
      {steps.map((step, index) => {
        const Icon = step.icon;
        return (
          <div
            key={step.label}
            className="flex items-center gap-3 rounded-[1.35rem] border border-white/70 bg-white/80 px-4 py-3 shadow-sm backdrop-blur"
          >
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${step.color}`}>
              <Icon className="h-4 w-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black uppercase tracking-[0.18em] text-slate-400">Step {index + 1}</p>
              <p className="font-black text-slate-950">{step.label}</p>
              <p className="text-xs font-medium leading-5 text-slate-500">{step.copy}</p>
            </div>
          </div>
        );
      })}
    </div>
  </section>
);

export default GuideSection;
