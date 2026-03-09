import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface UserStatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  subtitle?: string;
}

export const UserStatCard = ({
  label,
  value,
  icon: Icon,
  subtitle,
}: UserStatCardProps) => (
  <div className="rounded-xl border border-border bg-card p-5">
    <div className="flex items-center justify-between">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <Icon className="h-4 w-4 text-muted-foreground" />
    </div>
    <p className="mt-2 text-2xl font-bold text-foreground">{value}</p>
    {subtitle && (
      <p className="mt-1 text-xs text-muted-foreground">{subtitle}</p>
    )}
  </div>
);
