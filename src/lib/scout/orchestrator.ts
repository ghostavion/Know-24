import { createServiceClient } from "@/lib/supabase/server";
import { generateText } from "ai";
import { primaryModel } from "@/lib/ai/providers";
import { scanReddit } from "./reddit";
import { scanTwitter } from "./twitter";
import { scanQuora } from "./quora";
import { scanLinkedIn } from "./linkedin";
import { scanPodcasts } from "./podcasts";
import { scanNews } from "./news";
import { scoreResults } from "./relevance-scorer";
import type { ScoutConfig, PlatformResult } from "@/types/scout";

interface ScanResult {
  scanId: string;
  opportunitiesFound: number;
  errors: string[];
}

export async function runScan(scanId: string, businessId: string): Promise<ScanResult> {
  const supabase = createServiceClient();
  const errors: string[] = [];

  // Update scan status to running
  await supabase
    .from("scout_scans")
    .update({ status: "running" })
    .eq("id", scanId);

  try {
    // Get business context
    const { data: business } = await supabase
      .from("businesses")
      .select("name, niche")
      .eq("id", businessId)
      .single();

    if (!business) {
      throw new Error("Business not found");
    }

    const config: ScoutConfig = {
      businessId,
      businessName: business.name as string,
      niche: business.niche as string ?? "general",
      keywords: (business.niche as string ?? "").split(/[\s,]+/).filter(Boolean),
    };

    // Run all platform scans in parallel
    const platformScans = [
      { name: "reddit", fn: scanReddit },
      { name: "twitter", fn: scanTwitter },
      { name: "quora", fn: scanQuora },
      { name: "linkedin", fn: scanLinkedIn },
      { name: "podcasts", fn: scanPodcasts },
      { name: "news", fn: scanNews },
    ];

    const results: PlatformResult[] = [];

    const scanPromises = platformScans.map(async ({ name, fn }) => {
      try {
        const platformResults = await fn(config);
        return platformResults;
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        errors.push(`${name}: ${msg}`);
        return [];
      }
    });

    const allResults = await Promise.all(scanPromises);
    for (const batch of allResults) {
      results.push(...batch);
    }

    // Score all results for relevance
    const scoredResults = await scoreResults(businessId, results);

    // Generate AI draft responses for top opportunities
    const topResults = scoredResults.slice(0, 15);

    const opportunityInserts = [];
    for (const result of topResults) {
      let draftResponse: string | null = null;

      try {
        const { text } = await generateText({
          model: primaryModel,
          system: `You are a social media expert for "${config.businessName}", a ${config.niche} business. Write a helpful, authentic response that positions the business as an authority.`,
          prompt: `Write a short response (2-3 sentences) to this opportunity:
Platform: ${result.platform}
Title: ${result.title}
Context: ${result.context}

The response should be helpful and non-promotional while subtly positioning ${config.businessName} as knowledgeable.`,
        });
        draftResponse = text;
      } catch {
        // Draft generation failed, opportunity still valid without draft
      }

      opportunityInserts.push({
        scan_id: scanId,
        business_id: businessId,
        platform: result.platform,
        type: result.type,
        title: result.title,
        url: result.url,
        relevance_score: result.relevanceScore,
        context: result.context,
        suggested_moves: [result.relevanceHint],
        draft_response: draftResponse,
        status: "pending",
      });
    }

    // Insert all opportunities
    if (opportunityInserts.length > 0) {
      await supabase.from("scout_opportunities").insert(opportunityInserts);
    }

    // Update scan as completed
    await supabase
      .from("scout_scans")
      .update({
        status: "completed",
        opportunities_found: opportunityInserts.length,
        metadata: { errors, platforms_scanned: platformScans.map(p => p.name) },
      })
      .eq("id", scanId);

    return {
      scanId,
      opportunitiesFound: opportunityInserts.length,
      errors,
    };
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Unknown error";

    await supabase
      .from("scout_scans")
      .update({
        status: "failed",
        error_message: msg,
      })
      .eq("id", scanId);

    return {
      scanId,
      opportunitiesFound: 0,
      errors: [msg],
    };
  }
}
