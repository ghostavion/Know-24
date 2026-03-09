import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { Sparkles } from "lucide-react";
import { AdvisorInbox } from "@/components/advisor/AdvisorInbox";

interface AdvisorItemRow {
  id: string;
  business_id: string;
  category: string;
  priority: string;
  title: string;
  summary: string;
  action_type: string;
  action_payload: Record<string, unknown>;
  status: string;
  created_at: string;
}

export default async function AdvisorPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-primary" />
          <h1 className="text-2xl font-semibold text-foreground">AI Advisor</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Please sign in to view your AI Advisor recommendations.
        </p>
      </div>
    );
  }

  const supabase = createServiceClient();

  // Look up businesses the user belongs to
  const { data: userRecord } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  let items: AdvisorItemRow[] = [];

  if (userRecord) {
    // Get user's business IDs through organization membership
    const { data: memberships } = await supabase
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userRecord.id);

    if (memberships && memberships.length > 0) {
      const orgIds = memberships.map((m) => m.organization_id);

      const { data: businesses } = await supabase
        .from("businesses")
        .select("id")
        .in("organization_id", orgIds)
        .is("deleted_at", null);

      if (businesses && businesses.length > 0) {
        const businessIds = businesses.map((b) => b.id);

        const { data: advisorItems } = await supabase
          .from("advisor_items")
          .select(
            "id, business_id, category, priority, title, summary, action_type, action_payload, status, created_at"
          )
          .in("business_id", businessIds)
          .is("deleted_at", null)
          .in("status", ["pending", "snoozed"])
          .order("created_at", { ascending: false })
          .limit(50);

        items = (advisorItems as AdvisorItemRow[] | null) ?? [];
      }
    }
  }

  const mappedItems = items.map((item) => ({
    id: item.id,
    businessId: item.business_id,
    category: item.category,
    priority: item.priority,
    title: item.title,
    summary: item.summary,
    actionType: item.action_type,
    actionPayload: item.action_payload,
    status: item.status,
    createdAt: item.created_at,
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Sparkles className="h-5 w-5 text-primary" />
        <h1 className="text-2xl font-semibold text-foreground">AI Advisor</h1>
      </div>

      <AdvisorInbox items={mappedItems} />
    </div>
  );
}
