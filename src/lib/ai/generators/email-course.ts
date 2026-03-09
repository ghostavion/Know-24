import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateEmailCourse(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in educational email courses. You write engaging, conversational emails that teach one key concept per day. Each email should feel personal, provide a quick win, and build anticipation for the next day. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a 5-7 day email course. Each email should be 300-500 words, teach one focused concept, and include a small action step.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "courseTitle": "string — compelling course title",
  "courseDescription": "string — 100-150 word description for the signup page",
  "targetAudience": "string — who this course is for",
  "lessons": [
    {
      "day": 1,
      "subject": "string — email subject line (compelling, curiosity-driven)",
      "previewText": "string — email preview text (40-90 characters)",
      "body": "string — full email body (300-500 words, conversational tone)",
      "actionStep": "string — one specific thing the reader should do today",
      "teaser": "string — one sentence teasing what's coming tomorrow"
    }
  ],
  "welcomeEmail": {
    "subject": "string — welcome email subject",
    "body": "string — 150-200 word welcome email setting expectations"
  },
  "completionEmail": {
    "subject": "string — final/congratulations email subject",
    "body": "string — 150-200 word wrap-up with next steps"
  }
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
