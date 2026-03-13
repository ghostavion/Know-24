import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

interface ReferralLinkResponse {
  code: string;
  url: string;
  clicks: number;
  signups: number;
}

export async function GET(): Promise<NextResponse<ApiResponse<ReferralLinkResponse>>> {
  try {
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const rateLimit = await checkRateLimit(clerkUserId, "api");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const supabase = createServiceClient();

    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    // Check for existing referral link
    const { data: existing } = await supabase
      .from("referral_links")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (existing) {
      const link = existing as unknown as {
        code: string;
        clicks: number;
        signups: number;
      };
      return NextResponse.json({
        data: {
          code: link.code,
          url: `https://know24.io?ref=${link.code}`,
          clicks: link.clicks,
          signups: link.signups,
        },
      });
    }

    // Create a new referral link
    const code = crypto.randomUUID().slice(0, 8);

    const { data: newLink, error: insertError } = await supabase
      .from("referral_links")
      .insert({
        user_id: userId,
        code,
        source: "dashboard",
      })
      .select()
      .single();

    if (insertError || !newLink) {
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to create referral link",
            details: insertError?.message,
          },
        },
        { status: 500 }
      );
    }

    const created = newLink as unknown as {
      code: string;
      clicks: number;
      signups: number;
    };

    return NextResponse.json({
      data: {
        code: created.code,
        url: `https://know24.io?ref=${created.code}`,
        clicks: created.clicks,
        signups: created.signups,
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
