import { Boxes, BriefcaseBusiness, FileText, FolderKanban, GitBranch, Images, Palette, PackageCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { StudioWorkspace } from "@/lib/production-studio";

const MetricCard = ({ label, value, tone }: { label: string; value: number | string; tone: string }) => (
  <div className="rounded-[1.4rem] border border-white/70 bg-white/80 p-4 shadow-sm">
    <p className={`text-2xl font-black ${tone}`}>{value}</p>
    <p className="mt-1 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
  </div>
);

const EmptyState = ({ label }: { label: string }) => (
  <div className="rounded-[1.5rem] border border-dashed border-violet-200 bg-white/70 p-4 text-sm font-semibold text-slate-500">{label}</div>
);

const ProductionStudioPanel = ({ workspace }: { workspace: StudioWorkspace | null }) => {
  const data = workspace;

  if (!data) {
    return (
      <Card className="rounded-[2rem] border-white/70 bg-white/75 p-6 shadow-xl shadow-violet-100/50 backdrop-blur">
        <p className="text-sm font-black uppercase tracking-[0.25em] text-violet-600">Production Studio</p>
        <h2 className="mt-2 text-2xl font-black text-slate-950">Loading creative workspace...</h2>
      </Card>
    );
  }

  return (
    <section className="mx-auto w-full max-w-[1560px] px-4 pb-8 sm:px-6 lg:px-8">
      <Card className="overflow-hidden rounded-[2.25rem] border-white/70 bg-white/75 p-5 shadow-2xl shadow-violet-200/45 backdrop-blur-xl lg:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge className="rounded-full border-0 bg-slate-950 px-3 py-1 text-white hover:bg-slate-950">
                <Boxes className="mr-1.5 h-3.5 w-3.5" /> Full-stack Studio
              </Badge>
              <Badge className="rounded-full border-0 bg-cyan-100 px-3 py-1 font-black text-cyan-700 hover:bg-cyan-100">
                {data.mode === "production-ready" ? "Database ready" : "Demo architecture"}
              </Badge>
              <Badge className="rounded-full border-0 bg-amber-100 px-3 py-1 font-black text-amber-700 hover:bg-amber-100">
                {data.providerReady ? "AI provider connected" : "Provider pending"}
              </Badge>
            </div>
            <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 lg:text-4xl">AI Creative Production Studio</h2>
            <p className="mt-2 max-w-3xl text-sm font-semibold leading-6 text-slate-600">
              PixelForge is now structured around projects, creative briefs, brand kits, multi-model generation, asset library, remix/version history, and export workflows.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:w-[520px]">
            <MetricCard label="Projects" value={data.projects.length} tone="text-violet-700" />
            <MetricCard label="Briefs" value={data.briefs.length} tone="text-cyan-700" />
            <MetricCard label="Brand Kits" value={data.brandKits.length} tone="text-rose-700" />
            <MetricCard label="Assets" value={data.assets.length} tone="text-emerald-700" />
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[1.8rem] bg-slate-950 p-5 text-white">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.25em] text-cyan-200">Projects</p>
                <h3 className="text-xl font-black">Production workspaces</h3>
              </div>
              <FolderKanban className="h-6 w-6 text-cyan-200" />
            </div>
            <div className="grid gap-3">
              {data.projects.length ? (
                data.projects.slice(0, 3).map((project) => (
                  <div key={project.id} className="rounded-[1.35rem] border border-white/10 bg-white/10 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <h4 className="font-black">{project.name}</h4>
                      <Badge className="rounded-full border-0 bg-white/15 text-white hover:bg-white/15">{project.status}</Badge>
                    </div>
                    <p className="mt-2 text-sm font-medium leading-6 text-slate-300">{project.description}</p>
                    <p className="mt-3 text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">{project.category}</p>
                  </div>
                ))
              ) : (
                <EmptyState label="No project records yet. Create a campaign, product, education, or research workspace after login." />
              )}
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-[1.8rem] border border-violet-100 bg-white/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-violet-700">
                <FileText className="h-5 w-5" />
                <h3 className="font-black text-slate-950">Creative Brief Intelligence</h3>
              </div>
              {data.briefs.length ? (
                data.briefs.slice(0, 2).map((brief) => (
                  <div key={brief.id} className="mb-3 rounded-[1.25rem] bg-violet-50 p-4 last:mb-0">
                    <p className="font-black text-slate-950">{brief.title}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{brief.objective}</p>
                    <p className="mt-2 text-xs font-black uppercase tracking-[0.18em] text-violet-500">{brief.channel} • {brief.status}</p>
                  </div>
                ))
              ) : (
                <EmptyState label="No creative briefs yet. Briefs will guide prompt, audience, channel, negative prompt, and model choices." />
              )}
            </div>

            <div className="rounded-[1.8rem] border border-cyan-100 bg-white/80 p-5">
              <div className="mb-3 flex items-center gap-2 text-cyan-700">
                <Palette className="h-5 w-5" />
                <h3 className="font-black text-slate-950">Brand Kits</h3>
              </div>
              {data.brandKits.length ? (
                data.brandKits.slice(0, 2).map((kit) => (
                  <div key={kit.id} className="mb-3 rounded-[1.25rem] bg-cyan-50 p-4 last:mb-0">
                    <p className="font-black text-slate-950">{kit.name}</p>
                    <p className="mt-1 text-sm font-semibold leading-6 text-slate-600">{kit.description}</p>
                    <p className="mt-2 text-xs font-bold text-cyan-700">{kit.voice || "Brand voice pending"}</p>
                  </div>
                ))
              ) : (
                <EmptyState label="No brand kits yet. Brand kits will control colors, voice, style rules, and visual consistency." />
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div className="rounded-[1.7rem] border border-emerald-100 bg-emerald-50 p-5">
            <Images className="mb-3 h-6 w-6 text-emerald-700" />
            <h3 className="font-black text-slate-950">Asset Library</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Generated outputs can become reusable project assets with tags, thumbnails, and project/brief links.</p>
          </div>
          <div className="rounded-[1.7rem] border border-amber-100 bg-amber-50 p-5">
            <GitBranch className="mb-3 h-6 w-6 text-amber-700" />
            <h3 className="font-black text-slate-950">Remix Version Tree</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">{data.versioning.description}</p>
          </div>
          <div className="rounded-[1.7rem] border border-rose-100 bg-rose-50 p-5">
            <PackageCheck className="mb-3 h-6 w-6 text-rose-700" />
            <h3 className="font-black text-slate-950">Export Workflows</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">Export jobs prepare campaign packs, prompt packs, social assets, and future client approval bundles.</p>
          </div>
        </div>

        <div className="mt-5 rounded-[1.7rem] border border-slate-200 bg-slate-50 p-5">
          <div className="mb-3 flex items-center gap-2">
            <BriefcaseBusiness className="h-5 w-5 text-slate-700" />
            <h3 className="font-black text-slate-950">Next build actions</h3>
          </div>
          <div className="grid gap-2 md:grid-cols-3">
            {data.nextActions.map((action) => (
              <div key={action} className="rounded-2xl bg-white px-4 py-3 text-sm font-bold leading-6 text-slate-600 shadow-sm">
                {action}
              </div>
            ))}
          </div>
        </div>
      </Card>
    </section>
  );
};

export default ProductionStudioPanel;
