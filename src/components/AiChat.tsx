import { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Send,
  Loader2,
  BatteryMedium,
  ShieldCheck,
  Package,
  Clock,
  ChevronDown,
  ChevronUp,
  Star,
  Zap,
  ArrowRight,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatPrice } from "@/lib/products";
import { GoogleGenAI } from "@google/genai";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string;
const API_BASE = import.meta.env.VITE_API_URL ?? "";

interface DeviceRecommendation {
  id: string;
  model: string;
  brand: string;
  category: string;
  price_bdt: number;
  battery_health: number;
  condition: string;
  color: string;
  storage_gb: number;
  warranty_months: number;
  box_included: boolean;
  source: string;
  deal_score: number;
  rank: number;
  match_type: "exact" | "upgrade" | "alternative" | "budget";
  why_recommended: string;
  vs_desired: string;
}

interface AiResponse {
  reply: string;
  verdict: "BUY" | "WAIT" | "SWITCH" | "EXPLORE";
  verdict_reason: string;
  timing_advice: string;
  urgency_advice: string;
  recommendations: DeviceRecommendation[];
  comparison_note: string;
  market_insight: string;
}

interface AssistantMessage {
  role: "assistant";
  content: string;
  data?: AiResponse;
}

type Message = { role: "user"; content: string } | AssistantMessage;

const VERDICT_CONFIG = {
  BUY: {
    label: "BUY NOW",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
    icon: TrendingUp,
  },
  WAIT: {
    label: "WAIT",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    icon: Clock,
  },
  SWITCH: {
    label: "SWITCH MODEL",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
    icon: ArrowRight,
  },
  EXPLORE: {
    label: "EXPLORE",
    color: "bg-accent/15 text-accent border-accent/30",
    icon: Sparkles,
  },
};

const MATCH_TYPE_BADGE = {
  exact: {
    label: "Your Pick",
    color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
  },
  upgrade: {
    label: "Upgrade",
    color: "bg-blue-500/15 text-blue-400 border-blue-500/30",
  },
  alternative: {
    label: "Alternative",
    color: "bg-accent/15 text-accent border-accent/30",
  },
  budget: {
    label: "Budget Pick",
    color: "bg-amber-500/15 text-amber-400 border-amber-500/30",
  },
};

