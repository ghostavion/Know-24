"use client";

import { useState } from "react";
import { CategoryBadge } from "./CategoryBadge";
import { LogEntrySlideOver } from "./LogEntrySlideOver";
import type { PlatformLog } from "@/types/admin-logs";
import { cn } from "@/lib/utils";

interface LogsTableProps {
  logs: PlatformLog[];
}

const STATUS_DOT: Record<string, string> = {
  success: "bg-green-500",
  failure: "bg-red-500",
  error: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

export const LogsTable = ({ logs }: LogsTableProps) => {
  const [selectedLog, setSelectedLog] = useState<PlatformLog | null>(null);

  return (
    <>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="border-b border-border bg-muted/50">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Time</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Category</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Event</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">User</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">IP</th>
              <th className="px-4 py-3 text-left font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3 text-right font-medium text-muted-foreground">Duration</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {logs.map((log) => (
              <tr
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className="cursor-pointer transition-colors hover:bg-muted/30"
              >
                <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
                  {new Date(log.timestamp).toLocaleString(undefined, {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                    second: "2-digit",
                  })}
                </td>
                <td className="px-4 py-3">
                  <CategoryBadge category={log.event_category} />
                </td>
                <td className="max-w-[200px] truncate px-4 py-3 font-mono text-xs text-foreground">
                  {log.event_type}
                </td>
                <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted-foreground">
                  {log.user_email ?? "—"}
                </td>
                <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                  {log.ip_address ?? "—"}
                </td>
                <td className="px-4 py-3">
                  {log.status && (
                    <span className="flex items-center gap-1.5">
                      <span
                        className={cn(
                          "inline-block h-1.5 w-1.5 rounded-full",
                          STATUS_DOT[log.status] ?? "bg-gray-400"
                        )}
                      />
                      <span className="text-xs text-muted-foreground">{log.status}</span>
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-right text-xs text-muted-foreground">
                  {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-sm text-muted-foreground">
                  No logs found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <LogEntrySlideOver log={selectedLog} onClose={() => setSelectedLog(null)} />
    </>
  );
};
