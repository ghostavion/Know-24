// Research Orchestrator — runs Firecrawl + Tavily in parallel, synthesizes with Gemini
// Produces a structured NicheResearchDocument with real-time narration callbacks

import { generateObject } from "ai";
import { z } from "zod";
import { longContextModel } from "@/lib/ai/providers";
import { searchNicheProducts } from "./firecrawl";
import { searchTavily, searchNichePricing, searchTrendingTopics } from "./tavily";
import { createServiceClient } from "@/lib/supabase/server";
import crypto from "crypto";

// The structured output schema
export const NicheResearchSchema = z.object({
  niche: z.string(),
  subNiches: z.array(z.string()),
  marketSize: z.object({
    estimated: z.string(),
    trend: z.enum(["growing", "stable", "declining"]),
  }),
  topSellingProducts: z.array(z.object({
    title: z.string(),
    platform: z.string(),
    priceRange: z.string(),
    format: z.string(),
    estimatedSales: z.string(),
    whatMakesItWork: z.string(),
  })),
  contentGaps: z.array(z.object({
    topic: z.string(),
    searchDemand: z.enum(["high", "medium", "low"]),
    competitionLevel: z.enum(["high", "medium", "low"]),
    opportunity: z.string(),
  })),
  trendingTopics: z.array(z.object({
    topic: z.string(),
    source: z.string(),
    momentum: z.string(),
    relevance: z.number(),
  })),
  pricingInsights: z.object({
    sweetSpot: z.number(),
    premiumRange: z.number(),
    freeLeadMagnetTopics: z.array(z.string()),
  }),
  recommendedProduct: z.object({
    type: z.string(),
    title: z.string(),
    price: z.number(),
    chapters: z.number(),
    estimatedPages: z.number(),
    uniqueAngle: z.string(),
    whyThisWillSell: z.string(),
  }),
  competitorTeardown: z.array(z.object({
    title: z.string(),
    platform: z.string(),
    price: z.string(),
    rating: z.string(),
    weakness: z.string(),
  })),
  sources: z.array(z.object({
    url: z.string(),
    title: z.string(),
  })),
});

export type NicheResearchDocument = z.infer<typeof NicheResearchSchema>;

export type NarrationPhase =
  | "starting"
  | "scraping"
  | "analyzing"
  | "synthesizing"
  | "completed"
  | "failed";

export interface NarrationEvent {
  phase: NarrationPhase;
  message: string;
  detail?: string;
  progress?: number; // 0-100
  timestamp: number;
}

export type NarrationCallback = (event: NarrationEvent) => void;

function narrate(
  cb: NarrationCallback | undefined,
  phase: NarrationPhase,
  message: string,
  detail?: string,
  progress?: number
) {
  cb?.({ phase, message, detail, progress, timestamp: Date.now() });
}

/**
 * Hash a niche query for cache lookups.
 */
export function hashNiche(niche: string): string {
  return crypto.createHash("sha256").update(niche.toLowerCase().trim()).digest("hex").slice(0, 16);
}

interface RunResearchOptions {
  runId: string;
  userId: string;
  niche: string;
  subNiches?: string[];
  personalAngle?: string | null;
  onNarration?: NarrationCallback;
}

