import { embed } from "ai";
import { Job } from "bullmq";

import { embeddingModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

export interface EmbeddingChunk {
  content: string;
  chunkIndex: number;
}

export interface IngestEmbeddingsJobData {
  businessId: string;
  knowledgeItemId: string;
  chunks: EmbeddingChunk[];
}

/**
 * Ingest pre-split knowledge chunks by generating embeddings and storing
 * them in the knowledge_chunks table. Unlike process-knowledge, this
 * processor expects chunks to be provided in the job data.
 */
export async function ingestEmbeddings(job: Job<IngestEmbeddingsJobData>): Promise<void> {
  const { businessId, knowledgeItemId, chunks } = job.data;
  const supabase = createServiceClient();

  if (chunks.length === 0) {
    throw new Error("No chunks provided for embedding ingestion");
  }

  for (let i = 0; i < chunks.length; i++) {
    const chunk = chunks[i];

    const { embedding } = await embed({
      model: embeddingModel,
      value: chunk.content,
    });

    const { error: insertError } = await supabase.from("knowledge_chunks").insert({
      knowledge_item_id: knowledgeItemId,
      business_id: businessId,
      content: chunk.content,
      chunk_index: chunk.chunkIndex,
      embedding: JSON.stringify(embedding),
    });

    if (insertError) {
      throw new Error(`Failed to insert chunk ${chunk.chunkIndex}: ${insertError.message}`);
    }

    // Report progress
    await job.updateProgress(Math.round(((i + 1) / chunks.length) * 100));
  }
}
