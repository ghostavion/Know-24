"use client"

import { useEffect, useState, useCallback } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { RevenueChart } from "@/components/sales/RevenueChart"
import type {
  SalesDataPoint,
  RevenueByProduct,
  UsageMetrics,
  AnalyticsPeriod,
} from "@/types/operations"

interface SalesSlideOverProps {
  businessId: string
  businessName: string
}

interface SalesViewData {
  totalRevenue: number
  totalOrders: number
  avgOrderValue: number
  topProduct: string
  dataPoints: SalesDataPoint[]
  productBreakdown: RevenueByProduct[]
}

const formatDollars = (value: number): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

const SkeletonKpi = () => (
  <div className="animate-pulse space-y-2 rounded-lg border p-4">
    <div className="h-3 w-20 rounded bg-muted" />
    <div className="h-6 w-28 rounded bg-muted" />
  </div>
)

const SkeletonChart = () => (
  <div className="h-48 w-full animate-pulse rounded-lg bg-muted" />
)

interface ProgressBarProps {
  label: string
  used: number
  ceiling: number
}

const ProgressBar = ({ label, used, ceiling }: ProgressBarProps) => {
  const pct = ceiling > 0 ? Math.min((used / ceiling) * 100, 100) : 0
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-muted-foreground">
          {used.toLocaleString()} / {ceiling.toLocaleString()}
        </span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full transition-all",
            pct >= 90 ? "bg-red-500" : pct >= 70 ? "bg-yellow-500" : "bg-primary"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}

const SalesSlideOver = ({
  businessId,
  businessName,
}: SalesSlideOverProps) => {
  const [period, setPeriod] = useState<AnalyticsPeriod>("week")
  const [salesData, setSalesData] = useState<SalesViewData | null>(null)
  const [usageData, setUsageData] = useState<UsageMetrics | null>(null)
  const [salesLoading, setSalesLoading] = useState(true)
  const [usageLoading, setUsageLoading] = useState(true)

  const fetchSalesData = useCallback(async () => {
    setSalesLoading(true)
    try {
      const res = await fetch(
        `/api/analytics/sales?businessId=${businessId}&period=${period}`
      )
      const json: { data?: SalesViewData } = await res.json()
      if (json.data) {
        setSalesData(json.data)
      }
    } finally {
      setSalesLoading(false)
    }
  }, [businessId, period])

  const fetchUsageData = useCallback(async () => {
    setUsageLoading(true)
    try {
      const res = await fetch(`/api/analytics/usage?businessId=${businessId}`)
      const json: { data?: UsageMetrics } = await res.json()
      if (json.data) {
        setUsageData(json.data)
      }
    } finally {
      setUsageLoading(false)
    }
  }, [businessId])

  useEffect(() => {
    fetchSalesData()
  }, [fetchSalesData])

  useEffect(() => {
    fetchUsageData()
  }, [fetchUsageData])

  return (
    <div className="space-y-6 p-4">
      <h3 className="text-lg font-semibold">
        Sales &amp; Analytics for {businessName}
      </h3>

      {/* Period selector */}
      <div className="flex gap-1">
        {(["day", "week", "month"] as const).map((p) => (
          <Button
            key={p}
            variant={period === p ? "default" : "outline"}
            size="sm"
            onClick={() => setPeriod(p)}
          >
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </Button>
        ))}
      </div>

      {/* KPI cards */}
      {salesLoading ? (
        <div className="grid grid-cols-2 gap-3">
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
          <SkeletonKpi />
        </div>
      ) : salesData ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Revenue</p>
            <p className="mt-1 text-xl font-bold">
              {formatDollars(salesData.totalRevenue)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Total Orders</p>
            <p className="mt-1 text-xl font-bold">{salesData.totalOrders}</p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Avg Order Value</p>
            <p className="mt-1 text-xl font-bold">
              {formatDollars(salesData.avgOrderValue)}
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <p className="text-xs text-muted-foreground">Top Product</p>
            <p className="mt-1 truncate text-xl font-bold">
              {salesData.topProduct || "--"}
            </p>
          </div>
        </div>
      ) : null}

      {/* Revenue chart */}
      {salesLoading ? (
        <SkeletonChart />
      ) : salesData ? (
        <RevenueChart dataPoints={salesData.dataPoints} />
      ) : null}

      {/* Product breakdown */}
      {!salesLoading && salesData && salesData.productBreakdown.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-semibold">Product Breakdown</h4>
          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-4 py-2 text-left font-medium text-muted-foreground">
                    Product
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Revenue
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    Orders
                  </th>
                  <th className="px-4 py-2 text-right font-medium text-muted-foreground">
                    AOV
                  </th>
                </tr>
              </thead>
              <tbody>
                {salesData.productBreakdown.map((product) => (
                  <tr key={product.productId} className="border-b last:border-b-0">
                    <td className="px-4 py-2 font-medium">{product.productTitle}</td>
                    <td className="px-4 py-2 text-right">
                      {formatDollars(product.totalRevenue)}
                    </td>
                    <td className="px-4 py-2 text-right">{product.orderCount}</td>
                    <td className="px-4 py-2 text-right">
                      {formatDollars(product.averageOrderValue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Usage section */}
      <div className="space-y-3 border-t pt-4">
        <h4 className="text-sm font-semibold">Usage This Period</h4>
        {usageLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <div className="h-4 w-32 animate-pulse rounded bg-muted" />
                <div className="h-2 w-full animate-pulse rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : usageData ? (
          <div className="space-y-3">
            <ProgressBar
              label="AI Tokens"
              used={usageData.aiTokensUsed}
              ceiling={usageData.aiTokensCeiling}
            />
            <ProgressBar
              label="Social Posts"
              used={usageData.socialPostsUsed}
              ceiling={usageData.socialPostsCeiling}
            />
            <ProgressBar
              label="Scout Scans"
              used={usageData.scoutScansUsed}
              ceiling={usageData.scoutScansCeiling}
            />
          </div>
        ) : null}
      </div>
    </div>
  )
}

export { SalesSlideOver }
export type { SalesSlideOverProps }
