import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse>> {
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

    const { id: productId } = await params;
    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Verify product ownership through business
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, business_id, businesses(owner_id)")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const ownerData = product.businesses as unknown as { owner_id: string } | null;
    if (!ownerData || ownerData.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to access this product" } },
        { status: 403 }
      );
    }

    // Fetch all assets for this product
    const { data: assets, error: assetsError } = await supabase
      .from("product_assets")
      .select("*")
      .eq("product_id", productId)
      .order("created_at", { ascending: true });

    if (assetsError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch assets" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { assets: assets ?? [] } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
