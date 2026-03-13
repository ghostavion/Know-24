import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { getSignedUploadUrl, BUCKETS } from "@/lib/storage/supabase-storage";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const presignSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  fileName: z
    .string()
    .min(1, "File name is required")
    .regex(/^[a-zA-Z0-9_\-. ]+$/, "Invalid file name characters"),
  fileType: z.enum([
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
    "text/markdown",
    "audio/mpeg",
    "audio/wav",
    "audio/webm",
    "image/png",
    "image/jpeg",
  ], { error: "Unsupported file type" }),
  fileSize: z.number().max(52428800, "File too large (50MB max)"),
});

interface PresignData {
  uploadUrl: string;
  storagePath: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<PresignData>>> {
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
    const parsed = presignSchema.safeParse(body);
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

    const { businessId, fileName, fileType } = parsed.data;
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

    const storagePath = `${businessId}/${crypto.randomUUID()}-${fileName}`;

    const { signedUrl } = await getSignedUploadUrl(BUCKETS.knowledge, storagePath);

    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "upload.presigned",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { file_name: fileName, file_type: fileType, storage_path: storagePath },
    });

    return NextResponse.json({
      data: { uploadUrl: signedUrl, storagePath },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
