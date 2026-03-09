import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

const businessIdSchema = z.string().uuid();
const sequenceIdSchema = z.string().uuid();

const createSequenceSchema = z.object({
  businessId: z.string().uuid(),
  type: z.enum(["welcome", "nurture", "product_launch", "re_engagement", "custom"]),
  name: z.string(),
  subjectTemplate: z.string(),
  bodyTemplate: z.string(),
  delayHours: z.number().int().min(0).default(0),
  sortOrder: z.number().int().default(0),
});

const updateSequenceSchema = z.object({
  sequenceId: z.string().uuid(),
  name: z.string().optional(),
  subjectTemplate: z.string().optional(),
  bodyTemplate: z.string().optional(),
  delayHours: z.number().int().optional(),
  isActive: z.boolean().optional(),
});

interface EmailSequence {
  id: string;
  business_id: string;
  type: string;
  name: string;
  subject_template: string;
  body_template: string;
  delay_hours: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmailSequence[]>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const businessId = request.nextUrl.searchParams.get("businessId");
    const parsedId = businessIdSchema.safeParse(businessId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid businessId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", parsedId.data)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const { data: sequences, error: fetchError } = await supabase
      .from("email_sequences")
      .select("*")
      .eq("business_id", parsedId.data)
      .order("type", { ascending: true })
      .order("sort_order", { ascending: true });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch email sequences" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: (sequences ?? []) as EmailSequence[] });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmailSequence>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createSequenceSchema.safeParse(body);
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

    const { businessId, type, name, subjectTemplate, bodyTemplate, delayHours, sortOrder } =
      parsed.data;
    const supabase = createServiceClient();

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    const { data: sequence, error: insertError } = await supabase
      .from("email_sequences")
      .insert({
        business_id: businessId,
        type,
        name,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        delay_hours: delayHours,
        sort_order: sortOrder,
      })
      .select()
      .single();

    if (insertError || !sequence) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create email sequence" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: sequence as EmailSequence });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<EmailSequence>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateSequenceSchema.safeParse(body);
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

    const { sequenceId, name, subjectTemplate, bodyTemplate, delayHours, isActive } =
      parsed.data;
    const supabase = createServiceClient();

    // Fetch existing sequence and verify ownership
    const { data: existing, error: seqError } = await supabase
      .from("email_sequences")
      .select("id, business_id")
      .eq("id", sequenceId)
      .single();

    if (seqError || !existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Email sequence not found" } },
        { status: 404 }
      );
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", existing.business_id)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this email sequence" } },
        { status: 403 }
      );
    }

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) updateData.name = name;
    if (subjectTemplate !== undefined) updateData.subject_template = subjectTemplate;
    if (bodyTemplate !== undefined) updateData.body_template = bodyTemplate;
    if (delayHours !== undefined) updateData.delay_hours = delayHours;
    if (isActive !== undefined) updateData.is_active = isActive;

    updateData.updated_at = new Date().toISOString();

    const { data: updated, error: updateError } = await supabase
      .from("email_sequences")
      .update(updateData)
      .eq("id", sequenceId)
      .select()
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update email sequence" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: updated as EmailSequence });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ deleted: boolean }>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const sequenceId = request.nextUrl.searchParams.get("sequenceId");
    const parsedId = sequenceIdSchema.safeParse(sequenceId);
    if (!parsedId.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Valid sequenceId query parameter is required",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch sequence and verify ownership
    const { data: existing, error: seqError } = await supabase
      .from("email_sequences")
      .select("id, business_id")
      .eq("id", parsedId.data)
      .single();

    if (seqError || !existing) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Email sequence not found" } },
        { status: 404 }
      );
    }

    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", existing.business_id)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "You do not own this email sequence" } },
        { status: 403 }
      );
    }

    const { error: deleteError } = await supabase
      .from("email_sequences")
      .delete()
      .eq("id", parsedId.data);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: "DELETE_FAILED", message: "Failed to delete email sequence" } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { deleted: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
