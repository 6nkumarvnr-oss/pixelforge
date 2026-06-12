import { Heart, Image as ImageIcon, RefreshCcw, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import type { GeneratedImage } from "@/lib/studio-data";

type HistoryPanelProps = {
  history: GeneratedImage[];
  favoritesCount: number;
  modelsCount: number;
  onToggleFavorite: (id: string) => void;
  onRemix: (item: GeneratedImage) => void;
};

const HistoryPanel = ({ history, favoritesCount, modelsCount, onToggleFavorite, onRemix }: HistoryPanelProps) => (
  <aside
    id="history-panel"
    className="scroll-mt-5 rounded-[2rem] border border-white/70 bg-white/75 p-4 shadow-2xl shadow-violet-200/45 backdrop-blur-xl lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)]"
  >
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
        <p className="text-2xl font-black text-violet-700">{favoritesCount}</p>
        <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Favorites</p>
      </div>
      <div className="rounded-[1.4rem] bg-white p-4 text-center shadow-sm">
        <p className="text-2xl font-black text-cyan-700">{modelsCount}</p>
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
                    <Button
                      onClick={() => onToggleFavorite(item.id)}
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full text-rose-500 hover:bg-rose-50 hover:text-rose-600"
                    >
                      <Heart className={`h-4 w-4 ${item.favorite ? "fill-current" : ""}`} />
                    </Button>
                  </div>
                  <p className="line-clamp-2 text-sm font-bold leading-5 text-slate-800">{item.prompt}</p>
                  <p className="mt-1 text-xs font-semibold text-slate-400">
                    {item.model} • {item.aspect} • {item.resolution}
                  </p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <Button onClick={() => onRemix(item)} className="h-9 flex-1 rounded-2xl bg-slate-950 text-xs font-black text-white hover:bg-violet-700">
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
);

export default HistoryPanel;
