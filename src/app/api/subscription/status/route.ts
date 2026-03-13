import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";

interface SubscriptionStatus {
  active: boolean;
  tier: "founder" | "standard" | null;
  status: string;
  founderMember: boolean;
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

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("subscription_tier, subscription_status, founding_member")
    .eq("user_id", userId)
    .single();

  if (!profile) {
    return NextResponse.json({
      data: {
        active: false,
        tier: null,
        status: "inactive",
        founderMember: false,
      },
    });
  }

  const typedProfile = profile as {
    subscription_tier: string;
    subscription_status: string;
    founding_member: boolean;
  };

  return NextResponse.json({
    data: {
      active: typedProfile.subscription_status === "active",
      tier: typedProfile.subscription_tier as "founder" | "standard",
      status: typedProfile.subscription_status,
      founderMember: typedProfile.founding_member,
    },
  });
}
