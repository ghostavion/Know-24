import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getKnowledgeIngestQueue } from "@/lib/queue/queues";
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
    const { userId } = await auth();
    if (!userId) {
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

    await getKnowledgeIngestQueue().add("ingest-url", {
      knowledgeItemId,
      businessId,
      url,
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
