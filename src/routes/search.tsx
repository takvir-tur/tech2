import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, AlertCircle, Loader2, SearchX } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { fuzzyMatches, fuzzyScore } from "@/lib/fuzzySearch";
import { ProductCard } from "@/components/ProductCard";

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

  // Typo-tolerant match against name or brand, ranked by relevance so the
  // closest matches (exact substring first, then fuzzy) show up first.
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
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Back to Home
        </Link>

        <div className="border-b border-slate-200 pb-4">
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Search results for <span className="text-blue-600">"{q}"</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            {isLoading ? "Searching…" : `${results.length} matching listing${results.length !== 1 ? "s" : ""} found.`}
          </p>
        </div>

        {isError && (
          <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
            Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading live listings…
          </div>
        ) : results.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-24 text-center text-slate-500 bg-white shadow-inner flex flex-col items-center justify-center p-6">
            <SearchX className="h-10 w-10 text-slate-400 mb-2" />
            <p className="font-black text-lg text-slate-800">No listings matched "{q}"</p>
            <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm">
              Try a shorter or more general term — e.g. just the brand or model number.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {results.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}