import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export interface Filters {
  priceMin: string;
  priceMax: string;
  battery: number;
  buyDate: string; // "any" | "6" | "12" | "24"
  warranty: boolean;
  box: boolean;
  condition: string; // "any" | "Mint" | "Good" | "Fair"
}

export const defaultFilters: Filters = {
  priceMin: "",
  priceMax: "",
  battery: 0,
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
      <div>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Filters</h2>
      </div>

      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Price</Label>
        <div className="flex items-center gap-2">
          <Input
            inputMode="numeric"
            placeholder="Min"
            value={filters.priceMin}
            onChange={(e) => set("priceMin", e.target.value.replace(/\D/g, ""))}
          />
          <span className="text-muted-foreground">—</span>
          <Input
            inputMode="numeric"
            placeholder="Max"
            value={filters.priceMax}
            onChange={(e) => set("priceMax", e.target.value.replace(/\D/g, ""))}
          />
        </div>
      </div>

      <Separator />

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Min Battery Health</Label>
          <span className="text-sm tabular-nums text-foreground">{filters.battery}%</span>
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
        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Condition</Label>
        <Select value={filters.condition} onValueChange={(v) => set("condition", v)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">Any condition</SelectItem>
            <SelectItem value="Mint">Mint</SelectItem>
            <SelectItem value="Good">Good</SelectItem>
            <SelectItem value="Fair">Fair</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <div className="flex items-center justify-between">
        <Label htmlFor="warranty" className="text-sm">Warranty remaining</Label>
        <Switch id="warranty" checked={filters.warranty} onCheckedChange={(v) => set("warranty", v)} />
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="box" className="text-sm">Box included</Label>
        <Switch id="box" checked={filters.box} onCheckedChange={(v) => set("box", v)} />
      </div>

      <button
        onClick={() => onChange(defaultFilters)}
        className="w-full rounded-md border border-border py-2 text-xs uppercase tracking-wider text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      >
        Reset filters
      </button>
    </aside>
  );
}
