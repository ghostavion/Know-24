"use client";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface RevenueLineChartProps {
  data: Array<{ date: string; revenue: number; orders: number }>;
}

export const RevenueLineChart = ({ data }: RevenueLineChartProps) => {
  const formatted = data.map((d) => ({
    ...d,
    revenue: d.revenue / 100,
    label: new Date(d.date).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
    }),
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={formatted}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="label" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v: number) => `$${v}`} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: unknown, name: unknown) =>
              name === "revenue" ? [`$${Number(value).toFixed(2)}`, "Revenue"] : [String(value), "Orders"]
            }
          />
          <Line type="monotone" dataKey="revenue" stroke="#0891b2" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="orders" stroke="#0891b2" strokeWidth={1.5} dot={false} strokeDasharray="4 4" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
