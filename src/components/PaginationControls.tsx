import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const WINDOW_SIZE = 5;
const BUTTON_CLASS = "flex h-9 w-9 items-center justify-center rounded-md text-sm";

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
      className={`${BUTTON_CLASS} font-bold transition ${
        disabled
          ? "bg-slate-100 text-slate-300 cursor-not-allowed"
          : "bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-700"
      }`}
    >
      {children}
    </button>
  );
}

function Ellipsis() {
  return (
    <span className="flex h-9 w-5 items-center justify-center text-white text-white select-none">
      ...
    </span>
  );
}

/** Invisible placeholder that reserves the same footprint as a real page button. */
function GhostSlot() {
  return <span aria-hidden className={`${BUTTON_CLASS} invisible`}>0</span>;
}

export function PaginationControls({ currentPage, totalPages, onPageChange }: PaginationControlsProps) {
  if (totalPages <= 1) return null;

  let start = Math.max(1, currentPage - Math.floor(WINDOW_SIZE / 2));
  const end = Math.min(totalPages, start + WINDOW_SIZE - 1);
  start = Math.max(1, end - WINDOW_SIZE + 1);
  const pageNumbers = Array.from({ length: end - start + 1 }, (_, i) => start + i);
  const ghostCount = WINDOW_SIZE - pageNumbers.length;

  return (
    <div className="flex items-center gap-1">
      <NavButton onClick={() => onPageChange(currentPage - 1)} disabled={currentPage === 1} label="Previous page">
        <ChevronLeft className="h-4 w-4" />
      </NavButton>

      {start > 1 && <Ellipsis />}

      {pageNumbers.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`${BUTTON_CLASS} font-black transition ${
            page === currentPage ? "bg-teal-700 text-white" : "bg-teal-600 text-white hover:bg-teal-700"
          }`}
        >
          {page}
        </button>
      ))}
      {Array.from({ length: ghostCount }, (_, i) => (
        <GhostSlot key={`ghost-${i}`} />
      ))}

      {end < totalPages && <Ellipsis />}

      <NavButton onClick={() => onPageChange(currentPage + 1)} disabled={currentPage === totalPages} label="Next page">
        <ChevronRight className="h-4 w-4" />
      </NavButton>
    </div>
  );
}
