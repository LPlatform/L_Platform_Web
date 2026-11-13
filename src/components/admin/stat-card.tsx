import type { LucideIcon } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

const TONES = {
  primary: {
    icon: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300",
    surface: "lp-kpi-violet",
    stroke: "#8b5cf6",
  },
  violet: {
    icon: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300",
    surface: "lp-kpi-violet",
    stroke: "#8b5cf6",
  },
  info: {
    icon: "bg-blue-500/15 text-blue-600 ring-1 ring-blue-500/25 dark:text-blue-300",
    surface: "lp-kpi-blue",
    stroke: "#3b82f6",
  },
  success: {
    icon: "bg-emerald-500/15 text-emerald-600 ring-1 ring-emerald-500/25 dark:text-emerald-300",
    surface: "lp-kpi-emerald",
    stroke: "#10b981",
  },
  warning: {
    icon: "bg-amber-500/15 text-amber-600 ring-1 ring-amber-500/25 dark:text-amber-300",
    surface: "lp-kpi-amber",
    stroke: "#f59e0b",
  },
  rose: {
    icon: "bg-rose-500/15 text-rose-600 ring-1 ring-rose-500/25 dark:text-rose-300",
    surface: "lp-kpi-rose",
    stroke: "#f43f5e",
  },
} as const;

function MiniSparkline({ points, stroke }: { points: number[]; stroke: string }) {
  const id = React.useId().replace(/:/g, "");
  if (points.length < 2) return null;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const width = 76;
  const height = 28;
  const coords = points.map((val, idx) => {
    const x = (idx / (points.length - 1)) * width;
    const y = height - ((val - min) / span) * (height - 6) - 3;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const areaPoints = `0,${height} ${coords.join(" ")} ${width},${height}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
      <defs>
        <linearGradient id={`spark-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity={0.38} />
          <stop offset="100%" stopColor={stroke} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill={`url(#spark-${id})`} />
      <polyline
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={coords.join(" ")}
      />
    </svg>
  );
}

export function StatCard({
  label,
  value,
  hint,
  delta,
  sparkline,
  icon: Icon,
  tone = "primary",
  loading,
  className,
}: {
  label: string;
  value: string | number;
  hint?: string;
  delta?: string;
  sparkline?: number[];
  icon: LucideIcon;
  tone?: keyof typeof TONES;
  loading?: boolean;
  className?: string;
}) {
  const style = TONES[tone];
  return (
    <div
      className={cn(
        "surface group hover:border-primary/40 relative overflow-hidden p-5 transition-all",
        style.surface,
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-1.5">
          <p className="text-muted-foreground truncate text-xs font-medium tracking-wide uppercase">
            {label}
          </p>
          {loading ? (
            <div className="bg-muted h-8 w-20 animate-pulse rounded-md" />
          ) : (
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold tracking-tight tabular-nums sm:text-[28px]">
                {value}
              </p>
              {delta && (
                <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                  {delta}
                </span>
              )}
            </div>
          )}
          {hint && <p className="text-muted-foreground truncate text-xs">{hint}</p>}
        </div>
        <div className="flex shrink-0 flex-col items-end justify-between gap-2">
          <span
            className={cn(
              "flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105",
              style.icon,
            )}
          >
            <Icon className="size-5" aria-hidden />
          </span>
          {!loading && sparkline && sparkline.length > 1 && (
            <MiniSparkline points={sparkline} stroke={style.stroke} />
          )}
        </div>
      </div>
    </div>
  );
}
