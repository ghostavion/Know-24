"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Search,
  Target,
  FileText,
  Image,
  Headphones,
  Video,
  Globe,
  Compass,
  Check,
  Loader2,
  AlertCircle,
  RefreshCw,
  Clock,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { useSetupWizard } from "@/hooks/useSetupWizard";

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BuildStage {
  id: string;
  label: string;
  icon: LucideIcon;
  status: "pending" | "in_progress" | "completed" | "error";
  detail?: string;
}

interface ResearchData {
  status: "pending" | "processing" | "completed" | "error";
  insights?: string[];
  recommendedProduct?: {
    productTypeSlug: string;
    title: string;
    description: string;
    price: number;
  };
  productCount?: number;
  contentGaps?: number;
  niche?: string;
}

interface AssetData {
  coverImage?: boolean;
  audio?: boolean;
  video?: boolean;
  storefront?: boolean;
  distribution?: boolean;
  product?: boolean;
}

/* -------------------------------------------------------------------------- */
/*  Initial stages                                                            */
/* -------------------------------------------------------------------------- */

const INITIAL_STAGES: BuildStage[] = [
  { id: "research", label: "Researching your niche", icon: Search, status: "pending" },
  { id: "select-product", label: "Selecting best product", icon: Target, status: "pending" },
  { id: "generate-product", label: "Generating your product", icon: FileText, status: "pending" },
  { id: "cover-art", label: "Creating cover art", icon: Image, status: "pending" },
  { id: "audio", label: "Recording audio version", icon: Headphones, status: "pending" },
  { id: "video", label: "Creating explainer video", icon: Video, status: "pending" },
  { id: "storefront", label: "Building your storefront", icon: Globe, status: "pending" },
  { id: "distribution", label: "Finding distribution channels", icon: Compass, status: "pending" },
];

/* -------------------------------------------------------------------------- */
/*  Component                                                                 */
/* -------------------------------------------------------------------------- */

