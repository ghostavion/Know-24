import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const trackSchema = z.object({
  code: z.string().min(1),
});

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ tracked: boolean }>>> {
  try {
    // Rate limit by IP (no auth required for anonymous visitors)
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? "anonymous";
    const rateLimit = await checkRateLimit(`track:${ip}`, "api");
    if (!rateLimit.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429 }
      );
    }

    const body: unknown = await request.json();
    const parsed = trackSchema.safeParse(body);
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

    const { code } = parsed.data;
    const supabase = createServiceClient();

    // Find the referral link by code
    const { data: link } = await supabase
      .from("referral_links")
      .select("id, clicks")
      .eq("code", code)
      .single();

    if (!link) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Referral link not found" } },
        { status: 404 }
      );
    }

    const typedLink = link as unknown as { id: string; clicks: number };

    // Increment clicks
    await supabase
      .from("referral_links")
      .update({ clicks: typedLink.clicks + 1 })
      .eq("id", typedLink.id);

    return NextResponse.json({ data: { tracked: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
