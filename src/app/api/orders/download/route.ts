import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";
import { checkRateLimit } from "@/lib/rate-limit";
import type { ApiResponse } from "@/types/api";

interface DownloadData {
  url: string;
  filename: string;
}

/**
 * GET /api/orders/download?token=...  (preferred — public, token-based)
 * GET /api/orders/download?orderId=... (legacy fallback)
 * Returns a signed download URL for the purchased ebook PDF.
 */
export async function GET(
  request: NextRequest
): Promise<NextResponse<ApiResponse<DownloadData>>> {
  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  const rlResult = await checkRateLimit(ip, "api");
  if (!rlResult.success) {
    return NextResponse.json(
      { error: { code: "RATE_LIMITED", message: "Too many requests" } },
      { status: 429 }
    );
  }

  const token = request.nextUrl.searchParams.get("token");
  const orderId = request.nextUrl.searchParams.get("orderId");

  if (!token && !orderId) {
    return NextResponse.json(
      { error: { code: "MISSING_PARAM", message: "token or orderId is required" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Fetch order by token or orderId
  const query = supabase
    .from("orders")
    .select("id, ebook_id, status, download_count, download_token");

  if (token) {
    query.eq("download_token", token);
  } else {
    query.eq("id", orderId!);
  }

  const { data: order, error: orderError } = await query.single();

  if (orderError || !order) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Order not found" } },
      { status: 404 }
    );
  }

  const typedOrder = order as {
    id: string;
    ebook_id: string | null;
    status: string;
    download_count: number;
  };

  if (typedOrder.status !== "completed") {
    return NextResponse.json(
      {
        error: {
          code: "ORDER_NOT_COMPLETED",
          message: "This order has not been completed",
        },
      },
      { status: 403 }
    );
  }

  // Rate limit downloads (max 10 per order)
  if (typedOrder.download_count >= 10) {
    return NextResponse.json(
      {
        error: {
          code: "DOWNLOAD_LIMIT",
          message: "Download limit reached (10). Contact support for help.",
        },
      },
      { status: 403 }
    );
  }

  const ebookId = typedOrder.ebook_id;
  if (!ebookId) {
    return NextResponse.json(
      { error: { code: "NO_EBOOK", message: "No ebook linked to this order" } },
      { status: 400 }
    );
  }

  // Fetch ebook
  const { data: ebook, error: ebookError } = await supabase
    .from("ebooks")
    .select("id, title, pdf_url, pdf_storage_path")
    .eq("id", ebookId)
    .single();

  if (ebookError || !ebook) {
    return NextResponse.json(
      { error: { code: "EBOOK_NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  const typedEbook = ebook as {
    id: string;
    title: string;
    pdf_url: string | null;
    pdf_storage_path: string | null;
  };

  if (!typedEbook.pdf_url && !typedEbook.pdf_storage_path) {
    return NextResponse.json(
      {
        error: {
          code: "PDF_NOT_READY",
          message: "PDF is not yet available for this ebook",
        },
      },
      { status: 404 }
    );
  }

  let downloadUrl: string;

  if (typedEbook.pdf_storage_path) {
    // Stored in Supabase Storage — generate signed URL
    const { data: signedUrlData, error: signedError } = await supabase.storage
      .from("ebooks")
      .createSignedUrl(typedEbook.pdf_storage_path, 3600); // 1 hour expiry

    if (signedError || !signedUrlData?.signedUrl) {
      return NextResponse.json(
        {
          error: {
            code: "DOWNLOAD_ERROR",
            message: "Failed to generate download link",
          },
        },
        { status: 500 }
      );
    }

    downloadUrl = signedUrlData.signedUrl;
  } else if (typedEbook.pdf_url?.includes("/storage/")) {
    // Legacy: extract path from public URL
    const pdfPath = typedEbook.pdf_url.split("/storage/v1/object/public/")[1];
    if (!pdfPath) {
      downloadUrl = typedEbook.pdf_url;
    } else {
      const [bucket, ...pathParts] = pdfPath.split("/");
      const { data: signedUrlData } = await supabase.storage
        .from(bucket)
        .createSignedUrl(pathParts.join("/"), 3600);
      downloadUrl = signedUrlData?.signedUrl ?? typedEbook.pdf_url;
    }
  } else {
    downloadUrl = typedEbook.pdf_url!;
  }

  // Increment download count
  await supabase
    .from("orders")
    .update({ download_count: typedOrder.download_count + 1 })
    .eq("id", typedOrder.id);

  const safeTitle = typedEbook.title
    .replace(/[^a-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .toLowerCase();

  return NextResponse.json({
    data: {
      url: downloadUrl,
      filename: `${safeTitle}.pdf`,
    },
  });
}
