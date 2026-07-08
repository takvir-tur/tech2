import { useMemo } from "react";
import { useMutation } from "@tanstack/react-query";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { analyzeAI, type AnalyzeParams } from "@/lib/api";
import type { LiveProduct } from "@/lib/products";
import { AIResults, type AIAnalysis } from "@/components/AIResults";
import { usePersistedState } from "@/lib/store";

const CATEGORY_OPTIONS = ["Phone", "Tablet", "Laptop"];

interface AIAdvisoryFormProps {
  /**
   * Unique key for this form instance's persisted state (e.g. "home-ai" or
   * `${category}-${brand}-ai`). All fields + the last AI result are kept
   * alive under this key, so navigating to a product detail page and back
   * doesn't reset the form or lose the results.
   */
  persistKey: string;
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
  persistKey,
  allProducts,
  fixedCategory,
  optionsPool,
  title = "AI Advisory Search Engine",
  subtitle = "Tell it the exact model you want — it compares real dealers and tells you whether to buy now or wait.",
  defaultBudget = 60_000,
  modelPlaceholder = 'e.g. "iPhone 14 Pro" or "Galaxy S23"',
  anchorId,
}: AIAdvisoryFormProps) {
  const [formState, setFormState] = usePersistedState(persistKey, {
    category: fixedCategory ?? "Phone",
    budget: defaultBudget,
    minBattery: 0,
    condition: "any",
    aiModel: "",
    aiRoms: [] as string[],
    aiUrgency: "flexible",
    aiResult: null as AIAnalysis | null,
  });
  const { category, budget, minBattery, condition, aiModel, aiRoms, aiUrgency, aiResult } = formState;

  const setCategory = (value: string) => setFormState((prev) => ({ ...prev, category: value }));
  const setBudget = (value: number) => setFormState((prev) => ({ ...prev, budget: value }));
  const setMinBattery = (value: number) => setFormState((prev) => ({ ...prev, minBattery: value }));
  const setCondition = (value: string) => setFormState((prev) => ({ ...prev, condition: value }));
  const setAiModel = (value: string) => setFormState((prev) => ({ ...prev, aiModel: value }));
  const setAiUrgency = (value: string) => setFormState((prev) => ({ ...prev, aiUrgency: value }));
  const setAiResult = (value: AIAnalysis | null) => setFormState((prev) => ({ ...prev, aiResult: value }));

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
    setFormState((prev) => ({
      ...prev,
      aiRoms: prev.aiRoms.includes(rom) ? prev.aiRoms.filter((r) => r !== rom) : [...prev.aiRoms, rom],
    }));
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
      className="bg-white text-slate-900 rounded-3xl p-6 md:p-8 border border-slate-200 shadow-xl shadow-slate-200/60 space-y-5 scroll-mt-24"
    >
      <div className="flex items-center gap-2.5">
        <div className="p-2 bg-blue-50 rounded-xl text-blue-600 border border-blue-100">
          <Sparkles className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-black tracking-tight text-slate-900">{title}</h2>
          <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {!fixedCategory && (
            <div className="space-y-1.5">
              <Label className="text-xs font-black uppercase text-slate-500">Category</Label>
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-full h-11 bg-white border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-white text-slate-900 border-slate-200">
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
            <Label className="text-xs font-black uppercase text-slate-500">Model</Label>
            <input
              type="text"
              placeholder={modelPlaceholder}
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-white border border-slate-200 font-medium text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-500 transition"
            />
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-500">Urgency</Label>
            <Select value={aiUrgency} onValueChange={setAiUrgency}>
              <SelectTrigger className="w-full h-11 bg-white border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
                <SelectItem value="flexible">Flexible — no rush</SelectItem>
                <SelectItem value="soon">Soon — within 2 weeks</SelectItem>
                <SelectItem value="urgent">Urgent — need it now</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-baseline">
              <Label className="text-xs font-black uppercase text-slate-500">Max Budget</Label>
              <span className="text-sm font-black text-blue-600 font-mono">৳{budget.toLocaleString()}</span>
            </div>
            <Slider value={[budget]} onValueChange={(val) => setBudget(val[0])} min={10_000} max={220_000} step={5_000} className="py-1.5" />
          </div>
        </div>

        {availableStorages.length > 0 && (
          <div className="space-y-1.5">
            <Label className="text-xs font-black uppercase text-slate-500">Storage (optional)</Label>
            <div className="flex flex-wrap gap-2">
              {availableStorages.map((rom) => (
                <button
                  type="button"
                  key={rom}
                  onClick={() => toggleRom(rom)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition ${
                    aiRoms.includes(rom)
                      ? "bg-blue-600 border-blue-600 text-white"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-400"
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
            <Label className="text-xs font-black uppercase text-slate-500">Condition (optional)</Label>
            <Select value={condition} onValueChange={setCondition}>
              <SelectTrigger className="w-full sm:w-64 h-11 bg-white border border-slate-200 font-bold text-slate-900 focus:ring-1 focus:ring-blue-500">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-white text-slate-900 border-slate-200">
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
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 text-sm">
          Couldn't reach the AI advisory endpoint. Make sure the backend is running and Ollama (or your configured
          model provider) is reachable.
        </div>
      )}

      {aiResult && <AIResults result={aiResult} model={aiModel} />}
    </section>
  );
}