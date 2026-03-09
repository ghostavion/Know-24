import { createServiceClient } from "@/lib/supabase/server"
import type { SalesDataPoint, RevenueByProduct, SalesAnalytics, AnalyticsPeriod } from "@/types/operations"

export async function getSalesAnalytics(
  businessId: string,
  period: AnalyticsPeriod = "month",
  startDate?: string,
  endDate?: string
): Promise<SalesAnalytics> {
  const supabase = createServiceClient()

  // Default date range: last 12 months/weeks/days depending on period
  const now = new Date()
  const defaultStart = new Date(now)
  if (period === "month") defaultStart.setMonth(now.getMonth() - 12)
  else if (period === "week") defaultStart.setDate(now.getDate() - 84) // 12 weeks
  else defaultStart.setDate(now.getDate() - 30)

  const start = startDate ?? defaultStart.toISOString()
  const end = endDate ?? now.toISOString()

  // Get completed orders in range
  const { data: orders } = await supabase
    .from("orders")
    .select("id, amount_cents, product_id, created_at")
    .eq("business_id", businessId)
    .eq("status", "completed")
    .gte("created_at", start)
    .lte("created_at", end)
    .order("created_at", { ascending: true })

  if (!orders || orders.length === 0) {
    return {
      dataPoints: [],
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      revenueByProduct: [],
    }
  }

  // Group by date period
  const groupedByDate = new Map<string, { revenue: number; count: number }>()

  for (const order of orders) {
    const date = new Date(order.created_at)
    let key: string
    if (period === "month") key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`
    else if (period === "week") {
      // ISO week
      const d = new Date(date)
      d.setDate(d.getDate() - d.getDay())
      key = d.toISOString().slice(0, 10)
    } else {
      key = date.toISOString().slice(0, 10)
    }
    const existing = groupedByDate.get(key) ?? { revenue: 0, count: 0 }
    existing.revenue += order.amount_cents
    existing.count += 1
    groupedByDate.set(key, existing)
  }

  const dataPoints: SalesDataPoint[] = Array.from(groupedByDate.entries()).map(
    ([date, { revenue, count }]) => ({
      date,
      revenue,
      orderCount: count,
    })
  )

  // Group by product
  const groupedByProduct = new Map<string, { revenue: number; count: number }>()
  for (const order of orders) {
    const existing = groupedByProduct.get(order.product_id) ?? { revenue: 0, count: 0 }
    existing.revenue += order.amount_cents
    existing.count += 1
    groupedByProduct.set(order.product_id, existing)
  }

  // Get product titles
  const productIds = Array.from(groupedByProduct.keys())
  const { data: products } = await supabase
    .from("products")
    .select("id, title")
    .in("id", productIds)

  const productMap = new Map((products ?? []).map(p => [p.id, p.title]))

  const revenueByProduct: RevenueByProduct[] = Array.from(groupedByProduct.entries()).map(
    ([productId, { revenue, count }]) => ({
      productId,
      productTitle: productMap.get(productId) ?? "Unknown Product",
      totalRevenue: revenue,
      orderCount: count,
      averageOrderValue: Math.round(revenue / count),
    })
  ).sort((a, b) => b.totalRevenue - a.totalRevenue)

  const totalRevenue = orders.reduce((sum, o) => sum + o.amount_cents, 0)
  const totalOrders = orders.length

  return {
    dataPoints,
    totalRevenue,
    totalOrders,
    averageOrderValue: totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0,
    revenueByProduct,
  }
}
