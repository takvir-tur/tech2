import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Sparkles, BatteryMedium, ShieldCheck, Package, Calendar, Store } from "lucide-react";
import { type Product, formatPrice } from "@/lib/products";
import { getDealBadge, generateTrendPoints } from "@/lib/deal";
import { PriceTrendCard } from "./PriceTrendCard";

interface Props {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function ProductDetailModal({ product, open, onOpenChange }: Props) {
  if (!product) return null;
  const badge = getDealBadge(product);
  const points = generateTrendPoints(product.price);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto border-border bg-card">
        <div className="space-y-5">
          <div className="flex items-start justify-between gap-3 border-b border-border pb-4">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-wider text-muted-foreground">{product.brand} · {product.category}</p>
              <h3 className="mt-1 font-display text-xl font-bold tracking-tight">{product.name}</h3>
            </div>
            <span className={`shrink-0 rounded-md border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badge.className}`}>
              {badge.label}
            </span>
          </div>

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <img src={product.image} alt={product.name} className="h-56 w-full object-cover" />
          </div>

          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Stat label="Price" value={formatPrice(product.price)} accent />
            <Stat label="Battery" value={`${product.batteryHealth}%`} icon={<BatteryMedium className="h-3 w-3" />} />
            <Stat label="Condition" value={product.condition} icon={<Sparkles className="h-3 w-3" />} />
            <Stat label="Source" value={product.source} icon={<Store className="h-3 w-3" />} />
            <Stat label="Bought" value={`${product.boughtMonthsAgo}mo ago`} icon={<Calendar className="h-3 w-3" />} />
            <Stat label="Warranty" value={product.warrantyMonths > 0 ? `${product.warrantyMonths}mo` : "None"} icon={<ShieldCheck className="h-3 w-3" />} />
            <Stat label="Box" value={product.boxIncluded ? "Included" : "No"} icon={<Package className="h-3 w-3" />} />
            <Stat label="Deal Score" value={`${product.dealScore}/100`} accent />
          </div>

          <PriceTrendCard deviceName={product.name} points={points} />

          <div className="flex items-start gap-2.5 rounded-xl border border-ai/30 bg-ai/10 p-3">
            <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-ai" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-ai">AI Summary · </span>
              {product.aiSummary}
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value, icon, accent }: { label: string; value: string; icon?: React.ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-lg border border-border bg-background/40 p-2.5">
      <span className="mb-1 flex items-center gap-1 text-[10px] uppercase tracking-wider text-muted-foreground">
        {icon}
        {label}
      </span>
      <span className={`block text-sm font-bold tabular-nums ${accent ? "text-accent" : "text-foreground"}`}>{value}</span>
    </div>
  );
}
