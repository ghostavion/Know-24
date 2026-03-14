"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import {
  Bot,
  Plus,
  Loader2,
  Play,
  Square,
  Pencil,
  Eye,
  Users,
  DollarSign,
  Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { createAuthenticatedBrowserClient } from "@/lib/supabase/client";
import type { AgentSummary, AgentFramework } from "@/types/agenttv";

const FRAMEWORK_LABELS: Record<AgentFramework, { label: string; color: string }> = {
  langgraph: { label: "LangGraph", color: "bg-blue-500/10 text-blue-600" },
  crewai: { label: "CrewAI", color: "bg-purple-500/10 text-purple-600" },
  "openai-agents": { label: "OpenAI Agents", color: "bg-green-500/10 text-green-600" },
  "raw-python": { label: "Raw Python", color: "bg-yellow-500/10 text-yellow-600" },
  nodejs: { label: "Node.js", color: "bg-teal-500/10 text-teal-600" },
};

function formatCents(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

function formatUptime(createdAt: string): string {
  const days = Math.floor(
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24)
  );
  if (days === 0) return "Today";
  if (days === 1) return "1 day";
  return `${days} days`;
}

export default function AgentsPage() {
  const { getToken } = useAuth();
  const [agents, setAgents] = useState<AgentSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const supabase = await createAuthenticatedBrowserClient(getToken);
        const { data, error } = await supabase
          .from("agents")
          .select(
            "id, name, slug, description, framework, status, tier, total_revenue_cents, follower_count, created_at"
          )
          .neq("status", "deleted")
          .order("created_at", { ascending: false });

        if (error) throw error;
        setAgents((data ?? []) as AgentSummary[]);
      } catch (err) {
        console.error("[agents] Failed to load:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [getToken]);

  async function toggleAgent(slug: string, currentStatus: string) {
    const isRunning = currentStatus === "running" || currentStatus === "starting";
    const endpoint = isRunning ? "stop" : "start";
    const optimisticStatus = isRunning ? "offline" : "starting";

    // Optimistic update
    setAgents((prev) =>
      prev.map((a) =>
        a.slug === slug ? { ...a, status: optimisticStatus as AgentSummary["status"] } : a
      )
    );

    try {
      const body = isRunning ? {} : { agent_cmd: "python main.py" };
      const res = await fetch(`/api/agents/${slug}/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        const finalStatus = isRunning ? "offline" : "running";
        setAgents((prev) =>
          prev.map((a) =>
            a.slug === slug ? { ...a, status: finalStatus as AgentSummary["status"] } : a
          )
        );
      } else {
        // Revert on failure
        setAgents((prev) =>
          prev.map((a) =>
            a.slug === slug ? { ...a, status: currentStatus as AgentSummary["status"] } : a
          )
        );
        const json = await res.json().catch(() => ({}));
        console.error("[agents] Toggle failed:", json.error?.message);
      }
    } catch (err) {
      // Revert on error
      setAgents((prev) =>
        prev.map((a) =>
          a.slug === slug ? { ...a, status: currentStatus as AgentSummary["status"] } : a
        )
      );
      console.error("[agents] Toggle failed:", err);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Agents</h1>
          <p className="text-sm text-muted-foreground">
            {agents.length} agent{agents.length !== 1 ? "s" : ""} deployed
          </p>
        </div>
        <Link href="/agents/new">
          <Button>
            <Plus className="size-4" />
            Create Agent
          </Button>
        </Link>
      </div>

      {/* Agent Cards Grid */}
      {agents.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center">
          <Bot className="mx-auto size-12 text-muted-foreground/40" />
          <h3 className="mt-4 text-lg font-semibold">No agents yet</h3>
          <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
            Create your first AI agent to start earning. Choose a framework,
            connect your API key, and deploy in minutes.
          </p>
          <div className="mt-6">
            <Link href="/agents/new">
              <Button>
                <Plus className="size-4" />
                Create Agent
              </Button>
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {agents.map((agent) => {
            const fw = FRAMEWORK_LABELS[agent.framework] ?? {
              label: agent.framework,
              color: "bg-gray-500/10 text-gray-600",
            };

            return (
              <div
                key={agent.id}
                className="group relative rounded-xl border bg-card p-5 transition-colors hover:border-primary/30"
              >
                {/* Status + Name */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`size-2.5 rounded-full ${
                        agent.status === "running"
                          ? "bg-green-500 animate-pulse"
                          : agent.status === "error"
                            ? "bg-red-500"
                            : "bg-gray-400"
                      }`}
                    />
                    <h3 className="font-semibold">{agent.name}</h3>
                  </div>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${fw.color}`}>
                    {fw.label}
                  </span>
                </div>

                {/* Description */}
                {agent.description && (
                  <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                    {agent.description}
                  </p>
                )}

                {/* Metrics */}
                <div className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <DollarSign className="size-3" />
                      Revenue
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">
                      {formatCents(agent.total_revenue_cents)}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Users className="size-3" />
                      Followers
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">
                      {agent.follower_count.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                      <Clock className="size-3" />
                      Uptime
                    </div>
                    <p className="mt-0.5 text-sm font-semibold">
                      {formatUptime(agent.created_at)}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-4 flex items-center gap-2 border-t pt-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleAgent(agent.slug, agent.status)}
                    className="flex-1"
                  >
                    {agent.status === "running" ? (
                      <>
                        <Square className="size-3" />
                        Stop
                      </>
                    ) : (
                      <>
                        <Play className="size-3" />
                        Start
                      </>
                    )}
                  </Button>
                  <Link href={`/agents/${agent.slug}/edit`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Pencil className="size-3" />
                      Edit
                    </Button>
                  </Link>
                  <Link href={`/watch/${agent.slug}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full">
                      <Eye className="size-3" />
                      Stream
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
