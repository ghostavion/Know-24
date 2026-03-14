import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";
import { withApiLogging } from "@/lib/logging/api-logger";
import type { ApiResponse } from "@/types/api";

/* ------------------------------------------------------------------ */
/* Zod schemas                                                         */
/* ------------------------------------------------------------------ */

const notificationsSchema = z.object({
  agentUpdates: z.boolean(),
  weeklyDigest: z.boolean(),
  productNews: z.boolean(),
});

const settingsPayload = z.object({
  firstName: z.string().max(100).optional(),
  lastName: z.string().max(100).optional(),
  timezone: z.string().max(50).optional(),
  notifications: notificationsSchema.optional(),
});

type SettingsPayload = z.infer<typeof settingsPayload>;

/* ------------------------------------------------------------------ */
/* Helpers                                                              */
/* ------------------------------------------------------------------ */

interface UserRow {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  settings: {
    timezone?: string;
    notifications?: {
      agentUpdates: boolean;
      weeklyDigest: boolean;
      productNews: boolean;
    };
  } | null;
}

async function authenticateAndResolve() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return { error: "UNAUTHORIZED" as const, clerkUserId: null, userId: null };

  const supabase = createServiceClient();
  const userId = await resolveUserId(supabase, clerkUserId);
  if (!userId) return { error: "USER_NOT_FOUND" as const, clerkUserId, userId: null };

  return { error: null, clerkUserId, userId, supabase };
}

/* ------------------------------------------------------------------ */
/* GET — fetch current settings                                        */
/* ------------------------------------------------------------------ */

async function _GET(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(ip, "api");
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await authenticateAndResolve();
    if (result.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }
    if (result.error === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    const { supabase, userId } = result;

    const { data, error } = await supabase!
      .from("users")
      .select("id, first_name, last_name, email, settings")
      .eq("id", userId)
      .single();

    if (error || !data) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch settings" } },
        { status: 500 },
      );
    }

    const user = data as UserRow;
    const settings = user.settings ?? {};

    return NextResponse.json({
      data: {
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
        timezone: settings.timezone ?? "America/New_York",
        notifications: settings.notifications ?? {
          agentUpdates: true,
          weeklyDigest: true,
          productNews: false,
        },
      },
    });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* POST — update settings (matches SettingsForm.tsx)                    */
/* ------------------------------------------------------------------ */

async function _POST(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(ip, "api");
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await authenticateAndResolve();
    if (result.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }
    if (result.error === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    const { supabase, userId } = result;

    // Parse & validate body
    const body = await req.json();
    const parsed = settingsPayload.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid settings payload",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { firstName, lastName, timezone, notifications } = parsed.data as SettingsPayload;

    // Build updates — profile columns + JSONB settings
    const columnUpdates: Record<string, unknown> = {};
    if (firstName !== undefined) columnUpdates.first_name = firstName;
    if (lastName !== undefined) columnUpdates.last_name = lastName;

    // Merge into settings JSONB
    const settingsUpdate: Record<string, unknown> = {};
    if (timezone !== undefined) settingsUpdate.timezone = timezone;
    if (notifications !== undefined) settingsUpdate.notifications = notifications;

    // Fetch existing settings to merge
    const { data: existing } = await supabase!
      .from("users")
      .select("settings")
      .eq("id", userId)
      .single();

    const mergedSettings = {
      ...((existing as { settings: Record<string, unknown> } | null)?.settings ?? {}),
      ...settingsUpdate,
    };

    columnUpdates.settings = mergedSettings;

    const { error } = await supabase!
      .from("users")
      .update(columnUpdates)
      .eq("id", userId);

    if (error) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update settings" } },
        { status: 500 },
      );
    }

    return NextResponse.json({ data: { updated: true } });
  } catch (error) {
    Sentry.captureException(error);
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}

/* ------------------------------------------------------------------ */
/* DELETE — account deletion (GDPR soft-delete)                        */
/* ------------------------------------------------------------------ */

async function _DELETE(req: NextRequest): Promise<NextResponse<ApiResponse>> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rl = await checkRateLimit(ip, "auth");
    if (!rl.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: rateLimitHeaders(rl) },
      );
    }

    const result = await authenticateAndResolve();
    if (result.error === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }
    if (result.error === "USER_NOT_FOUND") {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User not found" } },
        { status: 404 },
      );
    }

    const { supabase, userId, clerkUserId } = result;

    // 1. Cancel any active Stripe subscription
    const { data: userRow } = await supabase!
      .from("users")
      .select("stripe_subscription_id")
      .eq("id", userId)
      .single();

    if (userRow?.stripe_subscription_id) {
      try {
        const { getStripe } = await import("@/lib/stripe/server");
        const stripe = getStripe();
        await stripe.subscriptions.cancel(userRow.stripe_subscription_id);
      } catch {
        // Subscription may already be canceled — continue
      }
    }

    // 2. Soft-delete the user record
    await supabase!
      .from("users")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", userId);

    // 3. Delete the Clerk user account
    try {
      const clerkSecretKey = process.env.CLERK_SECRET_KEY;
      if (clerkSecretKey && clerkUserId) {
        await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${clerkSecretKey}`,
            "Content-Type": "application/json",
          },
        });
      }
    } catch {
      // Log but don't block — the user record is already soft-deleted
      Sentry.captureMessage(`Failed to delete Clerk user ${clerkUserId}`, "warning");
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

export const GET = withApiLogging(_GET, "api.settings.get");
export const POST = withApiLogging(_POST, "api.settings.update");
export const DELETE = withApiLogging(_DELETE, "api.settings.delete");
