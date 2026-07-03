import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, Flame, Smartphone, Tablet, Laptop, ChevronLeft, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/products";

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

  const nextHotDeal = () => setHotIndex((prev) => (prev + 1) % hotProducts.length);
  const prevHotDeal = () => setHotIndex((prev) => (prev - 1 + hotProducts.length) % hotProducts.length);

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
                  <div
                    key={product.id}
                    className="w-full px-4 py-3 text-left bg-slate-800 border-b border-slate-700 last:border-0 text-white"
                  >
                    <div className="font-semibold">{product.name}</div>
                    <div className="text-xs text-slate-400">
                      ৳{product.price.toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        
        {/* ==========================================================
            1. HOT DEALS CAROUSEL SPOTLIGHT
            ========================================================== */}
        {activeHotProduct && (
          <section className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/20 via-white to-rose-400/10 p-6 md:p-8 shadow-xl shadow-amber-500/10 transition-all duration-300">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md">
                  <Flame className="h-4 w-4 fill-current animate-bounce" /> Lucrative Hot Deal Spotlight
                </span>
                <span className="text-xs text-slate-600 font-bold font-mono">({hotIndex + 1}/{hotProducts.length})</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
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

                <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/80 relative">
                  <span className="absolute -top-2.5 left-4 px-2 bg-slate-900 text-[9px] font-black tracking-widest text-blue-400 border border-blue-100 rounded-full uppercase">AI Market Evaluator</span>
                  <p className="text-sm font-semibold italic text-slate-800 leading-relaxed">"{activeHotProduct.aiSummary}"</p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                  <div>🔋 Battery Health: <span className="text-slate-900 font-black">{activeHotProduct.batteryHealth}%</span></div>
                  <div>🛒 Aggregated From: <span className="text-blue-600 font-extrabold">{activeHotProduct.source}</span></div>
                  <div>⏰ Time Listed: <span className="text-slate-900 font-black">{activeHotProduct.listedDaysAgo} days ago</span></div>
                </div>
              </div>
            </div>

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
            2. THE MAJOR CATEGORIES HUB (ROUTING TRIGGERS)
            ========================================================== */}
        <section className="space-y-4">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Step 1: Choose Core Pipeline</h3>
            <p className="text-sm text-slate-500 font-medium">Select a category to explore database-verified scraped items.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/$category"
              params={{ category: "Phone" }}
              className="relative h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left transition-all p-6 flex items-end group shadow-sm hover:border-blue-400 hover:shadow-md"
            >
              <img src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60" alt="Phones" className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm"><Smartphone className="h-5 w-5" /></div>
                <div>
                  <h4 className="text-lg font-black text-white">Smartphones</h4>
                  <p className="text-xs font-bold text-slate-300">Explore iPhones & premium Galaxy lines</p>
                </div>
              </div>
            </Link>

            <Link
              to="/$category"
              params={{ category: "Tablet" }}
              className="relative h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left transition-all p-6 flex items-end group shadow-sm hover:border-rose-400 hover:shadow-md"
            >
              <img src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60" alt="Tablets" className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500" />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-xl text-white shadow-sm"><Tablet className="h-5 w-5" /></div>
                <div>
                  <h4 className="text-lg font-black text-white">Tablets & iPads</h4>
                  <p className="text-xs font-bold text-slate-300">High performance productivity monitors</p>
                </div>
              </div>
            </Link>
          </div>

          <Link
            to="/$category"
            params={{ category: "Laptop" }}
            className="relative w-full h-28 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left transition-all p-6 flex items-end group shadow-sm hover:border-amber-400 hover:shadow-md block"
          >
            <img src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=60" alt="Laptops" className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500" />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-xl text-white shadow-sm"><Laptop className="h-5 w-5" /></div>
              <div>
                <h4 className="text-lg font-black text-white">Premium Laptops</h4>
                <p className="text-xs font-bold text-slate-300">Aggregated developer workstations & MacBooks</p>
              </div>
            </div>
          </Link>
        </section>

      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs font-bold text-slate-500 tracking-wider uppercase font-mono mt-12">
        Tech 2 Core Engine Portal // Phase 1 Complete.
      </footer>
    </div>
  );
}