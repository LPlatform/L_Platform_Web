"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type { ChartPoint } from "@/types";

const AXIS_TICK = { fill: "var(--muted-foreground)", fontSize: 11 } as const;
const TOOLTIP_STYLE = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: 12,
  boxShadow: "0 8px 24px rgb(15 23 42 / 0.08)",
  fontSize: 12,
  color: "var(--foreground)",
} as const;

export function StudentGrowthChart({ data }: { data: ChartPoint[] }) {
  const gradientId = React.useId().replace(/:/g, "");

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={data} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="var(--chart-1)" stopOpacity={0.35} />
            <stop offset="95%" stopColor="var(--chart-1)" stopOpacity={0.02} />
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
          stroke="var(--chart-1)"
          strokeWidth={2}
          fill={`url(#${gradientId})`}
          activeDot={{ r: 4 }}
        />
        <Area
          type="monotone"
          dataKey="secondary"
          name="Teachers"
          stroke="var(--chart-2)"
          strokeWidth={2}
          strokeDasharray="4 4"
          fill="transparent"
          activeDot={{ r: 4 }}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function OrganizationDistributionChart({ data }: { data: ChartPoint[] }) {
  const height = Math.max(260, data.length * 48);

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
        <Tooltip contentStyle={TOOLTIP_STYLE} cursor={{ fill: "var(--muted)", opacity: 0.5 }} />
        <Bar
          dataKey="value"
          name="Students"
          fill="var(--chart-1)"
          radius={[0, 6, 6, 0]}
          barSize={16}
        />
        <Bar
          dataKey="secondary"
          name="Teachers"
          fill="var(--chart-2)"
          radius={[0, 6, 6, 0]}
          barSize={8}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
