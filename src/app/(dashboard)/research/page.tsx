"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2, CheckCircle2, AlertCircle, Zap, TrendingUp, Target, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface NarrationEvent {
  phase: string;
  message: string;
  detail?: string;
  progress?: number;
  timestamp: number;
}

interface ProofCard {
  recommendedProduct: {
    type: string;
    title: string;
    price: number;
    chapters: number;
    estimatedPages: number;
    uniqueAngle: string;
    whyThisWillSell: string;
  };
  marketSize: { estimated: string; trend: string };
  pricingInsights: { sweetSpot: number; premiumRange: number };
  topGap: { topic: string; searchDemand: string; opportunity: string } | null;
  sourceCount: number;
  confidenceScore: number;
}

export default function ResearchPage() {
  const router = useRouter();
  const [niche, setNiche] = useState("");
  const [personalAngle, setPersonalAngle] = useState("");
  const [status, setStatus] = useState<"idle" | "running" | "complete" | "error">("idle");
  const [narrations, setNarrations] = useState<NarrationEvent[]>([]);
  const [proofCard, setProofCard] = useState<ProofCard | null>(null);
  const [progress, setProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState("");
  const [runId, setRunId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const startResearch = useCallback(async () => {
    if (!niche.trim() || status === "running") return;

    setStatus("running");
    setNarrations([]);
    setProofCard(null);
    setProgress(0);
    setErrorMsg("");

    try {
      const res = await fetch("/api/research/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          niche: niche.trim(),
          personalAngle: personalAngle.trim() || undefined,
        }),
      });

      const json = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMsg(json.error?.message ?? "Failed to start research");
        return;
      }

      const id = json.data.runId;
      setRunId(id);

      // Connect to SSE stream
      const es = new EventSource(`/api/research/${id}/stream`);
      eventSourceRef.current = es;

      es.addEventListener("narration", (e) => {
        const data = JSON.parse(e.data) as NarrationEvent;
        setNarrations((prev) => [...prev, data]);
        if (data.progress) setProgress(data.progress);
      });

      es.addEventListener("phase", (e) => {
        const data = JSON.parse(e.data) as { phase: string };
        // Phase updates handled by narration events
        if (data.phase === "completed") setProgress(100);
      });

      es.addEventListener("complete", (e) => {
        const data = JSON.parse(e.data) as { proofCard: ProofCard; confidenceScore: number };
        setProofCard(data.proofCard);
        setProgress(100);
        setStatus("complete");
        es.close();
      });

      es.addEventListener("error", (e) => {
        if (e instanceof MessageEvent) {
          const data = JSON.parse(e.data) as { message: string };
          setErrorMsg(data.message);
        }
        setStatus("error");
        es.close();
      });

      es.onerror = () => {
        setStatus((prev) => {
          if (prev === "running") return "error";
          return prev;
        });
        setErrorMsg("Connection lost");
        es.close();
      };
    } catch {
      setStatus("error");
      setErrorMsg("Network error");
    }
  }, [niche, personalAngle, status]);

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Niche Research</h1>
        <p className="mt-1 text-muted-foreground">
          Enter your niche and we&apos;ll analyze the market, find gaps, and recommend your ideal ebook.
        </p>
      </div>

      {/* Input Form */}
      <div className="space-y-4 rounded-xl border bg-card p-6">
        <div>
          <label className="mb-1.5 block text-sm font-medium">Your Niche</label>
          <input
            type="text"
            value={niche}
            onChange={(e) => setNiche(e.target.value)}
            placeholder="e.g. personal finance for millennials, sourdough baking, SaaS marketing..."
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={status === "running"}
            onKeyDown={(e) => e.key === "Enter" && startResearch()}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">
            Your Angle <span className="text-muted-foreground">(optional)</span>
          </label>
          <input
            type="text"
            value={personalAngle}
            onChange={(e) => setPersonalAngle(e.target.value)}
            placeholder="e.g. 10 years as a CFP, taught 500+ students, built a 6-figure bakery..."
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm outline-none transition-colors focus:border-primary focus:ring-1 focus:ring-primary"
            disabled={status === "running"}
          />
        </div>
        <Button
          onClick={startResearch}
          disabled={!niche.trim() || status === "running"}
          className="w-full"
        >
          {status === "running" ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Researching...
            </>
          ) : (
            <>
              <Search className="size-4" />
              Research This Niche (10 credits)
            </>
          )}
        </Button>
      </div>

      {/* Progress + Narration */}
      {status !== "idle" && (
        <div className="space-y-4 rounded-xl border bg-card p-6">
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">
                {status === "complete" ? "Research Complete" : status === "error" ? "Error" : "Analyzing..."}
              </span>
              <span className="text-muted-foreground">{progress}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  status === "error" ? "bg-destructive" : status === "complete" ? "bg-green-500" : "bg-primary"
                )}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          {/* Narration feed */}
          <div className="max-h-48 space-y-2 overflow-y-auto">
            {narrations.map((n, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                {n.phase === "completed" ? (
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-green-500" />
                ) : n.phase === "failed" ? (
                  <AlertCircle className="mt-0.5 size-4 shrink-0 text-destructive" />
                ) : (
                  <Loader2 className="mt-0.5 size-4 shrink-0 animate-spin text-primary" />
                )}
                <div>
                  <p className="font-medium">{n.message}</p>
                  {n.detail && <p className="text-muted-foreground">{n.detail}</p>}
                </div>
              </div>
            ))}
          </div>

          {errorMsg && (
            <div className="rounded-lg bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {errorMsg}
            </div>
          )}
        </div>
      )}

      {/* Proof Card */}
      {proofCard && (
        <div className="space-y-6">
          <div className="rounded-xl border-2 border-green-500/30 bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500/10">
                <CheckCircle2 className="size-5 text-green-500" />
              </div>
              <div>
                <h2 className="text-lg font-semibold">Your Proof Card</h2>
                <p className="text-sm text-muted-foreground">
                  Confidence: {proofCard.confidenceScore}/100 · {proofCard.sourceCount} sources analyzed
                </p>
              </div>
            </div>

            {/* Recommended Product */}
            <div className="rounded-lg border bg-primary/5 p-5">
              <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-primary">
                Recommended Ebook
              </h3>
              <p className="text-xl font-bold">{proofCard.recommendedProduct.title}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {proofCard.recommendedProduct.uniqueAngle}
              </p>

              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="flex items-center justify-center gap-1">
                    <DollarSign className="size-4 text-green-600" />
                    <span className="text-lg font-semibold">${proofCard.recommendedProduct.price}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">Price</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold">{proofCard.recommendedProduct.chapters}</span>
                  <p className="text-xs text-muted-foreground">Chapters</p>
                </div>
                <div className="text-center">
                  <span className="text-lg font-semibold">~{proofCard.recommendedProduct.estimatedPages}</span>
                  <p className="text-xs text-muted-foreground">Pages</p>
                </div>
              </div>

              <p className="mt-4 text-sm">
                <strong>Why this will sell:</strong> {proofCard.recommendedProduct.whyThisWillSell}
              </p>
            </div>

            {/* Market Stats */}
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <TrendingUp className="mx-auto mb-1 size-5 text-blue-500" />
                <p className="text-sm font-semibold">{proofCard.marketSize.estimated}</p>
                <p className="text-xs text-muted-foreground capitalize">{proofCard.marketSize.trend}</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <DollarSign className="mx-auto mb-1 size-5 text-green-500" />
                <p className="text-sm font-semibold">${proofCard.pricingInsights.sweetSpot}</p>
                <p className="text-xs text-muted-foreground">Sweet Spot</p>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <Target className="mx-auto mb-1 size-5 text-purple-500" />
                <p className="text-sm font-semibold">{proofCard.topGap?.topic ?? "N/A"}</p>
                <p className="text-xs text-muted-foreground">Top Gap</p>
              </div>
            </div>
          </div>

          {/* CTA — Generate Ebook */}
          <Button
            className="w-full"
            size="lg"
            onClick={() => router.push(`/ebooks?research=${runId}&niche=${encodeURIComponent(niche)}`)}
          >
            <Zap className="size-4" />
            Generate This Ebook (50 credits)
          </Button>
        </div>
      )}
    </div>
  );
}
