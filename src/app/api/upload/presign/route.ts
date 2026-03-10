import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { r2 } from "@/lib/storage/r2";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import type { ApiResponse } from "@/types/api";

const presignSchema = z.object({
  businessId: z.string().uuid("Invalid business ID"),
  fileName: z.string().min(1, "File name is required"),
  fileType: z.string().min(1, "File type is required"),
});

interface PresignData {
  uploadUrl: string;
  r2Key: string;
}

export async function POST(req: Request): Promise<NextResponse<ApiResponse<PresignData>>> {
  try {
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

    const r2Key = `knowledge/${businessId}/${crypto.randomUUID()}-${fileName}`;

    const command = new PutObjectCommand({
      Bucket: process.env.R2_PRODUCT_ASSETS_BUCKET!,
      Key: r2Key,
      ContentType: fileType,
    });

    const presignedUrl = await getSignedUrl(r2, command, { expiresIn: 3600 });

    logPlatformEvent({
      event_category: "USER_ACTION",
      event_type: "upload.presigned",
      clerk_user_id: clerkUserId,
      status: "success",
      business_id: businessId,
      payload: { file_name: fileName, file_type: fileType, r2_key: r2Key },
    });

    return NextResponse.json({
      data: { uploadUrl: presignedUrl, r2Key },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
