"use client";

import { useEffect, useState, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface ServiceStatus {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
}

interface HealthResponse {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    supabase: ServiceStatus;
    redis: ServiceStatus;
    stripe: ServiceStatus;
  };
  timestamp: string;
}

type ServiceName = keyof HealthResponse["services"];

const SERVICE_LABELS: Record<ServiceName, string> = {
  supabase: "Supabase (Database)",
  redis: "Upstash Redis",
  stripe: "Stripe",
};

interface ServiceRowProps {
  name: string;
  service: ServiceStatus | null;
  loading: boolean;
}

function ServiceRow({ name, service, loading }: ServiceRowProps) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-center gap-3">
        <span
          className={cn(
            "h-2.5 w-2.5 rounded-full",
            loading && "bg-gray-400 animate-pulse",
            !loading && service?.status === "ok" && "bg-green-500",
            !loading && service?.status === "error" && "bg-red-500",
            !loading && !service && "bg-gray-400"
          )}
        />
        <span className="text-sm font-medium text-foreground">{name}</span>
      </div>
      <div className="flex items-center gap-3">
        {service?.error && (
          <span className="text-xs text-red-500">{service.error}</span>
        )}
        {service && !loading && (
          <span className="text-xs text-muted-foreground">
            {service.latencyMs}ms
          </span>
        )}
        {loading && (
          <span className="text-xs text-muted-foreground">Checking...</span>
        )}
      </div>
    </div>
  );
}

export function AdminHealthPanel() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/health");
      if (res.ok) {
        const data: HealthResponse = await res.json();
        setHealth(data);
        setLastChecked(new Date());
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    const interval = setInterval(fetchHealth, 30_000);
    return () => clearInterval(interval);
  }, [fetchHealth]);

  const overallColor = health
    ? health.status === "healthy"
      ? "text-green-600"
      : health.status === "degraded"
        ? "text-yellow-600"
        : "text-red-600"
    : "text-gray-400";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("text-sm font-medium capitalize", overallColor)}>
            {health?.status ?? "Checking..."}
          </span>
          {lastChecked && (
            <span className="text-xs text-muted-foreground">
              Last checked{" "}
              {lastChecked.toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
                second: "2-digit",
              })}
            </span>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchHealth}
          disabled={loading}
        >
          <RefreshCw
            className={cn("h-3.5 w-3.5", loading && "animate-spin")}
          />
          Refresh
        </Button>
      </div>

      <div className="space-y-2">
        {(Object.keys(SERVICE_LABELS) as ServiceName[]).map((key) => (
          <ServiceRow
            key={key}
            name={SERVICE_LABELS[key]}
            service={health?.services[key] ?? null}
            loading={loading}
          />
        ))}
      </div>
    </div>
  );
}
