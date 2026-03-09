import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function verifyBusinessOwnership(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  businessId: string
): Promise<
  | { ok: true; business: { id: string; organization_id: string } }
  | { ok: false; response: NextResponse }
> {
  const { data: business } = await supabase
    .from("businesses")
    .select("id, organization_id")
    .eq("id", businessId)
    .single();

  if (!business) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      ),
    };
  }

  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      ),
    };
  }

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", business.organization_id)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return {
      ok: false,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not a member of this business" } },
        { status: 403 }
      ),
    };
  }

  return { ok: true, business };
}

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  period: z.enum(["day", "week", "month"]).default("month"),
  startDate: z.string().datetime({ offset: true }).optional(),
  endDate: z.string().datetime({ offset: true }).optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface DataPoint {
  date: string;
  revenue: number;
  orders: number;
}

interface ProductRevenue {
  productId: string;
  productTitle: string;
  revenue: number;
  orders: number;
}

interface SalesAnalytics {
  totalRevenue: number;
  totalOrders: number;
  averageOrderValue: number;
  dataPoints: DataPoint[];
  revenueByProduct: ProductRevenue[];
}

interface OrderWithProduct {
  amount_cents: number;
  created_at: string;
  product_id: string;
  products: { title: string } | null;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateDate(dateStr: string, period: "day" | "week" | "month"): string {
  const date = new Date(dateStr);
  switch (period) {
    case "day":
      return date.toISOString().slice(0, 10);
    case "week": {
      // Truncate to Monday of that week
      const day = date.getUTCDay();
      const diff = day === 0 ? 6 : day - 1; // Adjust so Monday = 0
      date.setUTCDate(date.getUTCDate() - diff);
      return date.toISOString().slice(0, 10);
    }
    case "month":
      return date.toISOString().slice(0, 7);
  }
}

// ---------------------------------------------------------------------------
// GET — Sales analytics
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      businessId: url.searchParams.get("businessId") ?? undefined,
      period: url.searchParams.get("period") ?? undefined,
      startDate: url.searchParams.get("startDate") ?? undefined,
      endDate: url.searchParams.get("endDate") ?? undefined,
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

    const { businessId, period, startDate, endDate } = parsed.data;
    const supabase = createServiceClient();

    const ownership = await verifyBusinessOwnership(supabase, userId, businessId);
    if (!ownership.ok) return ownership.response;

    // Fetch completed orders with product title
    let query = supabase
      .from("orders")
      .select("amount_cents, created_at, product_id, products(title)")
      .eq("business_id", businessId)
      .eq("status", "completed");

    if (startDate) {
      query = query.gte("created_at", startDate);
    }
    if (endDate) {
      query = query.lte("created_at", endDate);
    }

    const { data: orders, error: fetchError } = await query;

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch orders" } },
        { status: 500 }
      );
    }

    const typedOrders = orders as unknown as OrderWithProduct[];

    // Calculate totals
    let totalRevenue = 0;
    const totalOrders = typedOrders.length;

    // Group by date for dataPoints
    const dateMap = new Map<string, { revenue: number; orders: number }>();
    // Group by product for revenueByProduct
    const productMap = new Map<
      string,
      { productTitle: string; revenue: number; orders: number }
    >();

    for (const order of typedOrders) {
      totalRevenue += order.amount_cents;

      const dateKey = truncateDate(order.created_at, period);
      const existing = dateMap.get(dateKey) ?? { revenue: 0, orders: 0 };
      existing.revenue += order.amount_cents;
      existing.orders += 1;
      dateMap.set(dateKey, existing);

      const productEntry = productMap.get(order.product_id) ?? {
        productTitle: order.products?.title ?? "Unknown",
        revenue: 0,
        orders: 0,
      };
      productEntry.revenue += order.amount_cents;
      productEntry.orders += 1;
      productMap.set(order.product_id, productEntry);
    }

    const dataPoints: DataPoint[] = Array.from(dateMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, vals]) => ({
        date,
        revenue: vals.revenue,
        orders: vals.orders,
      }));

    const revenueByProduct: ProductRevenue[] = Array.from(
      productMap.entries()
    ).map(([productId, vals]) => ({
      productId,
      productTitle: vals.productTitle,
      revenue: vals.revenue,
      orders: vals.orders,
    }));

    const averageOrderValue =
      totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

    const analytics: SalesAnalytics = {
      totalRevenue,
      totalOrders,
      averageOrderValue,
      dataPoints,
      revenueByProduct,
    };

    return NextResponse.json({ data: analytics });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
