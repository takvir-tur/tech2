import type { Product } from "./products";

export interface DealBadge {
  label: "Great Deal" | "Fair Price" | "Overpriced";
  className: string;
  score: 1 | 2 | 3;
}

export function getDealBadge(p: Product): DealBadge {
  if (p.dealScore >= 85)
    return {
      label: "Great Deal",
      className: "bg-accent/10 text-accent border-accent/30",
      score: 3,
    };
  if (p.dealScore >= 72)
    return {
      label: "Fair Price",
      className: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      score: 2,
    };
  return {
    label: "Overpriced",
    className: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    score: 1,
  };
}

export function generateTrendPoints(currentPrice: number) {
  const factors = [1.12, 1.09, 1.05, 1.04, 1.01, 1.0];
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"];
  return months.map((month, i) => ({
    month,
    price: Math.round(currentPrice * factors[i]),
  }));
}
