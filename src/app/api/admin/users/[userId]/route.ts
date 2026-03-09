import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface UserBusiness {
  id: string;
  name: string;
  niche: string | null;
  status: string;
  productCount: number;
  orderCount: number;
  revenueCents: number;
}

interface UserOrganization {
  id: string;
  name: string;
  plan: string | null;
  subscriptionStatus: string | null;
  stripeCustomerId: string | null;
  aiTokensUsed: number;
  aiTokensCeiling: number;
  businesses: UserBusiness[];
}

interface AdminNote {
  id: string;
  adminUserId: string;
  content: string;
  createdAt: string;
}

interface CreditEntry {
  id: string;
  action: string;
  description: string;
  amountCents: number;
  tokenAmount: number;
  createdAt: string;
}

interface UserDetailData {
  user: {
    id: string;
    email: string;
    firstName: string | null;
    lastName: string | null;
    imageUrl: string | null;
    createdAt: string;
  };
  organizations: UserOrganization[];
  notes: AdminNote[];
  creditHistory: CreditEntry[];
  stats: {
    totalBusinesses: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenueCents: number;
    memberSince: string;
  };
}

// ---------------------------------------------------------------------------
// GET — Admin: detailed user profile with orgs, businesses, products, orders
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<UserDetailData>>> {
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
    const { userId } = await params;
    const supabase = createServiceClient();

    // 1. Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, first_name, last_name, image_url, created_at")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // 2. Get organization memberships
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id, role")
      .eq("user_id", userId);

    const orgIds = (memberships ?? []).map(
      (m: { organization_id: string }) => m.organization_id
    );

    // 3. Get organizations with subscription info
    let organizations: UserOrganization[] = [];
    let allBusinessIds: string[] = [];

    if (orgIds.length > 0) {
      const { data: orgs } = await supabase
        .from("organizations")
        .select(
          "id, name, plan, subscription_status, stripe_customer_id, ai_tokens_used, ai_tokens_ceiling"
        )
        .in("id", orgIds);

      // 4. Get businesses for these organizations
      const { data: businesses } = await supabase
        .from("businesses")
        .select("id, organization_id, name, niche, status")
        .in("organization_id", orgIds);

      const bizList = (businesses ?? []) as {
        id: string;
        organization_id: string;
        name: string;
        niche: string | null;
        status: string;
      }[];

      allBusinessIds = bizList.map((b) => b.id);

      // 5. Get product counts per business
      let productCounts: Record<string, number> = {};
      if (allBusinessIds.length > 0) {
        const { data: products } = await supabase
          .from("products")
          .select("id, business_id")
          .in("business_id", allBusinessIds);

        for (const p of (products ?? []) as { id: string; business_id: string }[]) {
          productCounts[p.business_id] = (productCounts[p.business_id] ?? 0) + 1;
        }
      }

      // 6. Get order counts and revenue per business
      let orderCounts: Record<string, number> = {};
      let orderRevenue: Record<string, number> = {};
      if (allBusinessIds.length > 0) {
        const { data: orders } = await supabase
          .from("orders")
          .select("id, business_id, amount_cents")
          .in("business_id", allBusinessIds);

        for (const o of (orders ?? []) as {
          id: string;
          business_id: string;
          amount_cents: number;
        }[]) {
          orderCounts[o.business_id] = (orderCounts[o.business_id] ?? 0) + 1;
          orderRevenue[o.business_id] =
            (orderRevenue[o.business_id] ?? 0) + (o.amount_cents ?? 0);
        }
      }

      // Build organizations array
      organizations = ((orgs ?? []) as {
        id: string;
        name: string;
        plan: string | null;
        subscription_status: string | null;
        stripe_customer_id: string | null;
        ai_tokens_used: number;
        ai_tokens_ceiling: number;
      }[]).map((org) => {
        const orgBusinesses = bizList.filter((b) => b.organization_id === org.id);

        return {
          id: org.id,
          name: org.name,
          plan: org.plan,
          subscriptionStatus: org.subscription_status,
          stripeCustomerId: org.stripe_customer_id,
          aiTokensUsed: org.ai_tokens_used,
          aiTokensCeiling: org.ai_tokens_ceiling,
          businesses: orgBusinesses.map((b) => ({
            id: b.id,
            name: b.name,
            niche: b.niche,
            status: b.status,
            productCount: productCounts[b.id] ?? 0,
            orderCount: orderCounts[b.id] ?? 0,
            revenueCents: orderRevenue[b.id] ?? 0,
          })),
        };
      });
    }

    // 7. Get admin notes for this user
    const { data: noteRows } = await supabase
      .from("admin_notes")
      .select("id, admin_user_id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    const notes: AdminNote[] = ((noteRows ?? []) as {
      id: string;
      admin_user_id: string;
      content: string;
      created_at: string;
    }[]).map((n) => ({
      id: n.id,
      adminUserId: n.admin_user_id,
      content: n.content,
      createdAt: n.created_at,
    }));

    // 8. Get credit ledger entries for user's organizations
    let creditHistory: CreditEntry[] = [];
    if (orgIds.length > 0) {
      const { data: creditRows } = await supabase
        .from("admin_credit_ledger")
        .select("id, action, description, amount_cents, token_amount, created_at")
        .in("organization_id", orgIds)
        .order("created_at", { ascending: false });

      creditHistory = ((creditRows ?? []) as {
        id: string;
        action: string;
        description: string;
        amount_cents: number;
        token_amount: number;
        created_at: string;
      }[]).map((c) => ({
        id: c.id,
        action: c.action,
        description: c.description,
        amountCents: c.amount_cents,
        tokenAmount: c.token_amount,
        createdAt: c.created_at,
      }));
    }

    // 9. Compute stats
    const totalBusinesses = allBusinessIds.length;
    const totalProducts = Object.values(
      organizations.reduce<Record<string, number>>((acc, org) => {
        for (const biz of org.businesses) {
          acc[biz.id] = biz.productCount;
        }
        return acc;
      }, {})
    ).reduce((sum, count) => sum + count, 0);
    const totalOrders = organizations.reduce(
      (sum, org) => sum + org.businesses.reduce((s, b) => s + b.orderCount, 0),
      0
    );
    const totalRevenueCents = organizations.reduce(
      (sum, org) => sum + org.businesses.reduce((s, b) => s + b.revenueCents, 0),
      0
    );

    return NextResponse.json({
      data: {
        user: {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name,
          imageUrl: user.image_url,
          createdAt: user.created_at,
        },
        organizations,
        notes,
        creditHistory,
        stats: {
          totalBusinesses,
          totalProducts,
          totalOrders,
          totalRevenueCents,
          memberSince: user.created_at,
        },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
