import { formatPrice, type LiveProduct } from "@/lib/products";
import { ProductLink } from "@/components/ProductLink";

interface AppleProductCardProps {
  product: LiveProduct;
}

/**
 * Product card styled after apple.com's "Explore the lineup" cards:
 * plain white surface, a large product photo, just the name + price as
 * text, and a "View details" / "Buy >" button pair at the bottom.
 */
export function AppleProductCard({ product }: AppleProductCardProps) {
  return (
    <div className="group flex flex-col items-center rounded-3xl bg-white border border-slate-200 shadow-sm hover:shadow-xl transition-shadow duration-300 p-6 text-center h-full">
      <div className="relative w-full aspect-[4/5] flex items-center justify-center overflow-hidden rounded-2xl bg-slate-50">
        <img
          src={product.image}
          alt={product.name}
          className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105"
        />
      </div>

      <h3 className="mt-6 text-xl font-bold text-black leading-snug line-clamp-2 min-h-[3.25rem] flex items-center">
        {product.name}
      </h3>
      <p className="mt-1.5 text-base font-medium text-slate-600">{formatPrice(product.price)}</p>

      <div className="mt-auto pt-5 flex items-center gap-3">
        <ProductLink
          product={product}
          className="inline-flex items-center rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
        >
          Details
        </ProductLink>

        {product.link && product.link.startsWith("http") ? (
          <a
            href={product.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Buy <span aria-hidden>›</span>
          </a>
        ) : (
          <ProductLink
            product={product}
            className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700"
          >
            Buy <span aria-hidden>›</span>
          </ProductLink>
        )}
      </div>
    </div>
  );
}
