import { Resend } from "resend";
import { createServiceClient } from "@/lib/supabase/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// Types
interface SequenceRow {
  id: string;
  business_id: string;
  type: string;
  name: string;
  subject_template: string;
  body_template: string;
  delay_hours: number;
  is_active: boolean;
}

interface BusinessRow {
  name: string;
  niche: string;
}

// Process a sequence trigger (e.g., new subscriber -> welcome sequence)
export async function triggerSequence(
  businessId: string,
  sequenceType: string,
  recipientEmail: string,
  variables: Record<string, string> = {}
): Promise<{ sent: boolean; error?: string }> {
  const supabase = createServiceClient();

  // Get active sequences of this type for the business
  const { data: sequences } = await supabase
    .from("email_sequences")
    .select("id, business_id, type, name, subject_template, body_template, delay_hours, is_active")
    .eq("business_id", businessId)
    .eq("type", sequenceType)
    .eq("is_active", true)
    .order("sort_order", { ascending: true });

  if (!sequences || sequences.length === 0) {
    return { sent: false, error: "No active sequences found" };
  }

  // Get business info for template variables
  const { data: business } = await supabase
    .from("businesses")
    .select("name, niche")
    .eq("id", businessId)
    .single();

  const biz = business as BusinessRow | null;
  const templateVars: Record<string, string> = {
    business_name: biz?.name ?? "",
    business_niche: biz?.niche ?? "",
    recipient_email: recipientEmail,
    ...variables,
  };

  // Send the first sequence email immediately, queue others with delays
  for (const seq of sequences as SequenceRow[]) {
    const subject = replaceTemplateVars(seq.subject_template, templateVars);
    const body = replaceTemplateVars(seq.body_template, templateVars);

    if (seq.delay_hours === 0) {
      // Send immediately
      await sendSequenceEmail(seq.id, businessId, recipientEmail, subject, body);
    } else {
      // Record as pending (a background job would pick these up)
      await supabase.from("email_sequence_sends").insert({
        sequence_id: seq.id,
        business_id: businessId,
        recipient_email: recipientEmail,
        status: "pending",
      });
    }
  }

  return { sent: true };
}

// Send a single sequence email via Resend
async function sendSequenceEmail(
  sequenceId: string,
  businessId: string,
  to: string,
  subject: string,
  htmlBody: string
): Promise<void> {
  const supabase = createServiceClient();

  try {
    await resend.emails.send({
      from: "Know24 <noreply@know24.io>",
      to,
      subject,
      html: htmlBody,
    });

    await supabase.from("email_sequence_sends").insert({
      sequence_id: sequenceId,
      business_id: businessId,
      recipient_email: to,
      status: "sent",
      sent_at: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    await supabase.from("email_sequence_sends").insert({
      sequence_id: sequenceId,
      business_id: businessId,
      recipient_email: to,
      status: "failed",
      error_message: message,
    });
  }
}

// Simple template variable replacement: {{variable_name}} -> value
function replaceTemplateVars(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key: string) => vars[key] ?? "");
}

// Generate default sequences for a new business
export async function generateDefaultSequences(businessId: string): Promise<void> {
  const supabase = createServiceClient();

  const defaults = [
    {
      business_id: businessId,
      type: "welcome",
      name: "Welcome Email",
      subject_template: "Welcome to {{business_name}}!",
      body_template: "<h1>Welcome!</h1><p>Thanks for joining {{business_name}}. We're excited to have you here.</p><p>Stay tuned for great content about {{business_niche}}.</p>",
      delay_hours: 0,
      sort_order: 0,
    },
    {
      business_id: businessId,
      type: "nurture",
      name: "Getting Started Guide",
      subject_template: "Getting the most from {{business_name}}",
      body_template: "<h1>Getting Started</h1><p>Here are some tips to get the most from your {{business_name}} experience.</p>",
      delay_hours: 48,
      sort_order: 1,
    },
  ];

  await supabase.from("email_sequences").insert(defaults);
}
