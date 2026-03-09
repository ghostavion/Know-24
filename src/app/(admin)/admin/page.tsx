import {
  Users,
  Building2,
  Package,
  ShoppingCart,
  DollarSign,
  Globe,
} from "lucide-react";
import { createServiceClient } from "@/lib/supabase/server";
import { AdminHealthPanel } from "@/components/admin/AdminHealthPanel";

interface StatCardProps {
  label: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
}

function StatCard({ label, value, subtitle, icon: Icon }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <p className="mt-2 text-3xl font-bold text-foreground">{value}</p>
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    </div>
  );
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100);
}

export default async function AdminOverviewPage() {
  const supabase = createServiceClient();
  const sevenDaysAgo = new Date(
    Date.now() - 7 * 24 * 60 * 60 * 1000
  ).toISOString();

  const [
    usersTotal,
    usersRecent,
    businessesTotal,
    businessesActive,
    businessesRecent,
    productsTotal,
    ordersTotal,
    ordersRevenue,
    storefrontsTotal,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("businesses").select("*", { count: "exact", head: true }),
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .eq("status", "active"),
    supabase
      .from("businesses")
      .select("*", { count: "exact", head: true })
      .gte("created_at", sevenDaysAgo),
    supabase.from("products").select("*", { count: "exact", head: true }),
    supabase.from("orders").select("*", { count: "exact", head: true }),
    supabase
      .from("orders")
      .select("amount_cents")
      .eq("status", "completed"),
    supabase.from("storefronts").select("*", { count: "exact", head: true }),
  ]);

  const totalRevenueCents = (ordersRevenue.data ?? []).reduce(
    (sum: number, row: { amount_cents: number }) =>
      sum + (row.amount_cents ?? 0),
    0
  );

  const stats: StatCardProps[] = [
    {
      label: "Total Users",
      value: usersTotal.count ?? 0,
      subtitle: `+${usersRecent.count ?? 0} last 7 days`,
      icon: Users,
    },
    {
      label: "Total Businesses",
      value: businessesTotal.count ?? 0,
      subtitle: `+${businessesRecent.count ?? 0} last 7 days`,
      icon: Building2,
    },
    {
      label: "Active Businesses",
      value: businessesActive.count ?? 0,
      subtitle: `of ${businessesTotal.count ?? 0} total`,
      icon: Building2,
    },
    {
      label: "Total Products",
      value: productsTotal.count ?? 0,
      subtitle: "across all businesses",
      icon: Package,
    },
    {
      label: "Total Orders",
      value: ordersTotal.count ?? 0,
      subtitle: "all time",
      icon: ShoppingCart,
    },
    {
      label: "Total Revenue",
      value: formatCurrency(totalRevenueCents),
      subtitle: "from completed orders",
      icon: DollarSign,
    },
    {
      label: "Storefronts",
      value: storefrontsTotal.count ?? 0,
      subtitle: "published storefronts",
      icon: Globe,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-semibold text-foreground">
          Platform Overview
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Real-time metrics across the Know24 platform.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatCard key={stat.label} {...stat} />
        ))}
      </div>

      <div>
        <h3 className="mb-4 text-lg font-semibold text-foreground">
          Service Health
        </h3>
        <AdminHealthPanel />
      </div>
    </div>
  );
}
