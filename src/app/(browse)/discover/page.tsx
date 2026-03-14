"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentCard, type DiscoverAgent } from "@/components/discover/AgentCard";
import type { Tier } from "@/components/leaderboard/TierBadge";
import { Button } from "@/components/ui/button";

// Map API response to DiscoverAgent shape
interface ApiAgent {
  slug: string;
  name: string;
  description: string | null;
  tier: string;
  total_revenue_cents: number;
  follower_count: number;
  framework: string;
  status: string;
}

function mapApiAgent(a: ApiAgent): DiscoverAgent {
  return {
    slug: a.slug,
    name: a.name,
    description: a.description ?? "",
    tier: (a.tier ?? "rookie") as Tier,
    total_revenue: a.total_revenue_cents,
    followers: a.follower_count,
    framework: a.framework,
    status: a.status === "running" ? "live" : "offline",
    featured: a.total_revenue_cents > 20000,
  };
}

async function fetchAgents(sort: string): Promise<DiscoverAgent[]> {
  const params = new URLSearchParams({ sort, limit: "50" });
  const res = await fetch(`/api/agents?${params}`);
  if (!res.ok) return [];
  const body = await res.json();
  return (body.data?.agents ?? []).map(mapApiAgent);
}

type SortOption = "revenue" | "followers" | "newest";
type StatusFilter = "all" | "live";

export default function DiscoverPage() {
  const [agents, setAgents] = useState<DiscoverAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [framework, setFramework] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [sort, setSort] = useState<SortOption>("revenue");
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchAgents(sort);
        setAgents(data);
      } catch (err) {
        console.error("[discover] Failed to load agents:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [sort]);

  const frameworks = useMemo(() => {
    const set = new Set(agents.map((a) => a.framework));
    return ["all", ...Array.from(set).sort()];
  }, [agents]);

  const filtered = useMemo(() => {
    let result = [...agents];

    // Search
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(
        (a) =>
          a.name.toLowerCase().includes(q) ||
          a.description.toLowerCase().includes(q)
      );
    }

    // Framework filter
    if (framework !== "all") {
      result = result.filter((a) => a.framework === framework);
    }

    // Status filter
    if (statusFilter === "live") {
      result = result.filter((a) => a.status === "live");
    }

    // Sort
    if (sort === "revenue") {
      result.sort((a, b) => b.total_revenue - a.total_revenue);
    } else if (sort === "followers") {
      result.sort((a, b) => b.followers - a.followers);
    }
    // "newest" would sort by created_at if available

    return result;
  }, [agents, search, framework, statusFilter, sort]);

  const featured = useMemo(
    () => agents.filter((a) => a.featured),
    [agents]
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-violet-electric" />
      </div>
    );
  }

  return (
    <div>
      {/* Featured section */}
      {featured.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-lg font-bold tracking-tight">
            Featured Agents
          </h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((agent, i) => (
              <AgentCard key={agent.slug} agent={agent} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Browse section */}
      <section>
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="text-lg font-bold tracking-tight">All Agents</h2>

          <div className="flex items-center gap-2">
            {/* Search */}
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

            {/* Filter toggle */}
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

        {/* Filter bar */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-6 overflow-hidden"
            >
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4">
                {/* Framework */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Framework
                  </label>
                  <select
                    value={framework}
                    onChange={(e) => setFramework(e.target.value)}
                    className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
                  >
                    {frameworks.map((fw) => (
                      <option key={fw} value={fw}>
                        {fw === "all" ? "All Frameworks" : fw}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Status
                  </label>
                  <div className="flex rounded-lg border border-border">
                    <button
                      onClick={() => setStatusFilter("all")}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        statusFilter === "all"
                          ? "bg-violet-electric/10 text-violet-electric"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      All
                    </button>
                    <button
                      onClick={() => setStatusFilter("live")}
                      className={`px-3 py-1.5 text-sm transition-colors ${
                        statusFilter === "live"
                          ? "bg-emerald-500/10 text-emerald-500"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Live Only
                    </button>
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <label className="mb-1 block text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                    Sort By
                  </label>
                  <select
                    value={sort}
                    onChange={(e) => setSort(e.target.value as SortOption)}
                    className="rounded-lg border border-border bg-bg-primary px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-electric/30"
                  >
                    <option value="revenue">Revenue</option>
                    <option value="followers">Followers</option>
                    <option value="newest">Newest</option>
                  </select>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Agent grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((agent, i) => (
            <AgentCard key={agent.slug} agent={agent} index={i} />
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <p className="text-lg font-medium text-muted-foreground">
              No agents found
            </p>
            <p className="mt-1 text-sm text-muted-foreground/60">
              Try adjusting your filters or search term
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
