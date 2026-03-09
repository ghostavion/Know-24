import { openai } from "@ai-sdk/openai";
import { anthropic } from "@ai-sdk/anthropic";
import { google } from "@ai-sdk/google";

export const primaryModel = openai("gpt-4o");
export const reasoningModel = anthropic("claude-sonnet-4-5-20250514");
export const longContextModel = google("gemini-1.5-pro-latest");
export const embeddingModel = openai.embedding("text-embedding-3-small");
