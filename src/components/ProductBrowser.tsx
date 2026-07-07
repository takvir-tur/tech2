import { useEffect, useMemo, useState } from "react";
import { Loader2, AlertCircle, SlidersHorizontal } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatPrice, type LiveProduct } from "@/lib/products";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { BrandLogoCard } from "@/components/BrandLogoCard";
import { PaginationControls } from "@/components/PaginationControls";

// Increased significantly from the old ৳220,000 ceiling so high-end laptops
// and flagship phones aren't clipped by the price filter.
const MAX_PRICE = 500_000;
const MIN_BATTERY_FLOOR = 60;
const PAGE_SIZE = 12;

const CONDITION_RANK: Record<string, number> = {
  excellent: 5,
  "apple replacement": 5,
  good: 4,
  "minimal scratches on display": 3.5,
  refurbished: 3,
  used: 2,
  fair: 1,
};
function conditionRank(c: string | null): number {
  return c ? CONDITION_RANK[c.toLowerCase()] ?? 2.5 : 2.5;
}

type SortOption = "price-asc" | "price-desc" | "battery-desc" | "condition-desc";

/** Small "+/-" style expandable filter section. */
function FilterSection({
  title,
  children,
  defaultOpen = true,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border-b border-slate-200 py-3">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between text-xs font-black uppercase tracking-wider text-slate-700"
      >
        {title}
        <span className="flex h-5 w-5 items-center justify-center rounded-full border border-slate-300 text-sm font-black text-slate-500 leading-none">
          {open ? "\u2212" : "+"}
        </span>
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

interface ProductBrowserProps {
  /** Pre-scoped set to browse — already filtered by category, or by a search query. */
  browseProducts: LiveProduct[];
  /** Full live catalog, used only for the modal's storage-variant lookups. */
  allProducts: LiveProduct[];
  isLoading: boolean;
  isError: boolean;
  /** Shows the logo-card brand row + filters by it. Off on the search page. */
  showBrandNav?: boolean;
}

export function ProductBrowser({
  browseProducts,
  allProducts,
  isLoading,
  isError,
  showBrandNav = true,
}: ProductBrowserProps) {
  const brands = useMemo(() => {
    if (!showBrandNav) return [];
    const set = new Set<string>();
    browseProducts.forEach((p) => set.add(p.brand));
    return ["All", ...Array.from(set).sort()];
  }, [browseProducts, showBrandNav]);

  const [selectedBrand, setSelectedBrand] = useState("All");

  const [priceRange, setPriceRange] = useState<[number, number]>([0, MAX_PRICE]);
  const [minBattery, setMinBattery] = useState(MIN_BATTERY_FLOOR);
  const [selectedConditions, setSelectedConditions] = useState<string[]>([]);
  const [selectedStorages, setSelectedStorages] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<SortOption>("price-asc");
  const [currentPage, setCurrentPage] = useState(1);

  const availableConditions = useMemo(() => {
    const set = new Set<string>();
    browseProducts.forEach((p) => p.condition && set.add(p.condition));
    return Array.from(set).sort();
  }, [browseProducts]);

  const availableStorages = useMemo(() => {
    const set = new Set<string>();
    browseProducts.forEach((p) => p.storage && set.add(p.storage));
    return Array.from(set).sort();
  }, [browseProducts]);

  const toggleCondition = (c: string) => {
    setSelectedConditions((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));
  };
  const toggleStorage = (s: string) => {
    setSelectedStorages((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));
  };

  const filtered = useMemo(() => {
    return browseProducts.filter((p) => {
      if (showBrandNav && selectedBrand !== "All" && p.brand !== selectedBrand) return false;
      if (p.price != null && (p.price < priceRange[0] || p.price > priceRange[1])) return false;
      if (minBattery > MIN_BATTERY_FLOOR && p.battery != null && p.battery < minBattery) return false;
      if (selectedConditions.length > 0 && (!p.condition || !selectedConditions.includes(p.condition))) return false;
      if (selectedStorages.length > 0 && (!p.storage || !selectedStorages.includes(p.storage))) return false;
      return true;
    });
  }, [browseProducts, showBrandNav, selectedBrand, priceRange, minBattery, selectedConditions, selectedStorages]);

  const sorted = useMemo(() => {
    const list = [...filtered];
    switch (sortBy) {
      case "price-asc":
        return list.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
      case "price-desc":
        return list.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity));
      case "battery-desc":
        return list.sort((a, b) => (b.battery ?? -1) - (a.battery ?? -1));
      case "condition-desc":
        return list.sort((a, b) => conditionRank(b.condition) - conditionRank(a.condition));
      default:
        return list;
    }
  }, [filtered, sortBy]);

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedBrand, priceRange, minBattery, selectedConditions, selectedStorages, sortBy]);

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const pageItems = sorted.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const gridGhostCount = pageItems.length > 0 ? PAGE_SIZE - pageItems.length : 0;

  const [modalProduct, setModalProduct] = useState<LiveProduct | null>(null);

  return (
    <div className="space-y-8">
      {isError && (
        <div className="rounded-2xl border-2 border-dashed border-rose-300 bg-rose-50 p-6 text-center text-sm font-bold text-rose-600">
          Couldn't reach the live inventory API. Make sure the backend is running on port 8000.
        </div>
      )}

      {/* Top nav: logo-card brand filter, "All" selected by default */}
      {showBrandNav && brands.length > 0 && (
        <div className="flex flex-wrap gap-3 border-b border-slate-200 pb-4">
          {brands.map((b) =>
            b === "All" ? (
              <button
                key={b}
                onClick={() => setSelectedBrand(b)}
                className={`flex h-10 w-24 shrink-0 items-center justify-center rounded-xl border-2 text-sm font-black transition ${
                  selectedBrand === b
                    ? "border-teal-600 bg-teal-600 text-white ring-2 ring-teal-500/30"
                    : "border-slate-200 bg-white text-slate-600 hover:border-teal-400"
                }`}
              >
                All
              </button>
            ) : (
              <BrandLogoCard key={b} brand={b} selected={selectedBrand === b} onClick={() => setSelectedBrand(b)} />
            )
          )}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Sidebar: filters + sorting */}
        <aside className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm lg:sticky lg:top-20">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
            <SlidersHorizontal className="h-4 w-4 text-teal-600" />
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700">Filters</h3>
          </div>

          <div className="py-3 border-b border-slate-200 space-y-1.5">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Sort By</span>
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-full h-10">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="price-asc">Price: Low to High</SelectItem>
                <SelectItem value="price-desc">Price: High to Low</SelectItem>
                <SelectItem value="battery-desc">Battery Health: High to Low</SelectItem>
                <SelectItem value="condition-desc">Best Condition First</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="py-3 border-b border-slate-200 space-y-3">
            <span className="text-xs font-black uppercase tracking-wider text-slate-700">Price Range</span>
            <Slider
              value={priceRange}
              onValueChange={(val) => setPriceRange([val[0], val[1]] as [number, number])}
              min={0}
              max={MAX_PRICE}
              step={1000}
            />
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={priceRange[0]}
                min={0}
                max={priceRange[1]}
                onChange={(e) => setPriceRange([Number(e.target.value), priceRange[1]])}
                className="h-9 text-xs"
              />
              <span className="text-slate-400 text-xs">to</span>
              <Input
                type="number"
                value={priceRange[1]}
                min={priceRange[0]}
                max={MAX_PRICE}
                onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="py-3 border-b border-slate-200 space-y-2">
            <div className="flex justify-between items-baseline">
              <span className="text-xs font-black uppercase tracking-wider text-slate-700">Min Battery Health</span>
              <span className="text-sm font-black text-teal-600 font-mono">{minBattery}%+</span>
            </div>
            <Slider
              value={[minBattery]}
              onValueChange={(val) => setMinBattery(val[0])}
              min={MIN_BATTERY_FLOOR}
              max={100}
              step={5}
            />
            <p className="text-[10px] text-slate-400">Listings with unknown battery health are always kept.</p>
          </div>

          <FilterSection title="Condition">
            {availableConditions.length === 0 ? (
              <p className="text-xs text-slate-400">No condition data available yet.</p>
            ) : (
              availableConditions.map((c) => (
                <label key={c} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <Checkbox checked={selectedConditions.includes(c)} onCheckedChange={() => toggleCondition(c)} />
                  {c}
                </label>
              ))
            )}
          </FilterSection>

          <FilterSection title="RAM | ROM">
            <p className="text-[11px] text-slate-400 -mt-1 mb-1">
              Only storage (ROM) is tracked in the scraped data — RAM isn't available per listing.
            </p>
            {availableStorages.length === 0 ? (
              <p className="text-xs text-slate-400">No storage data available yet.</p>
            ) : (
              availableStorages.map((s) => (
                <label key={s} className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer">
                  <Checkbox checked={selectedStorages.includes(s)} onCheckedChange={() => toggleStorage(s)} />
                  {s}
                </label>
              ))
            )}
          </FilterSection>
        </aside>

        {/* Main content: grid + pagination */}
        <div className="lg:col-span-9 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-slate-300 bg-white p-10 text-slate-500">
              <Loader2 className="h-5 w-5 animate-spin" /> Loading live listings…
            </div>
          ) : pageItems.length === 0 ? (
            <div className="rounded-2xl border-2 border-dashed border-slate-300 py-24 text-center text-slate-500 bg-white shadow-inner flex flex-col items-center justify-center p-6">
              <AlertCircle className="h-10 w-10 text-slate-400 mb-2" />
              <p className="font-black text-lg text-slate-800">No Matching Listings</p>
              <p className="text-sm font-medium text-slate-400 mt-1 max-w-sm">Adjust the filters to widen your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {pageItems.map((product) => (
                <button
                  key={product.id}
                  onClick={() => setModalProduct(product)}
                  className="text-left rounded-2xl border border-slate-200 bg-white shadow-sm hover:border-teal-400 hover:shadow-md hover:-translate-y-0.5 transition overflow-hidden"
                >
                  <div className="aspect-[4/3] w-full bg-slate-100 overflow-hidden">
                    <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
                  </div>
                  <div className="p-4 space-y-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-teal-600">{product.brand}</span>
                    <h4 className="font-black text-slate-900 tracking-tight text-base line-clamp-1">{product.name}</h4>
                    <p className="text-sm font-black text-slate-900 font-mono">
                      Starting from {formatPrice(product.price)}
                    </p>
                  </div>
                </button>
              ))}
              {Array.from({ length: gridGhostCount }, (_, i) => (
                <div key={`grid-ghost-${i}`} aria-hidden className="invisible aspect-[4/3]" />
              ))}
            </div>
          )}

          <div className="flex justify-end">
            <PaginationControls currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        </div>
      </div>

      <ProductQuickViewModal
        product={modalProduct}
        allProducts={allProducts}
        onClose={() => setModalProduct(null)}
        onSelectVariant={(p) => setModalProduct(p)}
      />
    </div>
  );
}