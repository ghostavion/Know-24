import { NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";

const patchSchema = z.object({
  status: z.string().min(1).max(50),
  dev_response: z.string().max(5000).optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "UNAUTHORIZED";
    const status = message === "FORBIDDEN" ? 403 : 401;
    return NextResponse.json({ error: message }, { status });
  }

  const { id } = await params;

  // Parse body
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid payload", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  const updates: Record<string, unknown> = {
    status: parsed.data.status,
    updated_at: new Date().toISOString(),
  };

  if (parsed.data.dev_response !== undefined) {
    updates.dev_response = parsed.data.dev_response;
  }

  if (parsed.data.status === "resolved") {
    updates.resolved_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from("feedback")
    .update(updates)
    .eq("id", id)
    .select("id, status, updated_at")
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Failed to update feedback" },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      { error: "Feedback not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ data });
}
