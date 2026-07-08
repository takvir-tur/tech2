import { useMemo, useState, useRef, useEffect } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Search, Info, X } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice } from "@/lib/products";
import { fuzzyMatches, fuzzyScore } from "@/lib/fuzzySearch";
import { ProductLink } from "@/components/ProductLink";

const NAV_LINKS = [
  { label: "Smartphones", category: "Phone" },
  { label: "Tablets & iPads", category: "Tablet" },
  { label: "Premium Laptops", category: "Laptop" },
] as const;

export function SiteHeader() {
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: rawProducts, isLoading } = useQuery({
    queryKey: ["live-products"],
    queryFn: fetchLiveProducts,
    staleTime: 60_000,
  });

  const products = useMemo(
    () => (rawProducts ?? []).map((p, i) => enrichProduct(p, i)),
    [rawProducts],
  );

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
    setSearchOpen(false);
  };

  const openSearch = () => {
    setSearchOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const closeSearch = () => {
    setSearchOpen(false);
    setQuery("");
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeSearch();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-50/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-3 sm:px-5 lg:px-8 gap-4">

        {/* Logo — shifted slightly left via negative margin */}
        <Link
          to="/"
          className="-ml-1 shrink-0 bg-gradient-to-r from-blue-600 via-rose-500 to-amber-500 bg-clip-text text-xl font-black uppercase tracking-wider text-transparent"
        >
          Tech 2
        </Link>

        {/* Center nav links — hidden when search is open on small screens */}
        <nav
          className={`hidden md:flex items-center gap-1 flex-1 justify-center transition-opacity duration-200 ${
            searchOpen ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
        >
          {NAV_LINKS.map(({ label, category }) => (
            <Link
              key={category}
              to="/$category"
              params={{ category }}
              className="px-3 py-1.5 text-[13px] font-bold text-slate-600 rounded-full hover:bg-slate-200/70 hover:text-slate-900 transition-colors"
            >
              {label}
            </Link>
          ))}
        </nav>

        {/* Spacer pushes search to the right on mobile when nav is hidden */}
        <div className="flex-1 md:hidden" />

        {/* Animated search — circle → expanding input */}
        <div className="relative flex items-center justify-end shrink-0">
          {/* Expanding input wrapper */}
          <div
            className={`flex items-center overflow-hidden rounded-full border border-slate-300/60 bg-white shadow-sm transition-all duration-300 ease-in-out ${
              searchOpen ? "w-56 sm:w-72 opacity-100" : "w-0 opacity-0 border-transparent"
            }`}
          >
            <input
              ref={inputRef}
              type="search"
              placeholder="Search listings..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") goToSearchResults();
              }}
              className="w-full bg-transparent pl-4 pr-2 py-2 text-sm font-medium text-slate-900 placeholder:text-slate-400 outline-none"
            />
            {query && (
              <button
                onClick={() => setQuery("")}
                className="pr-2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Circle icon button */}
          <button
            onClick={searchOpen ? closeSearch : openSearch}
            aria-label="Toggle search"
            className={`flex h-9 w-9 items-center justify-center rounded-full transition-all duration-200 ${
              searchOpen
                ? "bg-slate-200 text-slate-600 hover:bg-slate-300 ml-1.5"
                : "bg-slate-200/80 text-slate-600 hover:bg-slate-300"
            }`}
          >
            {searchOpen ? <X className="h-4 w-4" /> : <Search className="h-4 w-4" />}
          </button>

          {/* Dropdown suggestions */}
          {searchOpen && query && (
            <div className="absolute top-full right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-xl z-50 overflow-hidden">
              {isLoading ? (
                <div className="px-4 py-3 text-sm text-slate-300">Loading live listings…</div>
              ) : suggestions.length === 0 ? (
                <div className="px-4 py-3 text-sm text-slate-400">
                  No matches found. Press Enter to search.
                </div>
              ) : (
                <>
                  {suggestions.map((product) => (
                    <ProductLink
                      key={product.id}
                      product={product}
                      onClick={() => { setQuery(""); setSearchOpen(false); }}
                      className="flex w-full items-center justify-between gap-3 border-b border-slate-700 bg-slate-800 px-4 py-3 text-left text-white transition hover:bg-slate-700"
                    >
                      <div>
                        <div className="font-semibold text-sm">{product.name}</div>
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
