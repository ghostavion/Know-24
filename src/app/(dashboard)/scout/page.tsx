"use client";

import { useEffect, useState, useCallback } from "react";
import { Radar, Loader2, ExternalLink, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ScoutScan {
  id: string;
  niche: string;
  status: string;
  opportunities_found: number;
  results: Array<{
    platform: string;
    title: string;
    url: string;
    relevance: number;
    summary: string;
  }> | null;
  created_at: string;
  completed_at: string | null;
}

export default function ScoutPage() {
  const [scans, setScans] = useState<ScoutScan[]>([]);
  const [loading, setLoading] = useState(true);
  const [niche, setNiche] = useState("");
  const [starting, setStarting] = useState(false);
  const [expandedScan, setExpandedScan] = useState<string | null>(null);

  const fetchScans = useCallback(async () => {
    try {
      const res = await fetch("/api/scout/v1");
      const json = await res.json();
      if (json.data) setScans(json.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScans();
  }, [fetchScans]);

  // Poll for pending scans
  useEffect(() => {
    const hasPending = scans.some((s) => s.status === "pending" || s.status === "scanning");
    if (!hasPending) return;
    const interval = setInterval(fetchScans, 5000);
    return () => clearInterval(interval);
  }, [scans, fetchScans]);

  const startScan = async () => {
    if (!niche.trim() || starting) return;
    setStarting(true);
    try {
      const res = await fetch("/api/scout/v1", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche: niche.trim() }),
      });
      if (res.ok) {
        setNiche("");
        await fetchScans();
      }
    } finally {
      setStarting(false);
    }
  };

  const statusConfig: Record<string, { label: string; icon: React.ComponentType<{ className?: string }>; color: string }> = {
    pending: { label: "Queued", icon: Clock, color: "text-yellow-600" },
    scanning: { label: "Scanning...", icon: Loader2, color: "text-blue-600" },
    completed: { label: "Complete", icon: CheckCircle2, color: "text-green-600" },
    failed: { label: "Failed", icon: AlertCircle, color: "text-destructive" },
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scout</h1>
        <p className="mt-1 text-muted-foreground">
          Find live opportunities to promote your ebook across Reddit, Twitter, LinkedIn, and more.
        </p>
      </div>

      {/* Start Scan */}
      <div className="flex gap-3 rounded-xl border bg-card p-4">
        <input
          type="text"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          placeholder="Enter your niche..."
          className="flex-1 rounded-lg border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
          onKeyDown={(e) => e.key === "Enter" && startScan()}
        />
        <Button onClick={startScan} disabled={!niche.trim() || starting}>
          {starting ? <Loader2 className="size-4 animate-spin" /> : <Radar className="size-4" />}
          Scan (15 credits)
        </Button>
      </div>

      {/* Scan Results */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="h-20 animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : scans.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed p-12 text-center">
          <Radar className="mx-auto size-10 text-muted-foreground/30" />
          <p className="mt-3 text-sm text-muted-foreground">
            No scans yet. Enter your niche above to find promotion opportunities.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {scans.map((scan) => {
            const st = statusConfig[scan.status] ?? statusConfig.pending;
            const Icon = st.icon;
            const isExpanded = expandedScan === scan.id;

            return (
              <div key={scan.id} className="rounded-xl border bg-card">
                <button
                  className="flex w-full items-center justify-between p-4 text-left"
                  onClick={() => setExpandedScan(isExpanded ? null : scan.id)}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={cn("size-5", st.color, scan.status === "scanning" && "animate-spin")} />
                    <div>
                      <p className="font-medium">{scan.niche}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(scan.created_at).toLocaleString()}
                        {scan.opportunities_found > 0 && ` · ${scan.opportunities_found} opportunities`}
                      </p>
                    </div>
                  </div>
                  <span className={cn("text-xs font-medium", st.color)}>{st.label}</span>
                </button>

                {isExpanded && scan.results && scan.results.length > 0 && (
                  <div className="border-t px-4 pb-4 pt-3">
                    <div className="space-y-3">
                      {scan.results.map((opp, i) => (
                        <div key={i} className="flex items-start justify-between gap-3 rounded-lg bg-muted/50 p-3">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <span className="rounded bg-primary/10 px-1.5 py-0.5 text-xs font-medium text-primary">
                                {opp.platform}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {Math.round(opp.relevance * 100)}% relevant
                              </span>
                            </div>
                            <p className="mt-1 text-sm font-medium">{opp.title}</p>
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{opp.summary}</p>
                          </div>
                          <a
                            href={opp.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 rounded-lg border p-2 text-muted-foreground transition-colors hover:text-foreground"
                          >
                            <ExternalLink className="size-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
