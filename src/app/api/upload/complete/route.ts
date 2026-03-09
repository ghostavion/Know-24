import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { knowledgeIngestQueue } from "@/lib/queue/queues";
import type { ApiResponse } from "@/types/api";

const uploadCompleteSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  r2Key: z.string().min(1, "R2 key is required"),
  fileName: z.string().min(1, "File name is required"),
});

interface UploadCompleteData {
  id: string;
  status: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<UploadCompleteData>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await req.json();
    const parsed = uploadCompleteSchema.safeParse(body);
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

    const { businessId, r2Key, fileName } = parsed.data;
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
      source_type: "document",
      original_filename: fileName,
      source_url: r2Key,
      raw_content: "",
      processing_status: "pending",
    });

    if (insertError) {
      return NextResponse.json(
        { error: { code: "INSERT_FAILED", message: "Failed to create knowledge item" } },
        { status: 500 }
      );
    }

    await knowledgeIngestQueue.add("ingest-file", {
      knowledgeItemId,
      businessId,
      r2Key,
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
