import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Flame, Database } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { products, type Product } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { FilterPanel, defaultFilters, type Filters } from "@/components/FilterPanel";
import { ProductDetailModal } from "@/components/ProductDetailModal";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tech 2 — Premium Second-Hand Tech Marketplace" },
      { name: "description", content: "Aggregated live secondary market insights for iPhones, iPads, MacBooks and Samsung devices — scored by AI." },
      { property: "og:title", content: "Tech 2 — Premium Second-Hand Tech" },
      { property: "og:description", content: "Verified second-hand premium tech with AI condition reports." },
    ],
  }),
  component: Home,
});

type SortKey = "deal-desc" | "price-asc" | "price-desc" | "battery-desc" | "newest";

function Home() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("deal-desc");

  const filtered = useMemo(() => {
    let list = products.filter((p) => {
      if (query && !`${p.name} ${p.brand}`.toLowerCase().includes(query.toLowerCase())) return false;
      const min = Number(filters.priceMin) || 0;
      const max = Number(filters.priceMax) || Infinity;
      if (p.price < min || p.price > max) return false;
      if (p.batteryHealth < filters.battery) return false;
      if (filters.buyDate !== "any" && p.boughtMonthsAgo > Number(filters.buyDate)) return false;
      if (filters.warranty && p.warrantyMonths <= 0) return false;
      if (filters.box && !p.boxIncluded) return false;
      if (filters.condition !== "any" && p.condition !== filters.condition) return false;
      return true;
    });

    list = [...list].sort((a, b) => {
      switch (sort) {
        case "deal-desc": return b.dealScore - a.dealScore;
        case "price-asc": return a.price - b.price;
        case "price-desc": return b.price - a.price;
        case "battery-desc": return b.batteryHealth - a.batteryHealth;
        case "newest": return a.listedDaysAgo - b.listedDaysAgo;
      }
    });
    return list;
  }, [query, filters, sort]);

  const hot = useMemo(() => products.filter((p) => p.hot).slice(0, 4), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3.5 md:gap-4 md:px-8 md:py-4">
          <a href="/" className="flex shrink-0 items-center gap-2.5">
            <span className="grid h-9 w-9 place-items-center rounded-lg bg-accent font-display text-sm font-bold tracking-tight text-accent-foreground">
              T2
            </span>
            <span className="hidden font-display text-lg font-bold tracking-tight sm:inline">Tech 2</span>
          </a>

          <div className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search iPhone, MacBook, Galaxy…"
              className="h-10 rounded-full border-border bg-secondary pl-10 pr-4 text-sm focus-visible:ring-accent"
            />
          </div>

          <div className="hidden shrink-0 items-center gap-2 rounded-full border border-border bg-secondary/60 px-3 py-1.5 text-[11px] uppercase tracking-wider text-muted-foreground md:flex">
            <Database className="h-3.5 w-3.5 text-accent" />
            <span className="tabular-nums text-foreground">{products.length}</span> Items Indexed
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-10">
        {/* Hero */}
        <section className="mb-8">
          <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
            <Flame className="h-3.5 w-3.5 text-accent" /> For You / Hot Deals
          </div>
          <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
            Premium tech, <span className="text-muted-foreground">priced fairly.</span>
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground md:text-base">
            Aggregated live secondary market insights across platforms — scored by AI for condition you can rely on.
          </p>
        </section>

        {/* Hot deals row */}
        <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {hot.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>

        {/* Market analytics */}
        <div className="mb-12">
          <PriceTrendCard />
        </div>

        {/* Toolbar */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-xl font-semibold md:text-2xl">
            {query ? `Results for "${query}"` : "All Listings"}
            <span className="ml-2 text-sm font-normal text-muted-foreground">({filtered.length})</span>
          </h2>

          <div className="flex shrink-0 items-center gap-2">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2 lg:hidden">
                  <SlidersHorizontal className="h-4 w-4" /> Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[320px] overflow-y-auto bg-background p-4">
                <FilterPanel filters={filters} onChange={setFilters} />
              </SheetContent>
            </Sheet>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs uppercase tracking-wider text-muted-foreground sm:inline">Sort By:</span>
              <Select value={sort} onValueChange={(v) => setSort(v as SortKey)}>
                <SelectTrigger className="w-[210px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deal-desc">Best Deal Score</SelectItem>
                  <SelectItem value="price-asc">Price: Low to High</SelectItem>
                  <SelectItem value="price-desc">Price: High to Low</SelectItem>
                  <SelectItem value="battery-desc">Battery Health: High to Low</SelectItem>
                  <SelectItem value="newest">Newest Listing First</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Layout: sidebar + grid */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
          <div className="hidden lg:block">
            <FilterPanel filters={filters} onChange={setFilters} />
          </div>

          <div>
            {filtered.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/40 px-6 py-20 text-center">
                <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full bg-secondary">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <p className="font-display text-lg font-semibold">No matching listings found</p>
                <p className="mt-2 text-sm text-muted-foreground">
                  Try widening your price range, reducing battery requirements, or expanding search parameters.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
              </div>
            )}
          </div>
        </div>
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Tech 2 · Aggregating premium second-hand tech listings.
      </footer>
    </div>
  );
}
