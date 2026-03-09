import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateResourceDirectory(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in curated resource directories. You organize tools, links, and resources into logical categories with clear descriptions of why each resource matters. Focus on practical value and honest assessments. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a resource directory with 4-6 categories. Each category should contain 4-8 recommended resources with descriptions and tags.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — directory title",
  "description": "string — 100-150 words on what this directory covers and who it's for",
  "categories": [
    {
      "title": "string — category name",
      "description": "string — what this category covers",
      "resources": [
        {
          "name": "string — resource name",
          "url": "string — placeholder URL like https://example.com/resource-name",
          "description": "string — 2-3 sentences on what it does and why it's recommended",
          "tags": ["string — relevant tags like 'free', 'paid', 'beginner', 'advanced'"],
          "bestFor": "string — one line on the ideal use case"
        }
      ]
    }
  ],
  "selectionCriteria": "string — how these resources were selected and evaluated"
}`,
    });

    const contentJson: Record<string, unknown> = JSON.parse(text);
    const supabase = createServiceClient();

    const { error: updateError } = await supabase
      .from("products")
      .update({ content: contentJson, status: "review" })
      .eq("id", productId)
      .eq("business_id", businessId);

    if (updateError) {
      throw new Error(`Database update failed: ${updateError.message}`);
    }

    return { success: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Generation failed";
    const supabase = createServiceClient();
    await supabase
      .from("products")
      .update({ status: "draft" })
      .eq("id", productId)
      .eq("business_id", businessId);
    return { success: false, error: message };
  }
}
