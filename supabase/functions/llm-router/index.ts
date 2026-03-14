// supabase/functions/llm-router/index.ts
// Deno Edge Function — proxies BYOK API keys to the correct LLM provider.
// Handles OpenAI-compatible, Anthropic, and Google Gemini formats.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ---------------------------------------------------------------------------
// Rate limiter (in-memory, per-isolate)
// ---------------------------------------------------------------------------
const rateBuckets = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60; // requests per minute

function checkRateLimit(agentId: string): boolean {
  const now = Date.now();
  const bucket = rateBuckets.get(agentId);
  if (!bucket || now >= bucket.resetAt) {
    rateBuckets.set(agentId, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (bucket.count >= RATE_LIMIT) return false;
  bucket.count++;
  return true;
}

// ---------------------------------------------------------------------------
// Token estimation (rough: 1 token ~ 4 chars)
// ---------------------------------------------------------------------------
function estimateTokens(messages: Message[]): number {
  let chars = 0;
  for (const m of messages) {
    if (typeof m.content === "string") chars += m.content.length;
    else if (Array.isArray(m.content)) {
      for (const part of m.content) {
        if (part.type === "text") chars += (part.text ?? "").length;
      }
    }
  }
  return Math.ceil(chars / 4);
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface Message {
  role: string;
  content: string | ContentPart[];
}

interface ContentPart {
  type: string;
  text?: string;
  image_url?: { url: string };
}

interface RouterRequest {
  provider: "openai" | "anthropic" | "google" | "openai-compatible";
  base_url?: string;
  api_key: string;
  model: string;
  messages: Message[];
  max_tokens?: number;
  temperature?: number;
  stream?: boolean;
}

// ---------------------------------------------------------------------------
// Format handlers
// ---------------------------------------------------------------------------

function buildOpenAIRequest(body: RouterRequest, baseUrl: string): { url: string; init: RequestInit } {
  const url = `${baseUrl.replace(/\/$/, "")}/v1/chat/completions`;
  return {
    url,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${body.api_key}`,
      },
      body: JSON.stringify({
        model: body.model,
        messages: body.messages,
        max_tokens: body.max_tokens ?? 4096,
        temperature: body.temperature ?? 0.7,
        stream: body.stream ?? true,
      }),
    },
  };
}

function buildAnthropicRequest(body: RouterRequest): { url: string; init: RequestInit } {
  // Extract system prompt from messages
  let systemPrompt: string | undefined;
  const filteredMessages: { role: string; content: string | ContentPart[] }[] = [];

  for (const msg of body.messages) {
    if (msg.role === "system") {
      systemPrompt = typeof msg.content === "string"
        ? msg.content
        : msg.content.filter((p) => p.type === "text").map((p) => p.text).join("\n");
    } else {
      filteredMessages.push({
        role: msg.role === "assistant" ? "assistant" : "user",
        content: msg.content,
      });
    }
  }

  const payload: Record<string, unknown> = {
    model: body.model,
    max_tokens: body.max_tokens ?? 4096,
    temperature: body.temperature ?? 0.7,
    messages: filteredMessages,
    stream: body.stream ?? true,
  };
  if (systemPrompt) payload.system = systemPrompt;

  return {
    url: "https://api.anthropic.com/v1/messages",
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": body.api_key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(payload),
    },
  };
}

function buildGeminiRequest(body: RouterRequest): { url: string; init: RequestInit } {
  // Convert OpenAI messages to Gemini contents format
  const contents: { role: string; parts: { text: string }[] }[] = [];
  let systemInstruction: { parts: { text: string }[] } | undefined;

  for (const msg of body.messages) {
    const text = typeof msg.content === "string"
      ? msg.content
      : msg.content.filter((p) => p.type === "text").map((p) => p.text ?? "").join("\n");

    if (msg.role === "system") {
      systemInstruction = { parts: [{ text }] };
    } else {
      contents.push({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text }],
      });
    }
  }

  const payload: Record<string, unknown> = {
    contents,
    generationConfig: {
      maxOutputTokens: body.max_tokens ?? 4096,
      temperature: body.temperature ?? 0.7,
    },
  };
  if (systemInstruction) payload.systemInstruction = systemInstruction;

  const method = body.stream !== false ? "streamGenerateContent" : "generateContent";
  const streamSuffix = body.stream !== false ? "?alt=sse" : "";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${body.model}:${method}${streamSuffix}`;

  return {
    url,
    init: {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": body.api_key,
      },
      body: JSON.stringify(payload),
    },
  };
}

// ---------------------------------------------------------------------------
// Provider base URLs
// ---------------------------------------------------------------------------
const PROVIDER_URLS: Record<string, string> = {
  openai: "https://api.openai.com",
  groq: "https://api.groq.com/openai",
  together: "https://api.together.xyz",
  fireworks: "https://api.fireworks.ai/inference",
  mistral: "https://api.mistral.ai",
  deepseek: "https://api.deepseek.com",
};

// ---------------------------------------------------------------------------
// Main handler
// ---------------------------------------------------------------------------
Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Agent-Id, X-Run-Id",
      },
    });
  }

  if (req.method !== "POST") {
    return Response.json({ error: { code: "METHOD_NOT_ALLOWED", message: "POST only" } }, { status: 405 });
  }

  try {
    // ---------- Auth: require bearer run_token ----------
    const authHeader = req.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return Response.json(
        { error: { code: "UNAUTHORIZED", message: "Missing bearer token" } },
        { status: 401 }
      );
    }
    const runToken = authHeader.slice(7);

    const agentId = req.headers.get("x-agent-id") ?? "unknown";
    const runId = req.headers.get("x-run-id") ?? null;

    // Single Supabase client for auth + logging
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Validate run_token against agents table
    if (agentId !== "unknown") {
      const { data: agent } = await supabase
        .from("agents")
        .select("run_token")
        .eq("id", agentId)
        .single();

      if (!agent || agent.run_token !== runToken) {
        return Response.json(
          { error: { code: "UNAUTHORIZED", message: "Invalid run token" } },
          { status: 401 }
        );
      }
    }

    // Rate limit check
    if (!checkRateLimit(agentId)) {
      return Response.json(
        { error: { code: "RATE_LIMITED", message: "Max 60 requests/minute per agent" } },
        { status: 429 }
      );
    }

    const body = (await req.json()) as RouterRequest;

    // Validate required fields
    if (!body.provider || !body.api_key || !body.model || !body.messages?.length) {
      return Response.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields: provider, api_key, model, messages" } },
        { status: 400 }
      );
    }

    // Estimate input tokens for logging
    const inputTokens = estimateTokens(body.messages);

    // Build the provider request
    let providerReq: { url: string; init: RequestInit };

    switch (body.provider) {
      case "anthropic":
        providerReq = buildAnthropicRequest(body);
        break;
      case "google":
        providerReq = buildGeminiRequest(body);
        break;
      case "openai":
        providerReq = buildOpenAIRequest(body, PROVIDER_URLS.openai);
        break;
      case "openai-compatible": {
        const baseUrl = body.base_url;
        if (!baseUrl) {
          return Response.json(
            { error: { code: "VALIDATION_ERROR", message: "base_url required for openai-compatible provider" } },
            { status: 400 }
          );
        }
        providerReq = buildOpenAIRequest(body, baseUrl);
        break;
      }
      default:
        return Response.json(
          { error: { code: "INVALID_PROVIDER", message: `Unknown provider: ${body.provider}` } },
          { status: 400 }
        );
    }

    // Non-blocking usage log
    supabase
      .from("llm_usage")
      .insert({
        agent_id: agentId !== "unknown" ? agentId : null,
        run_id: runId,
        provider: body.provider,
        model: body.model,
        input_tokens: inputTokens,
        output_tokens: null, // will be updated by a post-process hook if needed
        cost_cents: null,
      })
      .then(({ error }) => {
        if (error) console.error("[llm-router] Usage log error:", error.message);
      });

    // Forward to provider
    const providerRes = await fetch(providerReq.url, providerReq.init);

    if (!providerRes.ok) {
      const errorBody = await providerRes.text();
      let parsed: unknown;
      try {
        parsed = JSON.parse(errorBody);
      } catch {
        parsed = { raw: errorBody };
      }
      return Response.json(
        {
          error: {
            code: "PROVIDER_ERROR",
            message: `Provider returned ${providerRes.status}`,
            provider_error: parsed,
          },
        },
        { status: providerRes.status }
      );
    }

    // Stream the response back (SSE passthrough)
    if (providerRes.body) {
      return new Response(providerRes.body, {
        status: 200,
        headers: {
          "Content-Type": providerRes.headers.get("content-type") ?? "text/event-stream",
          "Cache-Control": "no-cache",
          Connection: "keep-alive",
          "Access-Control-Allow-Origin": "*",
        },
      });
    }

    // Non-streaming fallback
    const result = await providerRes.json();
    return Response.json(result, {
      headers: { "Access-Control-Allow-Origin": "*" },
    });
  } catch (err) {
    console.error("[llm-router] Unhandled error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return Response.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
});
