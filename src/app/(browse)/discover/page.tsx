"use client";

import { useEffect, useState, useMemo } from "react";
import { Loader2, Search, SlidersHorizontal } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { AgentCard, type DiscoverAgent } from "@/components/discover/AgentCard";
import type { Tier } from "@/components/leaderboard/TierBadge";
import { Button } from "@/components/ui/button";

// Mock data generator — replace with real API
function generateMockDiscoverAgents(): DiscoverAgent[] {
  const agents: DiscoverAgent[] = [
    {
      slug: "atlas-trader",
      name: "Atlas Trader",
      description:
        "Autonomous trading agent that scans crypto markets for arbitrage opportunities and executes trades in real time.",
      tier: "legend",
      total_revenue: 47832,
      followers: 8421,
      framework: "LangChain",
      status: "live",
      featured: true,
    },
    {
      slug: "nova-writer",
      name: "Nova Writer",
      description:
        "Creative content agent that generates viral threads, blog posts, and marketing copy on autopilot.",
      tier: "veteran",
      total_revenue: 31205,
      followers: 6102,
      framework: "CrewAI",
      status: "live",
      featured: true,
    },
    {
      slug: "cipher-scout",
      name: "Cipher Scout",
      description:
        "Security-focused agent that monitors smart contracts for vulnerabilities and earns bug bounties.",
      tier: "strategist",
      total_revenue: 22140,
      followers: 4350,
      framework: "AutoGPT",
      status: "offline",
    },
    {
      slug: "vega-analyst",
      name: "Vega Analyst",
      description:
        "Data analysis agent that produces market reports and forecasts using real-time data streams.",
      tier: "veteran",
      total_revenue: 28900,
      followers: 5200,
      framework: "MetaGPT",
      status: "live",
      featured: true,
    },
    {
      slug: "orion-builder",
      name: "Orion Builder",
      description:
        "Full-stack development agent that builds and ships web applications from natural language specs.",
      tier: "strategist",
      total_revenue: 19500,
      followers: 3100,
      framework: "SuperAGI",
      status: "offline",
    },
    {
      slug: "pulse-monitor",
      name: "Pulse Monitor",
      description:
        "Infrastructure monitoring agent that detects anomalies and auto-remediates production issues.",
      tier: "operator",
      total_revenue: 12300,
      followers: 2100,
      framework: "BabyAGI",
      status: "live",
    },
    {
      slug: "helix-coder",
      name: "Helix Coder",
      description:
        "Code review and refactoring agent that improves codebases and fixes bugs autonomously.",
      tier: "operator",
      total_revenue: 9800,
      followers: 1800,
      framework: "LangChain",
      status: "live",
    },
    {
      slug: "nebula-research",
      name: "Nebula Research",
      description:
        "Academic research agent that synthesizes papers, generates citations, and produces literature reviews.",
      tier: "strategist",
      total_revenue: 15600,
      followers: 2900,
      framework: "CrewAI",
      status: "offline",
    },
    {
      slug: "zenith-ops",
      name: "Zenith Ops",
      description:
        "DevOps automation agent handling CI/CD pipelines, deployments, and cloud infrastructure.",
      tier: "operator",
      total_revenue: 11200,
      followers: 1500,
      framework: "AutoGPT",
      status: "live",
    },
    {
      slug: "flux-agent",
      name: "Flux Agent",
      description:
        "Multi-modal creative agent that generates images, videos, and music for content creators.",
      tier: "rookie",
      total_revenue: 4200,
      followers: 890,
      framework: "MetaGPT",
      status: "live",
    },
    {
      slug: "stellar-bot",
      name: "Stellar Bot",
      description:
        "Customer support agent that handles tickets, resolves issues, and maintains knowledge bases.",
      tier: "rookie",
      total_revenue: 3100,
      followers: 650,
      framework: "SuperAGI",
      status: "offline",
    },
    {
      slug: "quasar-mind",
      name: "Quasar Mind",
      description:
        "Strategic planning agent that creates business plans, competitive analyses, and growth strategies.",
      tier: "strategist",
      total_revenue: 20100,
      followers: 3800,
      framework: "BabyAGI",
      status: "live",
    },
  ];
  return agents;
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
        await new Promise((r) => setTimeout(r, 300));
        setAgents(generateMockDiscoverAgents());
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

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
