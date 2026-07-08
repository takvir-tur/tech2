import type { LiveProduct } from "@/lib/products";
import { AppleProductCard } from "@/components/AppleProductCard";
import { ScrollReveal } from "@/components/ScrollReveal";

interface ProductShowcaseSectionProps {
  title: string;
  products: LiveProduct[];
}

/** A titled row of Apple-style product cards, used for the homepage "Best X" showcases. */
export function ProductShowcaseSection({ title, products }: ProductShowcaseSectionProps) {
  return (
    <section className="space-y-8">
      <ScrollReveal>
        <h2
          style={{ fontSize: "60px", fontWeight: 900, color: "#000000", letterSpacing: "-0.03em", lineHeight: 1.05 }}
        >
          {title}
        </h2>
      </ScrollReveal>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-5">
        {products.map((product, i) => (
          <ScrollReveal key={product.id} delayMs={Math.min(i, 5) * 80}>
            <AppleProductCard product={product} />
          </ScrollReveal>
        ))}
      </div>
    </section>
  );
}
