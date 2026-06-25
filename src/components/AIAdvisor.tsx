import { useState } from "react";
import { Sparkles, Loader2, TrendingUp, ShoppingCart, Clock, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const MODELS = [
  "iPhone 13", "iPhone 14", "iPhone 14 Pro", "iPhone 14 Pro Max",
  "iPhone 15", "iPhone 15 Pro", "iPhone 15 Pro Max",
  "iPad Pro 11\"", "iPad Pro 12.9\"", "iPad Air",
  "MacBook Air M2", "MacBook Air M3", "MacBook Pro 14\" M3",
  "Samsung Galaxy S23", "Samsung Galaxy S23 Ultra",
  "Samsung Galaxy S24", "Samsung Galaxy S24 Ultra",
  "Samsung Galaxy Z Fold 5", "Samsung Galaxy Tab S9",
];

type Verdict = "BUY NOW" | "WAIT" | "SWITCH MODEL";

function VerdictBadge({ text }: { text: string }) {
  const verdict = text.toUpperCase();
  if (verdict.includes("BUY")) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/15 px-3 py-1 text-sm font-bold text-green-400">
      <ShoppingCart className="h-3.5 w-3.5" /> BUY NOW
    </span>
  );
  if (verdict.includes("WAIT")) return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-500/15 px-3 py-1 text-sm font-bold text-yellow-400">
      <Clock className="h-3.5 w-3.5" /> WAIT
    </span>
  );
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-500/15 px-3 py-1 text-sm font-bold text-blue-400">
      <RefreshCw className="h-3.5 w-3.5" /> SWITCH MODEL
    </span>
  );
}

function parseVerdict(text: string): Verdict | null {
  const upper = text.toUpperCase();
  if (upper.includes("BUY NOW")) return "BUY NOW";
  if (upper.includes("WAIT")) return "WAIT";
  if (upper.includes("SWITCH MODEL")) return "SWITCH MODEL";
  return null;
}

function formatAIResponse(raw: string) {
  const sections = raw.split(/^##\s+/m).filter(Boolean);
  return sections.map((section, i) => {
    const [heading, ...rest] = section.split("\n");
    const body = rest.join("\n").trim();
    const isVerdict = heading.toUpperCase().startsWith("VERDICT");
    const verdict = isVerdict ? parseVerdict(heading) : null;

    return (
      <div key={i} className="space-y-2">
        <div className="flex items-center gap-2">
          {isVerdict && verdict ? (
            <VerdictBadge text={heading} />
          ) : (
            <h3 className="text-sm font-semibold text-foreground">{heading.trim()}</h3>
          )}
        </div>
        <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
          {body}
        </div>
      </div>
    );
  });
}

export function AIAdvisor() {
  const [model, setModel] = useState("");
  const [budget, setBudget] = useState("");
  const [urgency, setUrgency] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!model || !budget || !urgency) return;
    setLoading(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch("/api/get_recommendation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          desired_model: model,
          budget: parseInt(budget),
          urgency,
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);
      const data = await res.json();
      setResult(data.ai_verdict);
    } catch (err) {
      setError("Could not reach the AI backend. Make sure it is running.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="rounded-2xl border border-accent/30 bg-card p-6 space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-accent" />
        <h2 className="text-base font-semibold text-foreground">AI Advisor</h2>
        <span className="rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider text-accent">
          Powered by GPT
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Desired Model</Label>
          <Select value={model} onValueChange={setModel}>
            <SelectTrigger>
              <SelectValue placeholder="Select a model…" />
            </SelectTrigger>
            <SelectContent>
              {MODELS.map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Budget (BDT)</Label>
          <Input
            inputMode="numeric"
            placeholder="e.g. 80000"
            value={budget}
            onChange={(e) => setBudget(e.target.value.replace(/\D/g, ""))}
          />
        </div>

        <div className="space-y-1.5">
          <Label className="text-xs uppercase tracking-wider text-muted-foreground">Urgency</Label>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger>
              <SelectValue placeholder="How soon do you need it?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="urgent">Urgent — need it this week</SelectItem>
              <SelectItem value="flexible">Flexible — within a month</SelectItem>
              <SelectItem value="patient">Patient — can wait for the best deal</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button
          type="submit"
          disabled={loading || !model || !budget || !urgency}
          className="w-full gap-2"
        >
          {loading ? (
            <><Loader2 className="h-4 w-4 animate-spin" /> Analysing market…</>
          ) : (
            <><TrendingUp className="h-4 w-4" /> Get AI Recommendation</>
          )}
        </Button>
      </form>

      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      {result && (
        <div className="space-y-4 border-t border-border pt-4">
          {formatAIResponse(result)}
        </div>
      )}
    </section>
  );
}
