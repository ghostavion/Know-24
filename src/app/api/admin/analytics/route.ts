import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface DailyRevenue {
  date: string;
  revenueCents: number;
  orderCount: number;
}

interface RevenueData {
  totalRevenueCents: number;
  orderCount: number;
  dailyBreakdown: DailyRevenue[];
  growthPercent: number;
}

interface DailyUsers {
  date: string;
  cumulative: number;
}

interface UsersData {
  total: number;
  newThisPeriod: number;
  dailyCumulative: DailyUsers[];
}

interface TopBusiness {
  businessId: string;
  businessName: string;
  revenueCents: number;
  orderCount: number;
  productCount: number;
}

interface ProductTypeBreakdown {
  productType: string;
  displayName: string;
  count: number;
  revenueCents: number;
}

interface UsageStats {
  totalAiTokens: number;
  totalSocialPosts: number;
  totalScoutScans: number;
}

interface AnalyticsData {
  revenue: RevenueData;
  users: UsersData;
  topBusinesses: TopBusiness[];
  productTypeBreakdown: ProductTypeBreakdown[];
  usage: UsageStats;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function periodToDays(period: string): number {
  switch (period) {
    case "7d":
      return 7;
    case "90d":
      return 90;
    case "1y":
      return 365;
    default:
      return 30;
  }
}

// ---------------------------------------------------------------------------
// GET — Admin: platform analytics dashboard
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<AnalyticsData>>> {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }

  try {
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      period: url.searchParams.get("period") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { period } = parsed.data;
    const days = periodToDays(period);
    const now = Date.now();
    const periodStart = new Date(now - days * 24 * 60 * 60 * 1000).toISOString();
    const prevPeriodStart = new Date(
      now - 2 * days * 24 * 60 * 60 * 1000
    ).toISOString();

    const supabase = createServiceClient();

    // Run all independent queries in parallel
    const [
      currentOrdersResult,
      prevOrdersResult,
      usersTotalResult,
      usersNewResult,
      allUsersForCumulative,
      businessOrdersResult,
      productTypesResult,
      productsWithTypeResult,
      ordersForProductType,
      orgsUsageResult,
    ] = await Promise.all([
      // Current period completed orders
      supabase
        .from("orders")
        .select("amount_cents, created_at")
        .eq("status", "completed")
        .gte("created_at", periodStart),

      // Previous period completed orders (for growth %)
      supabase
        .from("orders")
        .select("amount_cents")
        .eq("status", "completed")
        .gte("created_at", prevPeriodStart)
        .lt("created_at", periodStart),

      // Total users
      supabase
        .from("users")
        .select("*", { count: "exact", head: true }),

      // New users this period
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", periodStart),

      // All users created_at for cumulative chart (within period)
      supabase
        .from("users")
        .select("created_at")
        .gte("created_at", periodStart)
        .order("created_at", { ascending: true }),

      // Orders with business info for top businesses
      supabase
        .from("orders")
        .select("business_id, amount_cents, businesses!inner(name)")
        .eq("status", "completed")
        .gte("created_at", periodStart),

      // Product types lookup
      supabase
        .from("product_types")
        .select("id, slug, display_name"),

      // Products with their type
      supabase
        .from("products")
        .select("id, business_id, product_type_id")
        .is("deleted_at", null),

      // All completed orders for product type revenue
      supabase
        .from("orders")
        .select("product_id, amount_cents")
        .eq("status", "completed")
        .gte("created_at", periodStart),

      // Organization usage stats
      supabase
        .from("organizations")
        .select(
          "ai_tokens_used_this_month, social_posts_used_this_month, scout_scans_used_this_month"
        )
        .is("deleted_at", null),
    ]);

    // ---- Revenue ----
    const currentOrders = currentOrdersResult.data ?? [];
    const prevOrders = prevOrdersResult.data ?? [];

    const totalRevenueCents = currentOrders.reduce(
      (sum: number, o: { amount_cents: number }) => sum + (o.amount_cents ?? 0),
      0
    );

    const prevRevenueCents = prevOrders.reduce(
      (sum: number, o: { amount_cents: number }) => sum + (o.amount_cents ?? 0),
      0
    );

    const growthPercent =
      prevRevenueCents > 0
        ? Math.round(
            ((totalRevenueCents - prevRevenueCents) / prevRevenueCents) * 10000
          ) / 100
        : totalRevenueCents > 0
          ? 100
          : 0;

    // Daily revenue breakdown
    const dailyRevenueMap = new Map<
      string,
      { revenueCents: number; orderCount: number }
    >();

    for (const order of currentOrders as {
      amount_cents: number;
      created_at: string;
    }[]) {
      const day = order.created_at.slice(0, 10);
      const existing = dailyRevenueMap.get(day);
      if (existing) {
        existing.revenueCents += order.amount_cents ?? 0;
        existing.orderCount++;
      } else {
        dailyRevenueMap.set(day, {
          revenueCents: order.amount_cents ?? 0,
          orderCount: 1,
        });
      }
    }

    const dailyBreakdown: DailyRevenue[] = Array.from(
      dailyRevenueMap.entries()
    )
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => ({
        date,
        revenueCents: d.revenueCents,
        orderCount: d.orderCount,
      }));

