import { openai } from "@ai-sdk/openai";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { estimateCostUsd } from "@/lib/admin/llm-costs";

export const primaryModel = openai("gpt-4o");
export const reasoningModel = openai("gpt-4o"); // swap to anthropic when ANTHROPIC_API_KEY is added
export const longContextModel = openai("gpt-4o"); // swap to google when GOOGLE_GENERATIVE_AI_API_KEY is added
export const embeddingModel = openai.embedding("text-embedding-3-small");

/**
 * Log a completed LLM call with token usage and cost.
 * Call this from API routes after AI SDK returns usage data.
 */
export function logLLMCall(context: {
  businessId?: string | null;
  userId?: string | null;
  model: string;
  feature: string;
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
  status?: "success" | "error";
  errorMessage?: string;
}): void {
  const costUsd = estimateCostUsd(
    context.model,
    context.inputTokens,
    context.outputTokens
  );

  logPlatformEvent({
    event_category: "LLM",
    event_type:
      context.status === "error"
        ? "llm.call.failed"
        : "llm.call.completed",
    user_id: context.userId ?? null,
    business_id: context.businessId ?? null,
    status: context.status ?? "success",
    duration_ms: context.durationMs,
    error_message: context.errorMessage ?? null,
    payload: {
      model: context.model,
      feature: context.feature,
      input_tokens: context.inputTokens,
      output_tokens: context.outputTokens,
      cost_usd: costUsd,
      latency_ms: context.durationMs,
    },
  });
}
