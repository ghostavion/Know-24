import { auth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * GET /api/research/[runId]/stream
 * SSE endpoint that polls the research_runs table for status updates.
 * Sends narration events to the client in real time.
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ runId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { runId } = await params;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      function sendEvent(event: string, data: unknown) {
        const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      }

      const supabase = createServiceClient();
      let lastPhase = "";
      let lastNarrationCount = 0;
      let pollCount = 0;
      const maxPolls = 180; // 3 minutes at 1s intervals

      const poll = async () => {
        try {
          const { data: run } = await supabase
            .from("research_runs")
            .select("status, phase, narration_events, proof_card, confidence_score, completed_at")
            .eq("id", runId)
            .eq("user_id", userId)
            .single();

          if (!run) {
            sendEvent("error", { message: "Research run not found" });
            controller.close();
            return;
          }

          const typedRun = run as {
            status: string;
            phase: string;
            narration_events: Array<{ phase: string; message: string; detail?: string; progress?: number; timestamp: number }> | null;
            proof_card: unknown;
            confidence_score: number | null;
            completed_at: string | null;
          };

          // Send phase updates
          if (typedRun.phase !== lastPhase) {
            lastPhase = typedRun.phase;
            sendEvent("phase", { phase: typedRun.phase, status: typedRun.status });
          }

          // Send any new narration events
          const events = typedRun.narration_events ?? [];
          if (events.length > lastNarrationCount) {
            for (let i = lastNarrationCount; i < events.length; i++) {
              sendEvent("narration", events[i]);
            }
            lastNarrationCount = events.length;
          }

          // Check terminal states
          if (typedRun.status === "completed" || typedRun.status === "cached") {
            sendEvent("complete", {
              proofCard: typedRun.proof_card,
              confidenceScore: typedRun.confidence_score,
            });
            controller.close();
            return;
          }

          if (typedRun.status === "failed") {
            sendEvent("error", { message: "Research failed" });
            controller.close();
            return;
          }

          pollCount++;
          if (pollCount >= maxPolls) {
            sendEvent("error", { message: "Research timed out" });
            controller.close();
            return;
          }

          // Continue polling
          setTimeout(poll, 1000);
        } catch {
          sendEvent("error", { message: "Stream error" });
          controller.close();
        }
      };

      // Send initial event
      sendEvent("connected", { runId });

      // Start polling
      poll();
    },
    cancel() {
      // Client disconnected — cleanup handled by GC
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
