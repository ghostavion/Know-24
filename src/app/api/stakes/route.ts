import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

// ---------------------------------------------------------------------------
// GET /api/stakes — list user's stakes
// ---------------------------------------------------------------------------

interface StakeItem {
  id: string;
  agent_id: string;
  pct_owned: number;
  purchase_price_cents: number;
  current_value_cents: number;
  purchased_at: string;
  transferable: boolean;
  listed_price_cents: number | null;
  agent?: {
    name: string;
    slug: string;
    tier: string;
    status: string;
    total_revenue_cents: number;
  } | null;
}

export async function GET(): Promise<NextResponse<ApiResponse<{ stakes: StakeItem[] }>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  const { data, error } = await supabase
    .from("stakes")
    .select(`
      id,
      agent_id,
      pct_owned,
      purchase_price_cents,
      current_value_cents,
      purchased_at,
      transferable,
      listed_price_cents,
      agents!inner (
        name,
        slug,
        tier,
        status,
        total_revenue_cents
      )
    `)
    .eq("user_id", userId)
    .order("purchased_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  const stakes: StakeItem[] = (data ?? []).map((row: Record<string, unknown>) => ({
    id: row.id as string,
    agent_id: row.agent_id as string,
    pct_owned: row.pct_owned as number,
    purchase_price_cents: row.purchase_price_cents as number,
    current_value_cents: row.current_value_cents as number,
    purchased_at: row.purchased_at as string,
    transferable: row.transferable as boolean,
    listed_price_cents: row.listed_price_cents as number | null,
    agent: row.agents as StakeItem["agent"],
  }));

  return NextResponse.json({ data: { stakes } });
}

// ---------------------------------------------------------------------------
// POST /api/stakes — create a new stake (buy fractional ownership)
// ---------------------------------------------------------------------------

const createStakeSchema = z.object({
  agent_id: z.string().uuid(),
  pct_owned: z.number().min(0.01).max(100),
  purchase_price_cents: z.number().int().min(100).max(10_000_00), // $1 - $10,000
});

interface CreateStakeData {
  id: string;
  agent_id: string;
  pct_owned: number;
  purchase_price_cents: number;
  current_value_cents: number;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<CreateStakeData>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const body: unknown = await request.json();
  const parsed = createStakeSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      { error: { code: "VALIDATION_ERROR", message: parsed.error.issues[0]?.message ?? "Invalid input" } },
      { status: 400 }
    );
  }

  const { agent_id, pct_owned, purchase_price_cents } = parsed.data;
  const supabase = createServiceClient();

  // Verify agent exists and is not deleted
  const { data: agent } = await supabase
    .from("agents")
    .select("id, status")
    .eq("id", agent_id)
    .neq("status", "deleted")
    .single();

  if (!agent) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Agent not found" } },
      { status: 404 }
    );
  }

  // Check total ownership doesn't exceed 100%
  const { data: existingStakes } = await supabase
    .from("stakes")
    .select("pct_owned")
    .eq("agent_id", agent_id);

  const totalOwned = (existingStakes ?? []).reduce(
    (sum, s) => sum + Number((s as { pct_owned: number }).pct_owned),
    0
  );

  if (totalOwned + pct_owned > 100) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_SHARES", message: `Only ${(100 - totalOwned).toFixed(2)}% available` } },
      { status: 400 }
    );
  }

  // Create stake
  const { data: stake, error } = await supabase
    .from("stakes")
    .insert({
      user_id: userId,
      agent_id,
      pct_owned,
      purchase_price_cents,
      current_value_cents: purchase_price_cents,
    })
    .select("id, agent_id, pct_owned, purchase_price_cents, current_value_cents")
    .single();

  if (error) {
    return NextResponse.json(
      { error: { code: "DB_ERROR", message: error.message } },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { data: stake as CreateStakeData },
    { status: 201 }
  );
}