    // ---- Users ----
    const totalUsers = usersTotalResult.count ?? 0;
    const newUsersCount = usersNewResult.count ?? 0;
    const newUserRows = (allUsersForCumulative.data ?? []) as {
      created_at: string;
    }[];

    // Count of all users before the period start (baseline for cumulative chart)
    const baselineCount = totalUsers - newUserRows.length;

    // Build daily cumulative
    const dailyNewMap = new Map<string, number>();
    for (const u of newUserRows) {
      const day = u.created_at.slice(0, 10);
      dailyNewMap.set(day, (dailyNewMap.get(day) ?? 0) + 1);
    }

    const sortedDays = Array.from(dailyNewMap.keys()).sort();
    let cumulative = baselineCount;
    const dailyCumulative: DailyUsers[] = sortedDays.map((date) => {
      cumulative += dailyNewMap.get(date) ?? 0;
      return { date, cumulative };
    });

    // ---- Top businesses by revenue ----
    const businessOrderRows = (
      (businessOrdersResult.data ?? []) as unknown as {
        business_id: string;
        amount_cents: number;
        businesses: { name: string };
      }[]
    );

    const bizMap = new Map<
      string,
      { name: string; revenueCents: number; orderCount: number }
    >();

    for (const row of businessOrderRows) {
      const existing = bizMap.get(row.business_id);
      if (existing) {
        existing.revenueCents += row.amount_cents ?? 0;
        existing.orderCount++;
      } else {
        bizMap.set(row.business_id, {
          name: row.businesses?.name ?? "Unknown",
          revenueCents: row.amount_cents ?? 0,
          orderCount: 1,
        });
      }
    }

    // Count products per business
    const productsByBusiness = new Map<string, number>();
    for (const p of (productsWithTypeResult.data ?? []) as {
      business_id: string;
    }[]) {
      productsByBusiness.set(
        p.business_id,
        (productsByBusiness.get(p.business_id) ?? 0) + 1
      );
    }

    const topBusinesses: TopBusiness[] = Array.from(bizMap.entries())
      .sort(([, a], [, b]) => b.revenueCents - a.revenueCents)
      .slice(0, 10)
      .map(([businessId, d]) => ({
        businessId,
        businessName: d.name,
        revenueCents: d.revenueCents,
        orderCount: d.orderCount,
        productCount: productsByBusiness.get(businessId) ?? 0,
      }));

    // ---- Product type breakdown ----
    const productTypes = (productTypesResult.data ?? []) as {
      id: string;
      slug: string;
      display_name: string;
    }[];

    const products = (productsWithTypeResult.data ?? []) as {
      id: string;
      product_type_id: string;
    }[];

    const ordersByProduct = (ordersForProductType.data ?? []) as {
      product_id: string;
      amount_cents: number;
    }[];

    // Map product_id → product_type_id
    const productToType = new Map<string, string>();
    for (const p of products) {
      productToType.set(p.id, p.product_type_id);
    }

    // Count products per type and revenue per type
    const typeCountMap = new Map<string, number>();
    const typeRevenueMap = new Map<string, number>();

    for (const p of products) {
      typeCountMap.set(
        p.product_type_id,
        (typeCountMap.get(p.product_type_id) ?? 0) + 1
      );
    }

    for (const o of ordersByProduct) {
      const typeId = productToType.get(o.product_id);
      if (typeId) {
        typeRevenueMap.set(
          typeId,
          (typeRevenueMap.get(typeId) ?? 0) + (o.amount_cents ?? 0)
        );
      }
    }

    const productTypeBreakdown: ProductTypeBreakdown[] = productTypes
      .map((pt) => ({
        productType: pt.slug,
        displayName: pt.display_name,
        count: typeCountMap.get(pt.id) ?? 0,
        revenueCents: typeRevenueMap.get(pt.id) ?? 0,
      }))
      .sort((a, b) => b.revenueCents - a.revenueCents);

    // ---- Usage stats ----
    const orgRows = (orgsUsageResult.data ?? []) as {
      ai_tokens_used_this_month: number;
      social_posts_used_this_month: number;
      scout_scans_used_this_month: number;
    }[];

    const usage: UsageStats = {
      totalAiTokens: orgRows.reduce(
        (sum, o) => sum + (o.ai_tokens_used_this_month ?? 0),
        0
      ),
      totalSocialPosts: orgRows.reduce(
        (sum, o) => sum + (o.social_posts_used_this_month ?? 0),
        0
      ),
      totalScoutScans: orgRows.reduce(
        (sum, o) => sum + (o.scout_scans_used_this_month ?? 0),
        0
      ),
    };

    return NextResponse.json({
      data: {
        revenue: {
          totalRevenueCents,
          orderCount: currentOrders.length,
          dailyBreakdown,
          growthPercent,
        },
        users: {
          total: totalUsers,
          newThisPeriod: newUsersCount,
          dailyCumulative,
        },
        topBusinesses,
        productTypeBreakdown,
        usage,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
