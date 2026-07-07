import iphone17promax from "@/assets/iphone17promax.jpg";
import iphone17pro from "@/assets/iphone17pro.jpg";
import iphone17e from "@/assets/iphone17e.jpg";
import iphone17 from "@/assets/iphone17.jpg";
import iphoneair from "@/assets/iphoneair.jpg";
import iphone16promax from "@/assets/iphone16promax.jpg";
import iphone16pro from "@/assets/iphone16pro.jpg";
import iphone16plus from "@/assets/iphone16plus.jpg";
import iphone16e from "@/assets/iphone16e.jpg";
import iphone16 from "@/assets/iphone16.jpg";
import iphone15promax from "@/assets/iphone15promax.jpg";
import iphone15pro from "@/assets/iphone15pro.jpg";
import iphone15plus from "@/assets/iphone15plus.jpg";
import iphone15 from "@/assets/iphone15.jpg";
import iphone14promax from "@/assets/iphone14promax.jpg";
import iphone14pro from "@/assets/iphone14pro.jpg";
import iphone14plus from "@/assets/iphone14plus.jpg";
import iphone14 from "@/assets/iphone14.jpg";
import iphone13promax from "@/assets/iphone13promax.jpg";
import iphone13pro from "@/assets/iphone13pro.jpg";
import iphone13mini from "@/assets/iphone13mini.jpg";
import iphone13 from "@/assets/iphone13.jpg";
import iphone12promax from "@/assets/iphone12promax.jpg";
import iphone12pro from "@/assets/iphone12pro.jpg";
import iphone12mini from "@/assets/iphone12mini.jpg";
import iphone12 from "@/assets/iphone12.jpg";
import iphone11promax from "@/assets/iphone11promax.jpg";
import iphone11pro from "@/assets/iphone11pro.jpg";
import iphone11 from "@/assets/iphone11.jpg";
import iphonexr from "@/assets/iphonexr.jpg";
import iphonexs from "@/assets/iphonexs.jpg";

import ipadpro from "@/assets/ipadpro.jpg";
import ipadair from "@/assets/ipadair.jpg";
import ipadmini from "@/assets/ipadmini.jpg";
import ipad from "@/assets/ipad.jpg";
import macbookair from "@/assets/macbookair.jpg";
import macbookpro from "@/assets/macbookpro.jpg";

import galaxys26ultra from "@/assets/galaxys26ultra.jpg";
import galaxys25ultra from "@/assets/galaxys25ultra.jpg";
import galaxys24ultra from "@/assets/galaxys24ultra.jpg";
import galaxys23ultra from "@/assets/galaxys23ultra.jpg";
import galaxys23fe from "@/assets/galaxys23fe.jpg";
import galaxys23 from "@/assets/galaxys23.jpg";
import galaxya16 from "@/assets/galaxya16.jpg";
import galaxyzfold from "@/assets/galaxyzfold.jpg";
import galaxyzflip from "@/assets/galaxyzflip.jpg";
import galaxytabs10fe from "@/assets/galaxytabs10fe.jpg";
import galaxytabs11ultra from "@/assets/galaxytabs11ultra.jpg";

import pixel10pro from "@/assets/pixel10pro.jpg";
import pixel10a from "@/assets/pixel10a.jpg";
import pixel10 from "@/assets/pixel10.jpg";
import pixel9pro from "@/assets/pixel9pro.jpg";
import pixel9a from "@/assets/pixel9a.jpg";
import pixel9 from "@/assets/pixel9.jpg";
import pixel8pro from "@/assets/pixel8pro.jpg";
import pixel8a from "@/assets/pixel8a.jpg";
import pixel8 from "@/assets/pixel8.jpg";
import pixel7pro from "@/assets/pixel7pro.jpg";
import pixel7a from "@/assets/pixel7a.jpg";
import pixel7 from "@/assets/pixel7.jpg";
import pixel6pro from "@/assets/pixel6pro.jpg";
import pixel6a from "@/assets/pixel6a.jpg";
import pixel6 from "@/assets/pixel6.jpg";
import pixelfold from "@/assets/pixelfold.jpg";

import motorola from "@/assets/motorola.jpg";
import sony from "@/assets/sony.jpg";
import xiaomi from "@/assets/xiaomi.jpg";
import cmf from "@/assets/cmf.jpg";

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

/**
 * Matches a raw scraped product name to the most specific available photo.
 * Ordered longest/most-specific phrase first within each product family so
 * e.g. "iPhone 14 Pro Max" resolves before the generic "iPhone 14" bucket,
 * and "iPhone 14" resolves before the generic "iPhone" catch-all.
 */
