import { NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/admin/guard";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// SSE feed config
// ---------------------------------------------------------------------------

const POLL_INTERVAL_MS = 5_000;
const INITIAL_FETCH_LIMIT = 50;

// ---------------------------------------------------------------------------
// GET — Admin: Server-Sent Events feed for real-time platform logs
// ---------------------------------------------------------------------------

export async function GET(): Promise<Response> {
  // Authenticate admin before starting the stream
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
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const supabase = createServiceClient();
      let lastTimestamp: string | null = null;
      let aborted = false;

      // Helper to send an SSE event
      function sendEvent(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      // Helper to send a keepalive comment
      function sendKeepAlive() {
        controller.enqueue(encoder.encode(": keepalive\n\n"));
      }

      // Initial fetch: last 50 logs
      try {
        const { data: initialLogs, error } = await supabase
          .from("platform_logs")
          .select(
            `id, timestamp, event_category, event_type, user_id,
             status, duration_ms, business_id, payload,
             error_code, error_message, environment`
          )
          .order("timestamp", { ascending: false })
          .limit(INITIAL_FETCH_LIMIT);

        if (error) {
          sendEvent("error", {
            code: "FETCH_FAILED",
            message: "Failed to fetch initial logs",
          });
          controller.close();
          return;
        }

        const logs = initialLogs ?? [];

        // Send initial batch (reversed so oldest first for client to append)
        sendEvent("init", logs.reverse());

        // Track the most recent timestamp
        if (logs.length > 0) {
          lastTimestamp = logs[logs.length - 1].timestamp;
        }
      } catch {
        sendEvent("error", {
          code: "INTERNAL_ERROR",
          message: "Failed during initial fetch",
        });
        controller.close();
        return;
      }

      // Polling loop
      async function poll() {
        if (aborted) return;

        try {
          let query = supabase
            .from("platform_logs")
            .select(
              `id, timestamp, event_category, event_type, user_id,
               status, duration_ms, business_id, payload,
               error_code, error_message, environment`
            )
            .order("timestamp", { ascending: true });

          if (lastTimestamp) {
            query = query.gt("timestamp", lastTimestamp);
          }

          query = query.limit(100);

          const { data: newLogs, error } = await query;

          if (error) {
            sendEvent("error", {
              code: "FETCH_FAILED",
              message: "Polling query failed",
            });
          } else if (newLogs && newLogs.length > 0) {
            // Stream each new log as an individual event
            for (const log of newLogs) {
              sendEvent("log", log);
            }
            lastTimestamp = newLogs[newLogs.length - 1].timestamp;
          } else {
            // No new logs — send keepalive
            sendKeepAlive();
          }
        } catch {
          // Silently continue on transient errors
          sendKeepAlive();
        }

        // Schedule next poll
        if (!aborted) {
          pollTimeout = setTimeout(poll, POLL_INTERVAL_MS);
        }
      }

      // Start polling after initial fetch
      let pollTimeout = setTimeout(poll, POLL_INTERVAL_MS);

      // Clean up when the client disconnects
      // The controller.close() from the cancel callback stops the stream
      controller.enqueue(
        encoder.encode(": stream started\n\n")
      );

      // Store cleanup reference on the controller for the cancel callback
      (controller as unknown as Record<string, unknown>).__cleanup = () => {
        aborted = true;
        clearTimeout(pollTimeout);
      };
    },

    cancel(controller) {
      // Client disconnected — clean up polling
      const cleanup = (controller as unknown as Record<string, unknown>)
        .__cleanup as (() => void) | undefined;
      if (cleanup) cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
