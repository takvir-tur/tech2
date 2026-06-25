import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Flame, Smartphone, Tablet, Laptop, ChevronLeft, ChevronRight, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tech 2 — Premium second-hand tech, aggregated" },
      { name: "description", content: "Find verified second-hand iPhones, iPads, MacBooks and Samsung devices with AI-summarized condition reports." },
    ],
  }),
  component: Home,
});

function Home() {
  const [query, setQuery] = useState("");

  // Hot Deals Carousel Configuration
  const hotProducts = useMemo(() => products.filter((p) => p.hot), []);
  const [hotIndex, setHotIndex] = useState(0);

  // Expanded Workflow Filter States
  const [selectedCategory, setSelectedCategory] = useState<"Phone" | "Tablet" | "Laptop" | null>(null);
  const [selectedModelBase, setSelectedModelBase] = useState<string | null>(null);
  const [selectedROMs, setSelectedROMs] = useState<string[]>([]);
  const [budget, setBudget] = useState<number>(200000);
  const [minBattery, setMinBattery] = useState<number>(80);
  const [condition, setCondition] = useState<string>("any");

  const nextHotDeal = () => setHotIndex((prev) => (prev + 1) % hotProducts.length);
  const prevHotDeal = () => setHotIndex((prev) => (prev - 1 + hotProducts.length) % hotProducts.length);

  const modelFamilies = useMemo(() => {
    if (!selectedCategory) return [];
    const filteredByCategory = products.filter((p) => p.category === selectedCategory);
    const families = filteredByCategory.map((p) => {
      if (p.name.includes("iPhone 14 Pro")) return "iPhone 14 Pro";
      if (p.name.includes("iPhone 13")) return "iPhone 13";
      if (p.name.includes("Galaxy S23 Ultra")) return "Galaxy S23 Ultra";
      if (p.name.includes("Galaxy S23")) return "Galaxy S23 Base";
      if (p.name.includes("MacBook Air M2")) return "MacBook Air M2";
      if (p.name.includes("MacBook Pro 14")) return "MacBook Pro 14 M3";
      if (p.name.includes("iPad Pro")) return "iPad Pro 11";
      if (p.name.includes("Galaxy Z Fold")) return "Galaxy Z Fold 5";
      if (p.name.includes("Galaxy Tab S9+")) return "Galaxy Tab S9+";
      return p.name;
    });
    return Array.from(new Set(families));
  }, [selectedCategory]);

  const toggleROM = (rom: string) => {
    setSelectedROMs((prev) =>
      prev.includes(rom) ? prev.filter((item) => item !== rom) : [...prev, rom]
    );
  };

  const finalFilteredProducts = useMemo(() => {
    return products.filter((product) => {
      if (selectedCategory && product.category !== selectedCategory) return false;
      if (selectedModelBase) {
        const cleanBase = selectedModelBase.replace(" Base", "");
        if (!product.name.toLowerCase().includes(cleanBase.toLowerCase())) return false;
      }
      if (selectedROMs.length > 0) {
        const matchesROM = selectedROMs.some((rom) => product.name.includes(rom));
        if (!matchesROM) return false;
      }
      if (product.price > budget) return false;
      if (product.batteryHealth < minBattery) return false;
      if (condition !== "any" && product.condition !== condition) return false;
      if (query && !product.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [selectedCategory, selectedModelBase, selectedROMs, budget, minBattery, condition, query]);


  const searchSuggestions = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(query.toLowerCase()) ||
          p.brand.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 5);
  }, [query]);

  const activeHotProduct = hotProducts[hotIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased selection:bg-rose-200">
      
      {/* High Visibility Header */}
      <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-slate-900/85 backdrop-blur shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <span className="bg-gradient-to-r from-blue-600 via-rose-500 to-amber-500 bg-clip-text text-2xl font-black uppercase tracking-wider text-transparent">
            Tech 2
          </span>
          <div className="relative w-full max-w-md mx-4">
            <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              type="search"
              placeholder="Search aggregated live tech deals..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10 rounded-full bg-slate-100/80 border-slate-700/60 focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-slate-900"
            />
            {query && searchSuggestions.length > 0 && (
              <div className="absolute top-full mt-2 w-full bg-slate-800 border rounded-xl shadow-lg z-50 overflow-hidden">
                {searchSuggestions.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => setQuery(product.name)}
                    className="w-full px-4 py-3 text-left hover:bg-slate-700 transition text-white"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-slate-400">
                      ৳{product.price.toLocaleString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
        
        {/* ==========================================================
            1. HOT DEALS SECTION - FIXED LIGHT CANVAS CONTRAST
            ========================================================== */}
        {activeHotProduct && (
          <section className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/20 via-white to-rose-400/10 p-6 md:p-8 shadow-xl shadow-amber-500/10 transition-all duration-300">
            
            {/* Vivid Title Accent Badge */}
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md">
                  <Flame className="h-4 w-4 fill-current animate-bounce" /> Lucrative Hot Deal Spotlight
                </span>
                <span className="text-xs text-slate-600 font-bold font-mono">({hotIndex + 1}/{hotProducts.length})</span>
              </div>
            </div>

            {/* Content Hub Split */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              
              {/* Proportional Image Box */}
              <div className="md:col-span-4 relative aspect-square w-full max-w-[280px] mx-auto md:max-w-none rounded-2xl overflow-hidden border-2 border-orange-200 bg-slate-800 shadow-md group">
                <img
                  src={activeHotProduct.image}
                  alt={activeHotProduct.name}
                  className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="absolute top-3 right-3 bg-red-500 text-white font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md">
                  {activeHotProduct.condition} Grade
                </div>
              </div>

              {/* Comprehensive Summary Specs */}
              <div className="md:col-span-8 space-y-4 flex flex-col justify-center">
                <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-orange-100 pb-2">
                  <div>
                    <span className="text-[11px] font-black uppercase tracking-widest text-rose-500">{activeHotProduct.brand} Highlight</span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">{activeHotProduct.name}</h2>
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-black text-orange-600 font-mono tracking-tight">৳{activeHotProduct.price.toLocaleString()}</p>
                    <span className="inline-block text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      Deal Quality: {activeHotProduct.dealScore}/100
                    </span>
                  </div>
                </div>

                {/* Aesthetic AI snippet background card with strong contrast text */}
                <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/80 relative">
                  <span className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[9px] font-black tracking-widest text-blue-400 border border-blue-100 rounded-full uppercase">AI Market Evaluator</span>
                  <p className="text-sm font-semibold italic text-slate-800 leading-relaxed">"{activeHotProduct.aiSummary}"</p>
                </div>

                {/* Metadata badges configured cleanly for light backdrop */}
                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <div>🔋 Battery Health: <span className="text-slate-900 font-black">{activeHotProduct.batteryHealth}%</span></div>
                  <div>🛒 Aggregated From: <span className="text-blue-600 font-extrabold">{activeHotProduct.source}</span></div>
                  <div>⏰ Time Listed: <span className="text-slate-900 font-black">{activeHotProduct.listedDaysAgo} days ago</span></div>
                </div>
              </div>
            </div>

            {/* Slide Command Buttons updated for visual hierarchy over white background */}
            <div className="absolute right-4 bottom-4 flex gap-1.5">
              <Button variant="outline" size="icon" onClick={prevHotDeal} className="h-8 w-8 rounded-full border-slate-300 bg-white shadow-sm hover:bg-slate-100 text-slate-700">
                <ChevronLeft className="h-4 w-4 stroke-[3]" />
              </Button>
              <Button variant="outline" size="icon" onClick={nextHotDeal} className="h-8 w-8 rounded-full border-slate-300 bg-white shadow-sm hover:bg-slate-100 text-slate-700">
                <ChevronRight className="h-4 w-4 stroke-[3]" />
              </Button>
            </div>
          </section>
        )}

        {/* ==========================================================
            2. THE THREE MAJOR CATEGORIES ROW PANELS
            ========================================================== */}
        <section className="space-y-3">
          <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Step 1: Choose Pipeline Core</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <button
              onClick={() => { setSelectedCategory("Phone"); setSelectedModelBase(null); setSelectedROMs([]); }}
              className={`relative h-28 overflow-hidden rounded-2xl border text-left transition-all p-5 flex items-end group ${selectedCategory === "Phone" ? "border-blue-500 ring-4 ring-blue-500/10 bg-blue-50/50 shadow-md" : "bg-slate-800 border-slate-700 shadow-sm hover:border-blue-400"}`}
            >
              <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60" alt="Phones" className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm"><Smartphone className="h-5 w-5" /></div>
                <div><h4 className="text-lg font-black text-white">Smartphones</h4><p className="text-xs font-bold text-slate-300">iPhones & premium Galaxy series</p></div>
              </div>
            </button>

            <button
              onClick={() => { setSelectedCategory("Tablet"); setSelectedModelBase(null); setSelectedROMs([]); }}
              className={`relative h-28 overflow-hidden rounded-2xl border text-left transition-all p-5 flex items-end group ${selectedCategory === "Tablet" ? "border-rose-500 ring-4 ring-rose-500/10 bg-rose-50/50 shadow-md" : "bg-slate-800 border-slate-700 shadow-sm hover:border-rose-400"}`}
            >
              <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60" alt="Tablets" className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-xl text-white shadow-sm"><Tablet className="h-5 w-5" /></div>
                <div><h4 className="text-lg font-black text-white">Tablets & iPads</h4><p className="text-xs font-bold text-slate-300">High refresh productivity slates</p></div>
              </div>
            </button>
          </div>

          <button
            onClick={() => { setSelectedCategory("Laptop"); setSelectedModelBase(null); setSelectedROMs([]); }}
            className={`relative w-full h-24 overflow-hidden rounded-2xl border text-left transition-all p-5 flex items-end group ${selectedCategory === "Laptop" ? "border-amber-500 ring-4 ring-amber-500/10 bg-amber-50/50 shadow-md" : "bg-slate-800 border-slate-700 shadow-sm hover:border-amber-400"}`}
          >
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=60" alt="Laptops" className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-xl text-white shadow-sm"><Laptop className="h-5 w-5" /></div>
              <div><h4 className="text-lg font-black text-white">Premium Laptops</h4><p className="text-xs font-bold text-slate-300">MacBook configurations & developer workstations</p></div>
            </div>
          </button>
        </section>

        {/* ==========================================================
            3. MASSIVE MULTI-SELECT WORKSPACE PANEL - DARK COMPLIANT
            ========================================================== */}
        {selectedCategory && (
          <section className="bg-slate-800 border-2 border-blue-900 rounded-3xl p-8 md:p-10 space-y-10 shadow-xl">
            
            {/* Step A: Model Family Selector Box */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="flex h-7 w-7 items-center justify-center rounded-full bg-blue-600 text-sm font-black text-white">2</span>
                <Label className="text-base uppercase tracking-wider text-white font-black">Specify Model Generation</Label>
              </div>
              <div className="flex flex-wrap gap-3">
                {modelFamilies.map((family) => (
                  <Button
                    key={family}
                    variant={selectedModelBase === family ? "default" : "outline"}
                    onClick={() => { setSelectedModelBase(family); setSelectedROMs([]); }}
                    className={`h-14 px-8 rounded-xl font-black text-base transition-all ${
                      selectedModelBase === family 
                        ? "bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/30 ring-2 ring-blue-400" 
                        : "border-slate-700 text-slate-200 hover:border-blue-500 bg-slate-900/60 hover:bg-slate-700/50"
                    }`}
                  >
                    {family}
                  </Button>
                ))}
              </div>
            </div>

            {/* Step B: Variant Modifiers & Sliders */}
            {selectedModelBase && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 pt-8 border-t-2 border-slate-700">
                
                {/* Capacity Selection Hub */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-slate-300 font-black">Storage ROM Options (Multi-Select)</Label>
                  <div className="grid grid-cols-2 gap-3.5">
                    {["128GB", "256GB", "512GB", "1TB", "2TB"].map((rom) => {
                      const active = selectedROMs.includes(rom);
                      return (
                        <button
                          key={rom}
                          onClick={() => toggleROM(rom)}
                          className={`h-16 px-4 flex items-center justify-between rounded-xl border-2 text-base font-black transition-all ${
                            active 
                              ? "border-blue-500 bg-blue-950 text-blue-200 shadow-inner" 
                              : "bg-slate-900/40 border-slate-700 hover:border-slate-500 text-slate-300"
                          }`}
                        >
                          <span>{rom}</span>
                          <div className={`h-5 w-5 rounded-md border-2 flex items-center justify-center ${active ? "bg-blue-600 border-blue-600" : "border-slate-600 bg-slate-900"}`}>
                            {active && <Check className="h-3 w-3 text-white stroke-[4]" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Wear & Longevity Benchmarks */}
                <div className="space-y-6">
                  <Label className="text-xs uppercase tracking-widest text-slate-300 font-black">Wear & Longevity Benchmarks</Label>
                  
                  <div className="space-y-3 bg-emerald-950/40 p-5 rounded-xl border-2 border-emerald-800/60">
                    <div className="flex justify-between text-xs font-black">
                      <span className="text-emerald-400">Minimum Battery Health Bounds</span>
                      <span className="text-emerald-300 font-mono text-base">{minBattery}% or higher</span>
                    </div>
                    <Slider
                      value={[minBattery]}
                      onValueChange={(val) => setMinBattery(val[0])}
                      min={70}
                      max={100}
                      step={1}
                      className="py-1"
                    />
                  </div>

                  <div className="space-y-2">
                    <span className="text-xs text-slate-300 font-black">Structural Grading Filter</span>
                    <Select value={condition} onValueChange={setCondition}>
                      <SelectTrigger className="w-full h-14 bg-slate-900 border-2 border-slate-700 font-bold text-white"><SelectValue /></SelectTrigger>
                      <SelectContent className="bg-slate-800 text-white border-slate-700">
                        <SelectItem value="any">Accept Any Structural State</SelectItem>
                        <SelectItem value="Mint">Mint (Like New Only)</SelectItem>
                        <SelectItem value="Good">Good (Minor Micro Scratches)</SelectItem>
                        <SelectItem value="Fair">Fair (Noticeable Scuffs/Chips)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Financial Limit Parameters Slider Card */}
                <div className="space-y-4">
                  <Label className="text-xs uppercase tracking-widest text-slate-300 font-black">Financial Limit Parameters</Label>
                  <div className="bg-amber-950/40 border-2 border-amber-800/60 rounded-2xl p-6 space-y-4">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs text-amber-400 font-black">Max Budget Ceiling</span>
                      <span className="text-3xl font-black text-amber-300 font-mono">৳{budget.toLocaleString()}</span>
                    </div>
                    <Slider
                      value={[budget]}
                      onValueChange={(val) => setBudget(val[0])}
                      min={30000}
                      max={250000}
                      step={2500}
                      className="py-2"
                    />
                  </div>
                </div>

              </div>
            )}
          </section>
        )}

        {/* ==========================================================
            4. DYNAMIC LISTINGS MATCH MATRIX
            ========================================================== */}
        <section className="space-y-6">
          <div className="flex items-center justify-between border-b-2 border-slate-300 pb-3">
            <h3 className="text-lg font-black tracking-tight text-slate-800">
              {selectedModelBase ? `Matched ${selectedModelBase} Pipelines` : "All Tracked Pipeline Index"} 
              <span className="ml-2 rounded-full bg-blue-100 text-blue-800 px-3 py-0.5 text-xs font-black">
                {finalFilteredProducts.length} Items Available
              </span>
            </h3>
          </div>

          {finalFilteredProducts.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 py-20 text-center text-base font-medium text-slate-500 bg-white shadow-inner">
              No aggregated scraper records match this combination. Try extending storage markers or adjustments.
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {finalFilteredProducts.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>

      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs font-bold text-slate-500 tracking-wider uppercase font-mono">
        Tech 2 Core Engine Portal // Bright Execution Standard Active.
      </footer>
    </div>
  );
}