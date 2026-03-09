import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generatePromptPack(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in AI prompt engineering. You create carefully crafted, tested prompts that produce consistent, high-quality outputs from AI models. Each prompt should include clear variable placeholders and an example of expected output. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a prompt pack with 4-6 categories of AI prompts. Each category should contain 3-5 prompts designed for specific workflows.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — prompt pack title",
  "description": "string — 100-150 words on what workflows these prompts cover",
  "categories": [
    {
      "title": "string — category name (e.g., 'Content Creation', 'Analysis')",
      "description": "string — what this category of prompts helps with",
      "prompts": [
        {
          "name": "string — descriptive prompt name",
          "prompt": "string — the full prompt text with {{VARIABLE}} placeholders",
          "variables": [
            {
              "name": "string — variable name matching the placeholder",
              "description": "string — what to put here"
            }
          ],
          "example": "string — example output showing what a good result looks like",
          "tips": "string — how to get the best results from this prompt"
        }
      ]
    }
  ],
  "generalTips": ["string — 3-5 tips for getting better results from AI prompts"]
}`,
    });

    const contentJson: Record<string, unknown> = JSON.parse(text);
    const supabase = createServiceClient();

    const { error: updateError } = await supabase
      .from("products")
      .update({ content_json: contentJson, status: "review" })
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
