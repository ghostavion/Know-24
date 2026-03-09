import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";
import Stripe from "stripe";
import type { ApiResponse } from "@/types/api";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Service check helpers (same logic as /api/health but with admin context)
// ---------------------------------------------------------------------------

interface ServiceStatus {
  status: "ok" | "error";
  latencyMs: number;
  error?: string;
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

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

interface ServicesData {
  status: "healthy" | "degraded" | "unhealthy";
  services: {
    supabase: ServiceStatus;
    redis: ServiceStatus;
    stripe: ServiceStatus;
  };
  queues: {
    note: string;
  };
  timestamp: string;
}

// ---------------------------------------------------------------------------
// GET — Admin: service status + queue info
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse<ApiResponse<ServicesData>>> {
  try {
    await requireAdmin();
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    if (message === "UNAUTHORIZED") {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }
    if (message === "FORBIDDEN") {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Admin access required" } },
        { status: 403 }
      );
    }
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }

  try {
    const [supabase, redis, stripe] = await Promise.all([
      checkSupabase(),
      checkRedis(),
      checkStripe(),
    ]);

    const services = { supabase, redis, stripe };
    const statuses = Object.values(services).map((s) => s.status);
    const okCount = statuses.filter((s) => s === "ok").length;

    let status: ServicesData["status"];
    if (okCount === statuses.length) {
      status = "healthy";
    } else if (okCount === 0) {
      status = "unhealthy";
    } else {
      status = "degraded";
    }

    // Queue info — BullMQ queue sizes require direct Redis access.
    // Upstash REST API doesn't support LLEN directly in a simple way,
    // so we note this for future enhancement.
    const queues = {
      note: "Queue metrics require BullMQ worker connection. See /admin dashboard for live metrics.",
    };

    const data: ServicesData = {
      status,
      services,
      queues,
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json({ data });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
