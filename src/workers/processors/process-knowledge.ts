import { embed } from "ai";
import { Job } from "bullmq";

import { embeddingModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

export interface ProcessKnowledgeJobData {
  businessId: string;
  knowledgeItemId: string;
}

interface KnowledgeItemRow {
  id: string;
  business_id: string;
  content: string;
  source_title: string | null;
  status: string;
}

/**
 * Split text into chunks by paragraph, each approximately maxChars long.
 * Paragraphs are split on double newlines first, then combined or
 * further split to stay near the target size.
 */
function splitIntoChunks(text: string, maxChars = 500): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter((p) => p.trim().length > 0);
  const chunks: string[] = [];
  let current = "";

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();

    // If a single paragraph exceeds maxChars, split it by sentences
    if (trimmed.length > maxChars) {
      if (current.length > 0) {
        chunks.push(current.trim());
        current = "";
      }
      const sentences = trimmed.match(/[^.!?]+[.!?]+\s*/g) ?? [trimmed];
      let sentenceBuffer = "";
      for (const sentence of sentences) {
        if (sentenceBuffer.length + sentence.length > maxChars && sentenceBuffer.length > 0) {
          chunks.push(sentenceBuffer.trim());
          sentenceBuffer = "";
        }
        sentenceBuffer += sentence;
      }
      if (sentenceBuffer.trim().length > 0) {
        chunks.push(sentenceBuffer.trim());
      }
      continue;
    }

    if (current.length + trimmed.length + 1 > maxChars && current.length > 0) {
      chunks.push(current.trim());
      current = trimmed;
    } else {
      current += (current.length > 0 ? "\n\n" : "") + trimmed;
    }
  }

  if (current.trim().length > 0) {
    chunks.push(current.trim());
  }

  return chunks;
}

/**
 * Process a knowledge item: split into chunks, generate embeddings,
 * and store in the knowledge_chunks table.
 */
export async function processKnowledge(job: Job<ProcessKnowledgeJobData>): Promise<void> {
  const { businessId, knowledgeItemId } = job.data;
  const supabase = createServiceClient();

  // Fetch the knowledge item
  const { data: item, error: fetchError } = await supabase
    .from("knowledge_items")
    .select("id, business_id, content, source_title, status")
    .eq("id", knowledgeItemId)
    .eq("business_id", businessId)
    .single();

  if (fetchError || !item) {
    throw new Error(`Knowledge item not found: ${knowledgeItemId} (${fetchError?.message ?? "no data"})`);
  }

  const knowledgeItem = item as KnowledgeItemRow;

  // Split content into chunks
  const chunks = splitIntoChunks(knowledgeItem.content);

  if (chunks.length === 0) {
    throw new Error(`Knowledge item ${knowledgeItemId} has no content to process`);
  }

  // Generate embeddings and insert chunks
  for (let i = 0; i < chunks.length; i++) {
    const chunkContent = chunks[i];

    const { embedding } = await embed({
      model: embeddingModel,
      value: chunkContent,
    });

    const { error: insertError } = await supabase.from("knowledge_chunks").insert({
      knowledge_item_id: knowledgeItemId,
      business_id: businessId,
      content: chunkContent,
      chunk_index: i,
      embedding: JSON.stringify(embedding),
    });

    if (insertError) {
      throw new Error(`Failed to insert chunk ${i}: ${insertError.message}`);
    }

    // Report progress
    await job.updateProgress(Math.round(((i + 1) / chunks.length) * 100));
  }

  // Update knowledge item status to analyzed
  const { error: updateError } = await supabase
    .from("knowledge_items")
    .update({ status: "analyzed" })
    .eq("id", knowledgeItemId)
    .eq("business_id", businessId);

  if (updateError) {
    throw new Error(`Failed to update knowledge item status: ${updateError.message}`);
  }
}
