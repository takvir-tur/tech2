import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Search,
  SlidersHorizontal,
  Flame,
  Sparkles,
  LayoutGrid,
  MessageSquare,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { FilterPanel, defaultFilters, type Filters } from "@/components/FilterPanel";
import { AiChat } from "@/components/AiChat";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tech 2 — Premium second-hand tech, aggregated" },
      {
        name: "description",
        content:
          "Find verified second-hand iPhones, iPads, MacBooks and Samsung devices with AI-powered recommendations.",
      },
    ],
  }),
  component: Home,
});

type SortKey = "price-asc" | "battery-desc" | "date-asc" | "warranty-asc";
type Tab = "browse" | "ai";

function Home() {
  const [tab, setTab] = useState<Tab>("ai");
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("price-asc");

  const searching = query.trim().length > 0;

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (query && !`${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase()))
        return false;
      const min = Number(filters.priceMin) || 0;
      const max = Number(filters.priceMax) || Infinity;
      if (p.price < min || p.price > max) return false;
      if (p.batteryHealth < filters.battery) return false;
      if (filters.buyDate !== "any" && p.boughtMonthsAgo > Number(filters.buyDate))
        return false;
      if (filters.warranty && p.warrantyMonths <= 0) return false;
      if (filters.box && !p.boxIncluded) return false;
      if (filters.condition !== "any" && p.condition !== filters.condition) return false;
      return true;
    });
    list = [...list].sort((a, b) => {
      switch (sort) {
        case "price-asc":
          return a.price - b.price;
        case "battery-desc":
          return b.batteryHealth - a.batteryHealth;
        case "date-asc":
          return b.boughtMonthsAgo - a.boughtMonthsAgo;
        case "warranty-asc":
          return a.warrantyMonths - b.warrantyMonths;
      }
    });
    return list;
  }, [query, filters, sort]);

  const hot = useMemo(() => products.filter((p) => p.hot), []);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-3 md:px-8">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-xl font-bold tracking-tight">Tech</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
              2
            </span>
          </a>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-border bg-secondary p-1">
            <button
              onClick={() => setTab("ai")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "ai"
                  ? "bg-accent text-accent-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">AI Advisor</span>
            </button>
            <button
              onClick={() => setTab("browse")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                tab === "browse"
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Browse</span>
            </button>
          </div>

          {/* Search — only shown in browse tab */}
          {tab === "browse" && (
            <div className="relative ml-auto w-full max-w-sm">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search iPhone, MacBook, Galaxy…"
                className="h-10 rounded-full border-border bg-secondary pl-10 pr-4 text-sm focus-visible:ring-accent"
              />
            </div>
          )}
        </div>
      </header>

      {/* AI Advisor Tab */}
      {tab === "ai" && (
        <div className="flex-1 flex flex-col mx-auto w-full max-w-3xl px-0 md:px-4 md:py-4">
          <div className="flex-1 flex flex-col md:rounded-2xl md:border md:border-border overflow-hidden bg-background md:bg-card/30">
            <div className="border-b border-border px-4 py-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-accent/20">
                <Sparkles className="h-4 w-4 text-accent" />
              </div>
              <div>
                <p className="text-sm font-semibold text-foreground leading-none">Tech 2 AI Advisor</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Powered by Gemini · {products.length}+ listings analyzed
                </p>
              </div>
              <button
                onClick={() => setTab("browse")}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-border bg-secondary px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                Browse listings
              </button>
            </div>
            <div className="flex-1 overflow-hidden" style={{ minHeight: 0 }}>
              <div className="h-full flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
                <AiChat />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Browse Tab */}
      {tab === "browse" && (
        <main className="mx-auto max-w-7xl w-full px-4 py-8 md:px-8 md:py-12">
          {/* AI Promo Banner */}
          <div
            onClick={() => setTab("ai")}
            className="mb-8 flex cursor-pointer items-center gap-4 rounded-2xl border border-accent/25 bg-accent/5 px-5 py-4 transition-colors hover:border-accent/50 hover:bg-accent/10"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-accent/20">
              <MessageSquare className="h-5 w-5 text-accent" />
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-foreground text-sm">
                Not sure what to buy? Try the AI Advisor
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Describe your needs and get 10–15 ranked picks with a BUY / WAIT / SWITCH verdict
              </p>
            </div>
            <Sparkles className="ml-auto h-5 w-5 shrink-0 text-accent" />
          </div>

          {!searching ? (
            <>
              <section className="mb-10">
                <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">For you</p>
                <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
                  Premium tech, <span className="text-muted-foreground">priced fairly.</span>
                </h1>
                <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                  Verified second-hand listings from the marketplaces you trust, scored by AI for
                  condition you can rely on.
                </p>
              </section>

              <section className="mb-8 flex items-center gap-2">
                <Flame className="h-4 w-4 text-accent" />
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  Hot deals
                </h2>
              </section>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {hot.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>

              <section className="mb-8 mt-16 flex items-center gap-2">
                <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">
                  All listings
                </h2>
              </section>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            </>
          ) : (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
              <div className="hidden lg:block">
                <FilterPanel filters={filters} onChange={setFilters} />
              </div>

              <div>
                <div className="mb-6 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 sm:flex sm:flex-wrap sm:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate font-display text-xl font-semibold md:text-2xl">
                      Results for "{query}"
                    </h2>
                    <p className="mt-1 text-xs text-muted-foreground">
                      {filtered.length} listings found
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-2">
                    <Sheet>
                      <SheetTrigger asChild>
                        <Button variant="outline" size="sm" className="lg:hidden gap-2">
                          <SlidersHorizontal className="h-4 w-4" /> Filters
                        </Button>
                      </SheetTrigger>
                      <SheetContent
                        side="left"
                        className="w-[320px] overflow-y-auto bg-background p-4"
                      >
                        <FilterPanel filters={filters} onChange={setFilters} />
                      </SheetContent>
                    </Sheet>

                    <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Sort by" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="battery-desc">Battery: High to Low</SelectItem>
                        <SelectItem value="date-asc">Buy date: Oldest first</SelectItem>
                        <SelectItem value="warranty-asc">Warranty: Shortest first</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {filtered.length === 0 ? (
                  <div className="rounded-2xl border border-dashed py-20 text-center text-sm text-muted-foreground">
                    No listings match your filters.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                    {filtered.map((p) => (
                      <ProductCard key={p.id} product={p} />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      )}

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Tech 2 · Aggregating premium second-hand tech listings.
      </footer>
    </div>
  );
}
