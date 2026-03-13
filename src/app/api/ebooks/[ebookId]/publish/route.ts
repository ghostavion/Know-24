import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/server";

/**
 * POST /api/ebooks/[ebookId]/publish
 * Publishes an ebook to the user's storefront.
 * Body: { price: number (in dollars), authorName?: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ ebookId: string }> }
) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
      { status: 401 }
    );
  }

  const { ebookId } = await params;

  let body: { price?: number; authorName?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_BODY", message: "Invalid JSON" } },
      { status: 400 }
    );
  }

  const price = body.price;
  if (typeof price !== "number" || price < 0) {
    return NextResponse.json(
      { error: { code: "INVALID_PRICE", message: "Price must be a non-negative number" } },
      { status: 400 }
    );
  }

  const supabase = createServiceClient();

  // Verify ebook exists and is ready
  const { data: ebook, error: fetchErr } = await supabase
    .from("ebooks")
    .select("id, title, subtitle, description, niche, status, pdf_url, cover_url, chapters, total_words, total_pages")
    .eq("id", ebookId)
    .eq("user_id", userId)
    .single();

  if (fetchErr || !ebook) {
    return NextResponse.json(
      { error: { code: "NOT_FOUND", message: "Ebook not found" } },
      { status: 404 }
    );
  }

  const typedEbook = ebook as {
    id: string; title: string; subtitle: string | null;
    description: string | null; niche: string; status: string;
    pdf_url: string | null; cover_url: string | null;
    chapters: unknown; total_words: number | null; total_pages: number | null;
  };

  if (!typedEbook.pdf_url) {
    return NextResponse.json(
      { error: { code: "NO_PDF", message: "Ebook PDF must be generated before publishing" } },
      { status: 400 }
    );
  }

  // Create or find the user's business (for storefront compat)
  let businessId: string | null = null;
  const { data: existingBiz } = await supabase
    .from("businesses")
    .select("id")
    .eq("clerk_user_id", userId)
    .limit(1)
    .single();

  if (existingBiz) {
    businessId = (existingBiz as { id: string }).id;
  }

  // Create product entry for storefront
  const slug = typedEbook.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);

  const priceCents = Math.round(price * 100);

  // Upsert into products table for storefront listing
  const { data: product, error: productErr } = await supabase
    .from("products")
    .upsert({
      ...(businessId ? { business_id: businessId } : {}),
      title: typedEbook.title,
      description: typedEbook.description ?? typedEbook.subtitle ?? `A comprehensive guide on ${typedEbook.niche}`,
      slug,
      product_type: "guide-ebook",
      price_cents: priceCents,
      status: "active",
      cover_image_url: typedEbook.cover_url,
      content: typedEbook.chapters,
      metadata: {
        ebook_id: ebookId,
        total_words: typedEbook.total_words,
        total_pages: typedEbook.total_pages,
        pdf_url: typedEbook.pdf_url,
      },
    }, { onConflict: "slug" })
    .select("id")
    .single();

  if (productErr) {
    return NextResponse.json(
      { error: { code: "PUBLISH_FAILED", message: `Failed to create product: ${productErr.message}` } },
      { status: 500 }
    );
  }

  // Update ebook status
  await supabase
    .from("ebooks")
    .update({
      status: "published",
      target_price: price,
      author_name: body.authorName ?? null,
      published_at: new Date().toISOString(),
    })
    .eq("id", ebookId);

  return NextResponse.json({
    data: {
      published: true,
      productId: product ? (product as { id: string }).id : null,
      slug,
      priceCents,
    },
  });
}
