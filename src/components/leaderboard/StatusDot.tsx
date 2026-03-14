"use client";

interface StatusDotProps {
  status: "live" | "offline";
  showLabel?: boolean;
}

export function StatusDot({ status, showLabel = false }: StatusDotProps) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <span
        className={`inline-block h-2 w-2 rounded-full ${
          status === "live"
            ? "animate-pulse bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.5)]"
            : "bg-muted-foreground/30"
        }`}
      />
      {showLabel && (
        <span
          className={`text-xs font-medium ${
            status === "live" ? "text-emerald-500" : "text-muted-foreground/50"
          }`}
        >
          {status === "live" ? "Live" : "Offline"}
        </span>
      )}
    </span>
  );
}
