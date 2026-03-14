import Link from "next/link";
import { notFound } from "next/navigation";
import { createServiceClient } from "@/lib/supabase/server";
import {
  ArrowLeft,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { UserStatCard } from "@/components/admin/UserStatCard";
import { UsageBar } from "@/components/admin/UsageBar";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { AdminCreditActions } from "@/components/admin/AdminCreditActions";
import { AdminSubscriptionActions } from "@/components/admin/AdminSubscriptionActions";
import { AdminCreditHistory } from "@/components/admin/AdminCreditHistory";
import { cn } from "@/lib/utils";

interface AdminUserDetailPageProps {
  params: Promise<{ userId: string }>;
}

// -- Type definitions for DB rows --

interface UserRow {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  display_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface OrgMemberRow {
  organization_id: string;
  role: string;
}

interface OrganizationRow {
  id: string;
  name: string;
  slug: string;
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_price_id: string | null;
  ai_tokens_used_this_month: number;
  ai_tokens_ceiling: number;
  social_posts_used_this_month: number;
  social_posts_ceiling: number;
  scout_scans_used_this_month: number;
  scout_scans_ceiling: number;
}

interface BusinessRow {
  id: string;
  organization_id: string;
  name: string;
  slug: string;
  status: string;
}

interface ProductRow {
  id: string;
  business_id: string;
}

interface OrderRow {
  id: string;
  business_id: string;
  amount_cents: number;
  currency: string;
  status: string;
  created_at: string;
  products: { title: string }[] | null;
  customers: { email: string }[] | null;
}

interface AdminNoteRow {
  id: string;
  admin_user_id: string;
  content: string;
  created_at: string;
}

interface CreditLedgerRow {
  id: string;
  organization_id: string;
  action: string;
  description: string;
  amount_cents: number;
  token_amount: number;
  created_at: string;
}

// -- Helpers --

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-700",
  paused: "bg-gray-100 text-gray-700",
  unpaid: "bg-red-100 text-red-700",
};

// -- Page Component --

export default async function AdminUserDetailPage({
  params,
}: AdminUserDetailPageProps) {
  const { userId } = await params;
  const supabase = createServiceClient();

  // Fetch the user
  const { data: userRow } = await supabase
    .from("users")
    .select(
      "id, clerk_user_id, email, first_name, last_name, display_name, avatar_url, created_at"
    )
    .eq("id", userId)
    .single();

  if (!userRow) notFound();

  const user = userRow as UserRow;
  const fullName =
    user.display_name ??
    [user.first_name, user.last_name].filter(Boolean).join(" ") ??
    user.email;

  // Fetch org memberships for this user
  const { data: memberRows } = await supabase
    .from("organization_members")
    .select("organization_id, role")
    .eq("user_id", userId);

  const memberships = (memberRows ?? []) as OrgMemberRow[];
  const orgIds = memberships.map((m) => m.organization_id);

  // Fetch organizations, businesses, products, orders, notes, credits in parallel
  const [orgsRes, businessesRes, notesRes, creditsRes] = await Promise.all([
    orgIds.length > 0
      ? supabase
          .from("organizations")
          .select(
            "id, name, slug, subscription_status, stripe_customer_id, stripe_price_id, ai_tokens_used_this_month, ai_tokens_ceiling, social_posts_used_this_month, social_posts_ceiling, scout_scans_used_this_month, scout_scans_ceiling"
          )
          .in("id", orgIds)
      : Promise.resolve({ data: [] }),
    orgIds.length > 0
      ? supabase
          .from("businesses")
          .select("id, organization_id, name, slug, status")
          .in("organization_id", orgIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    supabase
      .from("admin_notes")
      .select("id, admin_user_id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    orgIds.length > 0
      ? supabase
          .from("admin_credit_ledger")
          .select(
            "id, organization_id, action, description, amount_cents, token_amount, created_at"
          )
          .in("organization_id", orgIds)
          .order("created_at", { ascending: false })
          .limit(50)
      : Promise.resolve({ data: [] }),
  ]);

  const organizations = (orgsRes.data ?? []) as OrganizationRow[];
  const businesses = (businessesRes.data ?? []) as BusinessRow[];
  const adminNotes = (notesRes.data ?? []) as AdminNoteRow[];
  const creditEntries = (creditsRes.data ?? []) as CreditLedgerRow[];

  const businessIds = businesses.map((b) => b.id);

  // Fetch product and order counts for businesses
  const [productsRes, ordersRes] = await Promise.all([
    businessIds.length > 0
      ? supabase
          .from("products")
          .select("id, business_id")
          .in("business_id", businessIds)
          .is("deleted_at", null)
      : Promise.resolve({ data: [] }),
    businessIds.length > 0
      ? supabase
          .from("orders")
          .select(
            "id, business_id, amount_cents, currency, status, created_at, products(title), customers(email)"
          )
          .in("business_id", businessIds)
          .order("created_at", { ascending: false })
          .limit(100)
      : Promise.resolve({ data: [] }),
  ]);

  const products = (productsRes.data ?? []) as ProductRow[];
  const orders = (ordersRes.data ?? []) as OrderRow[];

  // Compute stats
  const totalBusinesses = businesses.length;
  const totalProducts = products.length;
  const totalOrders = orders.length;
  const totalRevenueCents = orders
    .filter((o) => o.status === "completed")
    .reduce((sum, o) => sum + (o.amount_cents ?? 0), 0);

  // Map notes for client component
  const notesForClient = adminNotes.map((n) => ({
    id: n.id,
    adminUserId: n.admin_user_id,
    content: n.content,
    createdAt: n.created_at,
  }));

  // Map credit entries for display
  const creditHistoryEntries = creditEntries.map((e) => ({
    id: e.id,
    action: e.action,
    description: e.description,
    amountCents: e.amount_cents ?? 0,
    tokenAmount: e.token_amount ?? 0,
    createdAt: e.created_at,
  }));

  // Map orgs for action components
  const orgsForActions = organizations.map((o) => ({
    id: o.id,
    name: o.name,
  }));

  const orgsForSubscription = organizations.map((o) => ({
    id: o.id,
    name: o.name,
    subscriptionStatus: o.subscription_status,
    plan: o.stripe_price_id ?? "Creator",
    stripeCustomerId: o.stripe_customer_id,
  }));

  // Group businesses by org
  const businessesByOrg = organizations.map((org) => ({
    org,
    businesses: businesses.filter((b) => b.organization_id === org.id),
  }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link
          href="/admin/users"
          className="mt-1 rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div className="flex flex-1 items-center gap-4">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt=""
              className="h-14 w-14 rounded-full"
            />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#7C3AED]/10 text-lg font-bold text-[#7C3AED]">
              {(user.first_name?.[0] ?? user.email[0]).toUpperCase()}
            </div>
          )}
          <div>
            <h2 className="text-xl font-semibold text-foreground">
              {fullName}
            </h2>
            <p className="text-sm text-muted-foreground">{user.email}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Member since{" "}
              {new Date(user.created_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UserStatCard
          label="Businesses"
          value={totalBusinesses}
          icon={Building2}
          subtitle={`across ${organizations.length} org${organizations.length !== 1 ? "s" : ""}`}
        />
        <UserStatCard
          label="Products"
          value={totalProducts}
          icon={Package}
          subtitle="total products"
        />
        <UserStatCard
          label="Orders"
          value={totalOrders}
          icon={ShoppingCart}
          subtitle="all time"
        />
        <UserStatCard
          label="Revenue"
          value={formatCurrency(totalRevenueCents)}
          icon={DollarSign}
          subtitle="from completed orders"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column (2/3) */}
        <div className="space-y-6 lg:col-span-2">
          {/* Organizations & Businesses */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Organizations &amp; Businesses
            </h3>

            {businessesByOrg.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Not a member of any organization.
              </p>
            ) : (
              <div className="space-y-5">
                {businessesByOrg.map(({ org, businesses: orgBusinesses }) => (
                  <div
                    key={org.id}
                    className="rounded-lg border border-border p-4"
                  >
                    {/* Org header */}
                    <div className="mb-3 flex items-center justify-between">
                      <div>
                        <span className="font-medium text-foreground">
                          {org.name}
                        </span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {org.slug}
                        </span>
                      </div>
                      <span
                        className={cn(
                          "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                          statusColors[org.subscription_status] ??
                            "bg-gray-100 text-gray-700"
                        )}
                      >
                        {org.subscription_status.replace("_", " ")}
                      </span>
                    </div>

                    {/* Usage meters */}
                    <div className="mb-4 space-y-2">
                      <UsageBar
                        label="AI Tokens"
                        used={org.ai_tokens_used_this_month}
                        ceiling={org.ai_tokens_ceiling}
                      />
                      <UsageBar
                        label="Social Posts"
                        used={org.social_posts_used_this_month}
                        ceiling={org.social_posts_ceiling}
                      />
                      <UsageBar
                        label="Scout Scans"
                        used={org.scout_scans_used_this_month}
                        ceiling={org.scout_scans_ceiling}
                      />
                    </div>

                    {/* Businesses list */}
                    {orgBusinesses.length === 0 ? (
                      <p className="text-xs text-muted-foreground">
                        No businesses in this organization.
                      </p>
                    ) : (
                      <div className="space-y-1">
                        <p className="text-xs font-medium text-muted-foreground">
                          Businesses
                        </p>
                        {orgBusinesses.map((biz) => (
                          <div
                            key={biz.id}
                            className="flex items-center justify-between rounded-md bg-muted/50 px-3 py-2"
                          >
                            <div className="flex items-center gap-2">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              <span className="text-sm text-foreground">
                                {biz.name}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                /{biz.slug}
                              </span>
                            </div>
                            <span
                              className={cn(
                                "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                                biz.status === "active"
                                  ? "bg-green-100 text-green-700"
                                  : biz.status === "setup"
                                    ? "bg-blue-100 text-blue-700"
                                    : biz.status === "paused"
                                      ? "bg-yellow-100 text-yellow-700"
                                      : "bg-gray-100 text-gray-700"
                              )}
                            >
                              {biz.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Orders history */}
          <div className="rounded-xl border border-border bg-card p-5">
            <h3 className="mb-4 text-sm font-semibold text-foreground">
              Orders History
            </h3>

            {orders.length === 0 ? (
              <p className="text-sm text-muted-foreground">No orders yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Product
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Customer
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Amount
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Status
                      </th>
                      <th className="pb-2 text-left font-medium text-muted-foreground">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td className="py-2 text-foreground">
                          {order.products?.[0]?.title ?? "Unknown"}
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {order.customers?.[0]?.email ?? "--"}
                        </td>
                        <td className="py-2 text-foreground">
                          {formatCurrency(order.amount_cents)}
                        </td>
                        <td className="py-2">
                          <span
                            className={cn(
                              "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                              order.status === "completed"
                                ? "bg-green-100 text-green-700"
                                : order.status === "refunded"
                                  ? "bg-red-100 text-red-700"
                                  : order.status === "pending"
                                    ? "bg-yellow-100 text-yellow-700"
                                    : "bg-gray-100 text-gray-700"
                            )}
                          >
                            {order.status}
                          </span>
                        </td>
                        <td className="py-2 text-muted-foreground">
                          {new Date(order.created_at).toLocaleDateString(
                            "en-US",
                            {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            }
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Right column (1/3) */}
        <div className="space-y-6">
          <AdminSubscriptionActions
            userId={user.id}
            organizations={orgsForSubscription}
          />

          <AdminCreditActions
            userId={user.id}
            organizations={orgsForActions}
          />

          <AdminNotes userId={user.id} initialNotes={notesForClient} />

          <AdminCreditHistory entries={creditHistoryEntries} />
        </div>
      </div>
    </div>
  );
}
