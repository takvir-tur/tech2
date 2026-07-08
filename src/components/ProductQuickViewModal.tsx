import { useMemo, useState, useEffect } from "react";
import {
  ExternalLink, ShieldCheck, Box, Store,
  Zap, HardDrive, Tag,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatPrice, type LiveProduct } from "@/lib/products";

function storageSortValue(s: string): number {
  const match = s.match(/^(\d+)\s*(GB|TB)$/i);
  if (!match) return 0;
  const amount = parseInt(match[1], 10);
  return match[2].toUpperCase() === "TB" ? amount * 1024 : amount;
}

interface ProductQuickViewModalProps {
  product: LiveProduct | null;
  allProducts: LiveProduct[];
  onClose: () => void;
  onSelectVariant: (product: LiveProduct) => void;
}

/** Seller row — same visual as the detail page, but calls onSelectVariant instead of navigating. */
function SellerRow({
  listing,
  isActive,
  onSelect,
}: {
  listing: LiveProduct;
  isActive: boolean;
  onSelect: () => void;
}) {
  const rowClass = `flex items-center justify-between gap-3 rounded-xl border px-4 py-3 transition ${
    isActive
      ? "border-blue-300 bg-blue-50 ring-1 ring-blue-300"
      : "border-slate-100 bg-slate-50 hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer"
  }`;

  return (
    <div className={rowClass} onClick={isActive ? undefined : onSelect}>
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
    </div>
  );
}

export function ProductQuickViewModal({
  product,
  allProducts,
  onClose,
  onSelectVariant,
}: ProductQuickViewModalProps) {
  const sameNameListings = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.name.toLowerCase() === product.name.toLowerCase());
  }, [allProducts, product]);

  const storageVariants = useMemo(() => {
    const set = new Set<string>();
    sameNameListings.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort((a, b) => storageSortValue(a) - storageSortValue(b));
  }, [sameNameListings]);

  const [selectedStorage, setSelectedStorage] = useState<string | null>(null);
  useEffect(() => { setSelectedStorage(null); }, [product?.name, product?.source, product?.price]);

  const activeStorage =
    selectedStorage ?? product?.storage ?? (storageVariants.length > 0 ? storageVariants[0] : null);

  const listingsForStorage = useMemo(() => {
    if (!activeStorage) return [];
    return [...sameNameListings]
      .filter((p) => p.storage === activeStorage)
      .sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [sameNameListings, activeStorage]);

  const sellerListings = useMemo(() => {
    if (storageVariants.length > 0) return listingsForStorage;
    return [...sameNameListings].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
  }, [storageVariants, listingsForStorage, sameNameListings]);

  const handleStorageSelect = (storage: string) => {
    setSelectedStorage(storage);
    const matches = sameNameListings.filter((p) => p.storage === storage);
    if (!matches.length) return;
    const best = [...matches].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
    onSelectVariant(best);
  };

  return (
    <Dialog open={product != null} onOpenChange={(open) => !open && onClose()}>
      {/* Wide modal — same proportions as the detail page */}
      <DialogContent className="max-w-3xl w-full p-0 overflow-hidden bg-slate-50">
        {product && (
          <div className="max-h-[90vh] overflow-y-auto">
            <div className="grid grid-cols-1 md:grid-cols-[5fr_7fr] gap-4 p-5 items-start">

              {/* ── LEFT: image — exact clone of detail page ── */}
              <div>
                <div className="relative overflow-hidden rounded-3xl bg-slate-900 shadow-xl aspect-[4/5]">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover opacity-90"
                  />
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

                  {/* Source at bottom */}
                  <div className="absolute bottom-4 left-4 right-4 flex items-center gap-1.5">
                    <Store className="h-3.5 w-3.5 text-white/60" />
                    <span className="text-xs font-bold text-white/80">{product.source}</span>
                  </div>
                </div>
              </div>

              {/* ── RIGHT: details — exact clone of detail page ── */}
              <div className="space-y-3">

                {/* Name + price card */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-4">
                  <p className="text-xs font-black uppercase tracking-widest text-blue-600 mb-1">{product.brand}</p>
                  <h2 className="text-lg font-black text-slate-900 leading-tight tracking-tight">
                    {product.name}
                  </h2>
                  <p className="mt-2 text-3xl font-black text-slate-900 font-mono">{formatPrice(product.price)}</p>
                </div>

                {/* Storage variant picker */}
                {storageVariants.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-3 space-y-2.5">
                    <p className="text-xs font-black uppercase tracking-widest text-slate-400">Storage options</p>
                    <div className="flex flex-wrap gap-2">
                      {storageVariants.map((storage) => (
                        <button
                          key={storage}
                          onClick={() => handleStorageSelect(storage)}
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

                {/* Seller rows */}
                {sellerListings.length > 0 && (
                  <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-3 space-y-2">
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
                        onSelect={() => onSelectVariant(listing)}
                      />
                    ))}
                  </div>
                )}

                {/* Specs grid */}
                <div className="rounded-2xl bg-white border border-slate-100 shadow-sm px-5 py-3 space-y-2.5">
                  <p className="text-xs font-black uppercase tracking-widest text-slate-400">Specifications</p>
                  <div className="grid grid-cols-2 gap-2">

                    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Zap className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Battery</span>
                      </div>
                      <span className="text-base font-black text-slate-900">
                        {product.battery != null ? `${product.battery}%` : "N/A"}
                      </span>
                    </div>

                    <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Box className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Box</span>
                      </div>
                      <span className="text-base font-black text-slate-900">
                        {product.box === true ? "Included" : product.box === false ? "Not included" : "N/A"}
                      </span>
                    </div>

                    {product.storage && (
                      <div className="flex flex-col gap-1 rounded-xl bg-slate-50 border border-slate-100 p-3">
                        <div className="flex items-center gap-1.5 text-slate-400">
                          <HardDrive className="h-3.5 w-3.5" />
                          <span className="text-[11px] font-bold uppercase tracking-wider">Storage</span>
                        </div>
                        <span className="text-base font-black text-slate-900">{product.storage}</span>
                      </div>
                    )}

                    <div className={`flex flex-col gap-1 rounded-xl bg-emerald-50 border border-emerald-100 p-3 ${!product.storage ? "col-span-2" : ""}`}>
                      <div className="flex items-center gap-1.5 text-emerald-500">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        <span className="text-[11px] font-bold uppercase tracking-wider">Warranty</span>
                      </div>
                      <span className="text-base font-black text-slate-900">{product.warranty ?? "Not stated"}</span>
                    </div>

                    {product.condition && (
                      <div className="flex flex-col gap-1 rounded-xl bg-blue-50 border border-blue-100 p-3 col-span-2">
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
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
