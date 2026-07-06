import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, ExternalLink, ShieldCheck, Box, AlertCircle, Loader2 } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice } from "@/lib/products";

export const Route = createFileRoute("/$category/$brand_/product")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: String(search.name ?? ""),
    source: String(search.source ?? ""),
    price: search.price != null && search.price !== "" ? Number(search.price) : undefined,
  }),
  component: ProductDetail,
});

function ProductDetail() {
  const { category, brand } = Route.useParams();
  const { name, source, price } = Route.useSearch();

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

  // Identify the exact listing by name + source + price — the same triplet
  // the backend uses to de-duplicate, so this is a stable, real identity
  // rather than a fragile array-position id.
  const product = useMemo(() => {
    return products.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() &&
        p.source.toLowerCase() === source.toLowerCase() &&
        (price == null || p.price === price)
    );
  }, [products, name, source, price]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/$category/$brand"
          params={{ category, brand }}
          className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
        >
          <ChevronLeft className="h-4 w-4 stroke-[3]" /> Back to {brand} {category}s
        </Link>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
            <Loader2 className="h-5 w-5 animate-spin" /> Loading listing…
          </div>
        )}

        {isError && (
          <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
            Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
          </div>
        )}

        {!isLoading && !isError && !product && (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 py-16 text-center text-base font-medium text-slate-500 bg-white flex flex-col items-center gap-3">
            <AlertCircle className="h-8 w-8 text-slate-400" />
            This listing couldn't be found — it may have been refreshed or removed.
            <Link to="/$category/$brand" params={{ category, brand }} className="text-blue-600 font-bold underline">
              Back to {brand} {category}s
            </Link>
          </div>
        )}

        {product && (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-md overflow-hidden">
            <div className="aspect-video w-full bg-slate-100 overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <div className="p-6 sm:p-8 space-y-6">
              <div>
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">{product.brand}</span>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight mt-1">{product.name}</h1>
              </div>

              <div className="flex flex-wrap items-baseline gap-3 border-y border-slate-100 py-4">
                <span className="text-3xl font-black text-slate-900 font-mono">{formatPrice(product.price)}</span>
                {product.condition && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                    {product.condition}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  🔋 Battery:{" "}
                  <span className="text-slate-900 font-black">{product.battery != null ? `${product.battery}%` : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3">
                  <Box className="h-4 w-4 text-slate-400" />
                  Box:{" "}
                  <span className="text-slate-900 font-black">
                    {product.box === true ? "Included" : product.box === false ? "Not included" : "N/A"}
                  </span>
                </div>
                {product.storage && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 col-span-2">
                    Storage: <span className="text-slate-900 font-black">{product.storage}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-3 col-span-2">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Warranty: <span className="text-slate-900 font-black">{product.warranty ?? "Not stated"}</span>
                </div>
              </div>

              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                Listed on <span className="text-blue-600">{product.source}</span>
              </p>

              {product.link ? (
                <a
                  href={product.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-black text-white shadow-md hover:bg-blue-700 transition"
                >
                  View Deal on {product.source} <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="text-sm text-slate-400 italic">No direct link is available for this listing.</p>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
