import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import type { ApiResponse } from "@/types/api";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendEbookPurchaseRequest {
  orderId: string;
  customerEmail: string;
  ebookId: string;
  ebookTitle: string;
  amountCents: number;
  downloadUrl: string;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ sent: boolean }>>> {
  try {
    // Validate internal secret
    const authHeader = request.headers.get("authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (
      !internalSecret ||
      !authHeader ||
      authHeader !== `Bearer ${internalSecret}`
    ) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authorized" } },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SendEbookPurchaseRequest;
    const {
      orderId,
      customerEmail,
      ebookTitle,
      amountCents,
      downloadUrl,
    } = body;

    if (!orderId || !customerEmail || !ebookTitle || !downloadUrl) {
      return NextResponse.json(
        { error: { code: "VALIDATION_ERROR", message: "Missing required fields" } },
        { status: 400 }
      );
    }

    const amountFormatted =
      amountCents === 0
        ? "Free"
        : `$${(amountCents / 100).toFixed(2)} USD`;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:40px 20px;">
    <div style="background:#fff;border-radius:12px;padding:32px;box-shadow:0 1px 3px rgba(0,0,0,0.1);">
      <!-- Checkmark -->
      <div style="text-align:center;margin-bottom:24px;">
        <div style="display:inline-block;width:56px;height:56px;background:#dcfce7;border-radius:50%;line-height:56px;text-align:center;">
          <span style="font-size:28px;color:#16a34a;">&#10003;</span>
        </div>
      </div>

      <h1 style="margin:0 0 8px;font-size:24px;text-align:center;color:#111;">
        Your ebook is ready!
      </h1>
      <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-size:15px;">
        Thank you for purchasing <strong>${ebookTitle}</strong>.
      </p>

      <!-- Download button -->
      <div style="text-align:center;margin:24px 0;">
        <a href="${downloadUrl}" style="display:inline-block;padding:14px 32px;background:#2563eb;color:#fff;text-decoration:none;border-radius:8px;font-weight:700;font-size:16px;">
          Download Your Ebook (PDF)
        </a>
      </div>

      <p style="margin:0 0 24px;text-align:center;color:#9ca3af;font-size:13px;">
        You can download your ebook up to 10 times using this link.
      </p>

      <!-- Order details -->
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
        <h2 style="margin:0 0 16px;font-size:14px;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">
          Order Details
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Ebook</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${ebookTitle}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Amount</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${amountFormatted}</td>
          </tr>
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Order ID</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;font-size:12px;">${orderId}</td>
          </tr>
        </table>
      </div>

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          This email was sent by Know24.<br/>
          If you have questions, reply to this email.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    const { error: sendError } = await resend.emails.send({
      from: `Know24 <noreply@know24.io>`,
      to: customerEmail,
      subject: `Your ebook is ready: ${ebookTitle}`,
      html: emailHtml,
    });

    if (sendError) {
      throw new Error(`Resend error: ${sendError.message}`);
    }

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      { error: { code: "EMAIL_SEND_FAILED", message: "Failed to send email" } },
      { status: 500 }
    );
  }
}
