import { createServiceClient } from "@/lib/supabase/server";

// Credit costs for each action type
export const CREDIT_COSTS = {
  research_report: 10,
  ebook_generation: 50,
  cover_generation: 10,
  scout_scan: 15,
  chapter_rewrite: 5,
  voice_transcription: 5,
} as const;

export type CreditAction = keyof typeof CREDIT_COSTS;

const MONTHLY_ALLOCATION = 200;

interface CreditBalance {
  balance: number;
  monthlyAllocation: number;
  resetDate: string;
}

interface DeductResult {
  success: boolean;
  newBalance: number;
  error?: string;
}

/**
 * Get or initialize a user's credit balance.
 */
export async function getCreditBalance(userId: string): Promise<CreditBalance> {
  const supabase = createServiceClient();

  const { data: credits } = await supabase
    .from("credits")
    .select("balance, monthly_allocation, reset_date")
    .eq("user_id", userId)
    .single();

  if (credits) {
    // Check if we need to reset (past reset date)
    const resetDate = new Date(credits.reset_date);
    if (new Date() >= resetDate) {
      const newResetDate = new Date();
      newResetDate.setDate(newResetDate.getDate() + 30);

      const { data: updated } = await supabase
        .from("credits")
        .update({
          balance: credits.monthly_allocation,
          reset_date: newResetDate.toISOString(),
        })
        .eq("user_id", userId)
        .select("balance, monthly_allocation, reset_date")
        .single();

      if (updated) {
        // Log the reset transaction
        await supabase.from("credit_transactions").insert({
          user_id: userId,
          amount: credits.monthly_allocation,
          balance_after: credits.monthly_allocation,
          type: "monthly_reset",
          metadata: { previous_balance: credits.balance },
        });

        return {
          balance: updated.balance,
          monthlyAllocation: updated.monthly_allocation,
          resetDate: updated.reset_date,
        };
      }
    }

    return {
      balance: credits.balance,
      monthlyAllocation: credits.monthly_allocation,
      resetDate: credits.reset_date,
    };
  }

  // Initialize credits for new user
  const resetDate = new Date();
  resetDate.setDate(resetDate.getDate() + 30);

  const { data: newCredits } = await supabase
    .from("credits")
    .insert({
      user_id: userId,
      balance: MONTHLY_ALLOCATION,
      monthly_allocation: MONTHLY_ALLOCATION,
      reset_date: resetDate.toISOString(),
    })
    .select("balance, monthly_allocation, reset_date")
    .single();

  if (newCredits) {
    await supabase.from("credit_transactions").insert({
      user_id: userId,
      amount: MONTHLY_ALLOCATION,
      balance_after: MONTHLY_ALLOCATION,
      type: "monthly_reset",
      metadata: { initial: true },
    });
  }

  return {
    balance: MONTHLY_ALLOCATION,
    monthlyAllocation: MONTHLY_ALLOCATION,
    resetDate: resetDate.toISOString(),
  };
}

/**
 * Check if a user has enough credits for an action.
 */
export async function hasEnoughCredits(
  userId: string,
  action: CreditAction
): Promise<boolean> {
  const { balance } = await getCreditBalance(userId);
  return balance >= CREDIT_COSTS[action];
}

/**
 * Deduct credits for an action. Returns the new balance.
 * Fails if insufficient credits.
 */
export async function deductCredits(
  userId: string,
  action: CreditAction,
  referenceId?: string
): Promise<DeductResult> {
  const cost = CREDIT_COSTS[action];
  const supabase = createServiceClient();

  // Get current balance (also handles initialization + reset)
  const { balance } = await getCreditBalance(userId);

  if (balance < cost) {
    return {
      success: false,
      newBalance: balance,
      error: `Insufficient credits. Need ${cost}, have ${balance}.`,
    };
  }

  const newBalance = balance - cost;

  // Update balance
  const { error: updateError } = await supabase
    .from("credits")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  if (updateError) {
    return {
      success: false,
      newBalance: balance,
      error: `Failed to update credits: ${updateError.message}`,
    };
  }

  // Log transaction
  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount: -cost,
    balance_after: newBalance,
    type: "generation",
    action,
    reference_id: referenceId ?? null,
    metadata: { cost },
  });

  return { success: true, newBalance };
}

/**
 * Add credits to a user's balance (for purchases, referrals, bonuses).
 */
export async function addCredits(
  userId: string,
  amount: number,
  type: "purchase" | "referral_reward" | "bonus" | "refund",
  metadata?: Record<string, unknown>
): Promise<number> {
  const supabase = createServiceClient();
  const { balance } = await getCreditBalance(userId);

  const newBalance = balance + amount;

  await supabase
    .from("credits")
    .update({ balance: newBalance })
    .eq("user_id", userId);

  await supabase.from("credit_transactions").insert({
    user_id: userId,
    amount,
    balance_after: newBalance,
    type,
    metadata: metadata ?? {},
  });

  return newBalance;
}

/**
 * Get credit transaction history for a user.
 */
export async function getCreditHistory(
  userId: string,
  limit = 50
): Promise<Array<{
  id: string;
  amount: number;
  balanceAfter: number;
  type: string;
  action: string | null;
  createdAt: string;
}>> {
  const supabase = createServiceClient();

  const { data } = await supabase
    .from("credit_transactions")
    .select("id, amount, balance_after, type, action, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);

  return (data ?? []).map((t) => ({
    id: t.id as string,
    amount: t.amount as number,
    balanceAfter: t.balance_after as number,
    type: t.type as string,
    action: t.action as string | null,
    createdAt: t.created_at as string,
  }));
}
