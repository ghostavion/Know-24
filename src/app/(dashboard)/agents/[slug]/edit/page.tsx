"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ChevronLeft,
  Loader2,
  Save,
  Play,
  Square,
  Trash2,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { Agent } from "@/types/agenttv";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------
const editAgentSchema = z.object({
  name: z.string().min(1, "Name is required").max(100),
  description: z.string().max(2000).optional(),
  goal: z.string().max(5000).optional(),
  budget_usd: z.coerce.number().min(0).max(100000).optional(),
  daily_cap_usd: z.coerce.number().min(0).max(10000).optional(),
});

type FormData = z.infer<typeof editAgentSchema>;

export default function EditAgentPage() {
  const router = useRouter();
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } = useForm<FormData>({
    resolver: zodResolver(editAgentSchema) as any,
  });

  const loadAgent = useCallback(async () => {
    try {
      const res = await fetch(`/api/agents/${slug}`);
      if (!res.ok) {
        router.push("/agents");
        return;
      }
      const json = await res.json();
      const a = json.data as Agent;
      setAgent(a);
      reset({
        name: a.name,
        description: a.description ?? "",
        goal: (a.config as Record<string, unknown>)?.goal as string ?? "",
        budget_usd: (a.config as Record<string, unknown>)?.budget_usd as number ?? 0,
        daily_cap_usd: (a.config as Record<string, unknown>)?.daily_cap_usd as number ?? 0,
      });
    } catch (err) {
      console.error("[edit-agent] Load failed:", err);
      router.push("/agents");
    } finally {
      setLoading(false);
    }
  }, [slug, router, reset]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  async function onSubmit(data: FormData) {
    if (!agent) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/agents/${slug}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          config: {
            ...(agent.config as Record<string, unknown>),
            goal: data.goal,
            budget_usd: data.budget_usd,
            daily_cap_usd: data.daily_cap_usd,
          },
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setAgent(json.data);
        reset(data);
      } else {
        const json = await res.json();
        toast.error(json.error?.message ?? "Failed to save");
      }
    } catch (err) {
      console.error("[edit-agent] Save failed:", err);
      toast.error("Failed to save changes");
    } finally {
      setSaving(false);
    }
  }

  async function toggleStatus() {
    if (!agent) return;
    setToggling(true);
    const isRunning = agent.status === "running" || agent.status === "starting";

    try {
      if (isRunning) {
        // Stop agent via dedicated endpoint
        const res = await fetch(`/api/agents/${slug}/stop`, { method: "POST" });
        if (res.ok) {
          setAgent({ ...agent, status: "offline" } as Agent);
        } else {
          const json = await res.json();
          toast.error(json.error?.message ?? "Failed to stop agent");
        }
      } else {
        // Start agent via dedicated endpoint
        const agentCmd = (agent as unknown as { config?: { agent_cmd?: string } }).config?.agent_cmd ?? "python main.py";
        const res = await fetch(`/api/agents/${slug}/start`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            agent_cmd: agentCmd,
            daily_cap_usd: (agent as unknown as { config?: { daily_cap_usd?: number } }).config?.daily_cap_usd,
          }),
        });
        if (res.ok) {
          setAgent({ ...agent, status: "running" } as Agent);
        } else {
          const json = await res.json();
          toast.error(json.error?.message ?? "Failed to start agent");
        }
      }
    } catch (err) {
      console.error("[edit-agent] Toggle failed:", err);
      toast.error("Network error while toggling agent");
    } finally {
      setToggling(false);
    }
  }

  async function deleteAgent() {
    setDeleting(true);
    try {
      const res = await fetch(`/api/agents/${slug}`, { method: "DELETE" });
      if (res.ok) {
        router.push("/agents");
      } else {
        const json = await res.json();
        toast.error(json.error?.message ?? "Failed to delete");
      }
    } catch (err) {
      console.error("[edit-agent] Delete failed:", err);
      toast.error("Failed to delete agent");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!agent) return null;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Button variant="ghost" size="sm" onClick={() => router.push("/agents")}>
            <ChevronLeft className="size-4" />
            Back to Agents
          </Button>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Edit: {agent.name}</h1>
          <p className="text-sm text-muted-foreground">/{agent.slug}</p>
        </div>
        <div className="flex items-center gap-2">
          <div
            className={`size-2.5 rounded-full ${
              agent.status === "running"
                ? "bg-green-500 animate-pulse"
                : agent.status === "error"
                  ? "bg-red-500"
                  : "bg-gray-400"
            }`}
          />
          <span className="text-sm font-medium capitalize">{agent.status}</span>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="rounded-xl border bg-card p-6 space-y-4">
          <div>
            <label className="text-sm font-medium">Agent Name</label>
            <input
              {...register("name")}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name.message}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Description</label>
            <textarea
              {...register("description")}
              rows={3}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Agent Goal / System Prompt</label>
            <textarea
              {...register("goal")}
              rows={6}
              className="mt-1 w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Budget (USD)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  {...register("budget_usd")}
                  type="number"
                  step="1"
                  min="0"
                  className="w-full rounded-lg border bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Daily Cap (USD)</label>
              <div className="relative mt-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">$</span>
                <input
                  {...register("daily_cap_usd")}
                  type="number"
                  step="1"
                  min="0"
                  className="w-full rounded-lg border bg-background py-2 pl-7 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          </div>

          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-xs text-muted-foreground">
              <strong>Framework:</strong>{" "}
              <span className="capitalize">{agent.framework.replace("-", " ")}</span>
              {" | "}
              <strong>Tier:</strong>{" "}
              <span className="capitalize">{agent.tier}</span>
              {" | "}
              <strong>Created:</strong>{" "}
              {new Date(agent.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-between">
          <Button type="submit" disabled={saving || !isDirty}>
            {saving ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
            Save Changes
          </Button>
        </div>
      </form>

      {/* Controls */}
      <div className="rounded-xl border bg-card p-6 space-y-4">
        <h2 className="font-semibold">Agent Controls</h2>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={toggleStatus} disabled={toggling}>
            {toggling ? (
              <Loader2 className="size-4 animate-spin" />
            ) : agent.status === "running" ? (
              <>
                <Square className="size-4" />
                Stop Agent
              </>
            ) : (
              <>
                <Play className="size-4" />
                Start Agent
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-xl border border-red-200 bg-red-50/50 p-6 dark:border-red-900/50 dark:bg-red-950/20">
        <h2 className="font-semibold text-red-600">Danger Zone</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Deleting an agent is irreversible. All runs, events, and stats will be permanently removed.
        </p>

        {!showDeleteConfirm ? (
          <Button
            variant="outline"
            className="mt-4 border-red-300 text-red-600 hover:bg-red-100 dark:border-red-800 dark:hover:bg-red-950"
            onClick={() => setShowDeleteConfirm(true)}
          >
            <Trash2 className="size-4" />
            Delete Agent
          </Button>
        ) : (
          <div className="mt-4 flex items-center gap-3 rounded-lg border border-red-300 bg-red-100/50 p-3 dark:border-red-800 dark:bg-red-950/50">
            <AlertTriangle className="size-5 text-red-600" />
            <p className="flex-1 text-sm text-red-600">Are you sure? This cannot be undone.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDeleteConfirm(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              className="bg-red-600 hover:bg-red-700"
              onClick={deleteAgent}
              disabled={deleting}
            >
              {deleting ? <Loader2 className="size-4 animate-spin" /> : <Trash2 className="size-4" />}
              Confirm Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
