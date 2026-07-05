import iphone14pro from "@/assets/iphone14pro.jpg";
import iphone13 from "@/assets/iphone13.jpg";
import macbookair from "@/assets/macbookair.jpg";
import macbookpro from "@/assets/macbookpro.jpg";
import ipadpro from "@/assets/ipadpro.jpg";
import galaxys23 from "@/assets/galaxys23.jpg";
import zfold5 from "@/assets/zfold5.jpg";
import galaxytab from "@/assets/galaxytab.jpg";
import type { RawProduct } from "@/lib/api";

/**
 * A live, scraped listing enriched with a stable id, inferred brand and a
 * representative thumbnail. This is the shape every component in the app
 * should render — there is no more static/mock product data.
 */
export interface LiveProduct extends RawProduct {
  id: string;
  brand: string;
  image: string;
}

export function getProductImage(name: string): string {
  const n = name.toLowerCase();
  if (n.includes("z fold") || n.includes("z flip")) return zfold5;
  if (n.includes("galaxy tab") || n.includes("tab s")) return galaxytab;
  if (n.includes("ipad")) return ipadpro;
  if (n.includes("macbook air")) return macbookair;
  if (n.includes("macbook pro") || n.includes("macbook")) return macbookpro;
  if (n.includes("iphone 13")) return iphone13;
  if (n.includes("iphone")) return iphone14pro;
  if (n.includes("galaxy") || n.includes("samsung")) return galaxys23;
  // Generic fallback thumbnail for brands we don't have dedicated art for yet
  // (Xiaomi, Google Pixel, OnePlus, Dell, Lenovo, etc.)
  return galaxys23;
}

// Ordered so more specific brands (Xiaomi/Redmi/Poco) are checked before
// generic catch-alls. Expanded well beyond Apple/Samsung since the real
// scraped inventory includes Xiaomi, Google, Dell, Lenovo and more.
const BRAND_PATTERNS: [RegExp, string][] = [
  [/\biphone\b|\bipad\b|\bmacbook\b|apple\s?watch|\bapple\b/i, "Apple"],
  [/\bsamsung\b|\bgalaxy\b/i, "Samsung"],
  [/\bxiaomi\b|\bredmi\b|\bpoco\b/i, "Xiaomi"],
  [/\bpixel\b|\bgoogle\b/i, "Google"],
  [/\boneplus\b/i, "OnePlus"],
  [/\bhuawei\b|\bhonor\b/i, "Huawei"],
  [/\boppo\b/i, "Oppo"],
  [/\bvivo\b/i, "Vivo"],
  [/\brealme\b/i, "Realme"],
  [/\bdell\b|\bxps\b/i, "Dell"],
  [/\blenovo\b|\bthinkpad\b/i, "Lenovo"],
  [/\basus\b/i, "Asus"],
  [/\bhp\b|hewlett/i, "HP"],
  [/\bmicrosoft\b|\bsurface\b/i, "Microsoft"],
];

export function inferBrand(name: string): string {
  for (const [pattern, brand] of BRAND_PATTERNS) {
    if (pattern.test(name)) return brand;
  }
  return "Other";
}

export function inferCategory(name: string): "Phone" | "Laptop" | "Tablet" {
  const n = name.toLowerCase();
  if (n.includes("macbook") || n.includes("laptop") || n.includes("notebook")) return "Laptop";
  if (n.includes("ipad") || n.includes("galaxy tab") || n.includes("tab s")) return "Tablet";
  return "Phone";
}

export const formatPrice = (n: number | null | undefined) =>
  n == null ? "Price N/A" : "৳ " + new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(n);

/**
 * Turns a raw backend listing (from /api/products) into a display-ready
 * product: adds a stable id, inferred brand and a representative thumbnail.
 */
export function enrichProduct(raw: RawProduct, index: number): LiveProduct {
  return {
    ...raw,
    id: `${raw.source}-${raw.name}-${raw.price ?? "na"}-${index}`.toLowerCase().replace(/\s+/g, "-"),
    brand: inferBrand(raw.name),
    image: getProductImage(raw.name),
  };
}