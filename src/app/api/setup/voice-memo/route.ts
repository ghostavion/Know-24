import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { logPlatformEvent, extractRequestMeta } from "@/lib/logging/platform-logger";
import { logActivity } from "@/lib/logging/activity-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import { inngest } from "@/lib/inngest/client";
import type { ApiResponse } from "@/types/api";

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

interface VoiceMemoResponse {
  voiceMemoId: string;
  status: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<VoiceMemoResponse>>> {
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

    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const businessId = formData.get("businessId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "File is required" } },
        { status: 400 }
      );
    }

    if (!businessId || typeof businessId !== "string" || businessId.trim().length === 0) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "businessId is required" } },
        { status: 400 }
      );
    }

    if (!file.type.startsWith("audio/")) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "File must be an audio file" } },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "File must be less than 25MB" } },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, owner_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    if (business.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to access this business" } },
        { status: 403 }
      );
    }

    // Determine file extension from mime type
    const mimeToExt: Record<string, string> = {
      "audio/mpeg": "mp3",
      "audio/mp3": "mp3",
      "audio/mp4": "m4a",
      "audio/x-m4a": "m4a",
      "audio/wav": "wav",
      "audio/x-wav": "wav",
      "audio/webm": "webm",
      "audio/ogg": "ogg",
      "audio/flac": "flac",
      "audio/aac": "aac",
    };
    const ext = mimeToExt[file.type] ?? "bin";
    const filePath = `${businessId}/${crypto.randomUUID()}.${ext}`;

    // Upload to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const { error: uploadError } = await supabase.storage
      .from("voice-memos")
      .upload(filePath, buffer, { contentType: file.type });

    if (uploadError) {
      return NextResponse.json(
        { error: { code: "UPLOAD_FAILED", message: uploadError.message } },
        { status: 500 }
      );
    }

    // Create voice_memos record
    const { data: voiceMemo, error: insertError } = await supabase
      .from("voice_memos")
      .insert({
        business_id: businessId,
        file_path: filePath,
        file_size_bytes: file.size,
        mime_type: file.type,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !voiceMemo) {
      return NextResponse.json(
        { error: { code: "INSERT_FAILED", message: insertError?.message ?? "Failed to create record" } },
        { status: 500 }
      );
    }

    const voiceMemoId = voiceMemo.id as string;

    // Dispatch transcription via Inngest
    await inngest.send({
      name: "voice/transcription.requested",
      data: { voiceMemoId, businessId, filePath },
    });

    const meta = extractRequestMeta(req);
    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "setup.voice_memo.uploaded",
      clerk_user_id: clerkUserId,
      user_id: userId,
      status: "success",
      business_id: businessId,
      payload: { voiceMemoId, filePath, fileSize: file.size, mimeType: file.type },
      ...meta,
    });

    logActivity({
      business_id: businessId,
      event_type: "knowledge_ingested",
      title: "Voice memo uploaded",
      description: `Voice memo uploaded for transcription (${(file.size / 1024 / 1024).toFixed(1)}MB)`,
      metadata: { voiceMemoId, filePath },
    });

    return NextResponse.json({
      data: { voiceMemoId, status: "queued" },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
