import { useMemo } from "react";
import { ExternalLink, ShieldCheck, Box } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatPrice, type LiveProduct } from "@/lib/products";

/** Sorts storage strings like "128GB", "1TB" in ascending capacity order. */
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

export function ProductQuickViewModal({ product, allProducts, onClose, onSelectVariant }: ProductQuickViewModalProps) {
  // Every other real listing that shares this exact product name — used to
  // offer a storage-variant switcher when the data has more than one
  // capacity for the same model.
  const sameNameListings = useMemo(() => {
    if (!product) return [];
    return allProducts.filter((p) => p.name.toLowerCase() === product.name.toLowerCase());
  }, [allProducts, product]);

  const storageVariants = useMemo(() => {
    const set = new Set<string>();
    sameNameListings.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort((a, b) => storageSortValue(a) - storageSortValue(b));
  }, [sameNameListings]);

  const handleStorageSelect = (storage: string) => {
    const matches = sameNameListings.filter((p) => p.storage === storage);
    if (matches.length === 0) return;
    const best = [...matches].sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))[0];
    onSelectVariant(best);
  };

  return (
    <Dialog open={product != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-lg p-0 overflow-hidden">
        {product && (
          <>
            <div className="aspect-video w-full bg-slate-100 overflow-hidden">
              <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
            </div>

            <div className="p-6 space-y-5">
              <DialogHeader className="space-y-1 text-left">
                <span className="text-xs font-black uppercase tracking-widest text-blue-600">{product.brand}</span>
                <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight">
                  {product.name}
                </DialogTitle>
              </DialogHeader>

              <div className="flex flex-wrap items-baseline gap-3 border-y border-slate-100 py-3">
                <span className="text-2xl font-black text-white font-mono">
                  Starting from {formatPrice(product.price)}
                </span>
                {product.condition && (
                  <span className="rounded-full bg-blue-600 px-3 py-1 text-xs font-black uppercase tracking-wider text-white">
                    {product.condition}
                  </span>
                )}
              </div>

              {storageVariants.length > 1 && (
                <div className="space-y-1.5">
                  <span className="text-xs font-black uppercase tracking-wider text-slate-400">Storage</span>
                  <div className="flex flex-wrap gap-2">
                    {storageVariants.map((storage) => (
                      <button
                        key={storage}
                        onClick={() => handleStorageSelect(storage)}
                        className={`px-3 py-1.5 rounded-full text-sm font-bold border transition ${
                          product.storage === storage
                            ? "bg-blue-600 border-blue-600 text-white"
                            : "bg-white border-slate-300 text-slate-600 hover:border-blue-400"
                        }`}
                      >
                        {storage}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-2.5 text-sm font-bold text-slate-600">
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  🔋 Battery:{" "}
                  <span className="text-slate-900 font-black">{product.battery != null ? `${product.battery}%` : "N/A"}</span>
                </div>
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5">
                  <Box className="h-4 w-4 text-slate-400" />
                  Box:{" "}
                  <span className="text-slate-900 font-black">
                    {product.box === true ? "Included" : product.box === false ? "Not included" : "N/A"}
                  </span>
                </div>
                {product.storage && (
                  <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 col-span-2">
                    Storage: <span className="text-slate-900 font-black">{product.storage}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 col-span-2">
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
                  className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-black text-white shadow-md hover:bg-blue-700 transition"
                >
                  View Deal on {product.source} <ExternalLink className="h-4 w-4" />
                </a>
              ) : (
                <p className="text-sm text-slate-400 italic">No direct link is available for this listing.</p>
              )}
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}