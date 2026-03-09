import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateFrameworkTemplatePack(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in frameworks, templates, checklists, and standard operating procedures. You create practical, fill-in-the-blank tools that professionals can immediately apply to their work. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a framework/template pack with 4-6 templates. Each template should be practical and immediately usable.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — pack title",
  "description": "string — 100-150 word overview of what this pack contains and who it's for",
  "templates": [
    {
      "title": "string — template name",
      "description": "string — when and why to use this template",
      "content": "string — the full template content with placeholders like [Your X Here]",
      "checklist": ["string — step-by-step items to complete when using this template"]
    }
  ],
  "usageGuide": "string — 100-150 words on how to get the most out of these templates"
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
