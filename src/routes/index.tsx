import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Smartphone, Tablet, Laptop, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice } from "@/lib/products";
import { ProductLink } from "@/components/ProductLink";
import { AIAdvisoryForm } from "@/components/AIAdvisoryForm";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tech 2 — Premium second-hand tech, aggregated" },
      {
        name: "description",
        content:
          "Find verified second-hand iPhones, iPads, MacBooks and Samsung devices with AI-summarized condition reports.",
      },
    ],
  }),
  component: Home,
});

const SLIDE_INTERVAL_MS = 5000;

function Home() {
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

  // "Hot deals" = the priciest, verifiably-priced live listings — a stand-in
  // for a deal-score, since the real scraped data has no such field.
  const hotProducts = useMemo(() => {
    return [...products]
      .filter((p) => p.price != null)
      .sort((a, b) => (b.price ?? 0) - (a.price ?? 0))
      .slice(0, 5);
  }, [products]);

  const [hotIndex, setHotIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextHotDeal = () => setHotIndex((prev) => (prev + 1) % hotProducts.length);
  const prevHotDeal = () => setHotIndex((prev) => (prev - 1 + hotProducts.length) % hotProducts.length);

  // Auto-advance the carousel, pausing while the user is hovering over it.
  useEffect(() => {
    if (hotProducts.length <= 1 || isPaused) return;
    const timer = setInterval(() => {
      setHotIndex((prev) => (prev + 1) % hotProducts.length);
    }, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [hotProducts.length, isPaused]);

  // Clamp the index if the underlying list shrinks (e.g. after a refetch).
  useEffect(() => {
    if (hotIndex >= hotProducts.length && hotProducts.length > 0) {
      setHotIndex(0);
    }
  }, [hotProducts.length, hotIndex]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased selection:bg-rose-200">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-12">
        {isError && (
          <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
            Couldn't reach the live inventory API. Make sure the backend is running (
            <code className="font-mono">cd backend && uvicorn main:app --reload --port 8000</code>).
          </div>
        )}

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading live scraped listings…
          </div>
        )}

        {/* ==========================================================
            1. HOT DEALS — sliding, auto-advancing carousel
            ========================================================== */}
        {hotProducts.length > 0 && (
          <section
            className="relative overflow-hidden rounded-3xl border-2 border-amber-400 bg-gradient-to-br from-amber-400/20 via-white to-rose-400/10 p-6 md:p-8 shadow-xl shadow-amber-500/10"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-full bg-gradient-to-r from-red-500 via-orange-500 to-amber-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md">
                  <Flame className="h-4 w-4 fill-current animate-bounce" /> Premium Live Picks
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                {hotProducts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setHotIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all ${
                      i === hotIndex ? "w-6 bg-orange-500" : "w-1.5 bg-orange-200 hover:bg-orange-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden">
              <div
                className="flex transition-transform duration-700 ease-in-out"
                style={{ transform: `translateX(-${hotIndex * 100}%)` }}
              >
                {hotProducts.map((product) => (
                  <div key={product.id} className="w-full shrink-0">
                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                      <div className="md:col-span-4 relative aspect-square w-full max-w-[280px] mx-auto md:max-w-none rounded-2xl overflow-hidden border-2 border-orange-200 bg-slate-800 shadow-md group">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                        {product.condition && (
                          <div className="absolute top-3 right-3 bg-red-500 text-white font-extrabold text-[10px] uppercase px-2.5 py-1 rounded-full shadow-md">
                            {product.condition}
                          </div>
                        )}
                      </div>

                      <div className="md:col-span-8 space-y-4 flex flex-col justify-center">
                        <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-orange-100 pb-2">
                          <div>
                            <span className="text-[11px] font-black uppercase tracking-widest text-rose-500">
                              {product.brand} Highlight
                            </span>
                            <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">
                              {product.name}
                            </h2>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-black text-orange-600 font-mono tracking-tight">
                              {formatPrice(product.price)}
                            </p>
                            {product.storage && (
                              <span className="inline-block text-[11px] font-extrabold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                                {product.storage}
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap gap-4 text-xs font-bold text-slate-600 bg-slate-100 p-2.5 rounded-lg border border-slate-200">
                          <div>
                            🔋 Battery:{" "}
                            <span className="text-slate-900 font-black">
                              {product.battery != null ? `${product.battery}%` : "N/A"}
                            </span>
                          </div>
                          <div>
                            🛒 Source: <span className="text-blue-600 font-extrabold">{product.source}</span>
                          </div>
                          <div>
                            📦 Box:{" "}
                            <span className="text-slate-900 font-black">
                              {product.box === true ? "Included" : product.box === false ? "Not included" : "N/A"}
                            </span>
                          </div>
                        </div>

                        <ProductLink
                          product={product}
                          className="inline-flex items-center gap-2 self-start rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-black text-white shadow-md transition hover:bg-blue-700"
                        >
                          View Details <Info className="h-4 w-4" />
                        </ProductLink>
                      </div>
                    </div>
                  </div>
                ))}
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
            <p className="text-sm text-slate-500 font-medium">Select a category to explore live scraped listings.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Link
              to="/$category"
              params={{ category: "Phone" }}
              className="relative h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left transition-all p-6 flex items-end group shadow-sm hover:border-blue-400 hover:shadow-md"
            >
              <img
                src="https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=600&auto=format&fit=crop&q=60"
                alt="Phones"
                className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-blue-500 rounded-xl text-white shadow-sm">
                  <Smartphone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-lg font-black text-white">Smartphones</h4>
                  <p className="text-xs font-bold text-slate-300">iPhones, Galaxy, Pixel & more</p>
                </div>
              </div>
            </Link>

            <Link
              to="/$category"
              params={{ category: "Tablet" }}
              className="relative h-32 overflow-hidden rounded-2xl border border-slate-700 bg-slate-800 text-left transition-all p-6 flex items-end group shadow-sm hover:border-rose-400 hover:shadow-md"
            >
              <img
                src="https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=600&auto=format&fit=crop&q=60"
                alt="Tablets"
                className="absolute inset-0 h-full w-full object-cover opacity-25 group-hover:scale-105 transition-transform duration-500"
              />
              <div className="relative z-10 flex items-center gap-3">
                <div className="p-3 bg-rose-500 rounded-xl text-white shadow-sm">
                  <Tablet className="h-5 w-5" />
                </div>
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
            <img
              src="https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=1200&auto=format&fit=crop&q=60"
              alt="Laptops"
              className="absolute inset-0 h-full w-full object-cover opacity-20 group-hover:scale-105 transition-transform duration-500"
            />
            <div className="relative z-10 flex items-center gap-3">
              <div className="p-3 bg-amber-500 rounded-xl text-white shadow-sm">
                <Laptop className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-lg font-black text-white">Premium Laptops</h4>
                <p className="text-xs font-bold text-slate-300">Aggregated developer workstations & MacBooks</p>
              </div>
            </div>
          </Link>
        </section>

        {/* ==========================================================
            3. AI ADVISORY SEARCH — available right here too, no need
               to drill into a category/brand first.
            ========================================================== */}
        <section id="ai-advisory" className="space-y-3 scroll-mt-24">
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-blue-600">Or Skip Straight To The AI Advisor</h3>
            <p className="text-sm text-slate-500 font-medium">
              Don't want to browse manually? Tell the AI what you want and let it compare real listings for you.
            </p>
          </div>
          <AIAdvisoryForm
            persistKey="home-ai"
            allProducts={products}
            title="AI Advisory Search Engine"
            subtitle="Tell it the exact model you want — it compares real dealers and tells you whether to buy now or wait."
          />
        </section>
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs font-bold text-slate-500 tracking-wider uppercase font-mono mt-12">
        Tech 2 Core Engine Portal // Live Data Connected.
      </footer>
    </div>
  );
}