import { inngest } from "./client";
import { createServiceClient } from "@/lib/supabase/server";
import { triggerSequence } from "@/lib/email/sequences";

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

export const sendEmail = inngest.createFunction(
  { id: "send-email", concurrency: { limit: 5 } },
  { event: "email/send.requested" },
  async ({ event, step }) => {
    const { businessId, sequenceType, recipientEmail, variables } = event.data;

    await step.run("send", async () => {
      const result = await triggerSequence(
        businessId,
        sequenceType,
        recipientEmail,
        variables ?? {}
      );
      if (!result.sent) {
        throw new Error(result.error ?? `Failed to send ${sequenceType} email`);
      }
    });
  }
);

// ---------------------------------------------------------------------------
// Export all functions for the serve handler
// ---------------------------------------------------------------------------

export const inngestFunctions = [
  sendEmail,
];
