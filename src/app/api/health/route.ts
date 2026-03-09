import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import Stripe from "stripe";

export const dynamic = "force-dynamic";

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

async function checkSupabase(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const supabase = createServiceClient();
    const { error } = await supabase.from("businesses").select("id").limit(1);
    const latencyMs = Date.now() - start;

    if (error) {
      return { status: "error", latencyMs, error: error.message };
    }
    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkRedis(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
      return {
        status: "error",
        latencyMs: Date.now() - start,
        error: "Redis environment variables not configured",
      };
    }

    const response = await fetch(`${url}/ping`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const latencyMs = Date.now() - start;

    if (!response.ok) {
      return { status: "error", latencyMs, error: `HTTP ${response.status}` };
    }
    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

async function checkStripe(): Promise<ServiceStatus> {
  const start = Date.now();
  try {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      return {
        status: "error",
        latencyMs: Date.now() - start,
        error: "Stripe secret key not configured",
      };
    }

    const stripe = new Stripe(secretKey, { typescript: true });
    await stripe.balance.retrieve();
    const latencyMs = Date.now() - start;

    return { status: "ok", latencyMs };
  } catch (err) {
    return {
      status: "error",
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : "Unknown error",
    };
  }
}

export async function GET() {
  try {
    const [supabase, redis, stripe] = await Promise.all([
      checkSupabase(),
      checkRedis(),
      checkStripe(),
    ]);

    const services = { supabase, redis, stripe };
    const statuses = Object.values(services).map((s) => s.status);
    const okCount = statuses.filter((s) => s === "ok").length;

    let status: HealthResponse["status"];
    if (okCount === statuses.length) {
      status = "healthy";
    } else if (okCount === 0) {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    const response: HealthResponse = {
      status,
      services,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      status: status === "unhealthy" ? 503 : 200,
    });
  } catch {
    return NextResponse.json(
      {
        status: "unhealthy" as const,
        services: {
          supabase: { status: "error" as const, latencyMs: 0, error: "Health check failed" },
          redis: { status: "error" as const, latencyMs: 0, error: "Health check failed" },
          stripe: { status: "error" as const, latencyMs: 0, error: "Health check failed" },
        },
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
