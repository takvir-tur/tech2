import { useMemo, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Info } from "lucide-react";
import { Input } from "@/components/ui/input";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice } from "@/lib/products";
import { fuzzyMatches, fuzzyScore } from "@/lib/fuzzySearch";
import { ProductLink } from "@/components/ProductLink";

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  const { data: rawProducts, isLoading } = useQuery({
    queryKey: ["live-products"],
    queryFn: fetchLiveProducts,
    staleTime: 60_000,
  });

  const products = useMemo(() => (rawProducts ?? []).map((p, i) => enrichProduct(p, i)), [rawProducts]);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    return products
      .filter((p) => fuzzyMatches(query, p.name) || fuzzyMatches(query, p.brand))
      .sort((a, b) => fuzzyScore(query, b.name) - fuzzyScore(query, a.name))
      .slice(0, 6);
  }, [query, products]);

  const goToSearchResults = () => {
    if (!query.trim()) return;
    navigate({ to: "/search", search: { q: query.trim() } });
    setQuery("");
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-blue-100 bg-slate-900/85 backdrop-blur shadow-sm">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          to="/"
          className="shrink-0 bg-gradient-to-r from-blue-600 via-rose-500 to-amber-500 bg-clip-text text-2xl font-black uppercase tracking-wider text-transparent"
        >
          Tech 2
        </Link>

        <div className="relative w-full max-w-md mx-4">
          <Search className="absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            type="search"
            placeholder="Search live scraped listings..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") goToSearchResults();
            }}
            className="pl-10 rounded-full bg-slate-100/80 border-slate-700/60 focus-visible:ring-2 focus-visible:ring-blue-500 font-medium text-slate-900"
          />
          {query && (
            <div className="absolute top-full mt-2 w-full bg-slate-800 border rounded-xl shadow-lg z-50 overflow-hidden">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-slate-300">Loading live listings…</div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No matching listings found. Press Enter to search anyway.
                </div>
              ) : (
                <>
                  {suggestions.map((product) => (
                    <ProductLink
                      key={product.id}
                      product={product}
                      onClick={() => setQuery("")}
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3 text-left text-white transition hover:bg-slate-700"
                    >
                      <div>
                        <div className="font-semibold">{product.name}</div>
                        <div className="text-xs text-slate-400">
                          {formatPrice(product.price)} · {product.source}
                        </div>
                      </div>
                      <Info className="h-3.5 w-3.5 shrink-0 text-blue-400" />
                    </ProductLink>
                  ))}
                  <button
                    onClick={goToSearchResults}
                    className="w-full px-4 py-2.5 text-center text-xs font-bold uppercase tracking-wide text-blue-400 hover:bg-slate-700 transition"
                  >
                    See all results for "{query}"
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}