export async function runNicheResearch(opts: RunResearchOptions): Promise<NicheResearchDocument> {
  const { runId, userId, niche, subNiches = [], personalAngle, onNarration } = opts;
  const startTime = Date.now();
  const supabase = createServiceClient();
  const nicheHash = hashNiche(niche);

  // Update run status
  await supabase
    .from("research_runs")
    .update({ status: "scraping", phase: "scraping" })
    .eq("id", runId);

  narrate(onNarration, "scraping", "Scanning the web for market data...", `Searching for "${niche}" products, pricing, and trends`, 10);

  // Check research cache (7-day TTL)
  const { data: cached } = await supabase
    .from("research_cache")
    .select("research_run_id")
    .eq("niche_hash", nicheHash)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .single();

  if (cached) {
    const { data: cachedRun } = await supabase
      .from("research_runs")
      .select("pain_points, product_analysis, blueprint, proof_card, confidence_score")
      .eq("id", cached.research_run_id)
      .eq("status", "completed")
      .single();

    if (cachedRun) {
      narrate(onNarration, "completed", "Found cached research — delivering instantly!", undefined, 100);

      await supabase
        .from("research_runs")
        .update({
          status: "cached",
          phase: "completed",
          cached_from: cached.research_run_id,
          pain_points: cachedRun.pain_points,
          product_analysis: cachedRun.product_analysis,
          blueprint: cachedRun.blueprint,
          proof_card: cachedRun.proof_card,
          confidence_score: cachedRun.confidence_score,
          completed_at: new Date().toISOString(),
        })
        .eq("id", runId);

      // Return the cached data as a NicheResearchDocument
      return (cachedRun.blueprint as unknown) as NicheResearchDocument;
    }
  }

  // Check for platform intelligence
  const { data: intelligence } = await supabase
    .from("platform_intelligence")
    .select("metric_type, metric_value")
    .eq("niche_slug", niche.toLowerCase().replace(/\s+/g, "-"))
    .eq("period", "last_30d");

  const platformData = intelligence?.reduce((acc, row) => {
    acc[row.metric_type] = row.metric_value;
    return acc;
  }, {} as Record<string, unknown>) ?? {};

  // Run Firecrawl + Tavily research providers in parallel
  narrate(onNarration, "scraping", "Searching across multiple data sources...", "Firecrawl product search + Tavily market analysis running in parallel", 20);

  const [firecrawlResults, tavilyResults, tavilyPricing, tavilyTrending] =
    await Promise.allSettled([
      searchNicheProducts(niche, subNiches),
      searchTavily(`best ${niche} digital products ebooks courses guides 2026`, { maxResults: 10, searchDepth: "advanced", includeAnswer: true }),
      searchNichePricing(niche),
      searchTrendingTopics(niche),
    ]);

  // Update status to analyzing
  await supabase
    .from("research_runs")
    .update({ status: "analyzing", phase: "analyzing" })
    .eq("id", runId);

  narrate(onNarration, "analyzing", "Raw data collected. Analyzing market signals...", undefined, 50);

  // Collect all raw data
  const rawSources: { url: string; title: string }[] = [];
  let rawContent = "";
  let sourceCount = 0;

  if (firecrawlResults.status === "fulfilled") {
    rawSources.push(...firecrawlResults.value.sources);
    sourceCount += firecrawlResults.value.sources.length;
    narrate(onNarration, "analyzing", `Found ${firecrawlResults.value.sources.length} product listings via web search`, undefined, 55);
  }
  if (tavilyResults.status === "fulfilled") {
    rawContent += `\n\n## Tavily Search Results\n${tavilyResults.value.answer ?? ""}\n`;
    for (const r of tavilyResults.value.results) {
      rawSources.push({ url: r.url, title: r.title });
      rawContent += `\n### ${r.title}\n${r.content}\n`;
    }
    sourceCount += tavilyResults.value.results.length;
    narrate(onNarration, "analyzing", `Analyzed ${tavilyResults.value.results.length} market research results`, undefined, 60);
  }
  if (tavilyPricing.status === "fulfilled") {
    rawContent += `\n\n## Pricing Research\n`;
    for (const r of tavilyPricing.value) {
      rawContent += `\n### ${r.title}\n${r.content}\n`;
    }
    narrate(onNarration, "analyzing", "Pricing sweet-spot data collected", undefined, 65);
  }
  if (tavilyTrending.status === "fulfilled") {
    rawContent += `\n\n## Trending Topics\n`;
    for (const r of tavilyTrending.value) {
      rawContent += `\n### ${r.title}\n${r.content}\n`;
    }
    narrate(onNarration, "analyzing", "Trending topics identified", undefined, 70);
  }

  if (Object.keys(platformData).length > 0) {
    rawContent += `\n\n## AgentTV Platform Data\n${JSON.stringify(platformData, null, 2)}\n`;
  }
  if (personalAngle) {
    rawContent += `\n\n## Creator's Personal Angle\n${personalAngle}\n`;
  }

  // Deduplicate sources
  const uniqueSources = Array.from(
    new Map(rawSources.map(s => [s.url, s])).values()
  );

  // Synthesize with Gemini 2.5 Pro
  await supabase
    .from("research_runs")
    .update({ status: "synthesizing", phase: "synthesizing" })
    .eq("id", runId);

  narrate(onNarration, "synthesizing", `Synthesizing ${uniqueSources.length} sources into your Proof Card...`, "Gemini 2.5 Pro is analyzing market gaps, pricing, and opportunities", 75);

  const { object: research } = await generateObject({
    model: longContextModel,
    schema: NicheResearchSchema,
    prompt: `You are a market research analyst. Based on the following raw research data about the "${niche}" niche, produce a comprehensive structured analysis.

${rawContent}

Sources found: ${uniqueSources.length}

Requirements:
- Identify the top 5-8 selling products with real titles, platforms, and price ranges
- Find 3-5 content gaps (high demand, low competition)
- Identify 3-5 trending topics with momentum
- Recommend a specific product to create: title, type, price, chapter count, page estimate
- The recommended product should fill an identified gap and capitalize on a trend
- Include a competitor teardown with weaknesses
- Be data-driven — use the research, don't guess
${personalAngle ? `- Incorporate the creator's personal angle: "${personalAngle}"` : ""}`,
  });

  // Attach the deduplicated sources
  research.sources = uniqueSources.slice(0, 30);

  const durationMs = Date.now() - startTime;
  const confidenceScore = Math.min(100, Math.round(
    (uniqueSources.length >= 20 ? 40 : uniqueSources.length * 2) +
    (research.topSellingProducts.length >= 5 ? 30 : research.topSellingProducts.length * 6) +
    (research.contentGaps.length >= 3 ? 30 : research.contentGaps.length * 10)
  ));

  narrate(onNarration, "synthesizing", "Building your Proof Card...", `Confidence score: ${confidenceScore}/100`, 90);

  // Save to research_runs table
  await supabase
    .from("research_runs")
    .update({
      status: "completed",
      phase: "completed",
      niche_hash: nicheHash,
      pain_points: research.contentGaps,
      product_analysis: research.topSellingProducts,
      blueprint: research,
      proof_card: {
        recommendedProduct: research.recommendedProduct,
        marketSize: research.marketSize,
        pricingInsights: research.pricingInsights,
        topGap: research.contentGaps[0] ?? null,
        sourceCount: research.sources.length,
        confidenceScore,
      },
      confidence_score: confidenceScore,
      total_cost: 0, // API costs tracked separately
      completed_at: new Date().toISOString(),
    })
    .eq("id", runId);

  // Cache for 7 days
  await supabase.from("research_cache").insert({
    niche_hash: nicheHash,
    research_run_id: runId,
    expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
  });

  // Also update legacy research_documents if business context exists
  // (backwards compat for existing onboarding flow)
  const narrationEvents = [{
    phase: "completed",
    message: `Research completed in ${Math.round(durationMs / 1000)}s with ${uniqueSources.length} sources`,
    timestamp: Date.now(),
  }];

  await supabase
    .from("research_runs")
    .update({ narration_events: narrationEvents })
    .eq("id", runId);

  narrate(onNarration, "completed", "Research complete! Your Proof Card is ready.", `${uniqueSources.length} sources analyzed, confidence: ${confidenceScore}/100`, 100);

  return research;
}
