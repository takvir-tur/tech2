import { ShieldCheck, ShoppingCart, Box, Info } from "lucide-react";
import { formatPrice, type LiveProduct } from "@/lib/products";
import { ProductLink } from "@/components/ProductLink";

interface ProductCardProps {
  product: LiveProduct;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <ProductLink product={product} className="block h-full">
      <div className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md">

        {/* Top Graphic Card Header & Badging Context */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          {product.condition && (
            <div className="absolute top-3 left-3">
              <span className="inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm text-white bg-blue-600">
                {product.condition}
              </span>
            </div>
          )}

          <div className="absolute top-3 right-3 flex items-center gap-1 rounded-full bg-slate-900/80 px-2 py-1 text-[10px] font-bold text-white opacity-0 shadow-md transition group-hover:opacity-100">
            <Info className="h-3 w-3" /> View Details
          </div>
        </div>

        {/* Main Metadata Text Block Content */}
        <div className="flex flex-1 flex-col p-4 space-y-3">
          <div>
            <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
              {product.brand}
            </span>
            <h4 className="font-black text-slate-900 tracking-tight text-base mt-0.5 line-clamp-1 group-hover:text-blue-600 transition">
              {product.name}
            </h4>
          </div>

          {/* Technical Specs Array Grid info — real scraped fields only */}
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 bg-slate-50/60 p-2 rounded-lg border border-slate-100 font-mono">
            <div className="flex items-center gap-1">
              🔋 <span className="text-slate-900 font-black">{product.battery != null ? `${product.battery}%` : "N/A"}</span>
            </div>
            <div className="flex items-center gap-1">
              <Box className="h-3 w-3 text-slate-400" />
              <span className="text-slate-900 font-black">
                {product.box === true ? "Box" : product.box === false ? "Loose" : "N/A"}
              </span>
            </div>
            {product.storage && (
              <div className="flex items-center gap-1 col-span-2">
                <span className="text-slate-900 font-black">{product.storage}</span> storage
              </div>
            )}
            <div className="flex items-center gap-1 col-span-2">
              <ShieldCheck className="h-3 w-3 text-emerald-600" />
              Warranty: <span className="text-slate-900 font-black">{product.warranty ?? "Not stated"}</span>
            </div>
          </div>

          {/* Card Pricing and Action Footer Row Node */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
            <div>
              <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Price</span>
              <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
                {formatPrice(product.price)}
              </span>
            </div>

            <span className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
              View Details
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pt-1 border-t border-dashed border-slate-100">
            <ShoppingCart className="h-3 w-3" /> Source: <span className="text-blue-500 font-extrabold">{product.source}</span>
          </div>
        </div>
      </div>
    </ProductLink>
  );
}