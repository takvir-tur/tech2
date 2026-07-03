import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronLeft, SlidersHorizontal, Check, X, Sparkles, AlertCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/$category/$brand")({
  component: BrandProductDirectory,
});

function BrandProductDirectory() {
  const { category, brand } = Route.useParams();

  // Core Search & Filter States
  const [budget, setBudget] = useState<number>(220000);
  const [minBattery, setMinBattery] = useState<number>(80);
  const [condition, setCondition] = useState<string>("any");
  const [aiRecommendationPrompt, setAiRecommendationPrompt] = useState<string>("");
  const [aiResponse, setAiResponse] = useState<string>("");

  // 1. Dynamic Extraction of Available Database Records
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (p.category.toLowerCase() !== category.toLowerCase()) return false;
      if (p.brand.toLowerCase() !== brand.toLowerCase()) return false;
      if (p.price > budget) return false;
      if (p.batteryHealth < minBattery) return false;
      if (condition !== "any" && p.condition !== condition) return false;
      return true;
    });
  }, [category, brand, budget, minBattery, condition]);

  // 2. Track Activated Filter Badges to display at the Top Canvas
  const activeBadges = useMemo(() => {
    const badges = [];
    if (budget < 220000) badges.push({ id: "budget", label: `Max ৳${budget.toLocaleString()}` });
    if (minBattery > 80) badges.push({ id: "battery", label: `🔋 Min ${minBattery}% Health` });
    if (condition !== "any") badges.push({ id: "condition", label: `Grade: ${condition}` });
    return badges;
  }, [budget, minBattery, condition]);

  const clearBadge = (id: string) => {
    if (id === "budget") setBudget(220000);
    if (id === "battery") setMinBattery(80);
    if (id === "condition") setCondition("any");
  };

  // 3. Simulated AI Market Recommender
  const handleAiConsultation = (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiRecommendationPrompt.trim()) return;

    const lower = aiRecommendationPrompt.toLowerCase();
    if (lower.includes("budget") || lower.includes("cheap")) {
      setAiResponse(`Based on live metrics for second-hand ${brand} ${category} hardware, prioritizing high deal scores over absolute flawless physical grading returns optimal yield under tight liquidity margins.`);
    } else if (lower.includes("battery") || lower.includes("life")) {
      setAiResponse(`Warning: Battery metrics scale non-linearly below 85% on lithium cells. We advise securing profiles holding clear warranty buffers above selecting higher native storage modules.`);
    } else {
      setAiResponse(`Analysis for ${brand} ${category} catalog locked: Cross-referencing platform listing durations indicates negotiating on entries hosted past 5+ days delivers high closing flexibility.`);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb back to brand selector */}
        <Link
          to="/$category"
          params={{ category }}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Back to {brand} Models
        </Link>

        {/* Catalog Dashboard Title Header */}
        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {brand} <span className="text-blue-600 capitalize">{category} Hub</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Live pipeline feeds containing real verified aggregates.
          </p>
        </div>

        {/* Dynamic Interactive Filter Pill Badges Row */}
        {activeBadges.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 bg-white border p-3 rounded-xl shadow-sm">
            <span className="text-xs font-black uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
              Active Filters:
            </span>
            {activeBadges.map((badge) => (
              <div
                key={badge.id}
                className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 border border-blue-200 pl-3 pr-1.5 py-1 text-xs font-extrabold text-blue-700 transition shadow-sm"
              >
                <span>{badge.label}</span>
                <button
                  onClick={() => clearBadge(badge.id)}
                  className="p-0.5 rounded-full hover:bg-blue-200/60 text-blue-500 hover:text-blue-800 transition"
                >
                  <X className="h-3.5 w-3.5 stroke-[3]" />
                </button>
              </div>
            ))}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setBudget(220000); setMinBattery(80); setCondition("any"); }}
              className="h-7 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg ml-auto"
            >
              Reset All
            </Button>
          </div>
        )}

        {/* Main Interface Layout Node Splitted Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT CONTENT BLOCK: Real-time matched items array */}
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 py-24 text-center text-slate-500 bg-white shadow-inner flex flex-col items-center justify-center p-6">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                <p className="font-black text-lg text-slate-800">No Target Profiles Extracted</p>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm">
                  Adjust target parameters on the dashboard controls sidebar to catch wider pool matrices.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            )}
          </div>

          {/* RIGHT SIDE PANEL: Sticky high-contrast filter control dashboard */}
          <aside className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-20 bg-slate-800 border-2 border-slate-900 rounded-2xl p-6 space-y-6 shadow-xl text-white">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-blue-400" />
              <h3 className="font-black tracking-wider uppercase text-xs text-slate-200">
                Pipeline Adjustments Panel
              </h3>
            </div>

            {/* Financial Param Slider Container */}
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-baseline">
                <Label className="text-xs font-black uppercase text-slate-400">Max Budget Ceiling</Label>
                <span className="text-xl font-black text-amber-400 font-mono">৳{budget.toLocaleString()}</span>
              </div>
              <Slider
                value={[budget]}
                onValueChange={(val) => setBudget(val[0])}
                min={30000}
                max={220000}
                step={5000}
                className="py-1"
              />
            </div>

            {/* Battery Health Slider Container */}
            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-baseline">
                <Label className="text-xs font-black uppercase text-slate-400">Minimum Battery Bounds</Label>
                <span className="text-base font-black text-emerald-400 font-mono">{minBattery}%+</span>
              </div>
              <Slider
                value={[minBattery]}
                onValueChange={(val) => setMinBattery(val[0])}
                min={75}
                max={100}
                step={1}
                className="py-1"
              />
            </div>

            {/* structural condition grading select dropdown */}
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Structural Wear Grading</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full h-11 bg-slate-900 border border-slate-700 font-bold text-white focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-700">
                  <SelectItem value="any">Accept Any Quality Level</SelectItem>
                  <SelectItem value="Mint">Mint (Like New Structural Core)</SelectItem>
                  <SelectItem value="Good">Good (Minor Micro-scuffs Present)</SelectItem>
                  <SelectItem value="Fair">Fair (Noticeable Micro-abrasions)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </aside>
        </div>

        {/* ==========================================================
            5. DOWNSIDE AI SEARCH RECOMMENDATIONS SYSTEM CONSOLE
            ========================================================== */}
        <section className="bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 text-white rounded-3xl p-6 md:p-8 border-2 border-blue-500/30 shadow-xl space-y-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30">
              <Sparkles className="h-5 w-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight flex items-center gap-2">
                AI Advisory Search Engine
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Ask queries regarding parameters or timing strategies for purchasing second-hand hardware configurations.
              </p>
            </div>
          </div>

          <form onSubmit={handleAiConsultation} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder={`e.g., "Is it safe to buy a ${brand} ${category} at 84% battery?" or "what budget is reasonable?"...`}
              value={aiRecommendationPrompt}
              onChange={(e) => setAiRecommendationPrompt(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 font-medium text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition shadow-inner"
            />
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-black px-6 h-12 rounded-xl transition shadow-lg shadow-blue-600/20 shrink-0">
              Consult Advisor
            </Button>
          </form>

          {aiResponse && (
            <div className="p-4 rounded-xl bg-blue-950/40 border border-blue-500/20 text-slate-200 text-sm leading-relaxed font-medium animate-fadeIn">
              <span className="font-mono text-xs text-blue-400 font-black block uppercase tracking-widest mb-1">
                Evaluation Response:
              </span>
              "{aiResponse}"
            </div>
          )}
        </section>

      </main>
    </div>
  );
}