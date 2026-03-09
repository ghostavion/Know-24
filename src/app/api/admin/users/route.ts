import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Zod schema
// ---------------------------------------------------------------------------

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().optional(),
});

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface AdminUser {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  imageUrl: string | null;
  createdAt: string;
  businessCount: number;
}

interface UsersData {
  users: AdminUser[];
  pagination: { page: number; limit: number; total: number };
}

// ---------------------------------------------------------------------------
// GET — Admin: list all users with pagination + search
// ---------------------------------------------------------------------------

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<UsersData>>> {
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
    const url = new URL(request.url);
    const parsed = querySchema.safeParse({
      page: url.searchParams.get("page") ?? undefined,
      limit: url.searchParams.get("limit") ?? undefined,
      search: url.searchParams.get("search") ?? undefined,
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { page, limit, search } = parsed.data;
    const offset = (page - 1) * limit;
    const supabase = createServiceClient();

    // Build users query
    let usersQuery = supabase
      .from("users")
      .select("id, clerk_user_id, email, first_name, last_name, image_url, created_at", {
        count: "exact",
      })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply search filter on email, first_name, last_name
    if (search) {
      usersQuery = usersQuery.or(
        `email.ilike.%${search}%,first_name.ilike.%${search}%,last_name.ilike.%${search}%`
      );
    }

    const { data: userRows, count, error: usersError } = await usersQuery;

    if (usersError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch users" } },
        { status: 500 }
      );
    }

    const rows = userRows ?? [];
    const userIds = rows.map((u: { id: string }) => u.id);

    // Fetch business counts per user via organization_members → businesses
    let businessCounts: Record<string, number> = {};

    if (userIds.length > 0) {
      const { data: memberships } = await supabase
        .from("organization_members")
        .select("user_id, organization_id")
        .in("user_id", userIds);

      if (memberships && memberships.length > 0) {
        const orgIds = [
          ...new Set(
            memberships.map(
              (m: { organization_id: string }) => m.organization_id
            )
          ),
        ];

        const { data: businesses } = await supabase
          .from("businesses")
          .select("id, organization_id")
          .in("organization_id", orgIds);

        if (businesses) {
          // Map org_id → business count
          const orgBusinessCount: Record<string, number> = {};
          for (const b of businesses as { id: string; organization_id: string }[]) {
            orgBusinessCount[b.organization_id] =
              (orgBusinessCount[b.organization_id] ?? 0) + 1;
          }

          // Map user_id → total businesses across their orgs
          for (const m of memberships as {
            user_id: string;
            organization_id: string;
          }[]) {
            businessCounts[m.user_id] =
              (businessCounts[m.user_id] ?? 0) +
              (orgBusinessCount[m.organization_id] ?? 0);
          }
        }
      }
    }

    const users: AdminUser[] = rows.map(
      (u: {
        id: string;
        clerk_user_id: string;
        email: string;
        first_name: string | null;
        last_name: string | null;
        image_url: string | null;
        created_at: string;
      }) => ({
        id: u.clerk_user_id,
        email: u.email,
        firstName: u.first_name,
        lastName: u.last_name,
        imageUrl: u.image_url,
        createdAt: u.created_at,
        businessCount: businessCounts[u.id] ?? 0,
      })
    );

    return NextResponse.json({
      data: {
        users,
        pagination: { page, limit, total: count ?? 0 },
      },
    });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
