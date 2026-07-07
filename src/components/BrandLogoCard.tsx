import { useState } from "react";

/**
 * IMPORTANT: Real brand logos (Apple, Samsung, etc.) are trademarked/
 * copyrighted, so none are bundled here. This component expects YOU to
 * supply official logo files (from each brand's press/media kit, or your
 * own licensed assets) at:
 *
 *   public/brand-logos/<lowercase-brand-name>.png
 *   e.g. public/brand-logos/apple.png, public/brand-logos/samsung.png
 *
 * If a file is missing, it gracefully falls back to a text wordmark so the
 * layout never breaks — you'll just see brand names as text until you drop
 * the real logo files in.
 */
function logoPathFor(brand: string): string {
  return `/src/assets/brands/${brand.toLowerCase().replace(/\s+/g, "-")}.png`;
}

interface BrandLogoCardProps {
  brand: string;
  selected: boolean;
  onClick: () => void;
}

export function BrandLogoCard({ brand, selected, onClick }: BrandLogoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <button
      onClick={onClick}
      title={brand}
      className={`flex h-10 w-24 shrink-0 items-center justify-center rounded-xl border-2 bg-white p-2 shadow-sm transition ${
        selected ? "border-teal-600 ring-2 ring-teal-500/30" : "border-slate-200 hover:border-teal-400"
      }`}
    >
      {imageFailed ? (
        <span className="text-xs font-black text-slate-600 text-center leading-tight">{brand}</span>
      ) : (
        <img
          src={logoPathFor(brand)}
          alt={brand}
          className="h-full w-full object-contain"
          onError={() => setImageFailed(true)}
        />
      )}
    </button>
  );
}