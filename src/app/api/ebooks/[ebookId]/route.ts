import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/ebooks/[ebookId] — Get ebook details
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId } = await params;
  const supabase = createServiceClient();

  const { data: ebook, error } = await supabase
    .from("ebooks")
    .select("*")
    .eq("id", ebookId)
    .eq("user_id", userId)
    .single();

  if (error || !ebook) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  return NextResponse.json({ data: ebook });
}
