"use client";

import { useState } from "react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  CreditCard,
  ExternalLink,
  Loader2,
  Pause,
  Play,
  XCircle,
} from "lucide-react";

interface OrgSubscription {
  id: string;
  name: string;
  subscriptionStatus: string;
  plan: string;
  stripeCustomerId: string | null;
}

interface AdminSubscriptionActionsProps {
  userId: string;
  organizations: OrgSubscription[];
}

const statusColors: Record<string, string> = {
  active: "bg-green-100 text-green-700",
  trialing: "bg-blue-100 text-blue-700",
  past_due: "bg-yellow-100 text-yellow-700",
  canceled: "bg-red-100 text-red-700",
  paused: "bg-gray-100 text-gray-700",
  unpaid: "bg-red-100 text-red-700",
};

type SubscriptionAction = "pause" | "resume" | "cancel";

export const AdminSubscriptionActions = ({
  userId,
  organizations,
}: AdminSubscriptionActionsProps) => {
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [confirmingCancel, setConfirmingCancel] = useState<string | null>(null);
  const [orgStatuses, setOrgStatuses] = useState<Record<string, string>>(() =>
    Object.fromEntries(organizations.map((o) => [o.id, o.subscriptionStatus]))
  );

  const handleAction = async (
    orgId: string,
    action: SubscriptionAction
  ) => {
    if (action === "cancel" && confirmingCancel !== orgId) {
      setConfirmingCancel(orgId);
      return;
    }

    const key = `${orgId}-${action}`;
    setLoadingAction(key);
    setConfirmingCancel(null);

    try {
      const res = await fetch(`/api/admin/users/${userId}/subscription`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ organizationId: orgId, action }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(
          (err as { error?: string }).error ?? "Subscription action failed"
        );
        return;
      }

      const nextStatus: Record<SubscriptionAction, string> = {
        pause: "paused",
        resume: "active",
        cancel: "canceled",
      };

      setOrgStatuses((prev) => ({
        ...prev,
        [orgId]: nextStatus[action],
      }));
      toast.success(
        `Subscription ${action === "cancel" ? "canceled" : action === "pause" ? "paused" : "resumed"} successfully`
      );
    } catch {
      toast.error("Network error -- please try again");
    } finally {
      setLoadingAction(null);
    }
  };

  const stripeBaseUrl = "https://dashboard.stripe.com/customers";

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <CreditCard className="h-4 w-4 text-[#7C3AED]" />
        <h3 className="text-sm font-semibold text-foreground">
          Subscription Management
        </h3>
      </div>

      <div className="space-y-4">
        {organizations.map((org) => {
          const status = orgStatuses[org.id] ?? org.subscriptionStatus;
          const isLoading = loadingAction?.startsWith(org.id) ?? false;
          const isConfirmingCancel = confirmingCancel === org.id;

          return (
            <div
              key={org.id}
              className="rounded-lg border border-border p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">
                  {org.name}
                </span>
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    statusColors[status] ?? "bg-gray-100 text-gray-700"
                  )}
                >
                  {status.replace("_", " ")}
                </span>
              </div>

              <p className="mb-3 text-xs text-muted-foreground">
                Plan: {org.plan || "Creator"}
              </p>

              <div className="flex flex-wrap gap-2">
                {/* Pause / Resume */}
                {status === "active" || status === "trialing" ? (
                  <button
                    type="button"
                    onClick={() => handleAction(org.id, "pause")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {isLoading && loadingAction === `${org.id}-pause` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Pause className="h-3 w-3" />
                    )}
                    Pause
                  </button>
                ) : status === "paused" ? (
                  <button
                    type="button"
                    onClick={() => handleAction(org.id, "resume")}
                    disabled={isLoading}
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
                  >
                    {isLoading && loadingAction === `${org.id}-resume` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <Play className="h-3 w-3" />
                    )}
                    Resume
                  </button>
                ) : null}

                {/* Cancel */}
                {status !== "canceled" && (
                  <button
                    type="button"
                    onClick={() => handleAction(org.id, "cancel")}
                    disabled={isLoading}
                    className={cn(
                      "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition-colors disabled:opacity-50",
                      isConfirmingCancel
                        ? "border-red-300 bg-red-50 text-red-600 hover:bg-red-100"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    {isLoading && loadingAction === `${org.id}-cancel` ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <XCircle className="h-3 w-3" />
                    )}
                    {isConfirmingCancel ? "Confirm Cancel" : "Cancel"}
                  </button>
                )}

                {/* Stripe link */}
                {org.stripeCustomerId && (
                  <a
                    href={`${stripeBaseUrl}/${org.stripeCustomerId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Stripe
                  </a>
                )}
              </div>

              {isConfirmingCancel && (
                <p className="mt-2 text-xs text-red-500">
                  Click &quot;Confirm Cancel&quot; again to permanently cancel
                  this subscription.
                </p>
              )}
            </div>
          );
        })}

        {organizations.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No organizations found.
          </p>
        )}
      </div>
    </div>
  );
};
