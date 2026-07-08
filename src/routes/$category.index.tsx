import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, ArrowRight } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { ProductBrowser } from "@/components/ProductBrowser";

export const Route = createFileRoute("/$category/")({
  component: CategoryPage,
});

function CategoryPage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight capitalize">{category}s</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Live scraped listings, updated from the aggregator.</p>
        </div>

        <ProductBrowser
          browseProducts={categoryProducts}
          allProducts={products}
          isLoading={isLoading}
          isError={isError}
          showBrandNav
        />

        <Link
          to="/ai"
          className="group flex items-center justify-between gap-3 rounded-2xl border border-blue-300 bg-gradient-to-r from-blue-50 via-indigo-50 to-blue-50 px-4 py-2.5 shadow-sm transition hover:border-blue-400 hover:shadow-md"
        >
          <span className="flex items-center gap-2 text-sm font-bold text-blue-700">
            <Sparkles className="h-4 w-4 text-blue-500" />
            Not sure which one to pick? Let the AI Advisor compare deals for you.
          </span>
          <span className="flex items-center gap-1 text-xs font-black uppercase tracking-wide text-blue-600 transition-transform group-hover:translate-x-0.5">
            Try it <ArrowRight className="h-3.5 w-3.5" />
          </span>
        </Link>
      </main>
    </div>
  );
}
