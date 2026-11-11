"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/types";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP_STYLE = {
  backgroundColor: "var(--popover)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 12px 30px rgb(2 6 23 / 0.38)",
  fontSize: 12,
  color: "var(--foreground)",
} as const;

export function StudentGrowthChart({ data }: { data: ChartPoint[] }) {
  const gradientId = React.useId().replace(/:/g, "");
  const gradientSecId = React.useId().replace(/:/g, "");

  return (
    <ResponsiveContainer width="100%" height={280}>
      <AreaChart data={data} margin={{ top: 10, right: 10, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.42} />
            <stop offset="95%" stopColor="#7c3aed" stopOpacity={0.02} />
          </linearGradient>
          <linearGradient id={gradientSecId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.28} />
            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} dy={8} />
        <YAxis
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={52}
        />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: "var(--muted-foreground)", marginBottom: 4 }}
          cursor={{ stroke: "var(--border)", strokeWidth: 1 }}
        />
        <Area
          type="monotone"
          dataKey="value"
          name="Students"
          stroke="#8b5cf6"
          strokeWidth={2.5}
          fill={`url(#${gradientId})`}
          dot={{ r: 3, fill: "#a78bfa", strokeWidth: 0 }}
          activeDot={{ r: 5, fill: "#ffffff", stroke: "#7c3aed", strokeWidth: 2 }}
        />
        <Area
          type="monotone"
          dataKey="secondary"
          name="Teachers"
          stroke="#3b82f6"
          strokeWidth={2}
          fill={`url(#${gradientSecId})`}
          dot={false}
          activeDot={{ r: 4, fill: "#60a5fa" }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrganizationDistributionChart({ data }: { data: ChartPoint[] }) {
  const height = Math.max(240, data.length * 46);

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
        <XAxis
          type="number"
          allowDecimals={false}
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
        />
        <YAxis
          type="category"
          dataKey="label"
          tickLine={false}
          axisLine={false}
          tick={AXIS_TICK}
          width={128}
        />
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.35 }} />
        <Bar dataKey="value" name="Students" fill="#7c3aed" radius={[0, 6, 6, 0]} barSize={16} />
        <Bar dataKey="secondary" name="Teachers" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={8} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export interface DonutSlice {
  name: string;
  value: number;
  color: string;
}

export function DonutDistributionChart({
  data,
  centerValue,
  centerLabel,
}: {
  data: DonutSlice[];
  centerValue: string | number;
  centerLabel: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const safeData = total > 0 ? data : [{ name: "No data", value: 1, color: "var(--muted)" }];

  return (
    <div className="flex flex-col items-center gap-4 2xl:grid 2xl:grid-cols-[168px_1fr]">
      <div className="relative mx-auto h-[168px] w-[168px] shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={safeData}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={54}
              outerRadius={76}
              paddingAngle={total > 0 ? 3 : 0}
              stroke="none"
            >
              {safeData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            {total > 0 && <Tooltip contentStyle={TOOLTIP_STYLE} />}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="text-xl font-bold tracking-tight tabular-nums">{centerValue}</span>
          <span className="text-muted-foreground text-[11px]">{centerLabel}</span>
        </div>
      </div>

      <ul className="w-full space-y-2.5 text-sm">
        {data.map((item) => {
          const pct = total > 0 ? Math.round((item.value / total) * 100) : 0;
          return (
            <li key={item.name} className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-xs font-medium">
                <span
                  className="size-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: item.color }}
                  aria-hidden
                />
                <span className="text-muted-foreground">{item.name}</span>
              </span>
              <span className="flex items-center gap-2 text-xs font-semibold tabular-nums">
                <span>{item.value.toLocaleString()}</span>
                <span className="text-muted-foreground font-normal">({pct}%)</span>
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
