/**
 * Global footer. Rendered once in __root.tsx so it appears on every page,
 * per spec. "About Us" / "Contact Us" are placeholder anchors — wire these
 * to real pages or a mailto: link whenever those exist.
 */
export function SiteFooter() {
  return (
    <footer className="border-t border-slate-200 bg-white mt-12">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span className="text-xs font-black uppercase tracking-wider text-slate-400 font-mono">
          Tech 2 — Live Aggregated Second-Hand Tech Marketplace
        </span>
        <div className="flex items-center gap-6 text-sm font-bold text-slate-500">
          <a href="#about" className="hover:text-blue-600 transition">
            About Us
          </a>
          <a href="#contact" className="hover:text-blue-600 transition">
            Contact Us
          </a>
        </div>
      </div>
    </footer>
  );
}