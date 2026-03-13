import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { getStripe } from "@/lib/stripe/server";
import type { ApiResponse } from "@/types/api";

/* ------------------------------------------------------------------ */
/* POST — GDPR account deletion                                        */
/*                                                                      */
/* 1. Auth via Clerk                                                    */
/* 2. Resolve internal user ID                                          */
/* 3. Cancel active Stripe subscriptions on all owned businesses        */
/* 4. Soft-delete businesses (set deleted_at, status = "deleted")       */
/* 5. Soft-delete user record (set deleted_at)                          */
/* 6. Delete Clerk user via Admin API                                   */
/* ------------------------------------------------------------------ */

export async function POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    // Rate limit with auth tier (10 req/min) — destructive action
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(ip, "auth");
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    // Authenticate
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const supabase = createServiceClient();

    // Resolve Clerk ID → internal UUID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    // 1. Fetch all businesses owned by this user
    const { data: businesses } = await supabase
      .from("businesses")
      .select("id, stripe_subscription_id, stripe_customer_id")
      .eq("owner_id", userId)
      .is("deleted_at", null);

    // 2. Cancel Stripe subscriptions
    if (businesses && businesses.length > 0) {
      const stripe = getStripe();

      for (const biz of businesses as Array<{
        id: string;
        stripe_subscription_id: string | null;
        stripe_customer_id: string | null;
      }>) {
        if (biz.stripe_subscription_id) {
          try {
            await stripe.subscriptions.cancel(biz.stripe_subscription_id);
          } catch {
            // Subscription may already be canceled — continue gracefully
          }
        }
      }

      // 3. Soft-delete all businesses
      const bizIds = businesses.map((b: { id: string }) => b.id);
      await supabase
        .from("businesses")
        .update({
          deleted_at: new Date().toISOString(),
          status: "deleted",
          subscription_status: "canceled",
          stripe_subscription_id: null,
        })
        .in("id", bizIds);
    }

    // 4. Soft-delete user record
    const { error: userUpdateError } = await supabase
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);

    if (userUpdateError) {
      Sentry.captureException(userUpdateError);
      return NextResponse.json(
        { error: { code: "DELETE_FAILED", message: "Failed to delete user record" } },
        { status: 500 },
      );
    }

    // 5. Delete Clerk user via Admin API
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (clerkSecretKey) {
        const clerkRes = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        });

        if (!clerkRes.ok) {
          Sentry.captureMessage(
            `Clerk user deletion returned ${clerkRes.status} for ${clerkUserId}`,
            "warning",
          );
        }
      }
    } catch (clerkErr) {
      // Log but don't block — user is already soft-deleted in our DB
      Sentry.captureException(clerkErr);
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
