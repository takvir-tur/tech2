import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { fuzzyMatches, fuzzyScore } from "@/lib/fuzzySearch";
import { ProductBrowser } from "@/components/ProductBrowser";
import { AINudgePopup } from "@/components/AINudgePopup";
import { AIAdvisoryForm } from "@/components/AIAdvisoryForm";

export const Route = createFileRoute("/search")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: String(search.q ?? ""),
  }),
  component: SearchResults,
});

function SearchResults() {
  const { q } = Route.useSearch();

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

  // Typo-tolerant match against name or brand, ranked by relevance.
  const results = useMemo(() => {
    if (!q.trim()) return [];
    return products
      .filter((p) => fuzzyMatches(q, p.name) || fuzzyMatches(q, p.brand))
      .sort(
        (a, b) =>
          Math.max(fuzzyScore(q, b.name), fuzzyScore(q, b.brand)) -
          Math.max(fuzzyScore(q, a.name), fuzzyScore(q, a.brand))
      );
  }, [q, products]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Back to Home
        </Link>

        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Search results for <span className="text-teal-600">"{q}"</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isLoading ? "Searching…" : `${results.length} matching listing${results.length !== 1 ? "s" : ""} found.`}
          </p>
        </div>

        {/* No brand nav here — search spans every brand/category by design. */}
        <ProductBrowser
          browseProducts={results}
          allProducts={products}
          isLoading={isLoading}
          isError={isError}
          showBrandNav={false}
        />

        <section id="ai-advisory" className="scroll-mt-24">
          <AIAdvisoryForm
            persistKey="search-ai"
            allProducts={products}
            title="Not sure which model to pick? Ask the AI Advisor"
          />
        </section>
      </main>

      <AINudgePopup persistKey="search-ai-nudge" scrollTargetId="ai-advisory" />
    </div>
  );
}