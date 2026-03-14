import { cn } from "@/lib/utils";

interface UsageBarProps {
  label: string;
  used: number;
  ceiling: number;
}

export const UsageBar = ({ label, used, ceiling }: UsageBarProps) => {
  const pct = ceiling > 0 ? Math.min((used / ceiling) * 100, 100) : 0;
  return (
    <div>
      <div className="mb-1 flex justify-between text-xs text-muted-foreground">
        <span>{label}</span>
        <span>
          {used.toLocaleString()} / {ceiling.toLocaleString()}
        </span>
      </div>
      <div className="h-2 rounded-full bg-muted">
        <div
          className={cn(
            "h-2 rounded-full transition-all",
            pct > 90
              ? "bg-red-500"
              : pct > 70
                ? "bg-yellow-500"
                : "bg-[#7C3AED]"
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
};
