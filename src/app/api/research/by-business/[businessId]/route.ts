import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const uuidSchema = z.string().uuid("Invalid business ID format");

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
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

    const { businessId } = await params;
    const parsedId = uuidSchema.safeParse(businessId);
    if (!parsedId.success) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Invalid business ID format" } },
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

    // Fetch latest research document
    const { data: research, error: researchError } = await supabase
      .from("research_documents")
      .select("*")
      .eq("business_id", businessId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (researchError || !research) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "No research found for this business" } },
        { status: 404 }
      );
    }

    return NextResponse.json({ data: research });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
