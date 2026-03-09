import { generateText } from "ai";

import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";

import type { GeneratorResult } from "./index";

export async function generateGuideEbook(
  businessId: string,
  productId: string,
  knowledgeContext: string
): Promise<GeneratorResult> {
  try {
    const { text } = await generateText({
      model: primaryModel,
      system: `You are a professional content creator specializing in long-form educational guides and ebooks. You produce clear, well-structured, actionable content that provides genuine value to readers. Always write in a confident, expert tone. Output valid JSON only — no markdown fences, no commentary.`,
      prompt: `Using the following knowledge base, create a comprehensive guide/ebook with 5-8 chapters. Each chapter should be substantial (300-500 words) and provide actionable insights.

Knowledge Base:
${knowledgeContext}

Output as JSON with this exact structure:
{
  "title": "string — compelling, benefit-driven title",
  "subtitle": "string — clarifying subtitle",
  "introduction": "string — 150-200 word introduction setting context",
  "chapters": [
    {
      "title": "string — chapter title",
      "content": "string — 300-500 words of actionable content"
    }
  ],
  "keyTakeaways": ["string — 5-7 key takeaways the reader should remember"],
  "conclusion": "string — 100-150 word conclusion with next steps"
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
