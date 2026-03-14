import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { MarketplaceItem } from "@/types/agenttv";

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const createItemSchema = z.object({
  item_type: z.enum(["template", "strategy_pack", "clone"]),
  title: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  price_cents: z.number().int().min(0),
  agent_id: z.string().uuid().optional(),
  config_snapshot: z.record(z.string(), z.unknown()),
});

// ---------------------------------------------------------------------------
// GET /api/marketplace — browse listings (public)
// ---------------------------------------------------------------------------

interface MarketplaceListData {
  items: MarketplaceItem[];
  total: number;
}

export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MarketplaceListData>>> {
  try {
    const { searchParams } = request.nextUrl;
    const type = searchParams.get("type");
    const sort = searchParams.get("sort") ?? "popular";
    const limit = Math.min(Number(searchParams.get("limit") ?? 20), 100);
    const offset = Math.max(Number(searchParams.get("offset") ?? 0), 0);

    const supabase = createServiceClient();

    let query = supabase
      .from("marketplace_items")
      .select("*", { count: "exact" })
      .eq("status", "active");

    if (type) {
      query = query.eq("item_type", type);
    }

    switch (sort) {
      case "popular":
        query = query.order("purchase_count", { ascending: false });
        break;
      case "newest":
        query = query.order("created_at", { ascending: false });
        break;
      case "price":
        query = query.order("price_cents", { ascending: true });
        break;
      default:
        query = query.order("purchase_count", { ascending: false });
        break;
    }

    query = query.range(offset, offset + limit - 1);

    const { data, count, error } = await query;

    if (error) {
      console.error("[marketplace/list] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({
      data: { items: (data ?? []) as MarketplaceItem[], total: count ?? 0 },
      meta: { page: Math.floor(offset / limit) + 1, perPage: limit, total: count ?? 0 },
    });
  } catch (err) {
    console.error("[marketplace/list] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}

// ---------------------------------------------------------------------------
// POST /api/marketplace — create listing (authenticated)
// ---------------------------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<MarketplaceItem>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid listing data",
            details: parsed.error.flatten().fieldErrors,
          },
        },
        { status: 400 }
      );
    }

    const { item_type, title, description, price_cents, agent_id, config_snapshot } =
      parsed.data;

    const supabase = createServiceClient();

    // If clone type, verify the user owns the agent
    if (item_type === "clone" && agent_id) {
      const { data: agent } = await supabase
        .from("agents")
        .select("id, owner_id")
        .eq("id", agent_id)
        .neq("status", "deleted")
        .single();

      if (!agent) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Agent not found" } },
          { status: 404 }
        );
      }

      if ((agent as { owner_id: string }).owner_id !== userId) {
        return NextResponse.json(
          { error: { code: "FORBIDDEN", message: "You do not own this agent" } },
          { status: 403 }
        );
      }
    }

    const { data: item, error } = await supabase
      .from("marketplace_items")
      .insert({
        seller_id: userId,
        agent_id: agent_id ?? null,
        item_type,
        title,
        description: description ?? null,
        price_cents,
        config_snapshot,
        status: "active",
        purchase_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error("[marketplace/create] Supabase error:", error);
      return NextResponse.json(
        { error: { code: "DB_ERROR", message: error.message } },
        { status: 500 }
      );
    }

    return NextResponse.json({ data: item as MarketplaceItem }, { status: 201 });
  } catch (err) {
    console.error("[marketplace/create] Error:", err);
    const message = err instanceof Error ? err.message : "Internal error";
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message } },
      { status: 500 }
    );
  }
}
