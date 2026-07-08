import { Info, BatteryMedium, ShieldCheck, Package, Sparkles, Lightbulb, Clock } from "lucide-react";
import { enrichProduct, formatPrice } from "@/lib/products";
import { Badge } from "@/components/ui/badge";
import { ProductLink } from "@/components/ProductLink";

export interface DealItem {
  name: string;
  price: number | null;
  battery: number | null;
  condition: string | null;
  warranty: string | null;
  box: boolean | null;
  storage: string | null;
  source: string;
  link: string;
  category: string;
}

export interface AIAnalysis {
  same_model_dealers: DealItem[];
  better_options: DealItem[];
  wait_suggestion: string | null;
}

function DealCard({ item, index, highlight = false }: { item: DealItem; index: number; highlight?: boolean }) {
  // DealItem has the exact same shape the backend gives /api/products, so it
  // can go straight through the same enrichment (brand + thumbnail + id) that
  // every other listing in the app uses — keeping this fully consistent with
  // the product grid and the homepage.
  const product = enrichProduct(item, index);

  const card = (
    <div
      className={`group flex flex-col gap-3 overflow-hidden rounded-xl border bg-white p-4 transition-colors h-full ${
        highlight
          ? "border-blue-200 hover:border-blue-400 shadow-sm hover:shadow-md"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-100">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.condition && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
            {product.condition}
          </span>
        )}
      </div>

      <div className="min-w-0">
        <p className="text-xs font-black uppercase tracking-widest text-blue-600">{product.source}</p>
        <h4 className="mt-0.5 text-sm font-semibold text-slate-900 leading-snug line-clamp-2">{product.name}</h4>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {product.battery != null && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-200 text-slate-600">
            <BatteryMedium className="h-3 w-3" /> {product.battery}%
          </Badge>
        )}
        {product.storage && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-200 text-slate-600">
            {product.storage}
          </Badge>
        )}
        {product.warranty && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-200 text-slate-600">
            <ShieldCheck className="h-3 w-3" /> Warranty
          </Badge>
        )}
        {product.box === true && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-200 text-slate-600">
            <Package className="h-3 w-3" /> Box
          </Badge>
        )}
      </div>

      <div className="mt-auto flex flex-wrap items-center justify-between gap-2">
        <span className="text-lg font-black text-slate-900 font-mono">
          {product.price != null ? formatPrice(product.price) : "Price N/A"}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
          <Info className="h-3 w-3" /> View Details
        </span>
      </div>
    </div>
  );

  return (
    <ProductLink product={product} className="block h-full">
      {card}
    </ProductLink>
  );
}

interface Props {
  result: AIAnalysis;
  model: string;
}

export function AIResults({ result, model }: Props) {
  const { same_model_dealers, better_options, wait_suggestion } = result;

  return (
    <div className="space-y-10">

      {/* Section 1: Same model, different dealers */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</div>
          <h3 className="text-base font-black text-slate-900 uppercase tracking-wide">
            {model} — Compare Dealers
          </h3>
          <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-600">
            {same_model_dealers.length} listing{same_model_dealers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {same_model_dealers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 py-10 text-center text-sm text-slate-500">
            No listings found for <span className="font-bold text-slate-900">{model}</span> in the current inventory.
            <br />
            <span className="text-xs">Ask your scraper teammates to add more data.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {same_model_dealers.map((item, i) => (
              <DealCard key={i} item={item} index={i} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Better options — the star attraction, dressed up to match */}
      {better_options.length > 0 && (
        <section>
          <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-blue-600 via-indigo-600 to-rose-500 p-[2px] shadow-xl shadow-blue-500/20">
            <div className="relative rounded-[26px] bg-white p-5 md:p-7">
              {/* Soft glow accents */}
              <div className="pointer-events-none absolute -top-24 -right-24 h-56 w-56 rounded-full bg-rose-400/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-24 -left-24 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />

              <div className="relative flex flex-wrap items-center gap-3 mb-2">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-blue-600 to-rose-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-white shadow-md">
                  <Sparkles className="h-3.5 w-3.5" /> Top Pick
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Ranked by our scoring model on condition, battery health & warranty
                </span>
              </div>

              <h3 className="relative text-2xl md:text-3xl font-black tracking-tight bg-gradient-to-r from-blue-700 via-indigo-600 to-rose-500 bg-clip-text text-transparent mb-5">
                Other Great Options Within Budget
              </h3>

              <div className="relative grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {better_options.map((item, i) => (
                  <div key={i} className="relative">
                    {i === 0 && (
                      <span className="absolute -top-2.5 left-3 z-10 rounded-full bg-gradient-to-r from-amber-400 to-rose-500 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white shadow-md">
                        Best Value
                      </span>
                    )}
                    <DealCard item={item} index={i} highlight />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Section 3: Wait suggestion */}
      {wait_suggestion && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">3</div>
            <h3 className="text-base font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" /> Should You Wait?
            </h3>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-5 flex gap-3">
            <Lightbulb className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-700 leading-relaxed">{wait_suggestion}</p>
          </div>
        </section>
      )}
    </div>
  );
}
