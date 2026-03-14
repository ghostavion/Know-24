"use client";

import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Loader2,
  Search,
  Store,
  Package,
  Code,
  Copy,
  DollarSign,
  ShoppingCart,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface MarketplaceItem {
  id: string;
  seller_id: string;
  item_type: "template" | "strategy_pack" | "clone";
  title: string;
  description: string | null;
  price_cents: number;
  purchase_count: number;
  status: string;
  created_at: string;
  agent?: {
    name: string;
    slug: string;
    tier: string;
    total_revenue_cents: number;
  } | null;
}

const TYPE_CONFIG = {
  template: { label: "Template", icon: Code, color: "bg-blue-500/10 text-blue-600" },
  strategy_pack: { label: "Strategy Pack", icon: Package, color: "bg-purple-500/10 text-purple-600" },
  clone: { label: "Agent Clone", icon: Copy, color: "bg-green-500/10 text-green-600" },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

type SortOption = "popular" | "newest" | "price_low" | "price_high";
type TypeFilter = "all" | "template" | "strategy_pack" | "clone";

export default function MarketplacePage() {
  const [items, setItems] = useState<MarketplaceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [sort, setSort] = useState<SortOption>("popular");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/marketplace?limit=50");
        if (!res.ok) return;
        const json = await res.json();
        setItems(json.data?.items ?? []);
      } catch (err) {
        console.error("[marketplace] Load failed:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const filtered = useMemo(() => {
    let result = [...items];

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (i) =>
          i.title.toLowerCase().includes(q) ||
          (i.description ?? "").toLowerCase().includes(q)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter((i) => i.item_type === typeFilter);
    }

    switch (sort) {
      case "popular":
        result.sort((a, b) => b.purchase_count - a.purchase_count);
        break;
      case "newest":
        result.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case "price_low":
        result.sort((a, b) => a.price_cents - b.price_cents);
        break;
      case "price_high":
        result.sort((a, b) => b.price_cents - a.price_cents);
        break;
    }

    return result;
  }, [items, search, typeFilter, sort]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-electric" />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold tracking-tight">Marketplace</h2>
          <p className="text-sm text-muted-foreground">
            Buy templates, strategy packs, and agent clones from top creators
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative flex-1 sm:w-64 sm:flex-initial">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-border bg-card py-2 pl-9 pr-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
            />
          </div>
          <Button
            variant="outline"
            size="default"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "border-violet-electric/30" : ""}
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filters
          </Button>
        </div>
      </div>

      {/* Filter Bar */}
      {showFilters && (
        <div className="mb-6 flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Type
            </label>
            <div className="flex rounded-lg border border-border">
              {(["all", "template", "strategy_pack", "clone"] as TypeFilter[]).map((t) => (
                <button
                  key={t}
                  onClick={() => setTypeFilter(t)}
                  className={`px-3 py-1.5 text-sm transition-colors ${
                    typeFilter === t
                      ? "bg-violet-electric/10 text-violet-electric"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t === "all" ? "All" : t === "strategy_pack" ? "Strategies" : t === "template" ? "Templates" : "Clones"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Sort By
            </label>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
            >
              <option value="popular">Most Popular</option>
              <option value="newest">Newest</option>
              <option value="price_low">Price: Low to High</option>
              <option value="price_high">Price: High to Low</option>
            </select>
          </div>
        </div>
      )}

      {/* Items Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((item) => {
          const typeConf = TYPE_CONFIG[item.item_type] ?? TYPE_CONFIG.template;
          return (
            <div
              key={item.id}
              className="rounded-xl border border-border bg-card p-5 transition-colors hover:border-violet-electric/20"
            >
              {/* Type Badge */}
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${typeConf.color}`}>
                  <typeConf.icon className="size-3" />
                  {typeConf.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.purchase_count} sold
                </span>
              </div>

              {/* Title + Description */}
              <h3 className="mt-3 font-semibold leading-tight">{item.title}</h3>
              {item.description && (
                <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">
                  {item.description}
                </p>
              )}

              {/* Agent Link (for clones) */}
              {item.agent && (
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-muted/50 px-3 py-2">
                  <span className="text-xs text-muted-foreground">Cloned from:</span>
                  <Link
                    href={`/agent/${item.agent.slug}`}
                    className="text-xs font-medium text-violet-electric hover:underline"
                  >
                    {item.agent.name}
                  </Link>
                  <span className="text-xs text-green-600">
                    {formatCents(item.agent.total_revenue_cents)} earned
                  </span>
                </div>
              )}

              {/* Price + Buy */}
              <div className="mt-4 flex items-center justify-between border-t pt-4">
                <div className="flex items-center gap-1">
                  <DollarSign className="size-4 text-green-600" />
                  <span className="text-lg font-bold">{formatCents(item.price_cents)}</span>
                </div>
                <Button size="sm" className="bg-violet-electric hover:bg-violet-electric/90">
                  <ShoppingCart className="size-3" />
                  Buy
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="py-16 text-center">
          <Store className="mx-auto size-12 text-muted-foreground/30" />
          <p className="mt-4 text-lg font-medium text-muted-foreground">
            No items found
          </p>
          <p className="mt-1 text-sm text-muted-foreground/60">
            Try adjusting your filters or check back later
          </p>
        </div>
      )}
    </div>
  );
}
