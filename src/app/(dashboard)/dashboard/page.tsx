"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  Coins,
  DollarSign,
  FileText,
  Loader2,
  Plus,
  Search,
  TrendingUp,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface DashboardStats {
  creditsBalance: number;
  creditsUsed: number;
  creditsTotal: number;
  ebookCount: number;
  publishedCount: number;
  totalRevenue: number;
  totalSales: number;
}

interface RecentEbook {
  id: string;
  title: string;
  status: string;
  created_at: string;
  total_words: number | null;
  total_pages: number | null;
}

interface RecentActivity {
  id: string;
  type: string;
  description: string;
  amount: number;
  created_at: string;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentEbooks, setRecentEbooks] = useState<RecentEbook[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [creditsRes, ebooksRes] = await Promise.all([
          fetch("/api/credits?history=true"),
          fetch("/api/ebooks"),
        ]);

        const creditsJson = await creditsRes.json();
        const ebooksJson = await ebooksRes.json();

        const balance = creditsJson.data?.balance ?? 0;
        const used = creditsJson.data?.used ?? 0;
        const total = creditsJson.data?.monthlyAllowance ?? 200;
        const history: RecentActivity[] = (creditsJson.data?.history ?? []).slice(0, 8);

        const ebooks: RecentEbook[] = ebooksJson.data ?? [];
        const published = ebooks.filter((e) => e.status === "published");

        setStats({
          creditsBalance: balance,
          creditsUsed: used,
          creditsTotal: total,
          ebookCount: ebooks.length,
          publishedCount: published.length,
          totalRevenue: 0,
          totalSales: 0,
        });

        setRecentEbooks(ebooks.slice(0, 4));
        setRecentActivity(history);
      } catch {
        // Fail silently — stats will show as loading
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const s = stats ?? {
    creditsBalance: 0,
    creditsUsed: 0,
    creditsTotal: 200,
    ebookCount: 0,
    publishedCount: 0,
    totalRevenue: 0,
    totalSales: 0,
  };

  const creditsPercent = s.creditsTotal > 0 ? Math.round((s.creditsUsed / s.creditsTotal) * 100) : 0;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-yellow-500/10">
              <Coins className="size-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Credits</p>
              <p className="text-2xl font-semibold tracking-tight">{s.creditsBalance}</p>
            </div>
          </div>
          <div className="mt-3">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{s.creditsUsed} used</span>
              <span>{s.creditsTotal} total</span>
            </div>
            <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-yellow-500 transition-all"
                style={{ width: `${creditsPercent}%` }}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-blue-500/10">
              <BookOpen className="size-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Ebooks</p>
              <p className="text-2xl font-semibold tracking-tight">{s.ebookCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {s.publishedCount} published
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-green-500/10">
              <DollarSign className="size-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Revenue</p>
              <p className="text-2xl font-semibold tracking-tight">${s.totalRevenue}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {s.totalSales} sales
          </p>
        </div>

        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-purple-500/10">
              <TrendingUp className="size-5 text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Published</p>
              <p className="text-2xl font-semibold tracking-tight">{s.publishedCount}</p>
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            on your storefront
          </p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Link
          href="/research"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-primary/10 transition-colors group-hover:bg-primary/20">
            <Search className="size-6 text-primary" />
          </div>
          <div>
            <p className="font-semibold">Research a Niche</p>
            <p className="text-sm text-muted-foreground">Find your next ebook opportunity</p>
          </div>
        </Link>

        <Link
          href="/ebooks"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-blue-500/10 transition-colors group-hover:bg-blue-500/20">
            <BookOpen className="size-6 text-blue-600" />
          </div>
          <div>
            <p className="font-semibold">My Ebooks</p>
            <p className="text-sm text-muted-foreground">Edit, publish, and manage</p>
          </div>
        </Link>

        <Link
          href="/scout"
          className="group flex items-center gap-4 rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
        >
          <div className="flex size-12 items-center justify-center rounded-xl bg-orange-500/10 transition-colors group-hover:bg-orange-500/20">
            <Zap className="size-6 text-orange-600" />
          </div>
          <div>
            <p className="font-semibold">Scout Opportunities</p>
            <p className="text-sm text-muted-foreground">Scan platforms for gaps</p>
          </div>
        </Link>
      </div>

      {/* Recent Ebooks + Activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Ebooks */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-semibold">Recent Ebooks</h3>
            <Link
              href="/ebooks"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {recentEbooks.length === 0 ? (
              <div className="p-8 text-center">
                <FileText className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No ebooks yet</p>
                <Link
                  href="/research"
                  className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  <Plus className="size-3.5" />
                  Start with research
                </Link>
              </div>
            ) : (
              recentEbooks.map((ebook) => (
                <Link
                  key={ebook.id}
                  href={`/ebooks/${ebook.id}`}
                  className="flex items-center justify-between px-5 py-3 transition-colors hover:bg-muted/50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{ebook.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {ebook.total_pages ?? "—"} pages · {ebook.total_words?.toLocaleString() ?? "—"} words
                    </p>
                  </div>
                  <span
                    className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${
                      ebook.status === "published"
                        ? "bg-green-500/10 text-green-600"
                        : ebook.status === "generating"
                          ? "bg-yellow-500/10 text-yellow-600"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {ebook.status}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-xl border bg-card">
          <div className="flex items-center justify-between border-b px-5 py-4">
            <h3 className="font-semibold">Credit Activity</h3>
            <Link
              href="/credits"
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          </div>
          <div className="divide-y">
            {recentActivity.length === 0 ? (
              <div className="p-8 text-center">
                <Coins className="mx-auto size-8 text-muted-foreground/30" />
                <p className="mt-2 text-sm text-muted-foreground">No activity yet</p>
              </div>
            ) : (
              recentActivity.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-5 py-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm">{item.description || item.type}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(item.created_at).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      item.amount > 0 ? "text-green-600" : "text-muted-foreground"
                    }`}
                  >
                    {item.amount > 0 ? "+" : ""}{item.amount}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Getting Started CTA — show only when no ebooks */}
      {s.ebookCount === 0 && (
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-8 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
            <Zap className="size-7 text-primary" />
          </div>
          <h3 className="mt-4 text-lg font-semibold">Create Your First Ebook</h3>
          <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
            Start by researching a niche. Our AI will analyze the market, find gaps, and generate a
            professional ebook you can publish and sell — all in minutes.
          </p>
          <div className="mt-6">
            <Button onClick={() => (window.location.href = "/research")}>
              <Search className="size-4" />
              Research a Niche
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
