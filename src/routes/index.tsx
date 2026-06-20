import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, Flame } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { products } from "@/lib/products";
import { ProductCard } from "@/components/ProductCard";
import { FilterPanel, defaultFilters, type Filters } from "@/components/FilterPanel";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tech 2 — Premium second-hand tech, aggregated" },
      { name: "description", content: "Find verified second-hand iPhones, iPads, MacBooks and Samsung devices with AI-summarized condition reports." },
      { property: "og:title", content: "Tech 2 — Premium second-hand tech" },
      { property: "og:description", content: "Verified second-hand premium tech with AI condition reports." },
    ],
  }),
  component: Home,
});

type SortKey = "price-asc" | "battery-desc" | "date-asc" | "warranty-asc";

function Home() {
  const [query, setQuery] = useState("");
  const [filters, setFilters] = useState<Filters>(defaultFilters);
  const [sort, setSort] = useState<SortKey>("price-asc");

  const searching = query.trim().length > 0;

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
        case "price-asc": return a.price - b.price;
        case "battery-desc": return b.batteryHealth - a.batteryHealth;
        case "date-asc": return b.boughtMonthsAgo - a.boughtMonthsAgo;
        case "warranty-asc": return a.warrantyMonths - b.warrantyMonths;
      }
    });
    return list;
  }, [query, filters, sort]);

  const hot = useMemo(() => products.filter((p) => p.hot), []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center gap-4 px-4 py-4 md:px-8">
          <a href="/" className="flex items-center gap-2 shrink-0">
            <span className="font-display text-xl font-bold tracking-tight">Tech</span>
            <span className="grid h-7 w-7 place-items-center rounded-full bg-accent font-display text-sm font-bold text-accent-foreground">
              2
            </span>
          </a>

          <div className="relative mx-auto w-full max-w-xl">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search iPhone, MacBook, Galaxy…"
              className="h-11 rounded-full border-border bg-secondary pl-10 pr-4 text-sm focus-visible:ring-accent"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 md:px-8 md:py-12">
        {!searching ? (
          <>
            <section className="mb-10">
              <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">For you</p>
              <h1 className="mt-2 font-display text-3xl font-bold tracking-tight md:text-5xl">
                Premium tech, <span className="text-muted-foreground">priced fairly.</span>
              </h1>
              <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
                Verified second-hand listings from the marketplaces you trust, scored by AI for condition you can rely on.
              </p>
            </section>

            <section className="mb-8 flex items-center gap-2">
              <Flame className="h-4 w-4 text-accent" />
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">Hot deals</h2>
            </section>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {hot.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>

            <section className="mb-8 mt-16 flex items-center gap-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-foreground">All listings</h2>
            </section>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((p) => <ProductCard key={p.id} product={p} />)}
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
                  <p className="mt-1 text-xs text-muted-foreground">{filtered.length} listings found</p>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Sheet>
                    <SheetTrigger asChild>
                      <Button variant="outline" size="sm" className="lg:hidden gap-2">
                        <SlidersHorizontal className="h-4 w-4" /> Filters
                      </Button>
                    </SheetTrigger>
                    <SheetContent side="left" className="w-[320px] overflow-y-auto bg-background p-4">
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
                  {filtered.map((p) => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border py-8 text-center text-xs text-muted-foreground">
        Tech 2 · Aggregating premium second-hand tech listings.
      </footer>
    </div>
  );
}
