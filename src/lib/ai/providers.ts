import { google } from "@ai-sdk/google";
import { anthropic } from "@ai-sdk/anthropic";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { estimateCostUsd } from "@/lib/admin/llm-costs";

// Primary model — fast drafts, cheap
export const primaryModel = google("gemini-2.5-flash-preview-05-20");

// Reasoning / polish model — quality pass
export const reasoningModel = anthropic("claude-sonnet-4-5-20250514");

// Long context model — research synthesis
export const longContextModel = google("gemini-2.5-pro-preview-05-06");

// Embedding model — Gemini text embeddings
export const embeddingModel = google.textEmbeddingModel("text-embedding-004");

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
