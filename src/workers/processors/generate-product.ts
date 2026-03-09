import { Job } from "bullmq";

import { runGenerator } from "@/lib/ai/generators";
import { createServiceClient } from "@/lib/supabase/server";

export interface GenerateProductJobData {
  productId: string;
  businessId: string;
  productTypeSlug: string;
}

/**
 * Generate a digital product using AI based on the business's knowledge base.
 * Fetches relevant knowledge chunks, dispatches to the appropriate generator,
 * and logs the activity.
 */
export async function generateProduct(job: Job<GenerateProductJobData>): Promise<void> {
  const { productId, businessId, productTypeSlug } = job.data;
  const supabase = createServiceClient();

  // Fetch knowledge context for this business
  const { data: chunks, error: chunksError } = await supabase
    .from("knowledge_chunks")
    .select("content")
    .eq("business_id", businessId)
    .order("chunk_index", { ascending: true })
    .limit(50);

  if (chunksError) {
    throw new Error(`Failed to fetch knowledge chunks: ${chunksError.message}`);
  }

  const knowledgeContext = (chunks ?? [])
    .map((c) => (c as { content: string }).content)
    .join("\n\n---\n\n");

  if (knowledgeContext.trim().length === 0) {
    throw new Error(`No knowledge context available for business ${businessId}`);
  }

  // Update product status to generating
  await supabase
    .from("products")
    .update({ status: "generating" })
    .eq("id", productId)
    .eq("business_id", businessId);

  // Run the generator
  const result = await runGenerator(productTypeSlug, businessId, productId, knowledgeContext);

  if (!result.success) {
    throw new Error(result.error ?? "Product generation failed");
  }

  // Log activity
  await supabase.from("activity_log").insert({
    business_id: businessId,
    type: "product_generated",
    message: `Product generated successfully (${productTypeSlug})`,
    metadata: { productId, productTypeSlug },
  });
}
