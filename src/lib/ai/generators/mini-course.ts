import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateMiniCourse(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in structured online courses. You design multi-module learning experiences with clear progression, bite-sized lessons, and key takeaways. Each module should build on the previous one, and each lesson should be completable in 10-15 minutes. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a mini-course with 3-5 modules. Each module should contain 2-4 lessons. Lessons should be focused and actionable.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — course title",
  "description": "string — 100-150 word course description",
  "targetAudience": "string — who this course is for",
  "learningOutcomes": ["string — 3-5 outcomes students will achieve"],
  "modules": [
    {
      "title": "string — module title",
      "description": "string — what this module covers",
      "order": 1,
      "lessons": [
        {
          "title": "string — lesson title",
          "order": 1,
          "content": "string — 300-500 words of lesson content",
          "keyPoints": ["string — 3-5 key takeaways from this lesson"],
          "exercise": "string — optional hands-on exercise for the student"
        }
      ]
    }
  ],
  "prerequisites": ["string — what students should know before starting"],
  "estimatedDuration": "string — total estimated completion time"
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
