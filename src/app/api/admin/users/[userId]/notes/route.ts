import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schemas
// ---------------------------------------------------------------------------

const createNoteSchema = z.object({
  content: z.string().min(1, "Note content is required").max(5000),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface AdminNote {
  id: string;
  adminUserId: string;
  content: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// GET — Fetch all admin notes for a user
// ---------------------------------------------------------------------------

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<{ notes: AdminNote[] }>>> {
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

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const { data: noteRows, error: fetchError } = await supabase
      .from("admin_notes")
      .select("id, admin_user_id, content, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch notes" } },
        { status: 500 }
      );
    }

    const notes: AdminNote[] = ((noteRows ?? []) as {
      id: string;
      admin_user_id: string;
      content: string;
      created_at: string;
    }[]).map((n) => ({
      id: n.id,
      adminUserId: n.admin_user_id,
      content: n.content,
      createdAt: n.created_at,
    }));

    return NextResponse.json({ data: { notes } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST — Add an admin note to a user
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
): Promise<NextResponse<ApiResponse<AdminNote>>> {
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
    const parsed = createNoteSchema.safeParse(body);

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

    const supabase = createServiceClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("id", userId)
      .single();

    if (userError || !user) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "User not found" } },
        { status: 404 }
      );
    }

    const { data: note, error: insertError } = await supabase
      .from("admin_notes")
      .insert({
        user_id: userId,
        admin_user_id: adminUserId,
        content: parsed.data.content,
      })
      .select("id, admin_user_id, content, created_at")
      .single();

    if (insertError || !note) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create note" } },
        { status: 500 }
      );
    }

    const typedNote = note as {
      id: string;
      admin_user_id: string;
      content: string;
      created_at: string;
    };

    return NextResponse.json(
      {
        data: {
          id: typedNote.id,
          adminUserId: typedNote.admin_user_id,
          content: typedNote.content,
          createdAt: typedNote.created_at,
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
