"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Coins, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Organization {
  id: string;
  name: string;
}

interface AdminCreditActionsProps {
  userId: string;
  organizations: Organization[];
}

const actionTypes = [
  { value: "bonus_tokens", label: "Bonus AI Tokens", unit: "tokens" },
  { value: "bonus_scout_scans", label: "Bonus Scout Scans", unit: "scans" },
  { value: "bonus_social_posts", label: "Bonus Social Posts", unit: "posts" },
  { value: "comp_month", label: "Comp Month", unit: "months" },
  { value: "credit_added", label: "Account Credit", unit: "cents" },
  { value: "custom", label: "Custom", unit: "units" },
] as const;

type ActionType = (typeof actionTypes)[number]["value"];

export const AdminCreditActions = ({
  userId,
  organizations,
}: AdminCreditActionsProps) => {
  const [orgId, setOrgId] = useState(organizations[0]?.id ?? "");
  const [action, setAction] = useState<ActionType>("bonus_tokens");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selectedAction = actionTypes.find((a) => a.value === action);

  const handleSubmit = async () => {
    if (!orgId || !amount || !description.trim() || isSubmitting) return;

    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/users/${userId}/credits`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: orgId,
          action,
          amount: parseInt(amount, 10),
          description: description.trim(),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Request failed" }));
        toast.error(
          (err as { error?: string }).error ?? "Failed to issue credit"
        );
        return;
      }

      toast.success("Credit issued successfully");
      setAmount("");
      setDescription("");
    } catch {
      toast.error("Network error -- please try again");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-4 flex items-center gap-2">
        <Coins className="h-4 w-4 text-[#7C3AED]" />
        <h3 className="text-sm font-semibold text-foreground">
          Issue Credits
        </h3>
      </div>

      <div className="space-y-4">
        {/* Organization select */}
        <div>
          <label
            htmlFor="credit-org"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Organization
          </label>
          <select
            id="credit-org"
            value={orgId}
            onChange={(e) => setOrgId(e.target.value)}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          >
            {organizations.map((org) => (
              <option key={org.id} value={org.id}>
                {org.name}
              </option>
            ))}
          </select>
        </div>

        {/* Action type */}
        <div>
          <label className="mb-1 block text-xs font-medium text-muted-foreground">
            Action Type
          </label>
          <div className="grid grid-cols-2 gap-1.5">
            {actionTypes.map((at) => (
              <button
                key={at.value}
                type="button"
                onClick={() => setAction(at.value)}
                className={cn(
                  "rounded-lg border px-2 py-1.5 text-xs font-medium transition-colors",
                  action === at.value
                    ? "border-[#7C3AED] bg-[#7C3AED]/10 text-[#7C3AED]"
                    : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                )}
              >
                {at.label}
              </button>
            ))}
          </div>
        </div>

        {/* Amount */}
        <div>
          <label
            htmlFor="credit-amount"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Amount ({selectedAction?.unit ?? "units"})
          </label>
          <input
            id="credit-amount"
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder={`Enter ${selectedAction?.unit ?? "amount"}...`}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="credit-desc"
            className="mb-1 block text-xs font-medium text-muted-foreground"
          >
            Reason / Description
          </label>
          <textarea
            id="credit-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Why are you issuing this credit?"
            rows={2}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-[#7C3AED] focus:outline-none focus:ring-1 focus:ring-[#7C3AED]"
          />
        </div>

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!orgId || !amount || !description.trim() || isSubmitting}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[#7C3AED] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7C3AED]/90 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Issue Credit
        </button>
      </div>
    </div>
  );
};