export function getProductImage(name: string): string {
  const n = name.toLowerCase();

  // ---- iPhone (check longest/most specific model strings first) ----
  if (n.includes("iphone 17 pro max")) return iphone17promax;
  if (n.includes("iphone 17 pro")) return iphone17pro;
  if (n.includes("iphone 17e")) return iphone17e;
  if (n.includes("iphone 17")) return iphone17;
  if (n.includes("iphone air")) return iphoneair;
  if (n.includes("iphone 16 pro max")) return iphone16promax;
  if (n.includes("iphone 16 pro")) return iphone16pro;
  if (n.includes("iphone 16 plus")) return iphone16plus;
  if (n.includes("iphone 16e")) return iphone16e;
  if (n.includes("iphone 16")) return iphone16;
  if (n.includes("iphone 15 pro max")) return iphone15promax;
  if (n.includes("iphone 15 pro")) return iphone15pro;
  if (n.includes("iphone 15 plus")) return iphone15plus;
  if (n.includes("iphone 15")) return iphone15;
  if (n.includes("iphone 14 pro max")) return iphone14promax;
  if (n.includes("iphone 14 pro")) return iphone14pro;
  if (n.includes("iphone 14 plus")) return iphone14plus;
  if (n.includes("iphone 14")) return iphone14;
  if (n.includes("iphone 13 pro max")) return iphone13promax;
  if (n.includes("iphone 13 pro")) return iphone13pro;
  if (n.includes("iphone 13 mini")) return iphone13mini;
  if (n.includes("iphone 13")) return iphone13;
  if (n.includes("iphone 12 pro max")) return iphone12promax;
  if (n.includes("iphone 12 pro")) return iphone12pro;
  if (n.includes("iphone 12 mini")) return iphone12mini;
  if (n.includes("iphone 12")) return iphone12;
  if (n.includes("iphone 11 pro max")) return iphone11promax;
  if (n.includes("iphone 11 pro")) return iphone11pro;
  if (n.includes("iphone 11")) return iphone11;
  if (n.includes("iphone xr")) return iphonexr;
  if (n.includes("iphone xs")) return iphonexs;
  if (n.includes("iphone")) return iphone14pro; // generic fallback

  // ---- iPad ----
  if (n.includes("ipad pro")) return ipadpro;
  if (n.includes("ipad air")) return ipadair;
  if (n.includes("ipad mini")) return ipadmini;
  if (n.includes("ipad")) return ipad;

  // ---- MacBook ----
  if (n.includes("macbook air")) return macbookair;
  if (n.includes("macbook pro") || n.includes("macbook")) return macbookpro;

  // ---- Samsung Galaxy Z / Tab (checked before generic "galaxy") ----
  if (n.includes("z fold") || n.includes("zfold")) return galaxyzfold;
  if (n.includes("z flip") || n.includes("zflip")) return galaxyzflip;
  if (n.includes("tab s10 fe") || n.includes("tab s10")) return galaxytabs10fe;
  if (n.includes("tab s11") || n.includes("tab s ultra")) return galaxytabs11ultra;
  if (n.includes("galaxy tab") || n.includes("tab s")) return galaxytabs11ultra;

  // ---- Samsung Galaxy S ----
  if (n.includes("s26 ultra")) return galaxys26ultra;
  if (n.includes("s25 ultra")) return galaxys25ultra;
  if (n.includes("s24 ultra")) return galaxys24ultra;
  if (n.includes("s23 ultra")) return galaxys23ultra;
  if (n.includes("s23 fe")) return galaxys23fe;
  if (n.includes("s23")) return galaxys23;
  if (n.includes("a16")) return galaxya16;
  if (n.includes("galaxy") || n.includes("samsung")) return galaxys23; // generic fallback

  // ---- Google Pixel ----
  if (n.includes("pixel fold")) return pixelfold;
  if (n.includes("pixel 10a")) return pixel10a;
  if (n.includes("pixel 10 pro") || n.includes("pixel 10pro")) return pixel10pro;
  if (n.includes("pixel 10")) return pixel10;
  if (n.includes("pixel 9a")) return pixel9a;
  if (n.includes("pixel 9 pro") || n.includes("pixel 9pro")) return pixel9pro;
  if (n.includes("pixel 9")) return pixel9;
  if (n.includes("pixel 8a")) return pixel8a;
  if (n.includes("pixel 8 pro") || n.includes("pixel 8pro")) return pixel8pro;
  if (n.includes("pixel 8")) return pixel8;
  if (n.includes("pixel 7a")) return pixel7a;
  if (n.includes("pixel 7 pro") || n.includes("pixel 7pro")) return pixel7pro;
  if (n.includes("pixel 7")) return pixel7;
  if (n.includes("pixel 6a")) return pixel6a;
  if (n.includes("pixel 6 pro") || n.includes("pixel 6pro")) return pixel6pro;
  if (n.includes("pixel 6")) return pixel6;
  if (n.includes("pixel") || n.includes("google")) return pixel8; // generic fallback

  // ---- Other brands ----
  if (n.includes("motorola") || n.includes("moto ")) return motorola;
  if (n.includes("sony") || n.includes("xperia")) return sony;
  if (n.includes("xiaomi") || n.includes("redmi") || n.includes("poco")) return xiaomi;
  if (n.includes("cmf") || n.includes("nothing")) return cmf;

  // Final generic fallback thumbnail for anything unrecognized
  // (Dell, Lenovo, Asus, HP, Microsoft, etc. — no dedicated art yet)
  return galaxys23;
}

// Ordered so more specific brands (Xiaomi/Redmi/Poco) are checked before
// generic catch-alls. Expanded well beyond Apple/Samsung since the real
// scraped inventory includes Xiaomi, Google, Motorola, Sony, CMF, Dell,
// Lenovo and more.
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
  [/\bmotorola\b|\bmoto\b/i, "Motorola"],
  [/\bsony\b|\bxperia\b/i, "Sony"],
  [/\bcmf\b|\bnothing\b/i, "Nothing"],
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