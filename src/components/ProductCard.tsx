import { Sparkles, BatteryMedium, ShieldCheck, Package } from "lucide-react";
import { type Product, formatPrice } from "@/lib/products";
import { Badge } from "@/components/ui/badge";

export function ProductCard({ product }: { product: Product }) {
  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border bg-card transition-colors hover:border-accent/60">
      <div className="relative aspect-square overflow-hidden bg-secondary">
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          width={800}
          height={800}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.hot && (
          <span className="absolute left-3 top-3 rounded-full bg-accent px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-accent-foreground">
            Hot
          </span>
        )}
        <span className="absolute right-3 top-3 rounded-full bg-background/70 px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-foreground backdrop-blur">
          {product.condition}
        </span>
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.brand}</p>
            <h3 className="mt-0.5 truncate text-base font-semibold text-foreground">{product.name}</h3>
          </div>
          <p className="shrink-0 text-base font-semibold tabular-nums">{formatPrice(product.price)}</p>
        </div>

        <div className="flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
          <Badge variant="outline" className="gap-1 font-normal">
            <BatteryMedium className="h-3 w-3" /> {product.batteryHealth}%
          </Badge>
          {product.warrantyMonths > 0 && (
            <Badge variant="outline" className="gap-1 font-normal">
              <ShieldCheck className="h-3 w-3" /> {product.warrantyMonths}mo
            </Badge>
          )}
          {product.boxIncluded && (
            <Badge variant="outline" className="gap-1 font-normal">
              <Package className="h-3 w-3" /> Box
            </Badge>
          )}
        </div>

        <div className="mt-auto flex items-start gap-2 rounded-lg border border-ai/30 bg-ai/10 p-2.5">
          <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ai" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-medium text-ai">AI · </span>
            {product.aiSummary}
          </p>
        </div>
      </div>
    </article>
  );
}
