import { embed } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import { embeddingModel } from "@/lib/ai/providers";
import type { RetrievedChunk } from "@/types/chatbot";

/** Embed a query string into a vector using the embedding model. */
export async function embedQuery(text: string): Promise<number[]> {
  const { embedding } = await embed({
    model: embeddingModel,
    value: text,
  });
  return embedding;
}

/**
 * Match knowledge chunks by cosine similarity using pgvector.
 *
 * Uses the `match_knowledge_chunks` Supabase RPC function for server-side
 * vector similarity search. Falls back to a non-vector query if the RPC
 * is unavailable.
 */
export async function matchChunks(
  query: string,
  businessId: string,
  options?: {
    threshold?: number; // minimum similarity (0-1), default 0.7
    limit?: number; // max results, default 5
    scopeIds?: string[]; // limit to specific knowledge_item IDs
  }
): Promise<RetrievedChunk[]> {
  const threshold = options?.threshold ?? 0.7;
  const limit = options?.limit ?? 5;

  const queryEmbedding = await embedQuery(query);
  const supabase = createServiceClient();

  // Preferred path: use the match_knowledge_chunks RPC (pgvector cosine search)
  const { data: chunks, error } = await supabase.rpc(
    "match_knowledge_chunks",
    {
      query_embedding: JSON.stringify(queryEmbedding),
      match_business_id: businessId,
      match_threshold: threshold,
      match_count: limit,
      scope_ids: options?.scopeIds ?? null,
    }
  );

  if (error || !chunks) {
    // Fallback: fetch top chunks without vector search
    const { data: fallbackChunks } = await supabase
      .from("knowledge_chunks")
      .select(
        "id, content, knowledge_item_id, knowledge_items(source_title)"
      )
      .eq("business_id", businessId)
      .limit(limit);

    if (!fallbackChunks) return [];

    return fallbackChunks.map((c) => ({
      id: c.id as string,
      content: c.content as string,
      similarity: 0.5,
      knowledgeItemId: c.knowledge_item_id as string,
      sourceTitle:
        (
          c.knowledge_items as unknown as {
            source_title: string | null;
          }
        )?.source_title ?? null,
    }));
  }

  return (
    chunks as Array<{
      id: string;
      content: string;
      similarity: number;
      knowledge_item_id: string;
      source_title: string | null;
    }>
  ).map((c) => ({
    id: c.id,
    content: c.content,
    similarity: c.similarity,
    knowledgeItemId: c.knowledge_item_id,
    sourceTitle: c.source_title,
  }));
}

/** Assemble a formatted context string from retrieved chunks. */
export function assembleContext(chunks: RetrievedChunk[]): string {
  if (chunks.length === 0) return "";

  return chunks
    .map(
      (c, i) =>
        `[Source ${i + 1}${c.sourceTitle ? `: ${c.sourceTitle}` : ""}]\n${c.content}`
    )
    .join("\n\n---\n\n");
}
