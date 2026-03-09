import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateAssessmentQuiz(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in self-assessment quizzes and evaluations. You design questions that accurately gauge someone's level of knowledge or readiness in a specific area, with clear scoring and actionable recommendations for each result tier. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a self-assessment quiz with 10-15 questions. Include a scoring system and 3-4 result buckets with personalized recommendations.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — assessment title",
  "description": "string — 100-150 words explaining what this assessment measures",
  "instructions": "string — how to take the assessment",
  "questions": [
    {
      "id": 1,
      "question": "string — the question text",
      "options": [
        {
          "label": "string — answer option text",
          "value": "string — a|b|c|d",
          "score": 0
        }
      ]
    }
  ],
  "scoring": {
    "method": "sum",
    "maxScore": 0
  },
  "resultBuckets": [
    {
      "label": "string — result tier name (e.g., 'Beginner', 'Intermediate')",
      "minScore": 0,
      "maxScore": 0,
      "description": "string — what this score means",
      "recommendations": ["string — specific next steps for this tier"]
    }
  ]
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
