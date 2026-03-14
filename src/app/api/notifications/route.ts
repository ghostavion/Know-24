import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { withApiLogging } from "@/lib/logging/api-logger";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// GET /api/notifications — list user's notifications
// ---------------------------------------------------------------------------

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  data: Record<string, unknown> | null;
  read: boolean;
  created_at: string;
}

interface NotificationsData {
  notifications: Notification[];
  unread_count: number;
}

async function _GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<NotificationsData>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();
  const url = new URL(request.url);
  const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50", 10), 100);
  const unreadOnly = url.searchParams.get("unread") === "true";

  let query = supabase
    .from("notifications")
    .select("id, type, title, body, data, read, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (unreadOnly) {
    query = query.eq("read", false);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const notifications = (data ?? []) as Notification[];
  const unread_count = notifications.filter((n) => !n.read).length;

  return NextResponse.json({
    data: { notifications, unread_count },
  });
}

// ---------------------------------------------------------------------------
// PATCH /api/notifications — mark notifications as read
// ---------------------------------------------------------------------------

import { z } from "zod";

const markReadSchema = z.object({
  notification_ids: z.array(z.string().uuid()).min(1).max(100).optional(),
  mark_all_read: z.boolean().optional(),
});

async function _PATCH(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ updated: number }>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = markReadSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: "Provide notification_ids or mark_all_read" } },
      { status: 400 }
    );
  }

  const { notification_ids, mark_all_read } = parsed.data;
  const supabase = createServiceClient();

  if (mark_all_read) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .eq("read", false)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { updated: data?.length ?? 0 } });
  }

  if (notification_ids && notification_ids.length > 0) {
    const { data, error } = await supabase
      .from("notifications")
      .update({ read: true })
      .eq("user_id", userId)
      .in("id", notification_ids)
      .select("id");

    if (error) {
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: { updated: data?.length ?? 0 } });
  }

  return NextResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Provide notification_ids or mark_all_read" } },
    { status: 400 }
  );
}

export const GET = withApiLogging(_GET, "api.notifications.list");
export const PATCH = withApiLogging(_PATCH, "api.notifications.markRead");
