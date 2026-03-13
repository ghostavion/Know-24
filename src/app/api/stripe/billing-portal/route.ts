import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { stripe } from "@/lib/stripe/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

interface BillingPortalData {
  url: string;
}

interface OrganizationMemberRow {
  organization_id: string;
}

interface OrganizationRow {
  id: string;
  stripe_customer_id: string | null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<BillingPortalData>>> {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const supabase = createServiceClient();

    // Find the user's organization membership to get their org
    const { data: membership, error: memberError } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .single();

    if (memberError || !membership) {
      return NextResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "No organization found for this user",
          },
        },
        { status: 404 }
      );
    }

    const typedMembership = membership as unknown as OrganizationMemberRow;

    // Get the organization's Stripe customer ID
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .select("id, stripe_customer_id")
      .eq("id", typedMembership.organization_id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Organization not found" } },
        { status: 404 }
      );
    }

    const typedOrg = org as unknown as OrganizationRow;

    if (!typedOrg.stripe_customer_id) {
      return NextResponse.json(
        {
          error: {
            code: "NO_CUSTOMER",
            message:
              "No Stripe customer associated with this organization. Please subscribe to a plan first.",
          },
        },
        { status: 400 }
      );
    }

    // Create a Stripe Billing Portal session
    const appUrl = process.env.NEXT_PUBLIC_APP_URL!;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: typedOrg.stripe_customer_id,
      return_url: `${appUrl}/dashboard/settings`,
    });

    return NextResponse.json({
      data: { url: portalSession.url },
    });
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
