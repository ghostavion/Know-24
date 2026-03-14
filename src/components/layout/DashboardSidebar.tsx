"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Radio,
  LayoutDashboard,
  Bot,
  PieChart,
  DollarSign,
  Store,
  Trophy,
  Settings,
  Plus,
  BarChart3,
  Activity,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "My Agents", href: "/agents", icon: Bot },
      { label: "Earnings", href: "/earnings", icon: DollarSign },
      { label: "Portfolio", href: "/portfolio", icon: PieChart },
    ],
  },
  {
    title: "Explore",
    items: [
      { label: "Discover", href: "/discover", icon: Activity },
      { label: "Leaderboard", href: "/leaderboard", icon: Trophy },
      { label: "Marketplace", href: "/marketplace", icon: Store },
    ],
  },
  {
    title: "Account",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "Settings", href: "/settings", icon: Settings },
    ],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2 border-b border-border px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-electric text-white">
          <Radio className="h-4 w-4" />
        </div>
        <span className="text-lg font-semibold text-sidebar-foreground">
          AgentTV
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className={sIdx > 0 ? "mt-6" : ""}>
            {section.title && (
              <p className="mb-2 px-3 text-xs font-semibold uppercase tracking-wider text-sidebar-foreground/50">
                {section.title}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item) => {
                const isActive =
                  pathname === item.href || pathname.startsWith(item.href + "/");
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Create Agent CTA */}
      <div className="border-t border-border p-4">
        <Link
          href="/agents/new"
          className="flex items-center justify-center gap-2 rounded-lg bg-violet-electric px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-violet-electric/90"
        >
          <Plus className="h-4 w-4" />
          Create Agent
        </Link>
      </div>
    </aside>
  );
}
