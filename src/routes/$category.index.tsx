import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { ProductBrowser } from "@/components/ProductBrowser";
import { AINudgePopup } from "@/components/AINudgePopup";
import { AIAdvisoryForm } from "@/components/AIAdvisoryForm";

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

        <section id="ai-advisory" className="scroll-mt-24">
          <AIAdvisoryForm
            persistKey={`${category}-ai`}
            allProducts={products}
            fixedCategory={category}
            optionsPool={categoryProducts}
            modelPlaceholder={`e.g. "${category === "Phone" ? "Galaxy S23" : category} model"`}
          />
        </section>
      </main>

      <AINudgePopup persistKey={`${category}-ai-nudge`} scrollTargetId="ai-advisory" />
    </div>
  );
}