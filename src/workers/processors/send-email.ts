import { Job } from "bullmq";

import { triggerSequence } from "@/lib/email/sequences";

export interface SendEmailJobData {
  businessId: string;
  sequenceType: string;
  recipientEmail: string;
  variables?: Record<string, string>;
}

/**
 * Send an email sequence to a recipient. Delegates to the email
 * sequences module which handles template rendering and delivery via Resend.
 */
export async function sendEmail(job: Job<SendEmailJobData>): Promise<void> {
  const { businessId, sequenceType, recipientEmail, variables } = job.data;

  const result = await triggerSequence(
    businessId,
    sequenceType,
    recipientEmail,
    variables ?? {}
  );

  if (!result.sent) {
    throw new Error(result.error ?? `Failed to send ${sequenceType} email to ${recipientEmail}`);
  }
}
