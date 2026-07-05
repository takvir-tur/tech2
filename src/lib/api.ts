import type { AIAnalysis } from "@/components/AIResults";

/**
 * Shape returned by backend/main.py's format_item() for every listing
 * coming out of /api/products and /api/ai-analyze.
 */
export interface RawProduct {
  name: string;
  price: number | null;
  battery: number | null;
  condition: string | null;
  warranty: string | null;
  box: boolean | null;
  storage: string | null;
  source: string;
  link: string;
  category: string; // "phone" | "tablet" | "laptop" (lowercase, from backend)
}

/** Fetches every deduplicated, scraped listing from the live backend. */
export async function fetchLiveProducts(): Promise<RawProduct[]> {
  const res = await fetch("/api/products");
  if (!res.ok) {
    throw new Error(`Failed to load live products (status ${res.status})`);
  }
  const data = await res.json();
  return Array.isArray(data?.products) ? data.products : [];
}

export interface AnalyzeParams {
  category: string;
  model: string;
  roms?: string[];
  budget: number;
  min_battery?: number;
  condition?: string;
  urgency?: string;
}

/** Calls the real AI advisory endpoint (Ollama locally, or OpenAI once configured). */
export async function analyzeAI(params: AnalyzeParams): Promise<AIAnalysis> {
  const res = await fetch("/api/ai-analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    throw new Error(`AI analysis request failed (status ${res.status})`);
  }
  return res.json();
}