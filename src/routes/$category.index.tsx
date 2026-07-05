import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Layers, Loader2 } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";

export const Route = createFileRoute("/$category/")({
  component: CategoryBrandSelector,
});

function CategoryBrandSelector() {
  const { category } = Route.useParams();

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

  const categoryProducts = useMemo(
    () => products.filter((p) => p.category.toLowerCase() === category.toLowerCase()),
    [products, category]
  );

  const matchingBrands = useMemo(() => {
    const brands = categoryProducts.map((p) => p.brand);
    return Array.from(new Set(brands)).sort();
  }, [categoryProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Return to Pipelines
        </Link>

        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Step 2: Live Scraper Node Index</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Select Brand for <span className="text-blue-600 capitalize">{category}s</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Brands are derived live from the scraped inventory — not a fixed list.
          </p>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading live inventory…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
            Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
          </div>
        )}

        {!isLoading && !isError && matchingBrands.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center text-base font-medium text-slate-500 bg-white">
            No live records exist for category "{category}" right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matchingBrands.map((brand) => {
              const volume = categoryProducts.filter((p) => p.brand === brand).length;

              return (
                <Link
                  key={brand}
                  to="/$category/$brand"
                  params={{ category, brand }}
                  className="p-6 rounded-2xl bg-white border border-slate-200 shadow-sm hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5 transition duration-200 text-left group"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight group-hover:text-blue-600 transition">
                        {brand}
                      </h3>
                      <p className="text-xs text-slate-400 font-bold font-mono uppercase mt-1">Active Database Vendor</p>
                    </div>
                    <div className="bg-slate-100 text-slate-700 font-mono font-black text-xs px-3 py-1.5 rounded-xl group-hover:bg-blue-50 group-hover:text-blue-600 transition">
                      {volume} Live {volume === 1 ? "Deal" : "Deals"}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}