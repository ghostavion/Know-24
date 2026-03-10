"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsPeriodTabs } from "@/components/admin/AnalyticsPeriodTabs";
import { RevenueLineChart } from "@/components/admin/RevenueLineChart";
import { UserGrowthChart } from "@/components/admin/UserGrowthChart";
import { TopBusinessesTable } from "@/components/admin/TopBusinessesTable";
import { ProductTypeBarChart } from "@/components/admin/ProductTypeBarChart";
import {
  DollarSign,
  Users,
  Zap,
  MessageSquare,
} from "lucide-react";

interface AnalyticsData {
  revenue: {
    totalRevenueCents: number;
    orderCount: number;
    dailyBreakdown: Array<{ date: string; revenueCents: number; orderCount: number }>;
    growthPercent: number;
  };
  users: {
    total: number;
    newThisPeriod: number;
    dailyCumulative: Array<{ date: string; cumulative: number }>;
  };
  topBusinesses: Array<{
    businessId: string;
    businessName: string;
    revenueCents: number;
    orderCount: number;
    productCount: number;
  }>;
  productTypeBreakdown: Array<{
    productType: string;
    displayName: string;
    count: number;
    revenueCents: number;
  }>;
  usage: {
    totalAiTokens: number;
    totalSocialPosts: number;
    totalScoutScans: number;
  };
}

export default function AnalyticsPage() {
  const [period, setPeriod] = useState("30d");

  const { data, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["admin-analytics", period],
    queryFn: async () => {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      const json = await res.json();
      return json.data;
    },
  });

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Analytics</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Platform performance and growth metrics.
          </p>
        </div>
        <AnalyticsPeriodTabs active={period} onChange={setPeriod} />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl border border-border bg-muted/50" />
          ))}
        </div>
      ) : data ? (
        <>
          {/* Stat cards */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Revenue"
              value={`$${(data.revenue.totalRevenueCents / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
              subtitle={`${(data.revenue.growthPercent ?? 0) >= 0 ? "+" : ""}${(data.revenue.growthPercent ?? 0).toFixed(1)}% vs previous period`}
              icon={DollarSign}
            />
            <StatCard
              label="New Users"
              value={data.users.newThisPeriod.toLocaleString()}
              subtitle={`${data.users.total.toLocaleString()} total`}
              icon={Users}
            />
            <StatCard
              label="AI Tokens Used"
              value={data.usage.totalAiTokens.toLocaleString()}
              subtitle="across all businesses"
              icon={Zap}
            />
            <StatCard
              label="Social Posts"
              value={data.usage.totalSocialPosts.toLocaleString()}
              subtitle={`${data.usage.totalScoutScans} scout scans`}
              icon={MessageSquare}
            />
          </div>

          {/* Revenue chart */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              Revenue Trend
            </h3>
            <RevenueLineChart data={data.revenue.dailyBreakdown.map(d => ({ date: d.date, revenue: d.revenueCents / 100, orders: d.orderCount }))} />
          </div>

          {/* User growth */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="mb-4 text-base font-semibold text-foreground">
              User Growth
            </h3>
            <UserGrowthChart data={data.users.dailyCumulative.map(d => ({ date: d.date, count: 0, cumulative: d.cumulative }))} />
          </div>

          {/* Top businesses + product breakdown */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Top Businesses
              </h3>
              <TopBusinessesTable businesses={data.topBusinesses.map(b => ({ id: b.businessId, name: b.businessName, revenue: b.revenueCents / 100, orders: b.orderCount, products: b.productCount }))} />
            </div>
            <div className="rounded-xl border border-border bg-card p-6">
              <h3 className="mb-4 text-base font-semibold text-foreground">
                Revenue by Product Type
              </h3>
              <ProductTypeBarChart data={data.productTypeBreakdown.map(p => ({ type: p.displayName, count: p.count, revenue: p.revenueCents / 100 }))} />
            </div>
          </div>
        </>
      ) : (
        <p className="text-muted-foreground">Failed to load analytics data.</p>
      )}
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string;
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
