import { useEffect, useState } from "react";
import { Sparkles, X } from "lucide-react";
import { usePersistedState } from "@/lib/store";

interface AINudgePopupProps {
  /** Unique per page (e.g. "phone-ai-nudge" or "search-ai-nudge") so dismissing one page's nudge doesn't hide another's. */
  persistKey: string;
  /** The id of the AI Advisory section on this same page to scroll to. */
  scrollTargetId: string;
}

export function AINudgePopup({ persistKey, scrollTargetId }: AINudgePopupProps) {
  const [dismissed, setDismissed] = usePersistedState(persistKey, false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, [dismissed]);

  if (dismissed || !visible) return null;

  const handleTryIt = () => {
    setVisible(false);
    setDismissed(true);
    document.getElementById(scrollTargetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-sm rounded-2xl border-2 border-blue-500/30 bg-slate-900 p-4 shadow-2xl animate-in fade-in slide-in-from-bottom-4">
      <button
        onClick={handleDismiss}
        aria-label="Dismiss"
        className="absolute top-2 right-2 text-slate-500 hover:text-slate-300 transition"
      >
        <X className="h-4 w-4" />
      </button>
      <div className="flex gap-3 pr-4">
        <div className="shrink-0 p-2 bg-blue-500/20 rounded-xl text-blue-400 border border-blue-500/30 h-fit">
          <Sparkles className="h-4 w-4" />
        </div>
        <p className="text-sm font-semibold text-white leading-snug">
          Not sure which one to buy? Let AI find your perfect match.
        </p>
      </div>
      <div className="flex gap-2 mt-3">
        <button
          onClick={handleDismiss}
          className="flex-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-slate-700 transition"
        >
          No
        </button>
        <button
          onClick={handleTryIt}
          className="flex-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-700 transition"
        >
          Try It
        </button>
      </div>
    </div>
  );
}