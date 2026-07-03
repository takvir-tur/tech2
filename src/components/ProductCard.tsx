import { Product } from "@/lib/products";
import { Flame, ShieldCheck, ShoppingCart, Box } from "lucide-react";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-blue-400 hover:shadow-md">
      
      {/* Top Graphic Card Header & Badging Context */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100 border-b border-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        
        {/* Dynamic Condition Indicator Tag */}
        <div className="absolute top-3 left-3">
          <span className={`inline-block px-2.5 py-1 text-[10px] font-black uppercase tracking-wider rounded-full shadow-sm text-white ${
            product.condition === "Mint" ? "bg-emerald-600" :
            product.condition === "Good" ? "bg-blue-600" : "bg-amber-600"
          }`}>
            {product.condition} Grade
          </span>
        </div>

        {/* Hot Deal Overlay Badge Indicator */}
        {product.hot && (
          <div className="absolute top-3 right-3 bg-red-500 text-white p-1.5 rounded-full shadow-md animate-bounce">
            <Flame className="h-3.5 w-3.5 fill-current" />
          </div>
        )}
      </div>

      {/* Main Metadata Text Block Content */}
      <div className="flex flex-1 flex-col p-4 space-y-3">
        <div>
          <span className="text-[10px] font-black tracking-widest text-blue-600 uppercase">
            {product.brand} Pipeline Item
          </span>
          <h4 className="font-black text-slate-900 tracking-tight text-base mt-0.5 line-clamp-1 group-hover:text-blue-600 transition">
            {product.name}
          </h4>
        </div>

        {/* AI Insight Snippet Block quote */}
        <p className="text-xs italic text-slate-500 font-medium line-clamp-2 leading-relaxed bg-slate-50 border border-slate-100 p-2 rounded-lg">
          "{product.aiSummary}"
        </p>

        {/* Technical Specs Array Grid info */}
        <div className="grid grid-cols-2 gap-2 text-[11px] font-bold text-slate-600 bg-slate-50/60 p-2 rounded-lg border border-slate-100 font-mono">
          <div className="flex items-center gap-1">
            🔋 <span className="text-slate-900 font-black">{product.batteryHealth}%</span> Health
          </div>
          <div className="flex items-center gap-1">
            <Box className="h-3 w-3 text-slate-400" /> 
            <span className="text-slate-900 font-black">{product.boxIncluded ? "Box" : "Loose"}</span> Included
          </div>
          <div className="flex items-center gap-1 col-span-2">
            <ShieldCheck className="h-3 w-3 text-emerald-600" />
            Warranty: <span className="text-slate-900 font-black">{product.warrantyMonths > 0 ? `${product.warrantyMonths} months` : "Expired"}</span>
          </div>
        </div>

        {/* Card Pricing and Action Footer Row Node */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between mt-auto">
          <div>
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Indexed Price</span>
            <span className="text-lg font-black text-slate-900 font-mono tracking-tight">
              ৳{product.price.toLocaleString()}
            </span>
          </div>
          
          <div className="text-right">
            <span className="block text-[9px] font-black text-slate-400 uppercase tracking-wider">Deal Score</span>
            <span className={`inline-block text-xs font-black px-2 py-0.5 rounded ${
              product.dealScore >= 80 ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
              product.dealScore >= 70 ? "bg-blue-50 text-blue-700 border border-blue-200" :
              "bg-slate-50 text-slate-700 border border-slate-200"
            }`}>
              {product.dealScore}/100
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 pt-1 border-t border-dashed border-slate-100">
          <ShoppingCart className="h-3 w-3" /> Source: <span className="text-blue-500 font-extrabold">{product.source}</span>
        </div>

      </div>
    </div>
  );
}