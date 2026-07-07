import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const WINDOW_SIZE = 5;

/** Squarish light-grey nav button for First/Prev/Next/Last. */
function NavButton({
  onClick,
  disabled,
  children,
  label,
}: {
  onClick: () => void;
  disabled: boolean;
  children: React.ReactNode;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-bold transition ${
        disabled
          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  // A sliding window of at most 5 page numbers, centered on the current page.
  let start = Math.max(1, currentPage - Math.floor(WINDOW_SIZE / 2));
  const end = Math.min(totalPages, start + WINDOW_SIZE - 1);
  start = Math.max(1, end - WINDOW_SIZE + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);

  return (
    <div className="flex items-center gap-1.5">
      <NavButton onClick={() => onPageChange(1)} disabled={currentPage === 1} label="First page">
        <ChevronsLeft className="h-4 w-4" />
      </NavButton>
      <NavButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </NavButton>

      {start > 1 && <span className="px-1 text-slate-400 text-sm select-none">...</span>}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`flex h-9 w-9 items-center justify-center rounded-md text-sm font-black transition ${
            page === currentPage ? "bg-teal-700 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {page}
        </button>
      ))}

      {end < totalPages && <span className="px-1 text-slate-400 text-sm select-none">...</span>}

      <NavButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </NavButton>
      <NavButton onClick={() => onPageChange(totalPages)} disabled={currentPage === totalPages} label="Last page">
        <ChevronsRight className="h-4 w-4" />
      </NavButton>
    </div>
  );
}