import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles } from "lucide-react";
import { fetchLiveProducts } from "@/lib/api";
import { enrichProduct } from "@/lib/products";
import { AIAdvisoryForm } from "@/components/AIAdvisoryForm";

export const Route = createFileRoute("/ai")({
  head: () => ({
    meta: [
      { title: "AI Advisor — Tech 2" },
      { name: "description", content: "Let the AI compare real listings and tell you whether to buy now or wait." },
    ],
  }),
  component: AIPage,
});

function AIPage() {
  const { data: rawProducts } = useQuery({
    queryKey: ["live-products"],
    queryFn: fetchLiveProducts,
    staleTime: 60_000,
  });

  const products = useMemo(() => (rawProducts ?? []).map((p, i) => enrichProduct(p, i)), [rawProducts]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/40 to-rose-50/50 font-sans text-slate-900 antialiased">
      <main className="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-600 shadow-lg">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">AI Advisor</h1>
            <p className="text-sm text-slate-500 font-medium">
              Compare real listings. Buy smart.
            </p>
          </div>
        </div>

        <AIAdvisoryForm
          persistKey="ai-page"
          allProducts={products}
          title="AI Advisory Search Engine"
          subtitle="Tell it the exact model you want — it compares real dealers and tells you whether to buy now or wait."
        />
      </main>
    </div>
  );
}
