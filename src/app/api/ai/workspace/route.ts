import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { streamText, convertToModelMessages, stepCountIs, type UIMessage } from "ai";
import { createServiceClient } from "@/lib/supabase/server";
import { primaryModel, logLLMCall } from "@/lib/ai/providers";
import { getWorkspaceTools } from "@/lib/ai/tools/workspace-tools";
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
    const { userId } = await auth();
    if (!userId) {
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
    const systemPrompt = `You are the AI assistant for "${typedBusiness.name}", a knowledge business on Know24.

Business context:
- Name: ${typedBusiness.name}
- Niche: ${typedBusiness.niche}
- Status: ${typedBusiness.status}
- Products: ${productCount ?? 0} products
- Storefront: ${subdomain}.know24.io

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
      },
    });

    return result.toUIMessageStreamResponse();
  } catch {
    return NextResponse.json<ApiResponse>(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
