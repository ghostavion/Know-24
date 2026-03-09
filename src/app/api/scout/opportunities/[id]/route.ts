import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const updateOpportunitySchema = z.object({
  status: z.enum(["approved", "dismissed", "acted"]),
  editedDraft: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Interfaces
// ---------------------------------------------------------------------------

interface UpdateResult {
  id: string;
  status: string;
  savedToPostTray: boolean;
}

// ---------------------------------------------------------------------------
// PATCH — Update opportunity status (approve, dismiss, etc.)
// ---------------------------------------------------------------------------

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse<ApiResponse<UpdateResult>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 },
      );
    }

    const { id: opportunityId } = await params;

    const idSchema = z.string().uuid();
    const parsedId = idSchema.safeParse(opportunityId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Opportunity ID must be a valid UUID",
          },
        },
        { status: 400 },
      );
    }

    const body: unknown = await request.json();
    const parsed = updateOpportunitySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request body",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 },
      );
    }

    const { status, editedDraft } = parsed.data;
    const supabase = createServiceClient();

    // Fetch the opportunity
    const { data: opportunity, error: oppError } = await supabase
      .from("scout_opportunities")
      .select("id, business_id, platform, draft_response")
      .eq("id", parsedId.data)
      .single();

    if (oppError || !opportunity) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Opportunity not found" } },
        { status: 404 },
      );
    }

    // Verify ownership via business
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", opportunity.business_id)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this opportunity" } },
        { status: 403 },
      );
    }

    // Build update payload
    const updatePayload: Record<string, unknown> = { status };
    if (editedDraft !== undefined) {
      updatePayload.draft_response = editedDraft;
    }

    const { error: updateError } = await supabase
      .from("scout_opportunities")
      .update(updatePayload)
      .eq("id", parsedId.data);

    if (updateError) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update opportunity" } },
        { status: 500 },
      );
    }

    // If approved → save to Post Tray (social_posts table)
    const savedToPostTray = status === "approved";

    if (savedToPostTray) {
      const draftContent = editedDraft ?? opportunity.draft_response ?? "";

      // Map scout platform to social_posts platform
      // social_posts allows: twitter, linkedin, facebook, instagram
      const platformMap: Record<string, string> = {
        twitter: "twitter",
        reddit: "twitter",
        quora: "linkedin",
        linkedin: "linkedin",
        podcasts: "linkedin",
        news: "twitter",
      };
      const postPlatform = platformMap[opportunity.platform] ?? "twitter";

      const { error: postError } = await supabase
        .from("social_posts")
        .insert({
          business_id: opportunity.business_id,
          content: draftContent,
          platform: postPlatform,
          length: "medium",
          status: "draft",
        });

      if (postError) {
        // Non-fatal: opportunity was updated, but post tray save failed
        return NextResponse.json({
          data: { id: parsedId.data, status, savedToPostTray: false },
          error: {
            code: "POST_TRAY_FAILED",
            message: "Opportunity updated but failed to save to Post Tray",
          },
        });
      }
    }

    return NextResponse.json({
      data: { id: parsedId.data, status, savedToPostTray },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
