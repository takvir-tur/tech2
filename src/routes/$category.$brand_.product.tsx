import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink, ShieldCheck, Box, AlertCircle, Loader2,
  Zap, HardDrive, Tag, Store,
} from "lucide-react";
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

function storageSortValue(s: string): number {
  const match = s.match(/^(\d+)\s*(GB|TB)$/i);
  if (!match) return 0;
  const amount = parseInt(match[1], 10);
  return match[2].toUpperCase() === "TB" ? amount * 1024 : amount;
}

/** A single seller row inside the storage options panel. */
function SellerRow({
  listing,
  isActive,
  category,
  brand,
}: {
  listing: LiveProduct;
  isActive: boolean;
  category: string;
  brand: string;
}) {
  const inner = (
    <>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-black text-slate-800">{listing.source}</span>
          {listing.condition && (
            <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
              {listing.condition}
            </span>
          )}
          {isActive && (
            <span className="rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
              Viewing
            </span>
          )}
        </div>
        <p className="mt-0.5 text-lg font-black text-slate-900 font-mono">{formatPrice(listing.price)}</p>
      </div>
      {listing.link && (
        <a
          href={listing.link}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          className="flex-shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-black text-white shadow-sm hover:bg-blue-700 active:scale-95 transition"
        >
          Buy <ExternalLink className="h-3 w-3" />
        </a>
      )}
    </>
  );

  const rowClass = `flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
    isActive
      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300"
      : "border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
  }`;

  if (isActive) {
    return <div className={rowClass}>{inner}</div>;
  }

  return (
    <Link
      to="/$category/$brand_/product"
      params={{ category, brand }}
      search={{ name: listing.name, source: listing.source, price: listing.price ?? undefined }}
      className={rowClass}
    >
      {inner}
    </Link>
  );
}

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

  const product = useMemo(() => {
    return products.find(
      (p) =>
        p.name.toLowerCase() === name.toLowerCase() &&
        p.source.toLowerCase() === source.toLowerCase() &&
        (price == null || p.price === price)
    );
  }, [products, name, source, price]);

  // All listings across ALL sellers that share the same model name
  const sameNameListings = useMemo(() => {
    if (!product) return [];
    return products.filter((p) => p.name.toLowerCase() === product.name.toLowerCase());
  }, [products, product]);

  const storageVariants = useMemo(() => {
    const set = new Set<string>();
    sameNameListings.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort((a, b) => storageSortValue(a) - storageSortValue(b));
  }, [sameNameListings]);

  // Locally-selected storage — reset whenever the product identity changes
  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  useEffect(() => { setSelectedStorage(null); }, [product?.name, product?.source, product?.price]);

  // Best default: explicit selection → product's own storage → first available variant
  const activeStorage =
    selectedStorage ??
    product?.storage ??
    (storageVariants.length > 0 ? storageVariants[0] : null);

  // All seller listings for the active storage variant (immutable sort copy)
  const listingsForStorage = useMemo(() => {
    if (!activeStorage) return [];
    return [...sameNameListings]
      .filter((p) => p.storage === activeStorage)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [sameNameListings, activeStorage]);

  // If no storage variants exist, fall back to showing all same-name listings as sellers
  const sellerListings = useMemo(() => {
    if (storageVariants.length > 0) return listingsForStorage;
    return [...sameNameListings].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [storageVariants, listingsForStorage, sameNameListings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-100 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6 lg:px-8">

        {isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-slate-300 bg-white/80 p-16 text-slate-400 shadow-sm">
            <Loader2 className="h-8 w-8 animate-spin text-blue-400" />
            <span className="text-sm font-semibold">Loading listing…</span>
          </div>
        )}

        {isError && (
          <div className="rounded-3xl border border-rose-200 bg-rose-50 p-8 text-center shadow-sm">
            <AlertCircle className="mx-auto mb-3 h-8 w-8 text-rose-400" />
            <p className="text-sm font-bold text-rose-600">
              Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
            </p>
          </div>
        )}

        {!isLoading && !isError && !product && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white/80 py-20 text-center shadow-sm flex flex-col items-center gap-4">
            <AlertCircle className="h-10 w-10 text-slate-300" />
            <p className="text-base font-semibold text-slate-500">
              This listing couldn't be found — it may have been refreshed or removed.
            </p>
            <Link
              to="/$category/$brand"
              params={{ category, brand }}
              className="mt-1 rounded-full bg-blue-600 px-5 py-2 text-sm font-black text-white hover:bg-blue-700 transition"
            >
              Browse {brand} {category}s
            </Link>
          </div>
        )}

        {product && (
          <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-5 items-start">

            {/* ── LEFT COLUMN: image ── */}
            <div className="space-y-3">
              <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl aspect-[4/5]">
                <img
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover opacity-90"
                />
                {/* Subtle gradient at bottom */}
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />

                {/* Brand badge */}
                <div className="absolute top-4 left-4">
                  <span className="rounded-full bg-blue-600/90 backdrop-blur-sm px-3 py-1 text-xs font-black uppercase tracking-widest text-white shadow">
                    {product.brand}
                  </span>
                </div>

                {/* Condition badge */}
                {product.condition && (
                  <div className="absolute top-4 right-4">
                    <span className="rounded-full bg-black/30 backdrop-blur-sm border border-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                      {product.condition}
                    </span>
                  </div>
                )}

                {/* Source at bottom of image */}
                <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-white/60" />
                  <span className="text-xs font-bold text-white/80">{product.source}</span>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN: details ── */}
            <div className="space-y-4">

              {/* Name + price */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-5">
                <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">{product.brand}</p>
                <h1 className="text-xl sm:text-2xl font-black text-slate-900 leading-tight tracking-tight">
                  {product.name}
                </h1>
                <p className="mt-3 text-4xl font-black text-slate-900 font-mono">{formatPrice(product.price)}</p>
              </div>

              {/* Storage variant picker */}
              {storageVariants.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-4 space-y-3">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Storage options
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {storageVariants.map((storage) => (
                      <button
                        key={storage}
                        onClick={() => setSelectedStorage(storage)}
                        className={`px-4 py-1.5 rounded-full text-sm font-bold border transition ${
                          activeStorage === storage
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "bg-slate-50 border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600"
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Seller listings for selected storage */}
              {sellerListings.length > 0 && (
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-4 space-y-2.5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">
                    {storageVariants.length > 0
                      ? `Buy ${activeStorage} — ${sellerListings.length} seller${sellerListings.length !== 1 ? "s" : ""}`
                      : `${sellerListings.length} seller${sellerListings.length !== 1 ? "s" : ""} available`}
                  </p>
                  {sellerListings.map((listing, i) => (
                    <SellerRow
                      key={`${listing.source}-${listing.price}-${i}`}
                      listing={listing}
                      isActive={
                        listing.source.toLowerCase() === product.source.toLowerCase() &&
                        listing.price === product.price
                      }
                      category={category}
                      brand={brand}
                    />
                  ))}
                </div>
              )}

              {/* Specs */}
              <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-6 py-4 space-y-3">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Specifications</p>
                <div className="grid grid-cols-2 gap-2.5">

                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Zap className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Battery</span>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      {product.battery != null ? `${product.battery}%` : "N/A"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                    <div className="flex items-center gap-1.5 text-slate-400">
                      <Box className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Box</span>
                    </div>
                    <span className="text-base font-black text-slate-900">
                      {product.box === true ? "Included" : product.box === false ? "Not included" : "N/A"}
                    </span>
                  </div>

                  {product.storage && (
                    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3.5">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <HardDrive className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Storage</span>
                      </div>
                      <span className="text-base font-black text-slate-900">{product.storage}</span>
                    </div>
                  )}

                  <div className={`flex flex-col gap-1 rounded-xl bg-emerald-50 border border-emerald-100 p-3.5 ${!product.storage ? "col-span-2" : ""}`}>
                    <div className="flex items-center gap-1.5 text-emerald-500">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span className="text-[11px] font-bold uppercase tracking-wider">Warranty</span>
                    </div>
                    <span className="text-base font-black text-slate-900">{product.warranty ?? "Not stated"}</span>
                  </div>

                  {product.condition && (
                    <div className="flex flex-col gap-1 rounded-xl bg-blue-50 border border-blue-100 p-3.5 col-span-2">
                      <div className="flex items-center gap-1.5 text-blue-400">
                        <Tag className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Condition</span>
                      </div>
                      <span className="text-base font-black text-slate-900">{product.condition}</span>
                    </div>
                  )}

                </div>
              </div>

            </div>
          </div>
        )}
      </main>
    </div>
  );
}
