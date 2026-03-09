"use client";

import { X } from "lucide-react";
import { CategoryBadge } from "./CategoryBadge";
import type { PlatformLog } from "@/types/admin-logs";

interface LogEntrySlideOverProps {
  log: PlatformLog | null;
  onClose: () => void;
}

export const LogEntrySlideOver = ({ log, onClose }: LogEntrySlideOverProps) => {
  if (!log) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full max-w-lg overflow-y-auto border-l border-border bg-card shadow-xl">
        <div className="sticky top-0 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <h3 className="text-sm font-semibold text-foreground">Log Detail</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="space-y-4 p-6">
          <div>
            <p className="text-xs text-muted-foreground">Event</p>
            <p className="mt-1 text-sm font-medium text-foreground">{log.event_type}</p>
          </div>
          <div className="flex gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Category</p>
              <div className="mt-1">
                <CategoryBadge category={log.event_category} />
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="mt-1 text-sm text-foreground">{log.status ?? "—"}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Duration</p>
              <p className="mt-1 text-sm text-foreground">
                {log.duration_ms != null ? `${log.duration_ms}ms` : "—"}
              </p>
            </div>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Timestamp</p>
            <p className="mt-1 text-sm text-foreground">
              {new Date(log.timestamp).toLocaleString()}
            </p>
          </div>
          {log.user_email && (
            <div>
              <p className="text-xs text-muted-foreground">User</p>
              <p className="mt-1 text-sm text-foreground">{log.user_email}</p>
            </div>
          )}
          {log.ip_address && (
            <div>
              <p className="text-xs text-muted-foreground">IP Address</p>
              <p className="mt-1 text-sm text-foreground">
                {log.ip_address}
                {log.geo_country && ` (${log.geo_city ? `${log.geo_city}, ` : ""}${log.geo_country})`}
              </p>
            </div>
          )}
          {log.page_url && (
            <div>
              <p className="text-xs text-muted-foreground">URL</p>
              <p className="mt-1 break-all text-sm text-foreground">{log.page_url}</p>
            </div>
          )}
          {log.error_message && (
            <div>
              <p className="text-xs text-muted-foreground">Error</p>
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                {log.error_code && `[${log.error_code}] `}
                {log.error_message}
              </p>
            </div>
          )}
          <div>
            <p className="text-xs text-muted-foreground">Payload</p>
            <pre className="mt-1 overflow-x-auto rounded-lg bg-muted/50 p-3 text-xs text-foreground">
              {JSON.stringify(log.payload, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};
