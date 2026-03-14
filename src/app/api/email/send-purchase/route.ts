import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import * as Sentry from "@sentry/nextjs";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

const resend = new Resend(process.env.RESEND_API_KEY);

interface SendPurchaseEmailRequest {
  orderId: string;
  customerEmail: string;
  productId: string;
  businessId: string;
}

interface ProductAssetRow {
  id: string;
  file_name: string | null;
  asset_type: string;
  r2_key: string;
  r2_bucket: string | null;
}

export async function POST(
  request: NextRequest
): Promise<NextResponse<ApiResponse<{ sent: boolean }>>> {
  try {
    // Rate limit — webhook tier (called internally from webhook handler)
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      "unknown";
    const rlResult = await checkRateLimit(ip, "webhook");
    if (!rlResult.success) {
      return NextResponse.json(
        {
          error: {
            code: "RATE_LIMITED",
            message: "Too many requests",
          },
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(
              Math.ceil((rlResult.reset - Date.now()) / 1000)
            ),
          },
        }
      );
    }

    // Validate internal secret to prevent public abuse
    const authHeader = request.headers.get("authorization");
    const internalSecret = process.env.INTERNAL_API_SECRET;

    if (
      !internalSecret ||
      !authHeader ||
      authHeader !== `Bearer ${internalSecret}`
    ) {
      return NextResponse.json(
        {
          error: {
            code: "UNAUTHORIZED",
            message: "Not authorized",
          },
        },
        { status: 401 }
      );
    }

    const body = (await request.json()) as SendPurchaseEmailRequest;
    const { orderId, customerEmail, productId, businessId } = body;

    if (!orderId || !customerEmail || !productId || !businessId) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message:
              "Missing required fields: orderId, customerEmail, productId, businessId",
          },
        },
        { status: 400 }
      );
    }

    const supabase = createServiceClient();

    // Fetch product details
    const { data: product, error: productError } = await supabase
      .from("products")
      .select("id, title, slug, price_cents")
      .eq("id", productId)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    // Fetch business details
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    // Fetch order details
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .select("id, amount_cents, currency, status")
      .eq("id", orderId)
      .single();

    if (orderError || !order) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Order not found" } },
        { status: 404 }
      );
    }

    // Fetch downloadable assets for this product
    const { data: assets } = await supabase
      .from("product_assets")
      .select("id, file_name, asset_type, r2_key, r2_bucket")
      .eq("product_id", productId)
      .in("asset_type", ["pdf", "audio", "video", "ebook", "file"]);

    const typedAssets = (assets ?? []) as unknown as ProductAssetRow[];

    // Generate signed download URLs (24-hour expiry for email links)
    const downloadLinks: { name: string; url: string }[] = [];

    for (const asset of typedAssets) {
      const bucket = asset.r2_bucket || "product-assets";
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(asset.r2_key, 86400); // 24 hours

      if (signedUrlData?.signedUrl) {
        const fileName =
          asset.file_name || asset.r2_key.split("/").pop() || "download";
        downloadLinks.push({ name: fileName, url: signedUrlData.signedUrl });
      }
    }

    // Build email HTML
    const amountFormatted =
      (order.amount_cents as number) === 0
        ? "Free"
        : `$${((order.amount_cents as number) / 100).toFixed(2)} ${((order.currency as string) ?? "usd").toUpperCase()}`;

    const businessName = (business.name as string) ?? "AgentTV";
    const productTitle = product.title as string;

    const downloadSection =
      downloadLinks.length > 0
        ? `
      <div style="margin-top:24px;padding:20px;background:#f8f9fa;border-radius:8px;">
        <h2 style="margin:0 0 16px;font-size:18px;color:#111;">Your Downloads</h2>
        ${downloadLinks
          .map(
            (link) => `
          <a href="${link.url}" style="display:inline-block;margin:6px 0;padding:10px 20px;background:#2563eb;color:#fff;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
            Download: ${link.name}
          </a><br/>`
          )
          .join("")}
        <p style="margin:16px 0 0;font-size:12px;color:#6b7280;">
          Download links expire in 24 hours. Contact ${businessName} if you need new links.
        </p>
      </div>`
        : "";

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
        Thank you for your purchase!
      </h1>
      <p style="margin:0 0 24px;text-align:center;color:#6b7280;font-size:15px;">
        Your order from <strong>${businessName}</strong> is confirmed.
      </p>

      <!-- Order details -->
      <div style="border-top:1px solid #e5e7eb;padding-top:20px;">
        <h2 style="margin:0 0 16px;font-size:16px;color:#374151;text-transform:uppercase;letter-spacing:0.05em;">
          Order Details
        </h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;">
          <tr>
            <td style="padding:8px 0;color:#6b7280;">Product</td>
            <td style="padding:8px 0;text-align:right;font-weight:600;color:#111;">${productTitle}</td>
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

      ${downloadSection}

      <!-- Footer -->
      <div style="margin-top:32px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
        <p style="margin:0;font-size:12px;color:#9ca3af;">
          This email was sent by AgentTV on behalf of ${businessName}.<br/>
          If you have questions about this purchase, please contact ${businessName} directly.
        </p>
      </div>
    </div>
  </div>
</body>
</html>`;

    // Send via Resend
    const { error: sendError } = await resend.emails.send({
      from: `${businessName} via AgentTV <noreply@agenttv.io>`,
      to: customerEmail,
      subject: `Order confirmed: ${productTitle}`,
      html: emailHtml,
    });

    if (sendError) {
      throw new Error(`Resend error: ${sendError.message}`);
    }

    return NextResponse.json({ data: { sent: true } });
  } catch (err) {
    Sentry.captureException(err);
    return NextResponse.json(
      {
        error: {
          code: "EMAIL_SEND_FAILED",
          message: "Failed to send purchase confirmation email",
        },
      },
      { status: 500 }
    );
  }
}
