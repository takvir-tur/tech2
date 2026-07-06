import { useMemo, useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeAI, type AnalyzeParams } from "@/lib/api";
import type { LiveProduct } from "@/lib/products";
import { AIResults, type AIAnalysis } from "@/components/AIResults";

const CATEGORY_OPTIONS = ["Phone", "Tablet", "Laptop"];

interface AIAdvisoryFormProps {
  /** Full live product list — used to derive category-wide storage/condition options when no optionsPool is given. */
  allProducts: LiveProduct[];
  /** Pass this on a brand page to lock the category and hide the selector. */
  fixedCategory?: string;
  /** A narrower pool (e.g. one brand within a category) used just to derive the storage/condition chips. */
  optionsPool?: LiveProduct[];
  title?: string;
  subtitle?: string;
  defaultBudget?: number;
  modelPlaceholder?: string;
  /** Anchor id so a banner elsewhere on the page can link straight to this section. */
  anchorId?: string;
}

export function AIAdvisoryForm({
  allProducts,
  fixedCategory,
  optionsPool,
  title = "AI Advisory Search Engine",
  subtitle = "Tell it the exact model you want — it compares real dealers and tells you whether to buy now or wait.",
  defaultBudget = 60_000,
  modelPlaceholder = 'e.g. "iPhone 14 Pro" or "Galaxy S23"',
  anchorId,
}: AIAdvisoryFormProps) {
  const [category, setCategory] = useState(fixedCategory ?? "Phone");
  const [budget, setBudget] = useState(defaultBudget);
  const [minBattery, setMinBattery] = useState(0);
  const [condition, setCondition] = useState("any");
  const [aiModel, setAiModel] = useState("");
  const [aiRoms, setAiRoms] = useState<string[]>([]);
  const [aiUrgency, setAiUrgency] = useState("flexible");
  const [aiResult, setAiResult] = useState<AIAnalysis | null>(null);

  const pool = useMemo(() => {
    if (optionsPool) return optionsPool;
    return allProducts.filter((p) => p.category.toLowerCase() === category.toLowerCase());
  }, [optionsPool, allProducts, category]);

  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    pool.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort();
  }, [pool]);

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    pool.forEach((p) => p.condition && set.add(p.condition));
    return Array.from(set).sort();
  }, [pool]);

  const toggleRom = (rom: string) => {
    setAiRoms((prev) => (prev.includes(rom) ? prev.filter((r) => r !== rom) : [...prev, rom]));
  };

  const aiMutation = useMutation({
    mutationFn: (params: AnalyzeParams) => analyzeAI(params),
    onSuccess: (data) => setAiResult(data),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiModel.trim()) return;
    aiMutation.mutate({
      category,
      model: aiModel.trim(),
      roms: aiRoms,
      budget,
      min_battery: minBattery,
      condition,
      urgency: aiUrgency,
    });
  };

  return (
    <section
      id={anchorId}
      className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 border-2 border-blue-500/30 shadow-xl space-y-5 scroll-mt-24"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight">{title}</h2>
          <p className="text-xs text-slate-400 font-medium">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!fixedCategory && (
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-400">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full h-11 bg-slate-950 border border-slate-700 font-bold text-white focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-700">
                  {CATEGORY_OPTIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400">Model</Label>
            <input
              type="text"
              placeholder={modelPlaceholder}
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-medium text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400">Urgency</Label>
            <Select value={aiUrgency} onValueChange={setAiUrgency}>
              <SelectTrigger className="w-full h-11 bg-slate-950 border border-slate-700 font-bold text-white focus:ring-1 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-slate-700">
                <SelectItem value="flexible">Flexible — no rush</SelectItem>
                <SelectItem value="soon">Soon — within 2 weeks</SelectItem>
                <SelectItem value="urgent">Urgent — need it now</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <Label className="text-xs font-black uppercase text-slate-400">Max Budget</Label>
              <span className="text-sm font-black text-amber-400 font-mono">৳{budget.toLocaleString()}</span>
            </div>
            <Slider value={[budget]} onValueChange={(val) => setBudget(val[0])} min={10_000} max={220_000} step={5_000} className="py-1.5" />
          </div>
        </div>

        {availableStorages.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400">Storage (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableStorages.map((rom) => (
                <button
                  type="button"
                  key={rom}
                  onClick={() => toggleRom(rom)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                    aiRoms.includes(rom)
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-slate-950 border-slate-700 text-slate-300 hover:border-blue-500"
                  }`}
                >
                  {rom}
                </button>
              ))}
            </div>
          </div>
        )}

        {availableConditions.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-400">Condition (optional)</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full sm:w-64 h-11 bg-slate-950 border border-slate-700 font-bold text-white focus:ring-1 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900 text-white border-slate-700">
                <SelectItem value="any">Accept any quality level</SelectItem>
                {availableConditions.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <Button
          type="submit"
          disabled={aiMutation.isPending || !aiModel.trim()}
          className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 h-12 rounded-xl transition shadow-lg shadow-blue-600/20 w-full sm:w-auto"
        >
          {aiMutation.isPending ? (
            <span className="flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
            </span>
          ) : (
            "Consult Advisor"
          )}
        </Button>
      </form>

      {aiMutation.isError && (
        <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-200 text-sm">
          Couldn't reach the AI advisory endpoint. Make sure the backend is running and Ollama (or your configured
          model provider) is reachable.
        </div>
      )}

      {aiResult && <AIResults result={aiResult} model={aiModel} />}
    </section>
  );
}