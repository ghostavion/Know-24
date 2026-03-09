import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateSwipeFile(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in copy-paste scripts, templates, and swipe files. You create ready-to-use language and templates that professionals can immediately adapt to their specific situations. Each script should feel natural and professional. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a swipe file with 4-6 categories of scripts/templates. Each category should contain 3-5 ready-to-use scripts for different scenarios.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — swipe file title",
  "description": "string — 100-150 words on what this swipe file covers",
  "categories": [
    {
      "title": "string — category name (e.g., 'Cold Outreach', 'Follow-Up')",
      "description": "string — when to use scripts in this category",
      "scripts": [
        {
          "scenario": "string — specific situation this script addresses",
          "template": "string — the full copy-paste script with [PLACEHOLDER] variables",
          "customizationTips": "string — how to personalize this script"
        }
      ]
    }
  ],
  "usageGuidelines": ["string — 3-5 tips for getting the best results from these scripts"]
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
