import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import {
  getCreditBalance,
  getCreditHistory,
  deductCredits,
  CREDIT_COSTS,
  type CreditAction,
} from "@/lib/credits/service";

/**
 * GET /api/credits — Get current balance + transaction history
 * Query params: ?history=true&limit=50
 */
export async function GET(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const url = new URL(request.url);
  const includeHistory = url.searchParams.get("history") === "true";
  const limit = Math.min(
    parseInt(url.searchParams.get("limit") ?? "50", 10) || 50,
    200
  );

  const balance = await getCreditBalance(userId);

  if (!includeHistory) {
    return NextResponse.json({ data: { ...balance, costs: CREDIT_COSTS } });
  }

  const history = await getCreditHistory(userId, limit);
  return NextResponse.json({
    data: { ...balance, costs: CREDIT_COSTS, history },
  });
}

/**
 * POST /api/credits — Deduct credits for an action
 * Body: { action: CreditAction, referenceId?: string }
 */
export async function POST(request: Request) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  let body: { action?: string; referenceId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON body" } },
      { status: 400 }
    );
  }

  const { action, referenceId } = body;

  if (!action || !(action in CREDIT_COSTS)) {
    return NextResponse.json(
      {
        error: {
          code: "INVALID_ACTION",
          message: `Invalid action. Must be one of: ${Object.keys(CREDIT_COSTS).join(", ")}`,
        },
      },
      { status: 400 }
    );
  }

  const result = await deductCredits(
    userId,
    action as CreditAction,
    referenceId
  );

  if (!result.success) {
    return NextResponse.json(
      { error: { code: "INSUFFICIENT_CREDITS", message: result.error } },
      { status: 402 }
    );
  }

  return NextResponse.json({
    data: {
      success: true,
      newBalance: result.newBalance,
      charged: CREDIT_COSTS[action as CreditAction],
    },
  });
}
