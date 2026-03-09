import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateWorksheetWorkbook(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in interactive educational worksheets and workbooks. You design exercises that guide learners through self-discovery and practical application. Each exercise should build on the previous one for progressive learning. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a worksheet/workbook with 5-8 exercises. Each exercise should include clear instructions, thought-provoking questions, and reflection prompts.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — workbook title",
  "introduction": "string — 100-150 words explaining what the learner will achieve",
  "exercises": [
    {
      "title": "string — exercise title",
      "objective": "string — what the learner will accomplish",
      "instructions": "string — step-by-step directions",
      "questions": [
        {
          "question": "string — the question to answer",
          "hint": "string — optional guiding hint"
        }
      ],
      "reflectionPrompts": ["string — open-ended prompts for deeper thinking"]
    }
  ],
  "completionChecklist": ["string — items to verify the learner has finished all exercises"]
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
