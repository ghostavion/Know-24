import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

interface StatsData {
  users: { total: number; last7Days: number };
  businesses: { total: number; active: number; last7Days: number };
  products: { total: number; published: number };
  orders: { total: number; totalRevenueCents: number };
  storefronts: { total: number };
}

export async function GET(): Promise<NextResponse<ApiResponse<StatsData>>> {
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
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }

  try {
    const supabase = createServiceClient();

    const sevenDaysAgo = new Date(
      Date.now() - 7 * 24 * 60 * 60 * 1000
    ).toISOString();

    // Run all queries in parallel
    const [
      usersTotal,
      usersRecent,
      businessesTotal,
      businessesActive,
      businessesRecent,
      productsTotal,
      productsPublished,
      ordersTotal,
      ordersRevenue,
      storefrontsTotal,
    ] = await Promise.all([
      // Total users
      supabase
        .from("users")
        .select("*", { count: "exact", head: true }),

      // Users last 7 days
      supabase
        .from("users")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),

      // Total businesses
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true }),

      // Active businesses
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .eq("status", "active"),

      // Businesses last 7 days
      supabase
        .from("businesses")
        .select("*", { count: "exact", head: true })
        .gte("created_at", sevenDaysAgo),

      // Total products
      supabase
        .from("products")
        .select("*", { count: "exact", head: true }),

      // Published products
      supabase
        .from("products")
        .select("*", { count: "exact", head: true })
        .eq("status", "published"),

      // Total orders
      supabase
        .from("orders")
        .select("*", { count: "exact", head: true }),

      // Completed orders revenue
      supabase
        .from("orders")
        .select("amount_cents")
        .eq("status", "completed"),

      // Total storefronts
      supabase
        .from("storefronts")
        .select("*", { count: "exact", head: true }),
    ]);

    // Calculate total revenue from completed orders
    const totalRevenueCents = (ordersRevenue.data ?? []).reduce(
      (sum: number, row: { amount_cents: number }) => sum + (row.amount_cents ?? 0),
      0
    );

    const data: StatsData = {
      users: {
        total: usersTotal.count ?? 0,
        last7Days: usersRecent.count ?? 0,
      },
      businesses: {
        total: businessesTotal.count ?? 0,
        active: businessesActive.count ?? 0,
        last7Days: businessesRecent.count ?? 0,
      },
      products: {
        total: productsTotal.count ?? 0,
        published: productsPublished.count ?? 0,
      },
      orders: {
        total: ordersTotal.count ?? 0,
        totalRevenueCents,
      },
      storefronts: {
        total: storefrontsTotal.count ?? 0,
      },
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
