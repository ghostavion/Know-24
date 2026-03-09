"use client"

import { useState } from "react"

import { cn } from "@/lib/utils"
import type { SalesDataPoint } from "@/types/operations"

interface RevenueChartProps {
  dataPoints: SalesDataPoint[]
}

const formatDollars = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)
}

const RevenueChart = ({ dataPoints }: RevenueChartProps) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null)

  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center rounded-lg border-2 border-dashed p-12">
        <p className="text-sm text-muted-foreground">No sales data yet</p>
      </div>
    )
  }

  const maxRevenue = Math.max(...dataPoints.map((d) => d.revenue), 1)
  const chartHeight = 200
  const barGap = 4
  const barWidth = Math.max(
    12,
    Math.min(60, (100 - barGap * dataPoints.length) / dataPoints.length)
  )
  const totalWidth = dataPoints.length * (barWidth + barGap) - barGap
  const svgWidth = Math.max(totalWidth + 40, 300)
  const paddingTop = 20
  const paddingBottom = 40

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 ${svgWidth} ${chartHeight + paddingTop + paddingBottom}`}
        className="w-full"
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Bars */}
        {dataPoints.map((point, i) => {
          const barHeight = (point.revenue / maxRevenue) * chartHeight
          const x = 20 + i * (barWidth + barGap)
          const y = paddingTop + (chartHeight - barHeight)

          return (
            <g key={point.date}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={3}
                className={cn(
                  "transition-colors",
                  hoveredIndex === i ? "fill-primary" : "fill-primary/70"
                )}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              />

              {/* X-axis label */}
              <text
                x={x + barWidth / 2}
                y={chartHeight + paddingTop + 16}
                textAnchor="middle"
                className="fill-muted-foreground text-[10px]"
              >
                {point.date}
              </text>

              {/* Tooltip */}
              {hoveredIndex === i && (
                <g>
                  <rect
                    x={x + barWidth / 2 - 40}
                    y={y - 32}
                    width={80}
                    height={24}
                    rx={4}
                    className="fill-foreground"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 16}
                    textAnchor="middle"
                    className="fill-background text-[11px] font-medium"
                  >
                    {formatDollars(point.revenue)}
                  </text>
                </g>
              )}
            </g>
          )
        })}

        {/* Baseline */}
        <line
          x1={16}
          y1={chartHeight + paddingTop}
          x2={svgWidth - 16}
          y2={chartHeight + paddingTop}
          className="stroke-border"
          strokeWidth={1}
        />
      </svg>
    </div>
  )
}

export { RevenueChart }
export type { RevenueChartProps }
