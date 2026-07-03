import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { ChevronLeft, Layers } from "lucide-react";
import { products, inferBrand } from "@/lib/products";

export const Route = createFileRoute("/$category")({
  component: CategoryBrandSelector,
});

function CategoryBrandSelector() {
  // Grab the dynamic category from the URL route parameters (Phone, Tablet, Laptop)
  const { category } = Route.useParams();

  // Find all UNIQUE brands that actually exist for this category in our scraped database
  const matchingBrands = useMemo(() => {
    const filteredProducts = products.filter(
      (p) => p.category.toLowerCase() === category.toLowerCase()
    );
    
    // Fallback inference step if brand isn't explicitly filled, mapping strict values
    const brands = filteredProducts.map((p) => p.brand || inferBrand(p.name));
    return Array.from(new Set(brands));
  }, [category]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        
        {/* Navigation Breadcrumb back to home */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Return to Pipelines
        </Link>

        {/* Dynamic Context Header */}
        <div className="border-b border-slate-200 pb-5">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Layers className="h-4 w-4" />
            <span className="text-xs font-black uppercase tracking-widest">Step 2: Scraper Node Index</span>
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">
            Select Brand for <span className="text-blue-600 capitalize">{category}s</span>
          </h1>
          <p className="text-sm text-slate-500 font-medium mt-1">
            Displaying hardware corporations holding active records inside our system matrices.
          </p>
        </div>

        {/* Brand Link Array Grid */}
        {matchingBrands.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center text-base font-medium text-slate-500 bg-white">
            No live records exist for category "{category}" right now.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matchingBrands.map((brand) => {
              // Calculate item count dynamically for contextual validation UI
              const volume = products.filter(
                (p) => p.category.toLowerCase() === category.toLowerCase() && p.brand === brand
              ).length;

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
                      <p className="text-xs text-slate-400 font-bold font-mono uppercase mt-1">
                        Active Database Vendor
                      </p>
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