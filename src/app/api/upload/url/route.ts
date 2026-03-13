import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { inngest } from "@/lib/inngest/client";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const submitUrlSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  url: z.string().url("Invalid URL"),
});

interface UrlSubmitData {
  id: string;
  status: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<UrlSubmitData>>> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = submitUrlSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
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

    const { businessId, url } = parsed.data;
    const supabase = createServiceClient();

    // Resolve Clerk user ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (!business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Business not found or access denied" } },
        { status: 403 }
      );
    }

    const knowledgeItemId = crypto.randomUUID();

    const { error: insertError } = await supabase.from("knowledge_items").insert({
      id: knowledgeItemId,
      business_id: businessId,
      source_type: "url",
      source_url: url,
      raw_content: "",
      processing_status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { error: { code: "INSERT_FAILED", message: "Failed to create knowledge item" } },
        { status: 500 }
      );
    }

    await inngest.send({
      name: "knowledge/ingest.requested",
      data: { knowledgeItemId, businessId, url },
    });

    logPlatformEvent({
      event_category: "DATA",
      event_type: "knowledge.url.submitted",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { url, knowledge_item_id: knowledgeItemId },
    });

    logActivity({
      business_id: businessId,
      event_type: "knowledge_ingested",
      title: "URL submitted for analysis",
      description: `URL added: ${url}`,
      metadata: { url, knowledge_item_id: knowledgeItemId },
    });

    return NextResponse.json({
      data: { id: knowledgeItemId, status: "queued" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
