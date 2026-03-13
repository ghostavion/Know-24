import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

interface DownloadResponse {
  downloadUrl: string;
  fileName: string;
  mimeType: string | null;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ assetId: string }> }
): Promise<NextResponse<ApiResponse<DownloadResponse>>> {
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

    const { assetId } = await params;
    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Fetch asset with product's business info for ownership check
    const { data: asset, error: assetError } = await supabase
      .from("product_assets")
      .select("*, products!inner(business_id)")
      .eq("id", assetId)
      .single();

    if (assetError || !asset) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Asset not found" } },
        { status: 404 }
      );
    }

    const productData = asset.products as unknown as { business_id: string };
    const businessId = productData.business_id;

    // Verify ownership through business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("owner_id")
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
        { error: { code: "FORBIDDEN", message: "Not authorized to download this asset" } },
        { status: 403 }
      );
    }

    // Generate signed download URL (1 hour expiry) — schema column is r2_key, not file_path
    const r2Key = asset.r2_key as string;
    const r2Bucket = (asset.r2_bucket as string) || "product-assets";

    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from(r2Bucket)
      .createSignedUrl(r2Key, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        { error: { code: "SIGNED_URL_FAILED", message: "Failed to generate download URL" } },
        { status: 500 }
      );
    }

    const fileName = r2Key.split("/").pop() ?? "download";

    return NextResponse.json({
      data: {
        downloadUrl: signedUrlData.signedUrl,
        fileName,
        mimeType: (asset.mime_type as string) ?? null,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
