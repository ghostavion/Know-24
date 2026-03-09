import { openai } from "@ai-sdk/openai";

export const primaryModel = openai("gpt-4o");
export const reasoningModel = openai("gpt-4o"); // swap to anthropic when ANTHROPIC_API_KEY is added
export const longContextModel = openai("gpt-4o"); // swap to google when GOOGLE_GENERATIVE_AI_API_KEY is added
export const embeddingModel = openai.embedding("text-embedding-3-small");
