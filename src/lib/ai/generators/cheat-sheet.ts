import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateCheatSheet(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in concise, high-density reference materials. You distill complex topics into scannable, at-a-glance reference cards. Every item must be immediately useful — no filler. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a cheat sheet (1-3 page reference card). Keep everything short and scannable — bullet points, quick definitions, formulas, shortcuts.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — cheat sheet title",
  "subtitle": "string — what this covers in one line",
  "sections": [
    {
      "title": "string — section heading",
      "items": [
        {
          "term": "string — keyword or concept",
          "definition": "string — concise 1-2 sentence explanation or formula"
        }
      ]
    }
  ],
  "quickTips": ["string — 3-5 pro tips that fit on a sticky note"],
  "commonMistakes": ["string — 3-5 mistakes to avoid"]
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
