import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import { logAdminAudit } from "@/lib/logging/admin-audit";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const creditActionSchema = z.object({
  organizationId: z.string().uuid("Invalid organization ID"),
  action: z.enum([
    "credit_added",
    "comp_month",
    "bonus_tokens",
    "bonus_scout_scans",
    "bonus_social_posts",
    "custom",
  ]),
  description: z.string().min(1, "Description is required").max(1000),
  amountCents: z.number().int().min(0).optional(),
  tokenAmount: z.number().int().min(0).optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface CreditEntry {
  id: string;
  organizationId: string;
  adminUserId: string;
  action: string;
  description: string;
  amountCents: number;
  tokenAmount: number;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// GET — Fetch credit history for a user's organizations
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<{ creditHistory: CreditEntry[] }>>> {
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
    const supabase = createServiceClient();

    // Get user's organization memberships
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId);

    const orgIds = (memberships ?? []).map(
      (m: { organization_id: string }) => m.organization_id
    );

    if (orgIds.length === 0) {
      return NextResponse.json({ data: { creditHistory: [] } });
    }

    const { data: creditRows, error: fetchError } = await supabase
      .from("admin_credit_ledger")
      .select(
        "id, organization_id, admin_user_id, action, description, amount_cents, token_amount, metadata, created_at"
      )
      .in("organization_id", orgIds)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch credit history" } },
        { status: 500 }
      );
    }

    const creditHistory: CreditEntry[] = ((creditRows ?? []) as {
      id: string;
      organization_id: string;
      admin_user_id: string;
      action: string;
      description: string;
      amount_cents: number;
      token_amount: number;
      metadata: Record<string, unknown>;
      created_at: string;
    }[]).map((c) => ({
      id: c.id,
      organizationId: c.organization_id,
      adminUserId: c.admin_user_id,
      action: c.action,
      description: c.description,
      amountCents: c.amount_cents,
      tokenAmount: c.token_amount,
      metadata: c.metadata,
      createdAt: c.created_at,
    }));

    return NextResponse.json({ data: { creditHistory } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Issue credits/comps to a user's organization
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<CreditEntry>>> {
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
    const body: unknown = await request.json();
    const parsed = creditActionSchema.safeParse(body);

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

    const { organizationId, action, description, amountCents, tokenAmount } =
      parsed.data;
    const supabase = createServiceClient();

    // Verify the user is a member of the specified organization
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

    // Insert ledger entry
    const { data: ledgerEntry, error: insertError } = await supabase
      .from("admin_credit_ledger")
      .insert({
        organization_id: organizationId,
        admin_user_id: adminUserId,
        action,
        description,
        amount_cents: amountCents ?? 0,
        token_amount: tokenAmount ?? 0,
      })
      .select(
        "id, organization_id, admin_user_id, action, description, amount_cents, token_amount, metadata, created_at"
      )
      .single();

    if (insertError || !ledgerEntry) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create credit entry" } },
        { status: 500 }
      );
    }

    // Apply side effects based on action
    const effectiveTokenAmount = tokenAmount ?? 0;

    if (action === "bonus_tokens" && effectiveTokenAmount > 0) {
      const { error: updateError } = await supabase.rpc("increment_column", {
        table_name: "organizations",
        column_name: "ai_tokens_ceiling",
        row_id: organizationId,
        amount: effectiveTokenAmount,
      });

      // If the RPC doesn't exist, fall back to a manual update
      if (updateError) {
        const { data: org } = await supabase
          .from("organizations")
          .select("ai_tokens_ceiling")
          .eq("id", organizationId)
          .single();

        if (org) {
          await supabase
            .from("organizations")
            .update({
              ai_tokens_ceiling:
                (org as { ai_tokens_ceiling: number }).ai_tokens_ceiling +
                effectiveTokenAmount,
            })
            .eq("id", organizationId);
        }
      }
    }

    if (action === "bonus_scout_scans" && effectiveTokenAmount > 0) {
      const { data: org } = await supabase
        .from("organizations")
        .select("scout_scans_ceiling")
        .eq("id", organizationId)
        .single();

      if (org) {
        await supabase
          .from("organizations")
          .update({
            scout_scans_ceiling:
              (org as { scout_scans_ceiling: number }).scout_scans_ceiling +
              effectiveTokenAmount,
          })
          .eq("id", organizationId);
      }
    }

    if (action === "bonus_social_posts" && effectiveTokenAmount > 0) {
      const { data: org } = await supabase
        .from("organizations")
        .select("social_posts_ceiling")
        .eq("id", organizationId)
        .single();

      if (org) {
        await supabase
          .from("organizations")
          .update({
            social_posts_ceiling:
              (org as { social_posts_ceiling: number }).social_posts_ceiling +
              effectiveTokenAmount,
          })
          .eq("id", organizationId);
      }
    }

    // For comp_month and credit_added, we log it but actual Stripe handling
    // (e.g., issuing invoice credits or extending subscriptions) would need
    // separate Stripe API calls depending on business requirements.

    const typed = ledgerEntry as {
      id: string;
      organization_id: string;
      admin_user_id: string;
      action: string;
      description: string;
      amount_cents: number;
      token_amount: number;
      metadata: Record<string, unknown>;
      created_at: string;
    };

    logAdminAudit({
      admin_user_id: adminUserId,
      action: "user.credit.issue",
      target_resource: "user",
      target_id: userId,
      metadata: { organization_id: organizationId, credit_action: action, amount_cents: amountCents, token_amount: tokenAmount },
    });

    return NextResponse.json(
      {
        data: {
          id: typed.id,
          organizationId: typed.organization_id,
          adminUserId: typed.admin_user_id,
          action: typed.action,
          description: typed.description,
          amountCents: typed.amount_cents,
          tokenAmount: typed.token_amount,
          metadata: typed.metadata,
          createdAt: typed.created_at,
        },
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