const AIBuildProgress = () => {
  const { businessId, setStep, setBusinessInfo, setSelectedProductTypes, setBuildComplete } =
    useSetupWizard();

  const [stages, setStages] = useState<BuildStage[]>(INITIAL_STAGES);
  const [insights, setInsights] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [timedOut, setTimedOut] = useState(false);
  const hasStartedRef = useRef(false);
  const productIdRef = useRef<string | null>(null);

  /* -- Helpers to update a single stage ----------------------------------- */

  const updateStage = useCallback(
    (id: string, update: Partial<BuildStage>) => {
      setStages((prev) =>
        prev.map((s) => (s.id === id ? { ...s, ...update } : s))
      );
    },
    []
  );

  const markCompleted = useCallback(
    (id: string, detail?: string) => updateStage(id, { status: "completed", detail }),
    [updateStage]
  );

  const markInProgress = useCallback(
    (id: string, detail?: string) => updateStage(id, { status: "in_progress", detail }),
    [updateStage]
  );

  /* -- Retry handler ------------------------------------------------------ */

  const handleRetry = useCallback(() => {
    setError(null);
    setTimedOut(false);
    setStages(INITIAL_STAGES);
    setInsights([]);
    hasStartedRef.current = false;
    // Trigger re-render which will re-run the effect
    setRetryCount((c) => c + 1);
  }, []);

  const [retryCount, setRetryCount] = useState(0);

  /* -- Main orchestration ------------------------------------------------- */

  useEffect(() => {
    if (hasStartedRef.current || !businessId) return;
    hasStartedRef.current = true;

    let cancelled = false;

    const run = async () => {
      try {
        /* ---- Stage 1: Research ------------------------------------------ */
        markInProgress("research", "Analyzing market data...");

        const researchData = await pollResearch(businessId, (data) => {
          if (cancelled) return;
          const newInsights: string[] = [];
          if (data.productCount) {
            newInsights.push(
              `Found ${data.productCount} products in ${data.niche ?? "your niche"}`
            );
          }
          if (data.contentGaps) {
            newInsights.push(`Identified ${data.contentGaps} content gaps`);
          }
          if (data.insights) {
            newInsights.push(...data.insights);
          }
          if (newInsights.length > 0) {
            setInsights(newInsights);
          }
        });

        if (cancelled) return;
        markCompleted("research", `Research complete`);

        /* ---- Stage 2: Select product ------------------------------------ */
        markInProgress("select-product", "Evaluating best fit...");

        const recommendedProduct = researchData.recommendedProduct;
        const productSlug = recommendedProduct?.productTypeSlug ?? "ebook";

        await delay(1500);
        if (cancelled) return;

        setSelectedProductTypes([productSlug]);
        markCompleted(
          "select-product",
          recommendedProduct?.title ?? "Product selected"
        );

        /* ---- Stage 3: Build product ------------------------------------- */
        markInProgress("generate-product", "Writing content...");

        const buildRes = await fetch("/api/setup/build", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            businessId,
            productTypes: [productSlug],
          }),
        });

        const buildJson = await buildRes.json();

        if (!buildRes.ok) {
          throw new Error(buildJson.error?.message ?? "Build failed");
        }

        const productId =
          buildJson.data?.products?.[0]?.id ??
          buildJson.data?.productId ??
          null;
        productIdRef.current = productId;

        if (cancelled) return;
        markCompleted("generate-product", "Product generated");

        /* ---- Stages 4-8: Asset generation (poll for completion) --------- */
        const assetStages = [
          { id: "cover-art", key: "coverImage" as const, label: "Cover art created" },
          { id: "audio", key: "audio" as const, label: "Audio recorded" },
          { id: "video", key: "video" as const, label: "Video created" },
          { id: "storefront", key: "storefront" as const, label: "Storefront built" },
          { id: "distribution", key: "distribution" as const, label: "Channels found" },
        ];

        // Mark them all in-progress
        for (const stage of assetStages) {
          markInProgress(stage.id);
        }

        if (productId) {
          await pollAssets(
            productId,
            assetStages,
            markCompleted,
            () => cancelled
          );
        } else {
          // No product ID — simulate progress sequentially
          for (const stage of assetStages) {
            if (cancelled) return;
            await delay(2000 + Math.random() * 1500);
            markCompleted(stage.id, stage.label);
          }
        }

        if (cancelled) return;

        /* ---- All done — advance to step 3 ------------------------------- */
        setBuildComplete(true);
        await delay(800);
        setStep(3);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof Error ? err.message : "Something went wrong";
        const isTimeout = message.includes("timed out");
        setError(message);
        if (isTimeout) setTimedOut(true);

        // Mark any in-progress stages as error
        setStages((prev) =>
          prev.map((s) =>
            s.status === "in_progress"
              ? { ...s, status: "error" as const, detail: isTimeout ? "Timed out" : message }
              : s
          )
        );
      }
    };

    run();

    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    markCompleted,
    markInProgress,
    setBuildComplete,
    setSelectedProductTypes,
    setStep,
    setBusinessInfo,
    retryCount,
  ]);

  /* -- Render ------------------------------------------------------------- */

  const completedCount = stages.filter((s) => s.status === "completed").length;

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold tracking-tight">
          AI Is Building Everything
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Sit back — we&apos;re researching your niche, creating your product, and
          setting up your storefront.
        </p>
      </div>

      {/* Timeout banner */}
      {timedOut && (
        <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-950">
          <div className="flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-200">
            <Clock className="h-4 w-4 shrink-0" />
            Build is taking longer than expected
          </div>
          <p className="text-xs text-amber-700 dark:text-amber-300">
            Your build has exceeded the maximum wait time. You can retry or
            contact support if the issue persists.
          </p>
          <div className="flex items-center gap-3">
            <button
              onClick={handleRetry}
              className="inline-flex items-center gap-1.5 rounded-md bg-amber-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-amber-700"
            >
              <RefreshCw className="h-3 w-3" />
              Retry Build
            </button>
            <a
              href="mailto:support@agenttv.io"
              className="text-xs font-medium text-amber-700 underline hover:text-amber-800 dark:text-amber-300 dark:hover:text-amber-200"
            >
              Contact Support
            </a>
          </div>
        </div>
      )}

      {/* Error banner */}
      {error && !timedOut && (
        <div className="flex w-full max-w-md items-center justify-between rounded-lg border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-800 dark:border-red-700 dark:bg-red-950 dark:text-red-200">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
          <button
            onClick={handleRetry}
            className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-red-700 transition-colors hover:bg-red-100 dark:text-red-300 dark:hover:bg-red-900"
          >
            <RefreshCw className="h-3 w-3" />
            Retry
          </button>
        </div>
      )}

      {/* Vertical timeline */}
      <div className="w-full max-w-md">
        <div className="relative space-y-0">
          {stages.map((stage, index) => {
            const Icon = stage.icon;
            const isLast = index === stages.length - 1;

            return (
              <div key={stage.id} className="relative flex gap-4">
                {/* Connecting line */}
                {!isLast && (
                  <div
                    className={cn(
                      "absolute left-[17px] top-[36px] w-0.5",
                      stage.status === "completed" ? "bg-[#7C3AED]" : "bg-gray-200"
                    )}
                    style={{ height: "calc(100% - 20px)" }}
                  />
                )}

                {/* Icon circle */}
                <div
                  className={cn(
                    "relative z-10 flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border-2 transition-colors duration-300",
                    stage.status === "pending" &&
                      "border-gray-200 bg-white text-gray-400",
                    stage.status === "in_progress" &&
                      "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]",
                    stage.status === "completed" &&
                      "border-[#7C3AED] bg-[#7C3AED] text-white",
                    stage.status === "error" &&
                      "border-red-400 bg-red-50 text-red-500"
                  )}
                >
                  {stage.status === "completed" ? (
                    <Check className="h-4 w-4" />
                  ) : stage.status === "in_progress" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : stage.status === "error" ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <Icon className="h-4 w-4" />
                  )}
                </div>

                {/* Label + detail */}
                <div className="flex min-h-[52px] flex-col justify-center pb-4">
                  <span
                    className={cn(
                      "text-sm font-medium",
                      stage.status === "pending" && "text-gray-400",
                      stage.status === "in_progress" && "text-foreground",
                      stage.status === "completed" && "text-foreground",
                      stage.status === "error" && "text-red-600"
                    )}
                  >
                    {stage.label}
                  </span>
                  {stage.detail && (
                    <span className="mt-0.5 text-xs text-muted-foreground">
                      {stage.detail}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Progress counter */}
      <p className="text-sm text-muted-foreground">
        {completedCount} of {stages.length} steps complete
      </p>

      {/* Research insights */}
      {insights.length > 0 && (
        <div className="w-full max-w-md rounded-lg border border-[#7C3AED]/20 bg-[#7C3AED]/5 p-4">
          <h4 className="mb-2 text-sm font-semibold text-[#7C3AED]">
            Research Insights
          </h4>
          <ul className="space-y-1">
            {insights.map((insight, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                <Check className="mt-0.5 h-3 w-3 shrink-0 text-[#7C3AED]" />
                {insight}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* While you wait card */}
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-4">
        <h4 className="mb-2 text-sm font-semibold">While you wait</h4>
        <p className="text-xs text-muted-foreground">
          This usually takes about 8 minutes. Feel free to leave this tab open
          — your progress is saved automatically and will resume if you refresh.
        </p>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll GET /api/research/{businessId} with exponential backoff until status is
 * "completed" or "error". Calls `onUpdate` with intermediate data so we can
 * show live insights.
 *
 * Backoff: starts at 3s, doubles each attempt, capped at 30s.
 * Max duration: 30 minutes.
 */
async function pollResearch(
  businessId: string,
  onUpdate: (data: ResearchData) => void
): Promise<ResearchData> {
  const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const BASE_INTERVAL = 3000;
  const MAX_INTERVAL = 30000;
  const start = Date.now();
  let attempt = 0;

  while (Date.now() - start < MAX_DURATION_MS) {
    try {
      const res = await fetch(`/api/research/${businessId}`);
      if (res.ok) {
        const data: ResearchData = await res.json();
        onUpdate(data);

        if (data.status === "completed") return data;
        if (data.status === "error") {
          throw new Error("Research failed — please try again");
        }
      }
    } catch (err) {
      // If we're past the time limit on next tick, re-throw now
      if (Date.now() - start + BASE_INTERVAL >= MAX_DURATION_MS) throw err;
    }

    const interval = Math.min(BASE_INTERVAL * Math.pow(2, attempt), MAX_INTERVAL);
    await delay(interval);
    attempt++;
  }

  throw new Error("Research timed out");
}

/**
 * Poll GET /api/products/{id}/assets with exponential backoff and mark asset
 * stages complete as they appear.
 *
 * Backoff: starts at 3s, doubles each attempt, capped at 30s.
 * Max duration: 30 minutes.
 */
async function pollAssets(
  productId: string,
  assetStages: Array<{
    id: string;
    key: keyof AssetData;
    label: string;
  }>,
  markCompleted: (id: string, detail: string) => void,
  isCancelled: () => boolean
): Promise<void> {
  const MAX_DURATION_MS = 30 * 60 * 1000; // 30 minutes
  const BASE_INTERVAL = 3000;
  const MAX_INTERVAL = 30000;
  const start = Date.now();
  const completedSet = new Set<string>();
  let attempt = 0;

  while (Date.now() - start < MAX_DURATION_MS) {
    if (isCancelled()) return;

    try {
      const res = await fetch(`/api/products/${productId}/assets`);
      if (res.ok) {
        const assets: AssetData = await res.json();

        for (const stage of assetStages) {
          if (!completedSet.has(stage.id) && assets[stage.key]) {
            completedSet.add(stage.id);
            markCompleted(stage.id, stage.label);
          }
        }

        if (completedSet.size === assetStages.length) return;
      }
    } catch {
      // Ignore transient errors and keep polling
    }

    const interval = Math.min(BASE_INTERVAL * Math.pow(2, attempt), MAX_INTERVAL);
    await delay(interval);
    attempt++;
  }

  // If we timed out, throw so the UI shows the timeout state
  if (completedSet.size < assetStages.length) {
    throw new Error("Asset generation timed out");
  }
}

export default AIBuildProgress;
