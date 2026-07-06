import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, SlidersHorizontal, X, AlertCircle, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { AIAdvisoryForm } from "@/components/AIAdvisoryForm";

export const Route = createFileRoute("/$category/$brand")({
  component: BrandProductDirectory,
});

function BrandProductDirectory() {
  const { category, brand } = Route.useParams();

  const {
    data: rawProducts,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["live-products"],
    queryFn: fetchLiveProducts,
    staleTime: 60_000,
  });

  const products = useMemo(() => (rawProducts ?? []).map((p, i) => enrichProduct(p, i)), [rawProducts]);

  const brandCategoryProducts = useMemo(
    () =>
      products.filter(
        (p) => p.category.toLowerCase() === category.toLowerCase() && p.brand.toLowerCase() === brand.toLowerCase()
      ),
    [products, category, brand]
  );

  // ── Sidebar filters (operate on real fields only) ─────────────────
  const [budget, setBudget] = useState<number>(220000);
  const [minBattery, setMinBattery] = useState<number>(0);
  const [condition, setCondition] = useState<string>("any");

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    brandCategoryProducts.forEach((p) => p.condition && set.add(p.condition));
    return Array.from(set).sort();
  }, [brandCategoryProducts]);

  const filteredProducts = useMemo(() => {
    return brandCategoryProducts.filter((p) => {
      if (p.price != null && p.price > budget) return false;
      if (minBattery > 0 && p.battery != null && p.battery < minBattery) return false;
      if (condition !== "any" && p.condition !== condition) return false;
      return true;
    });
  }, [brandCategoryProducts, budget, minBattery, condition]);

  const activeBadges = useMemo(() => {
    const badges: { id: string; label: string }[] = [];
    if (budget < 220000) badges.push({ id: "budget", label: `Max ৳${budget.toLocaleString()}` });
    if (minBattery > 0) badges.push({ id: "battery", label: `🔋 Min ${minBattery}% Health` });
    if (condition !== "any") badges.push({ id: "condition", label: `Grade: ${condition}` });
    return badges;
  }, [budget, minBattery, condition]);

  const clearBadge = (id: string) => {
    if (id === "budget") setBudget(220000);
    if (id === "battery") setMinBattery(0);
    if (id === "condition") setCondition("any");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/$category"
          params={{ category }}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Back to {brand} Models
        </Link>

        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            {brand} <span className="text-blue-600 capitalize">{category} Hub</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Live pipeline feeds containing real verified aggregates.</p>
        </div>

        {/* Compact, eye-catching nudge toward the AI Advisor further down this
            same page — deliberately small, not a modal/popup. */}
        <a
          href="#ai-advisory"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 px-4 py-2.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Not sure which one to pick? Let the AI Advisor compare deals for you.
          </span>
          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-blue-600 transition-transform group-hover:translate-x-0.5">
            Try it <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </a>

        {isError && (
          <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
            Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
          </div>
        )}

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
              onClick={() => {
                setBudget(220000);
                setMinBattery(0);
                setCondition("any");
              }}
              className="h-7 text-xs font-bold text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg ml-auto"
            >
              Reset All
            </Button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 order-2 lg:order-1 space-y-6">
            {isLoading ? (
              <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
                <Loader2 className="h-5 w-5 animate-spin" /> Loading live listings…
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border-2 border-dashed border-slate-300 py-24 text-center text-slate-500 bg-white shadow-inner flex flex-col items-center justify-center p-6">
                <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
                <p className="font-black text-lg text-slate-800">No Matching Listings</p>
                <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm">
                  Adjust the filters on the sidebar to widen your search.
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

          <aside className="lg:col-span-4 order-1 lg:order-2 lg:sticky lg:top-20 bg-slate-800 border-2 border-slate-900 rounded-2xl p-6 space-y-6 shadow-xl text-white">
            <div className="flex items-center gap-2 border-b border-slate-700 pb-3">
              <SlidersHorizontal className="h-4 w-4 text-blue-400" />
              <h3 className="font-black tracking-wider uppercase text-xs text-slate-200">Pipeline Adjustments Panel</h3>
            </div>

            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-baseline">
                <Label className="text-xs font-black uppercase text-slate-400">Max Budget Ceiling</Label>
                <span className="text-xl font-black text-amber-400 font-mono">৳{budget.toLocaleString()}</span>
              </div>
              <Slider value={[budget]} onValueChange={(val) => setBudget(val[0])} min={10000} max={220000} step={5000} className="py-1" />
            </div>

            <div className="space-y-3 bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <div className="flex justify-between items-baseline">
                <Label className="text-xs font-black uppercase text-slate-400">Minimum Battery Bounds</Label>
                <span className="text-base font-black text-emerald-400 font-mono">{minBattery > 0 ? `${minBattery}%+` : "Any"}</span>
              </div>
              <Slider value={[minBattery]} onValueChange={(val) => setMinBattery(val[0])} min={0} max={100} step={5} className="py-1" />
              <p className="text-[10px] text-slate-500">Listings with unknown battery health are always kept.</p>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-black uppercase text-slate-400">Structural Wear Grading</Label>
              <Select value={condition} onValueChange={setCondition}>
                <SelectTrigger className="w-full h-11 bg-slate-900 border border-slate-700 font-bold text-white focus:ring-1 focus:ring-blue-500">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-900 text-white border-slate-700">
                  <SelectItem value="any">Accept Any Quality Level</SelectItem>
                  {availableConditions.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </aside>
        </div>

        {/* AI Advisory stays right here on the brand page too — not removed,
            just also now available up on the homepage. */}
        <AIAdvisoryForm
          allProducts={products}
          fixedCategory={category}
          optionsPool={brandCategoryProducts}
          defaultBudget={budget}
          anchorId="ai-advisory"
          modelPlaceholder={`e.g. "${brand} ${category === "Phone" ? "Galaxy S23" : category}"`}
        />
      </main>
    </div>
  );
}