import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import * as Sentry from "@sentry/nextjs";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { primaryModel, logLLMCall } from "@/lib/ai/providers";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { getWorkspaceTools } from "@/lib/ai/tools/workspace-tools";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const workspaceSchema = z.object({
  businessId: z.string().uuid(),
  messages: z.array(
    z.object({
      id: z.string(),
      role: z.enum(["user", "assistant", "system"]),
      parts: z.array(z.object({ type: z.string(), text: z.string().optional() }).passthrough()),
    }).passthrough()
  ),
});

interface BusinessRow {
  id: string;
  name: string;
  niche: string;
  status: string;
}

interface StorefrontRow {
  subdomain: string;
}

export async function POST(
  request: NextRequest
): Promise<Response> {
  try {
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "ai");
    if (!rlResult.success) {
      return NextResponse.json<ApiResponse>(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json<ApiResponse>(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = workspaceSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json<ApiResponse>(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { businessId, messages } = parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json<ApiResponse>(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business belongs to user
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name, niche, status")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json<ApiResponse>(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const typedBusiness = business as BusinessRow;

    // Get business context: product count and storefront subdomain
    const { count: productCount } = await supabase
      .from("products")
      .select("id", { count: "exact", head: true })
      .eq("business_id", businessId)
      .is("deleted_at", null);

    const { data: storefront } = await supabase
      .from("storefronts")
      .select("subdomain")
      .eq("business_id", businessId)
      .single();

    const typedStorefront = storefront as StorefrontRow | null;
    const subdomain = typedStorefront?.subdomain ?? typedBusiness.name.toLowerCase().replace(/\s+/g, "-");

    // Build system prompt
    const systemPrompt = `You are the AI assistant for "${typedBusiness.name}", a knowledge business on AgentTV.

Business context:
- Name: ${typedBusiness.name}
- Niche: ${typedBusiness.niche}
- Status: ${typedBusiness.status}
- Products: ${productCount ?? 0} products
- Storefront: ${subdomain}.agenttv.io

You can help the creator manage their business. You have tools to:
- View business stats and analytics
- Update product prices and statuses
- List all products
- Generate new products
- Change storefront colors

Be concise, helpful, and proactive. When the creator asks to do something, use the appropriate tool. Always confirm actions taken.`;

    // Stream the response
    const startTime = Date.now();
    const result = streamText({
      model: primaryModel,
      system: systemPrompt,
      messages: await convertToModelMessages(messages as UIMessage[]),
      tools: getWorkspaceTools(businessId),
      stopWhen: stepCountIs(3),
      onFinish: ({ usage }) => {
        logLLMCall({
          businessId,
          userId,
          model: "gpt-4o",
          feature: "workspace",
          inputTokens: usage.inputTokens ?? 0,
          outputTokens: usage.outputTokens ?? 0,
          durationMs: Date.now() - startTime,
        });

        logPlatformEvent({
          event_category: "LLM",
          event_type: "ai.workspace.chat",
          clerk_user_id: clerkUserId,
          status: "success",
          business_id: businessId,
          duration_ms: Date.now() - startTime,
          payload: {
            input_tokens: usage.inputTokens ?? 0,
            output_tokens: usage.outputTokens ?? 0,
          },
        });

        logActivity({
          business_id: businessId,
          event_type: "ai_workspace_action",
          title: "AI Workspace conversation",
          metadata: {
            input_tokens: usage.inputTokens ?? 0,
            output_tokens: usage.outputTokens ?? 0,
          },
        });
      },
    });

    return result.toUIMessageStreamResponse();
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json<ApiResponse>(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
