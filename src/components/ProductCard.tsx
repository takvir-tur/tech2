import { Store } from "lucide-react";
import { formatPrice, type LiveProduct } from "@/lib/products";
import { ProductLink } from "@/components/ProductLink";

interface ProductCardProps {
  product: LiveProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <ProductLink product={product} className="block">
      <div className="group flex items-stretch overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-md">

        {/* ── Left: square image panel ── */}
        <div className="relative w-[42%] shrink-0 bg-slate-100 aspect-square overflow-hidden">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {/* Brand badge — top left */}
          <div className="absolute top-2.5 left-2.5">
            <span className="rounded-full bg-blue-600 px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
              {product.brand}
            </span>
          </div>

          {/* Condition badge — top right */}
          {product.condition && (
            <div className="absolute top-2.5 right-2.5">
              <span className="rounded-full bg-slate-700/80 backdrop-blur-sm px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm">
                {product.condition}
              </span>
            </div>
          )}

          {/* Source — bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent px-2.5 pt-4 pb-2">
            <div className="flex items-center gap-1">
              <Store className="h-2.5 w-2.5 text-white/70" />
              <span className="text-[9px] font-bold text-white/90 truncate">{product.source}</span>
            </div>
          </div>
        </div>

        {/* ── Right: details panel ── */}
        <div className="flex flex-1 flex-col justify-between p-3 min-w-0">
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest text-blue-600">
              {product.brand}
            </p>
            <h4 className="text-[11px] font-black text-slate-900 leading-snug line-clamp-2 group-hover:text-blue-600 transition">
              {product.name}
            </h4>
          </div>

          <div className="mt-2 space-y-2">
            {/* Price */}
            <p className="text-base font-black text-slate-900 font-mono tracking-tight">
              {formatPrice(product.price)}
            </p>

            {/* Quick specs row */}
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-[9px] font-bold text-slate-500">
              <span>🔋 {product.battery != null ? `${product.battery}%` : "N/A"}</span>
              {product.storage && <span>💾 {product.storage}</span>}
              <span>{product.box === true ? "📦 Box" : product.box === false ? "📦 Loose" : ""}</span>
            </div>

            {/* View details pill */}
            <span className="inline-flex items-center rounded-lg bg-blue-600 px-2.5 py-1 text-[9px] font-black text-white">
              View Details →
            </span>
          </div>
        </div>
      </div>
    </ProductLink>
  );
}
