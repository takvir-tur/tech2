import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { SlidersHorizontal } from "lucide-react";

export interface Filters {
  priceMin: string;
  priceMax: string;
  battery: number;
  buyDate: string;
  warranty: boolean;
  box: boolean;
  condition: string;
}

export const defaultFilters: Filters = {
  priceMin: "",
  priceMax: "",
  battery: 70,
  buyDate: "any",
  warranty: false,
  box: false,
  condition: "any",
};

interface Props {
  filters: Filters;
  onChange: (f: Filters) => void;
}

export function FilterPanel({ filters, onChange }: Props) {
  const set = <K extends keyof Filters>(k: K, v: Filters[K]) => onChange({ ...filters, [k]: v });

  return (
    <aside className="space-y-6 rounded-2xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <SlidersHorizontal className="h-4 w-4 text-accent" />
          Refine Marketplace
        </h2>
        <button
          onClick={() => onChange(defaultFilters)}
          className="text-[11px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-accent"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Price Window (BDT)</Label>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min ৳"
            value={filters.priceMin}
            onChange={(e) => set("priceMin", e.target.value.replace(/\D/g, ""))}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            inputMode="numeric"
            placeholder="Max ৳"
            value={filters.priceMax}
            onChange={(e) => set("priceMax", e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Battery Health</Label>
          <span className="text-sm tabular-nums text-accent">≥ {filters.battery}%</span>
        </div>
        <Slider
          value={[filters.battery]}
          onValueChange={(v) => set("battery", v[0])}
          min={0}
          max={100}
          step={1}
        />
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buy Date</Label>
        <Select value={filters.buyDate} onValueChange={(v) => set("buyDate", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any time</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 1 year</SelectItem>
            <SelectItem value="24">Last 2 years</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Physical Condition</Label>
        <Select value={filters.condition} onValueChange={(v) => set("condition", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any Condition</SelectItem>
            <SelectItem value="Mint">Mint (Like New)</SelectItem>
            <SelectItem value="Good">Good (Minor Scratches)</SelectItem>
            <SelectItem value="Fair">Fair (Visible Scuffs)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="warranty" className="text-sm">Official Warranty Remaining</Label>
        <Switch id="warranty" checked={filters.warranty} onCheckedChange={(v) => set("warranty", v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="box" className="text-sm">Original Box Included</Label>
        <Switch id="box" checked={filters.box} onCheckedChange={(v) => set("box", v)} />
      </div>
    </aside>
  );
}
