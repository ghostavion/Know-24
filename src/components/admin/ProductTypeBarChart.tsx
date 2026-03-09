"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";

interface ProductTypeBarChartProps {
  data: Array<{ type: string; count: number; revenue: number }>;
}

export const ProductTypeBarChart = ({ data }: ProductTypeBarChartProps) => {
  const formatted = data.map((d) => ({
    ...d,
    revenue: d.revenue / 100,
  }));

  return (
    <div className="h-[300px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={formatted} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis type="number" tick={{ fontSize: 11 }} className="text-muted-foreground" tickFormatter={(v: number) => `$${v}`} />
          <YAxis type="category" dataKey="type" tick={{ fontSize: 11 }} className="text-muted-foreground" width={120} />
          <Tooltip
            contentStyle={{
              backgroundColor: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
            formatter={(value: unknown, name: unknown) =>
              name === "revenue" ? [`$${Number(value).toFixed(2)}`, "Revenue"] : [String(value), "Count"]
            }
          />
          <Bar dataKey="revenue" fill="#0891b2" radius={[0, 4, 4, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
