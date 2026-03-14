"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Bot,
  CreditCard,
  Activity,
  BarChart3,
  BrainCircuit,
  ScrollText,
  Server,
  ArrowLeft,
  Shield,
  LifeBuoy,
} from "lucide-react";

const navItems = [
  { label: "Overview", href: "/admin", icon: LayoutDashboard },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "Agents", href: "/admin/agents", icon: Bot },
  { label: "Subscriptions", href: "/admin/subscriptions", icon: CreditCard },
  { label: "Activity", href: "/admin/activity", icon: Activity },
  { label: "Analytics", href: "/admin/analytics", icon: BarChart3 },
  { label: "LLM Usage", href: "/admin/llm", icon: BrainCircuit },
  { label: "Platform Logs", href: "/admin/logs", icon: ScrollText },
  { label: "Services", href: "/admin/services", icon: Server },
  { label: "Support", href: "/admin/support", icon: LifeBuoy },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-card">
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <Shield className="h-5 w-5 text-[#7C3AED]" />
        <span className="text-lg font-semibold">Mission Control</span>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin"
              ? pathname === "/admin"
              : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-border p-4">
        <Link
          href="/dashboard"
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to App
        </Link>
      </div>
    </aside>
  );
}
