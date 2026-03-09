"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Loader2 } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { OpportunityCard } from "@/components/scout/OpportunityCard";
import type { ScoutScan, ScoutOpportunity, OpportunityType } from "@/types/scout";

interface ScoutPanelProps {
  businessId: string;
}

const FILTER_OPTIONS: { label: string; value: OpportunityType | "all" }[] = [
  { label: "All", value: "all" },
  { label: "Hot Threads", value: "hot_thread" },
  { label: "Influencer", value: "influencer_match" },
  { label: "Podcasts", value: "podcast_opportunity" },
  { label: "Trending", value: "trending_topic" },
  { label: "Community", value: "community_engagement" },
  { label: "Competitor", value: "competitor_activity" },
];

const MONTHLY_SCAN_LIMIT = 20;

export const ScoutPanel = ({ businessId }: ScoutPanelProps) => {
  const [scans, setScans] = useState<ScoutScan[]>([]);
  const [opportunities, setOpportunities] = useState<ScoutOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<OpportunityType | "all">("all");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const scansThisMonth = scans.filter((s) => {
    const scanDate = new Date(s.createdAt);
    const now = new Date();
    return (
      scanDate.getMonth() === now.getMonth() &&
      scanDate.getFullYear() === now.getFullYear()
    );
  }).length;

  const fetchScans = useCallback(async (): Promise<ScoutScan[]> => {
    const res = await fetch(`/api/scout/scan?businessId=${businessId}`);
    const json: { data?: ScoutScan[]; error?: { message: string } } =
      await res.json();
    if (json.error) {
      throw new Error(json.error.message);
    }
    const data = json.data ?? [];
    setScans(data);
    return data;
  }, [businessId]);

  const fetchOpportunities = useCallback(
    async (scanId: string) => {
      const res = await fetch(
        `/api/scout/scan?businessId=${businessId}&scanId=${scanId}`
      );
      const json: { data?: ScoutOpportunity[]; error?: { message: string } } =
        await res.json();
      if (json.error) {
        throw new Error(json.error.message);
      }
      setOpportunities(json.data ?? []);
    },
    [businessId]
  );

  const loadInitialData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const scanData = await fetchScans();
      const completedScans = scanData.filter((s) => s.status === "completed");
      if (completedScans.length > 0) {
        await fetchOpportunities(completedScans[0].id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setLoading(false);
    }
  }, [fetchScans, fetchOpportunities]);

  useEffect(() => {
    loadInitialData();
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
      }
    };
  }, [loadInitialData]);

  const startPoll = useCallback(() => {
    if (pollRef.current) {
      clearInterval(pollRef.current);
    }
    pollRef.current = setInterval(async () => {
      try {
        const scanData = await fetchScans();
        const latest = scanData[0];
        if (!latest) return;
        if (latest.status === "completed") {
          setScanning(false);
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
          await fetchOpportunities(latest.id);
        } else if (latest.status === "failed") {
          setScanning(false);
          setError(latest.errorMessage ?? "Scan failed");
          if (pollRef.current) {
            clearInterval(pollRef.current);
            pollRef.current = null;
          }
        }
      } catch {
        // silently continue polling
      }
    }, 3000);
  }, [fetchScans, fetchOpportunities]);

  const handleRunScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const res = await fetch("/api/scout/scan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessId }),
      });
      const json: { error?: { message: string } } = await res.json();
      if (json.error) {
        setError(json.error.message);
        setScanning(false);
        return;
      }
      startPoll();
    } catch {
      setError("Failed to start scan");
      setScanning(false);
    }
  };

  const handleUpdateStatus = async (
    id: string,
    status: string,
    editedDraft?: string
  ) => {
    try {
      await fetch(`/api/scout/opportunities/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, editedDraft }),
      });
      setOpportunities((prev) =>
        prev.map((opp) =>
          opp.id === id
            ? {
                ...opp,
                status: status as ScoutOpportunity["status"],
                ...(editedDraft !== undefined
                  ? { draftResponse: editedDraft }
                  : {}),
              }
            : opp
        )
      );
    } catch {
      // optimistic update failed — could add error toast later
    }
  };

  const filteredOpportunities =
    activeFilter === "all"
      ? opportunities
      : opportunities.filter((opp) => opp.type === activeFilter);

  const progressPercent = Math.min(
    (scansThisMonth / MONTHLY_SCAN_LIMIT) * 100,
    100
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-1">
      {/* Header Row */}
      <div className="flex items-center justify-between gap-4">
        <Button onClick={handleRunScan} disabled={scanning}>
          {scanning && <Loader2 className="size-4 animate-spin" />}
          {scanning ? "Scanning..." : "Run New Scan"}
        </Button>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">
            {scansThisMonth} of {MONTHLY_SCAN_LIMIT} scans used this month
          </p>
          <div className="mt-1 h-1.5 w-32 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-1.5">
        {FILTER_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setActiveFilter(opt.value)}
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium transition-colors",
              activeFilter === opt.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {/* Opportunity List */}
      {filteredOpportunities.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-12 text-center">
          <p className="text-sm text-muted-foreground">
            No opportunities found yet. Run a scan to discover opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOpportunities.map((opp) => (
            <OpportunityCard
              key={opp.id}
              opportunity={opp}
              onUpdateStatus={handleUpdateStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};
