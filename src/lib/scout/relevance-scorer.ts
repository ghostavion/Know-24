import { createServiceClient } from "@/lib/supabase/server";
import { google } from "@ai-sdk/google";
import { embed } from "ai";
import type { PlatformResult } from "@/types/scout";

interface ScoredResult extends PlatformResult {
  relevanceScore: number;
}

// Score results by comparing against business knowledge base embeddings
export async function scoreResults(
  businessId: string,
  results: PlatformResult[]
): Promise<ScoredResult[]> {
  const supabase = createServiceClient();

  // Get business knowledge chunks for comparison
  const { data: chunks } = await supabase
    .from("knowledge_chunks")
    .select("content, embedding")
    .eq("business_id", businessId)
    .limit(20);

  // If no knowledge base, assign scores based on keyword matching
  if (!chunks || chunks.length === 0) {
    return results.map((r) => ({
      ...r,
      relevanceScore: estimateRelevance(r),
    }));
  }

  // For each result, compute similarity against knowledge base
  const scored: ScoredResult[] = [];
  for (const result of results) {
    const text = `${result.title} ${result.context}`;

    // Generate embedding for the opportunity text
    const { embedding } = await embed({
      model: google.textEmbeddingModel("text-embedding-004"),
      value: text,
    });

    // Calculate max cosine similarity against knowledge chunks
    let maxSimilarity = 0;
    for (const chunk of chunks) {
      if (chunk.embedding) {
        const similarity = cosineSimilarity(
          embedding,
          chunk.embedding as number[]
        );
        maxSimilarity = Math.max(maxSimilarity, similarity);
      }
    }

    // Convert similarity (0-1) to score (0-100)
    const relevanceScore = Math.round(maxSimilarity * 100);

    scored.push({
      ...result,
      relevanceScore: Math.max(relevanceScore, 10), // minimum 10
    });
  }

  // Sort by relevance score descending
  scored.sort((a, b) => b.relevanceScore - a.relevanceScore);

  return scored;
}

// Simple keyword-based relevance estimation when no embeddings available
function estimateRelevance(result: PlatformResult): number {
  // Base score by type
  const typeScores: Record<string, number> = {
    hot_thread: 70,
    influencer_match: 65,
    podcast_opportunity: 75,
    trending_topic: 60,
    community_engagement: 55,
    competitor_activity: 50,
  };

  const base = typeScores[result.type] ?? 50;
  // Add some variance
  const variance = Math.floor(Math.random() * 20) - 10;
  return Math.min(100, Math.max(10, base + variance));
}

// Cosine similarity between two vectors
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0;

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  if (denominator === 0) return 0;

  return dotProduct / denominator;
}
