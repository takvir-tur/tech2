import type { LiveProduct } from "@/lib/products";

/**
 * Selection logic for the homepage's "Best phones / laptops / iPads" rows.
 * These are NOT hardcoded/mock items — they are picked live out of whatever
 * the backend actually scraped (the same `/api/products` feed that powers
 * the rest of the app), so the homepage always reflects real inventory.
 */

// Noise tokens that vary between otherwise-identical listings of the same
// physical model: storage/RAM combos, colors/finishes, condition, SIM/
// connectivity variants, and carrier/region model codes.
const NOISE_PATTERNS: RegExp[] = [
  /\(.*?\)/g, // "(Black, X/A)" / "(Used)" style suffixes
  /\b\d+\s*\/\s*\d+\s*(gb|tb)?\b/gi, // "12/256GB", "8/512"
  /\b\d+(\.\d+)?\s?(gb|tb)\b/gi, // "256GB", "1TB"
  /\b(used|new|like new|excellent|good|fair|refurbished|minimal scratches)\b/gi,
  /\b(e-?sim|dual sim|single sim|5g|4g|wifi\s*\+?\s*cellular|wifi|cellular)\b/gi,
  /\b(nano-texture glass|standard glass)\b/gi,
  /\b[a-z]{1,3}\/[a-z]\b/gi, // region/model codes like "LL/A", "ZP/A", "X/A"
  /[^a-z0-9]+/gi,
];

/** Collapses variant-specific suffixes so near-duplicate listings of the same
 *  physical model (different color/storage/condition) only appear once per row. */
function modelKey(name: string): string {
  let key = name.toLowerCase();
  for (const pattern of NOISE_PATTERNS) key = key.replace(pattern, " ");
  return key.trim().replace(/\s+/g, " ");
}

/**
 * Groups by model key and keeps only the highest-priced listing per group
 * (assumes `products` is already sorted by whatever priority you want ties
 * broken by — pass price-descending in for "pick the flagship variant").
 */
function dedupeKeepingFirst(products: LiveProduct[]): LiveProduct[] {
  const seen = new Set<string>();
  const out: LiveProduct[] = [];
  for (const p of products) {
    const key = modelKey(p.name);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

const byPriceDesc = (a: LiveProduct, b: LiveProduct) => (b.price as number) - (a.price as number);

/**
 * Flagship Apple + Samsung phones from live inventory, preferring listings
 * priced within ৳90,000–110,000. If the live scrape doesn't have 6 distinct
 * models in that exact band, we fill in with the closest-priced Apple/
 * Samsung flagships so the row still shows real, currently-available
 * listings.
 */
export function selectBestPhones(products: LiveProduct[], limit = 6): LiveProduct[] {
  const isFlagshipBrand = (p: LiveProduct) => p.brand === "Apple" || p.brand === "Samsung";
  const phones = products.filter((p) => p.category === "phone" && isFlagshipBrand(p) && p.price != null);

  const inBandSorted = phones
    .filter((p) => (p.price as number) >= 90_000 && (p.price as number) <= 110_000)
    .sort(byPriceDesc);
  const inBand = dedupeKeepingFirst(inBandSorted);

  if (inBand.length >= limit) return inBand.slice(0, limit);

  const usedKeys = new Set(inBand.map((p) => modelKey(p.name)));
  const nearestSorted = phones
    .filter((p) => !usedKeys.has(modelKey(p.name)))
    .sort((a, b) => Math.abs((a.price as number) - 100_000) - Math.abs((b.price as number) - 100_000));
  const nearest = dedupeKeepingFirst(nearestSorted);

  return [...inBand, ...nearest].slice(0, limit);
}

/** Top-priced (i.e. top-tier/flagship) live listings for a given category. */
export function selectTopByCategory(
  products: LiveProduct[],
  category: "laptop" | "tablet",
  limit = 6
): LiveProduct[] {
  const candidatesSorted = products
    .filter((p) => p.category === category && p.price != null)
    .sort(byPriceDesc);
  return dedupeKeepingFirst(candidatesSorted).slice(0, limit);
}
