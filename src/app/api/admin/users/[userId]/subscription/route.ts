import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const subscriptionActionSchema = z
  .object({
    organizationId: z.string().uuid("Invalid organization ID"),
    action: z.enum(["cancel", "pause", "resume", "change_plan"]),
    plan: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.action === "change_plan" && !data.plan) {
        return false;
      }
      return true;
    },
    {
      message: "Plan is required when action is change_plan",
      path: ["plan"],
    }
  );

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface SubscriptionResult {
  organizationId: string;
  action: string;
  subscriptionStatus: string;
  message: string;
}

// ---------------------------------------------------------------------------
// PATCH — Manage subscription actions (cancel, pause, resume, change_plan)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<SubscriptionResult>>> {
  try {
    await requireAdmin();
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
    const body: unknown = await request.json();
    const parsed = subscriptionActionSchema.safeParse(body);

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

    const { organizationId, action, plan } = parsed.data;
    const supabase = createServiceClient();
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

    // Verify user is a member of the organization
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "User is not a member of the specified organization",
          },
        },
        { status: 404 }
      );
    }

    // Get organization with subscription info
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, stripe_subscription_id, subscription_status")
      .eq("id", organizationId)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Organization not found" } },
        { status: 404 }
      );
    }

    const typedOrg = org as {
      id: string;
      stripe_subscription_id: string | null;
      subscription_status: string | null;
    };

    if (!typedOrg.stripe_subscription_id) {
      return NextResponse.json(
        {
          error: {
            code: "NO_SUBSCRIPTION",
            message: "Organization does not have an active subscription",
          },
        },
        { status: 400 }
      );
    }

    let newStatus: string;
    let resultMessage: string;

    switch (action) {
      case "cancel": {
        await stripe.subscriptions.cancel(typedOrg.stripe_subscription_id);
        newStatus = "canceled";
        resultMessage = "Subscription has been canceled";
        break;
      }

      case "pause": {
        await stripe.subscriptions.update(typedOrg.stripe_subscription_id, {
          pause_collection: { behavior: "void" },
        });
        newStatus = "paused";
        resultMessage = "Subscription has been paused";
        break;
      }

      case "resume": {
        await stripe.subscriptions.update(typedOrg.stripe_subscription_id, {
          pause_collection: "",
        });
        newStatus = "active";
        resultMessage = "Subscription has been resumed";
        break;
      }

      case "change_plan": {
        // Get the current subscription to find the subscription item
        const subscription = await stripe.subscriptions.retrieve(
          typedOrg.stripe_subscription_id
        );

        if (subscription.items.data.length === 0) {
          return NextResponse.json(
            {
              error: {
                code: "NO_ITEMS",
                message: "Subscription has no items to update",
              },
            },
            { status: 400 }
          );
        }

        const subscriptionItemId = subscription.items.data[0].id;

        // The `plan` value should be a Stripe Price ID
        await stripe.subscriptions.update(typedOrg.stripe_subscription_id, {
          items: [{ id: subscriptionItemId, price: plan! }],
          proration_behavior: "create_prorations",
        });

        newStatus = "active";
        resultMessage = `Subscription plan changed to ${plan}`;
        break;
      }

      default: {
        return NextResponse.json(
          { error: { code: "INVALID_ACTION", message: "Unknown action" } },
          { status: 400 }
        );
      }
    }

    // Update organization subscription status in database
    const { error: updateError } = await supabase
      .from("organizations")
      .update({
        subscription_status: newStatus,
        ...(action === "change_plan" ? { plan: plan } : {}),
      })
      .eq("id", organizationId);

    if (updateError) {
      // The Stripe action succeeded but the DB update failed — log but don't
      // roll back Stripe since idempotency is handled on webhook reconciliation
      return NextResponse.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message:
              "Stripe action succeeded but database update failed. The subscription webhook will reconcile.",
          },
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: {
        organizationId,
        action,
        subscriptionStatus: newStatus,
        message: resultMessage,
      },
    });
  } catch (err) {
    // Handle Stripe-specific errors
    if (err instanceof Stripe.errors.StripeError) {
      return NextResponse.json(
        {
          error: {
            code: "STRIPE_ERROR",
            message: err.message,
          },
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
