import { ExternalLink, BatteryMedium, ShieldCheck, Package, TrendingUp, Lightbulb, Clock } from "lucide-react";
import { getProductImage, formatPrice } from "@/lib/products";
import { Badge } from "@/components/ui/badge";

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

function DealCard({ item }: { item: DealItem }) {
  const card = (
    <div className="group flex flex-col gap-3 rounded-xl border border-slate-700 bg-slate-900 p-4 hover:border-blue-500/60 transition-colors cursor-pointer h-full">
      <div className="relative aspect-square overflow-hidden rounded-lg bg-slate-800">
        <img
          src={getProductImage(item.name)}
          alt={item.name}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {item.condition && (
          <span className="absolute right-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white backdrop-blur">
            {item.condition}
          </span>
        )}
      </div>

      <div>
        <p className="text-xs font-black uppercase tracking-widest text-blue-400">{item.source}</p>
        <h4 className="mt-0.5 text-sm font-semibold text-white leading-snug">{item.name}</h4>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {item.battery != null && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-600 text-slate-300">
            <BatteryMedium className="h-3 w-3" /> {item.battery}%
          </Badge>
        )}
        {item.storage && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-600 text-slate-300">
            {item.storage}
          </Badge>
        )}
        {item.warranty && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-600 text-slate-300">
            <ShieldCheck className="h-3 w-3" /> Warranty
          </Badge>
        )}
        {item.box === true && (
          <Badge variant="outline" className="gap-1 text-[10px] border-slate-600 text-slate-300">
            <Package className="h-3 w-3" /> Box
          </Badge>
        )}
      </div>

      <div className="mt-auto flex items-center justify-between">
        <span className="text-lg font-black text-amber-300 font-mono">
          {item.price != null ? formatPrice(item.price) : "Price N/A"}
        </span>
        {item.link && (
          <span className="flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white">
            <ExternalLink className="h-3 w-3" /> View Deal
          </span>
        )}
      </div>
    </div>
  );

  if (item.link) {
    return (
      <a href={item.link} target="_blank" rel="noopener noreferrer" className="block h-full">
        {card}
      </a>
    );
  }
  return card;
}

interface Props {
  result: AIAnalysis;
  model: string;
}

export function AIResults({ result, model }: Props) {
  const { same_model_dealers, better_options, wait_suggestion } = result;

  return (
    <div className="space-y-8">

      {/* Section 1: Same model, different dealers */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-600 text-xs font-black text-white">1</div>
          <h3 className="text-base font-black text-white uppercase tracking-wide">
            {model} — Compare Dealers
          </h3>
          <span className="rounded-full bg-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-300">
            {same_model_dealers.length} listing{same_model_dealers.length !== 1 ? "s" : ""}
          </span>
        </div>

        {same_model_dealers.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-600 py-10 text-center text-sm text-slate-400">
            No listings found for <span className="font-bold text-white">{model}</span> in the current inventory.
            <br />
            <span className="text-xs">Ask your scraper teammates to add more data.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {same_model_dealers.map((item, i) => (
              <DealCard key={i} item={item} />
            ))}
          </div>
        )}
      </section>

      {/* Section 2: Better options */}
      {better_options.length > 0 && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-black text-white">2</div>
            <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-rose-400" /> Other Great Options Within Budget
            </h3>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {better_options.map((item, i) => (
              <DealCard key={i} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Section 3: Wait suggestion */}
      {wait_suggestion && (
        <section>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-xs font-black text-white">3</div>
            <h3 className="text-base font-black text-white uppercase tracking-wide flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-400" /> Should You Wait?
            </h3>
          </div>
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-5 flex gap-3">
            <Lightbulb className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-sm text-slate-200 leading-relaxed">{wait_suggestion}</p>
          </div>
        </section>
      )}
    </div>
  );
}
