import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

interface SubscriptionStatus {
  active: boolean;
  tier: "free" | "paid";
  status: string;
}

export async function GET(): Promise<NextResponse<ApiResponse<SubscriptionStatus>>> {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not signed in" } },
      { status: 401 }
    );
  }

  const supabase = createServiceClient();

  const { data: sub } = await supabase
    .from("agent_subscriptions")
    .select("tier, status")
    .eq("user_id", userId)
    .single();

  if (sub) {
    const typedSub = sub as { tier: string; status: string };
    const isPaid = typedSub.tier === "paid" && typedSub.status === "active";
    return NextResponse.json({
      data: {
        active: typedSub.status === "active",
        tier: isPaid ? "paid" : "free",
        status: typedSub.status,
      },
    });
  }

  return NextResponse.json({
    data: {
      active: true,
      tier: "free",
      status: "active",
    },
  });
}
