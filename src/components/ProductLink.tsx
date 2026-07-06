import { Link } from "@tanstack/react-router";
import type { ReactNode, MouseEventHandler } from "react";
import type { LiveProduct } from "@/lib/products";

function capitalize(s: string): string {
  return s.length ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

interface ProductLinkProps {
  product: LiveProduct;
  className?: string;
  children: ReactNode;
  onClick?: MouseEventHandler;
}

/**
 * Every clickable listing in the app should use this instead of a raw
 * `<a href={product.link}>`. It routes to our own internal product detail
 * page (which shows specs + a clearly-labeled outbound link), rather than
 * immediately opening the real marketplace site.
 */
export function ProductLink({ product, className, children, onClick }: ProductLinkProps) {
  return (
    <Link
      to="/$category/$brand/product"
      params={{ category: capitalize(product.category), brand: product.brand }}
      search={{ name: product.name, source: product.source, price: product.price ?? undefined }}
      className={className}
      onClick={onClick}
    >
      {children}
    </Link>
  );
}