function DeviceCard({ device }: { device: DeviceRecommendation }) {
  const [open, setOpen] = useState(device.rank <= 3);
  const badge = MATCH_TYPE_BADGE[device.match_type] ?? MATCH_TYPE_BADGE.alternative;

  return (
    <div
      className={`rounded-xl border transition-colors ${
        device.rank === 1
          ? "border-accent/50 bg-accent/5"
          : "border-border bg-card/50"
      }`}
    >
      <button className="w-full p-4 text-left" onClick={() => setOpen((v) => !v)}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 min-w-0">
            <span
              className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                device.rank === 1
                  ? "bg-accent text-accent-foreground"
                  : "bg-secondary text-muted-foreground"
              }`}
            >
              {device.rank}
            </span>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5 mb-0.5">
                <span
                  className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${badge.color}`}
                >
                  {badge.label}
                </span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {device.source}
                </span>
              </div>
              <p className="font-semibold text-foreground leading-tight">{device.model}</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                {device.color} · {device.storage_gb}GB
              </p>
            </div>
          </div>

          <div className="flex shrink-0 flex-col items-end gap-1.5">
            <p className="font-bold text-foreground tabular-nums">
              {formatPrice(device.price_bdt)}
            </p>
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
              <span className="text-xs text-muted-foreground">{device.deal_score}/100</span>
            </div>
            {open ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        <div className="mt-3 flex flex-wrap gap-1.5">
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            <BatteryMedium className="h-3 w-3" /> {device.battery_health}%
          </span>
          <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
            {device.condition}
          </span>
          {device.warranty_months > 0 && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              <ShieldCheck className="h-3 w-3" /> {device.warranty_months}mo warranty
            </span>
          )}
          {device.box_included && (
            <span className="inline-flex items-center gap-1 rounded-full border border-border bg-background px-2 py-0.5 text-[11px] text-muted-foreground">
              <Package className="h-3 w-3" /> Box included
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border px-4 pb-4 pt-3 space-y-2">
          <div className="flex items-start gap-2 rounded-lg bg-accent/10 border border-accent/20 p-3">
            <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-accent" />
            <p className="text-xs leading-relaxed text-muted-foreground">
              <span className="font-semibold text-accent">AI says · </span>
              {device.why_recommended}
            </p>
          </div>
          {device.vs_desired && (
            <div className="flex items-start gap-2 rounded-lg bg-secondary/50 p-3">
              <ArrowRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">vs. your search · </span>
                {device.vs_desired}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function AiMessage({ msg }: { msg: AssistantMessage }) {
  const data = msg.data;

  if (!data) {
    return (
      <div className="flex gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
          <Sparkles className="h-4 w-4 text-accent" />
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3 max-w-[85%]">
          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
        </div>
      </div>
    );
  }

  const verdictCfg = VERDICT_CONFIG[data.verdict] ?? VERDICT_CONFIG.EXPLORE;
  const VerdictIcon = verdictCfg.icon;

  return (
    <div className="flex gap-3">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
        <Sparkles className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0 flex-1 space-y-4">
        <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
          <p className="text-sm leading-relaxed">{data.reply}</p>
        </div>

        <div
          className={`flex items-start gap-3 rounded-xl border px-4 py-3 ${verdictCfg.color}`}
        >
          <VerdictIcon className="mt-0.5 h-5 w-5 shrink-0" />
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-0.5">
              Verdict: {verdictCfg.label}
            </p>
            <p className="text-xs leading-relaxed opacity-90">{data.verdict_reason}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5">
            <Clock className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                Timing
              </p>
              <p className="text-xs leading-relaxed text-foreground">{data.timing_advice}</p>
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-card/50 px-3 py-2.5">
            <Zap className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <div>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-0.5">
                Your Urgency
              </p>
              <p className="text-xs leading-relaxed text-foreground">{data.urgency_advice}</p>
            </div>
          </div>
        </div>

        {data.recommendations && data.recommendations.length > 0 && (
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
              {data.recommendations.length} recommendations from marketplace
            </p>
            <div className="space-y-2">
              {data.recommendations.map((device) => (
                <DeviceCard key={`${device.id}-${device.rank}`} device={device} />
              ))}
            </div>
          </div>
        )}

        {(data.comparison_note || data.market_insight) && (
          <div className="rounded-xl border border-border bg-card/30 px-4 py-3 space-y-2">
            {data.comparison_note && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Comparison · </span>
                {data.comparison_note}
              </p>
            )}
            {data.market_insight && (
              <p className="text-xs leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Market insight · </span>
                {data.market_insight}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const SUGGESTIONS = [
  "I want an iPhone 14 Pro under ৳90,000 in good condition",
  "Best Samsung Galaxy S23 deal with high battery health",
  "Looking for a MacBook Air M2 within ৳1,10,000 budget",
  "Compare Galaxy S24 vs iPhone 14 Pro for me",
  "Best phone under ৳60,000 with warranty and box",
  "Galaxy Z Fold 5 — is now a good time to buy?",
];

async function callGemini(
  messages: { role: string; content: string }[],
  urgency: string,
  devices: object[],
): Promise<AiResponse> {
  const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

  const lastUserMsg =
    [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const conversation = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join("\n");
  const devicesJson = JSON.stringify(devices, null, 2);

  const prompt = `You are an expert tech marketplace AI advisor for Bangladesh's second-hand device market.
You help buyers find the best deals on used phones, laptops, and tablets in BDT (Bangladeshi Taka).

URGENCY LEVEL: ${urgency}

AVAILABLE MARKETPLACE LISTINGS (JSON):
${devicesJson}

CONVERSATION SO FAR:
${conversation}

TASK:
Analyze the user's latest request: "${lastUserMsg}"

Respond with a JSON object (no markdown, no code fences, raw JSON only) with this EXACT structure:
{
  "reply": "A warm, helpful 2-3 sentence conversational message acknowledging their request and summarizing your analysis",
  "verdict": "BUY" or "WAIT" or "SWITCH" or "EXPLORE",
  "verdict_reason": "1-2 sentence explanation of the verdict considering urgency (${urgency})",
  "timing_advice": "Specific advice on market timing — whether prices are likely to drop, new models coming, etc.",
  "urgency_advice": "Specific advice based on urgency level",
  "recommendations": [
    {
      "id": "device id from data",
      "model": "full model name",
      "brand": "brand name",
      "category": "category",
      "price_bdt": number,
      "battery_health": number,
      "condition": "condition",
      "color": "color",
      "storage_gb": number,
      "warranty_months": number,
      "box_included": boolean,
      "source": "marketplace source",
      "deal_score": number,
      "rank": number (1 = best match),
      "match_type": "exact" or "upgrade" or "alternative" or "budget",
      "why_recommended": "2-3 sentence explanation of why this is a great pick for the user",
      "vs_desired": "brief comparison to what the user asked for, highlighting pros/cons"
    }
  ],
  "comparison_note": "Brief comparison between top picks, highlighting trade-offs",
  "market_insight": "1-2 sentences about the current second-hand market for this category in Bangladesh"
}

RULES:
- Return 10 to 15 recommendations from the available listings, ranked best to worst for the user's needs
- Always include the device they asked for (if available) AND better alternatives even if they are over budget (mark as "upgrade")
- Mark the closest budget-friendly option as "budget" match_type
- If nothing exactly matches, find the closest alternatives and mark as "alternative"
- Consider: battery health (higher is better), price vs budget, condition, warranty, box, deal score, color preference if mentioned
- Be opinionated — give a clear BUY/WAIT/SWITCH/EXPLORE verdict
- WAIT if: prices likely to drop soon, bad battery health, urgency is low
- BUY if: good deal, within budget, good battery, urgency is high or medium
- SWITCH if: a clearly better device is available at similar or lower price
- EXPLORE if: user hasn't specified enough — ask clarifying questions in the reply field
- Prices are in BDT (Bangladeshi Taka ৳)
- Return ONLY valid JSON, absolutely no text or explanation outside the JSON`;

  const response = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: prompt,
  });

  let text = response.text ?? "";
  text = text.trim();
  if (text.startsWith("```")) {
    text = text.replace(/^```[a-z]*\n?/, "").replace(/\n?```$/, "").trim();
  }

  return JSON.parse(text) as AiResponse;
}

export function AiChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [urgency, setUrgency] = useState("Medium - Can wait a few weeks");
  const [loading, setLoading] = useState(false);
  const [devices, setDevices] = useState<object[]>([]);
  const [keyMissing, setKeyMissing] = useState(!GEMINI_API_KEY);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch(`${API_BASE}/api/devices`)
      .then((r) => r.json())
      .then((d) => setDevices(d))
      .catch(() => {});
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (text?: string) => {
    const userText = (text ?? input).trim();
    if (!userText || loading) return;
    setInput("");

    const newUserMsg: Message = { role: "user", content: userText };
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setLoading(true);

    try {
      const chatHistory = updatedMessages.map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const data = await callGemini(chatHistory, urgency, devices);

      const assistantMsg: AssistantMessage = {
        role: "assistant",
        content: data.reply ?? "Here are my recommendations.",
        data,
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error(err);
      const errMsg =
        err instanceof Error && err.message.includes("401")
          ? "The Gemini API key appears to be invalid. Please check your key at ai.google.dev — it should start with 'AIza...'."
          : "Sorry, something went wrong reaching the AI. Please try again.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: errMsg },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const isEmpty = messages.length === 0;

  if (keyMissing) {
    return (
      <div className="flex flex-col items-center justify-center h-full px-6 py-12 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-destructive/10 mb-4">
          <AlertCircle className="h-7 w-7 text-destructive" />
        </div>
        <h2 className="font-display text-lg font-bold text-foreground mb-2">Gemini API Key Missing</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Add your Google AI Studio API key as the <code className="rounded bg-secondary px-1 py-0.5 text-xs font-mono">GEMINI_API_KEY</code> secret in Replit's Secrets panel, then restart the app.
        </p>
        <p className="mt-3 text-xs text-muted-foreground">
          Get your free key at <span className="text-accent font-medium">ai.google.dev</span>
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full px-4 py-12 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/20 mb-4">
              <Sparkles className="h-7 w-7 text-accent" />
            </div>
            <h2 className="font-display text-xl font-bold text-foreground mb-2">
              Tech 2 AI Advisor
            </h2>
            <p className="text-sm text-muted-foreground max-w-sm mb-8">
              Describe what you're looking for — budget, model, specs, urgency — and I'll find the
              best deals and tell you whether to buy, wait, or switch.
            </p>
            <div className="grid grid-cols-1 gap-2 w-full max-w-md sm:grid-cols-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => sendMessage(s)}
                  className="rounded-xl border border-border bg-secondary/50 px-3 py-2.5 text-left text-xs text-muted-foreground transition-colors hover:border-accent/40 hover:bg-accent/5 hover:text-foreground"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6 px-4 py-6">
            {messages.map((msg, i) =>
              msg.role === "user" ? (
                <div key={i} className="flex justify-end">
                  <div className="rounded-2xl rounded-tr-sm bg-accent px-4 py-3 max-w-[80%]">
                    <p className="text-sm text-accent-foreground">{msg.content}</p>
                  </div>
                </div>
              ) : (
                <AiMessage key={i} msg={msg as AssistantMessage} />
              ),
            )}

            {loading && (
              <div className="flex gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/20">
                  <Sparkles className="h-4 w-4 text-accent" />
                </div>
                <div className="rounded-2xl rounded-tl-sm bg-secondary px-4 py-3">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin text-accent" />
                    <span className="text-sm text-muted-foreground">
                      Scanning marketplace & analyzing deals…
                    </span>
                  </div>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="border-t border-border bg-background/80 backdrop-blur p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          <span className="text-xs text-muted-foreground">Urgency:</span>
          <Select value={urgency} onValueChange={setUrgency}>
            <SelectTrigger className="h-7 text-xs flex-1 max-w-[260px] border-border bg-secondary">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="High - I need a phone today">High — Need it today</SelectItem>
              <SelectItem value="Medium - Can wait a few weeks">
                Medium — Can wait a few weeks
              </SelectItem>
              <SelectItem value="Low - Just browsing for deals">Low — Just browsing</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            sendMessage();
          }}
        >
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Describe what you want — model, budget, color, specs…"
            className="flex-1 rounded-xl border-border bg-secondary text-sm focus-visible:ring-accent"
            disabled={loading}
          />
          <Button
            type="submit"
            size="icon"
            className="rounded-xl shrink-0"
            disabled={!input.trim() || loading}
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}
