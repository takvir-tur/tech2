import { useEffect, useRef, useState } from "react";
import { TrendingDown } from "lucide-react";

export interface TrendPoint {
  month: string;
  price: number;
}

interface PriceTrendCardProps {
  deviceName?: string;
  points?: TrendPoint[];
  peak?: number;
  projected?: number;
}

const defaultPoints: TrendPoint[] = [
  { month: "Jan", price: 98000 },
  { month: "Feb", price: 96500 },
  { month: "Mar", price: 94000 },
  { month: "Apr", price: 94200 },
  { month: "May", price: 93000 },
  { month: "Jun", price: 92400 },
];

const padding = { top: 20, right: 20, bottom: 25, left: 20 };

export function PriceTrendCard({
  deviceName = "iPhone 14 Pro Max",
  points = defaultPoints,
  peak,
  projected,
}: PriceTrendCardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const coordsRef = useRef<{ x: number; y: number; raw: TrendPoint }[]>([]);
  const [tip, setTip] = useState<{ x: number; y: number; pt: TrendPoint } | null>(null);

  const peakValue = peak ?? Math.max(...points.map((p) => p.price));
  const projectedValue = projected ?? Math.round(points[points.length - 1].price * 0.99);

  const draw = (hoverIdx: number | null = null) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const graphWidth = rect.width - padding.left - padding.right;
    const graphHeight = rect.height - padding.top - padding.bottom;
    ctx.clearRect(0, 0, rect.width, rect.height);

    const prices = points.map((p) => p.price);
    const maxPrice = Math.max(...prices) * 1.02;
    const minPrice = Math.min(...prices) * 0.98;
    const range = maxPrice - minPrice || 1;

    const coords = points.map((pt, idx) => {
      const x = padding.left + (idx / (points.length - 1)) * graphWidth;
      const y = padding.top + (graphHeight - ((pt.price - minPrice) / range) * graphHeight);
      return { x, y, raw: pt };
    });
    coordsRef.current = coords;

    // Area fill
    ctx.beginPath();
    ctx.moveTo(coords[0].x, rect.height - padding.bottom);
    coords.forEach((c) => ctx.lineTo(c.x, c.y));
    ctx.lineTo(coords[coords.length - 1].x, rect.height - padding.bottom);
    ctx.closePath();
    const grad = ctx.createLinearGradient(0, padding.top, 0, rect.height - padding.bottom);
    grad.addColorStop(0, "rgba(16, 185, 129, 0.18)");
    grad.addColorStop(1, "rgba(16, 185, 129, 0.00)");
    ctx.fillStyle = grad;
    ctx.fill();

    // Spline stroke
    ctx.beginPath();
    ctx.moveTo(coords[0].x, coords[0].y);
    for (let i = 0; i < coords.length - 1; i++) {
      const xc = (coords[i].x + coords[i + 1].x) / 2;
      const yc = (coords[i].y + coords[i + 1].y) / 2;
      ctx.quadraticCurveTo(coords[i].x, coords[i].y, xc, yc);
    }
    ctx.lineTo(coords[coords.length - 1].x, coords[coords.length - 1].y);
    ctx.strokeStyle = "#10B981";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.stroke();

    // Month labels
    ctx.fillStyle = "#6B7280";
    ctx.font = "10px Inter, sans-serif";
    ctx.textAlign = "center";
    coords.forEach((c) => ctx.fillText(c.raw.month, c.x, rect.height - 5));

    // Hover ring
    if (hoverIdx !== null && coords[hoverIdx]) {
      const c = coords[hoverIdx];
      ctx.beginPath();
      ctx.arc(c.x, c.y, 5, 0, Math.PI * 2);
      ctx.fillStyle = "#10B981";
      ctx.strokeStyle = "#0B0F19";
      ctx.lineWidth = 2;
      ctx.fill();
      ctx.stroke();
    }
  };

  useEffect(() => {
    draw();
    const onResize = () => draw();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points]);

  const handleMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const coords = coordsRef.current;
    if (!coords.length) return;
    let idx = 0;
    let min = Math.abs(mx - coords[0].x);
    for (let i = 1; i < coords.length; i++) {
      const d = Math.abs(mx - coords[i].x);
      if (d < min) {
        min = d;
        idx = i;
      }
    }
    draw(idx);
    setTip({ x: coords[idx].x, y: coords[idx].y, pt: coords[idx].raw });
  };

  const handleLeave = () => {
    setTip(null);
    draw();
  };

  return (
    <div className="rounded-2xl border border-border bg-card p-5 shadow-xl">
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="rounded-lg bg-accent/10 p-2 text-accent">
            <TrendingDown className="h-5 w-5" />
          </div>
          <div>
            <h3 className="font-display text-base font-bold tracking-wide">Market Price Analytics</h3>
            <p className="text-xs text-muted-foreground">6-Month Historical Valuation Curve</p>
          </div>
        </div>
        <span className="rounded-md border border-border bg-background px-3 py-1 text-xs font-medium text-muted-foreground">
          {deviceName}
        </span>
      </div>

      <div className="relative mt-5 rounded-xl border border-border bg-background/50 p-4">
        <canvas
          ref={canvasRef}
          className="block h-[180px] w-full cursor-crosshair"
          onMouseMove={handleMove}
          onMouseLeave={handleLeave}
        />
        {tip && (
          <div
            className="pointer-events-none absolute z-10 space-y-0.5 rounded-lg border border-border bg-card/95 p-2 text-[11px] shadow-xl"
            style={{ left: Math.max(8, tip.x - 70), top: Math.max(8, tip.y - 55 + 16) }}
          >
            <p className="font-medium text-muted-foreground">Market Valuation — {tip.pt.month}</p>
            <p className="font-mono font-bold text-accent">{tip.pt.price.toLocaleString()} BDT</p>
          </div>
        )}
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 rounded-xl border border-border/60 bg-background/30 p-3 text-xs">
        <div>
          <span className="mb-0.5 block text-muted-foreground">Peak Market Value</span>
          <span className="font-mono font-bold">{peakValue.toLocaleString()} BDT</span>
        </div>
        <div>
          <span className="mb-0.5 block text-muted-foreground">Projected Next Month</span>
          <span className="font-mono font-bold text-accent">{projectedValue.toLocaleString()} BDT</span>
        </div>
      </div>
    </div>
  );
}
