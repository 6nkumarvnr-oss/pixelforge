import { ChevronRight, Search, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { Preset } from "@/lib/studio-data";

type PresetLibraryProps = {
  categories: string[];
  activeFilter: string;
  onFilterChange: (category: string) => void;
  search: string;
  onSearchChange: (search: string) => void;
  presets: Preset[];
  onApply: (preset: Preset) => void;
};

const PresetLibrary = ({
  categories,
  activeFilter,
  onFilterChange,
  search,
  onSearchChange,
  presets,
  onApply,
}: PresetLibraryProps) => (
  <aside
    id="preset-library"
    className="scroll-mt-5 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]"
  >
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
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder="Search styles..."
        className="h-12 rounded-2xl border-violet-100 bg-white pl-11 font-semibold shadow-sm"
      />
    </div>

    <div className="mb-4 flex flex-wrap gap-2">
      {categories.map((category) => (
        <Button
          key={category}
          variant="ghost"
          onClick={() => onFilterChange(category)}
          className={`h-9 rounded-full px-4 text-xs font-black ${
            activeFilter === category
              ? "bg-violet-600 text-white hover:bg-violet-700 hover:text-white"
              : "bg-white text-slate-600 hover:bg-violet-50 hover:text-violet-700"
          }`}
        >
          {category}
        </Button>
      ))}
    </div>

    <ScrollArea className="h-[520px] pr-3 lg:h-[calc(100vh-285px)]">
      <div className="space-y-3">
        {presets.map((preset) => {
          const Icon = preset.icon;
          return (
            <Card
              key={preset.id}
              className="group rounded-[1.6rem] border-white/80 bg-white/85 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl hover:shadow-violet-100"
            >
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
              <Button onClick={() => onApply(preset)} className="h-10 w-full rounded-2xl bg-slate-950 font-black text-white hover:bg-violet-700">
                Load preset <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </ScrollArea>
  </aside>
);

export default PresetLibrary;
