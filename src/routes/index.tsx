import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Flame, Smartphone, Tablet, Laptop, ChevronLeft, ChevronRight, Info, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice, getProductImage, type LiveProduct } from "@/lib/products";
import { ProductLink } from "@/components/ProductLink";

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

const CURATED_HOT_DEALS: LiveProduct[] = [
  {
    name: "iPhone Air 256GB Cloud White e-Sim (Used)",
    price: 85000,
    battery: 100,
    condition: "Used",
    warranty: null,
    box: true,
    storage: "256GB",
    source: "Apple Gadgets",
    link: "https://www.applegadgetsbd.com/contact-us",
    category: "phone",
    id: "hot-iphone-air",
    brand: "Apple",
    image: getProductImage("iPhone Air 256GB Cloud White"),
  },
  {
    name: "Samsung S24 Ultra 5G 12/512GB Titanium Black Dual Sim SD (Used)",
    price: 80000,
    battery: null,
    condition: "Used",
    warranty: null,
    box: true,
    storage: "12/512GB",
    source: "Apple Gadgets",
    link: "https://www.applegadgetsbd.com/contact-us",
    category: "phone",
    id: "hot-samsung-s24-ultra",
    brand: "Samsung",
    image: getProductImage("Samsung S24 Ultra 5G"),
  },
  {
    name: "Apple MacBook Air 13.6'' M3 (8-CPU 8-GPU 8GB/256GB) Space Gray",
    price: 114000,
    battery: 100,
    condition: "Like New",
    warranty: "Official Apple Warranty",
    box: true,
    storage: "256GB",
    source: "tech2",
    link: "",
    category: "laptop",
    id: "hot-macbook-air-m3",
    brand: "Apple",
    image: getProductImage("MacBook Air 13.6"),
  },
  {
    name: "iPad 11th Gen 11'' 128GB WiFi Silver (Used)",
    price: 39000,
    battery: 100,
    condition: "Used",
    warranty: null,
    box: true,
    storage: "128GB",
    source: "Apple Gadgets",
    link: "https://www.applegadgetsbd.com/contact-us",
    category: "tablet",
    id: "hot-ipad-11th-gen",
    brand: "Apple",
    image: getProductImage("iPad 11th Gen"),
  },
  {
    name: "Samsung TAB S10 Lite 5G 6/128GB Gray (Used) - SM-X400",
    price: 33000,
    battery: null,
    condition: "Used",
    warranty: null,
    box: true,
    storage: "128GB",
    source: "Apple Gadgets",
    link: "https://www.applegadgetsbd.com/contact-us",
    category: "tablet",
    id: "hot-samsung-tab-s10-lite",
    brand: "Samsung",
    image: getProductImage("Samsung Galaxy Tab S9 FE"),
  },
];

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

  const hotProducts = CURATED_HOT_DEALS;
  const n = hotProducts.length;

  const extendedSlides = useMemo(
    () => [hotProducts[n - 1], ...hotProducts, hotProducts[0]],
    [hotProducts, n],
  );

  const [innerIdx, setInnerIdx] = useState(1);
  const [animating, setAnimating] = useState(true);
  const [isPaused, setIsPaused] = useState(false);

  const dotIndex = ((innerIdx - 1) % n + n) % n;

  const nextHotDeal = useCallback(() => {
    setAnimating(true);
    setInnerIdx((prev) => prev + 1);
  }, []);

  const prevHotDeal = useCallback(() => {
    setAnimating(true);
    setInnerIdx((prev) => prev - 1);
  }, []);

  const goToDot = useCallback((i: number) => {
    setAnimating(true);
    setInnerIdx(i + 1);
  }, []);

  const handleTransitionEnd = useCallback(() => {
    if (innerIdx === 0) {
      setAnimating(false);
      setInnerIdx(n);
    } else if (innerIdx === n + 1) {
      setAnimating(false);
      setInnerIdx(1);
    }
  }, [innerIdx, n]);

  const rafRef = useRef<number | null>(null);
  useEffect(() => {
    if (!animating) {
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = requestAnimationFrame(() => setAnimating(true));
      });
    }
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
    };
  }, [animating]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        setAnimating(false);
        setInnerIdx(1);
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, []);

  useEffect(() => {
    if (innerIdx < 0 || innerIdx > n + 1) {
      setAnimating(false);
      setInnerIdx(1);
    }
  }, [innerIdx, n]);

  useEffect(() => {
    if (n <= 1 || isPaused) return;
    const timer = setInterval(nextHotDeal, SLIDE_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [n, isPaused, nextHotDeal]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased selection:bg-rose-200">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-10">
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

        {/* ============================================================
            1. HOT DEALS — unchanged carousel
            ============================================================ */}
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
                    onClick={() => goToDot(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      i === dotIndex ? "w-6 bg-orange-500" : "w-1.5 bg-orange-200 hover:bg-orange-300"
                    }`}
                  />
                ))}
              </div>
            </div>

            <div className="overflow-hidden">
              <div
                className={`flex ${animating ? "transition-transform duration-700 ease-in-out" : ""}`}
                style={{ transform: `translateX(-${innerIdx * 100}%)` }}
                onTransitionEnd={handleTransitionEnd}
              >
                {extendedSlides.map((product, i) => (
                  <div key={`${product.id}-${i}`} className="w-full shrink-0">
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

        {/* ============================================================
            2. AI ADVISOR TITLE CARD  — Apple-style: text above, photo below
            ============================================================ */}
        <section className="space-y-4">
          {/* ── Headline text — on plain page background, left-aligned ── */}
          <div className="space-y-0.5 pl-1">
            <p style={{ fontSize: "52px", fontWeight: 900, color: "#111827", letterSpacing: "-0.03em", lineHeight: 1.15 }}>
              CAN'T DECIDE !
            </p>
            <p style={{ fontSize: "13px", fontWeight: 800, lineHeight: 1.4 }}>
              <span style={{ marginRight: "32px" }}>
                <span style={{ color: "#f41212" }}>WHAT</span>
                <span style={{ color: "#31343b" }}> TO BUY !</span>
              </span>
            
              <span style={{ marginRight: "32px" }}>
                <span style={{ color: "#f41212" }}>WHEN</span>
                <span style={{ color: "#31343b" }}> TO BUY !</span>
              </span>

              <span>
                <span style={{ color: "#f41212" }}>WHERE</span>
                <span style={{ color: "#31343b" }}> TO BUY !</span>
              </span>
            </p>
          </div>

          {/* ── Wide photo card — same proportions as reference ── */}
          <Link to="/ai" className="block group">
            <div
              className="relative w-full overflow-hidden rounded-3xl shadow-lg"
              style={{ aspectRatio: "16 / 5.5" }}
            >
              {/* Photo — replace src/assets/aicard.jpg with your own image */}
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1600&auto=format&fit=crop&q=80"
                alt="AI Advisor"
                className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
              />

              {/* Dark gradient overlay so text is readable */}
              <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent" />

              {/* "LET ME HELP !" — rainbow gradient text, bottom-left */}
              <div className="absolute top-45 left-8">
                <span
                  style={{
                    fontSize: "40px",
                    fontWeight: 900,
                    letterSpacing: "0.06em",
                    background: "linear-gradient(90deg, #ef4444 0%, #f97316 20%, #eab308 40%, #22c55e 60%, #3b82f6 80%, #a855f7 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  LET ME HELP !
                </span>
              </div>
            </div>
          </Link>
        </section>

        {/* ============================================================
            3. CATEGORY HUB
            ============================================================ */}
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
      </main>

      <footer className="border-t border-slate-200 py-8 text-center text-xs font-bold text-slate-500 tracking-wider uppercase font-mono mt-12">
        Tech 2 Core Engine Portal // Live Data Connected.
      </footer>
    </div>
  );
}
