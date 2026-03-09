import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPublishedStorefront } from "@/lib/storefront/queries";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

const slugSchema = z.string().min(1);

const subscribeSchema = z.object({
  email: z.string().email("A valid email address is required"),
  firstName: z.string().max(100).optional(),
});

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
): Promise<NextResponse<ApiResponse<{ subscribed: boolean }>>> {
  try {
    const { slug } = await params;

    const parsedSlug = slugSchema.safeParse(slug);
    if (!parsedSlug.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid storefront slug",
            details: parsedSlug.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const body: unknown = await request.json();
    const parsed = subscribeSchema.safeParse(body);
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

    const storefront = await getPublishedStorefront(slug);
    if (!storefront) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Storefront not found" } },
        { status: 404 }
      );
    }

    const { email, firstName } = parsed.data;
    const supabase = createServiceClient();

    const { error } = await supabase
      .from("email_subscribers")
      .upsert(
        {
          business_id: storefront.business_id,
          email,
          first_name: firstName ?? null,
          source: "storefront",
          unsubscribed_at: null,
        },
        { onConflict: "business_id,email" }
      );

    if (error) {
      return NextResponse.json(
        {
          error: {
            code: "SUBSCRIBE_FAILED",
            message: "Failed to subscribe",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { subscribed: true } });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
