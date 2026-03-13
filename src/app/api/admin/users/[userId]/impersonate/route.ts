import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAudit } from "@/lib/logging/admin-audit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ImpersonateResult {
  userId: string;
  clerkDashboardUrl: string;
  message: string;
}

// ---------------------------------------------------------------------------
// POST — Generate an impersonation link for viewing what the user sees
// ---------------------------------------------------------------------------

export async function POST(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<ImpersonateResult>>> {
  let adminUserId: string;
  try {
    adminUserId = await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }

  try {
    const { userId } = await params;
    const supabase = createServiceClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    logAdminAudit({
      admin_user_id: adminUserId,
      action: "user.impersonate",
      target_resource: "user",
      target_id: userId,
    });

    // For now, return a link to the Clerk dashboard for this user.
    // In the future, this could use Clerk's impersonation feature
    // (requires Clerk Enterprise plan) to generate a session token.
    const clerkDashboardUrl = `https://dashboard.clerk.com/users/${userId}`;

    return NextResponse.json({
      data: {
        userId,
        clerkDashboardUrl,
        message:
          "Impersonation link generated. Full impersonation requires Clerk Enterprise. Use the Clerk dashboard to view user details.",
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
