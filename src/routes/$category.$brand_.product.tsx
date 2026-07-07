import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, ExternalLink, ShieldCheck, Box, AlertCircle, Loader2 } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct, formatPrice, type LiveProduct } from "@/lib/products";

export const Route = createFileRoute("/$category/$brand_/product")({
  validateSearch: (search: Record<string, unknown>) => ({
    name: String(search.name ?? ""),
    source: String(search.source ?? ""),
    price: search.price != null && search.price !== "" ? Number(search.price) : undefined,
  }),
  component: ProductDetail,
});

/** Sorts storage strings like "128GB", "1TB" in ascending capacity order. */
function storageSortValue(s: string): number {
  const match = s.match(/^(\d+)\s*(GB|TB)$/i);
  if (!match) return 0;
  const amount = parseInt(match[1], 10);
  return match[2].toUpperCase() === "TB" ? amount * 1024 : amount;
}

function ProductDetail() {
  const { category, brand } = Route.useParams();
  const { name, source, price } = Route.useSearch();
  const router = useRouter();
  const navigate = Route.useNavigate();

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

  // Every other real listing that shares this exact product name — used to
  // offer a storage-variant switcher when the scraped data has more than
  // one capacity for the same model.
  const sameNameListings = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.name.toLowerCase() === product.name.toLowerCase());
  }, [products, product]);

  const storageVariants = useMemo(() => {
    const set = new Set<string>();
    sameNameListings.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort((a, b) => storageSortValue(a) - storageSortValue(b));
  }, [sameNameListings]);

  const pickListingForStorage = (storage: string): LiveProduct | undefined => {
    const matches = sameNameListings.filter((p) => p.storage === storage);
    if (matches.length === 0) return undefined;
    // Prefer the cheapest real listing for that capacity.
    return [...matches].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
  };

  const handleStorageSelect = (storage: string) => {
    const target = pickListingForStorage(storage);
    if (!target) return;
    // replace: true so toggling storage variants doesn't pile up history
    // entries — the back button should return to wherever the user came
    // from, not to an earlier storage selection on this same page.
    navigate({
      search: { name: target.name, source: target.source, price: target.price ?? undefined },
      replace: true,
    });
  };

  const goBack = () => {
    router.history.back();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={goBack}
            className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-blue-600 transition"
          >
            <ArrowLeft className="h-4 w-4 stroke-[3]" /> Back
          </button>
          <Link
            to="/$category/$brand"
            params={{ category, brand }}
            className="text-xs font-bold text-slate-400 hover:text-blue-600 transition"
          >
            {brand} {category}s hub →
          </Link>
        </div>

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

              {storageVariants.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                    Storage — {storageVariants.length} variants available
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {storageVariants.map((storage) => (
                      <button
                        key={storage}
                        onClick={() => handleStorageSelect(storage)}
                        className={`px-3.5 py-1.5 rounded-full text-sm font-bold border transition ${
                          product.storage === storage
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Price/condition/source update to match the real listing for that capacity.
                  </p>
                </div>
              )}

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