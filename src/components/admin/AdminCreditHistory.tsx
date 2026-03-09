import { cn } from "@/lib/utils";

interface CreditEntry {
  id: string;
  action: string;
  description: string;
  amountCents: number;
  tokenAmount: number;
  createdAt: string;
}

interface AdminCreditHistoryProps {
  entries: CreditEntry[];
}

const actionColors: Record<string, string> = {
  credit_added: "bg-green-100 text-green-700",
  comp_month: "bg-purple-100 text-purple-700",
  bonus_tokens: "bg-blue-100 text-blue-700",
  bonus_scout_scans: "bg-orange-100 text-orange-700",
  bonus_social_posts: "bg-cyan-100 text-cyan-700",
  custom: "bg-gray-100 text-gray-700",
};

const actionLabels: Record<string, string> = {
  credit_added: "Account Credit",
  comp_month: "Comp Month",
  bonus_tokens: "Bonus Tokens",
  bonus_scout_scans: "Bonus Scans",
  bonus_social_posts: "Bonus Posts",
  custom: "Custom",
};

const formatAmount = (entry: CreditEntry): string => {
  if (entry.tokenAmount > 0) {
    return `${entry.tokenAmount.toLocaleString()} tokens`;
  }
  if (entry.amountCents > 0) {
    return `$${(entry.amountCents / 100).toFixed(2)}`;
  }
  return "--";
};

export const AdminCreditHistory = ({ entries }: AdminCreditHistoryProps) => {
  if (entries.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <h3 className="mb-3 text-sm font-semibold text-foreground">
          Credit History
        </h3>
        <p className="text-sm text-muted-foreground">
          No credits issued yet.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="mb-3 text-sm font-semibold text-foreground">
        Credit History
      </h3>
      <div className="space-y-3">
        {entries.map((entry) => (
          <div
            key={entry.id}
            className="flex items-start justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "inline-flex rounded-full px-2 py-0.5 text-xs font-medium",
                    actionColors[entry.action] ?? "bg-gray-100 text-gray-700"
                  )}
                >
                  {actionLabels[entry.action] ?? entry.action}
                </span>
                <span className="text-xs text-muted-foreground">
                  {formatAmount(entry)}
                </span>
              </div>
              <p className="mt-1 truncate text-xs text-muted-foreground">
                {entry.description}
              </p>
            </div>
            <span className="shrink-0 text-xs text-muted-foreground">
              {new Date(entry.createdAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
