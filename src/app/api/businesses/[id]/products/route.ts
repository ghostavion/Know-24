import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { getProductGenerationQueue } from "@/lib/queue/queues";
import type { ApiResponse } from "@/types/api";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

const createProductSchema = z.object({
  productTypeSlug: z.string().min(1, "Product type slug is required"),
  title: z.string().min(1).max(200).optional(),
});

interface ProductRow {
  id: string;
  business_id: string;
  product_type_id: string;
  title: string;
  slug: string;
  status: string;
  price_cents: number;
  pricing_model: string;
  description: string | null;
  created_at: string;
}

interface ProductWithType {
  id: string;
  title: string;
  slug: string;
  status: string;
  price_cents: number;
  pricing_model: string;
  description: string | null;
  created_at: string;
  product_types: { display_name: string; slug: string } | null;
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<unknown[]>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id: businessId } = await params;
    const supabase = createServiceClient();

    // Verify business belongs to user
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    // Fetch products with product type info
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, title, slug, status, price_cents, pricing_model, description, created_at, product_types(display_name, slug)")
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (productsError) {
      return NextResponse.json(
        { error: { code: "FETCH_FAILED", message: "Failed to fetch products" } },
        { status: 500 }
      );
    }

    // Flatten the product_types join for the frontend
    const formatted = (products as unknown as ProductWithType[]).map((p) => ({
      id: p.id,
      title: p.title,
      slug: p.slug,
      status: p.status,
      price_cents: p.price_cents,
      pricing_model: p.pricing_model,
      description: p.description,
      created_at: p.created_at,
      product_type_display_name: p.product_types?.display_name ?? null,
      product_type_slug: p.product_types?.slug ?? null,
    }));

    return NextResponse.json({ data: formatted });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<ProductRow>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid input",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { id: businessId } = await params;
    const { productTypeSlug, title: providedTitle } = parsed.data;
    const supabase = createServiceClient();

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("id, name")
      .eq("id", businessId)
      .eq("owner_id", userId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    // Look up product type
    const { data: productType, error: typeError } = await supabase
      .from("product_types")
      .select("id, display_name, slug")
      .eq("slug", productTypeSlug)
      .single();

    if (typeError || !productType) {
      return NextResponse.json(
        { error: { code: "INVALID_TYPE", message: "Product type not found" } },
        { status: 400 }
      );
    }

    // Generate title and slug
    const title = providedTitle ?? `${productType.display_name} \u2014 ${business.name}`;
    const slug = slugify(title);
    const productId = crypto.randomUUID();

    // Insert product
    const { data: product, error: insertError } = await supabase
      .from("products")
      .insert({
        id: productId,
        business_id: businessId,
        product_type_id: productType.id,
        title,
        slug,
        status: "draft",
        price_cents: 2900,
      })
      .select()
      .single();

    if (insertError || !product) {
      return NextResponse.json(
        { error: { code: "CREATE_FAILED", message: "Failed to create product" } },
        { status: 500 }
      );
    }

    // Enqueue generation job
    await getProductGenerationQueue().add("generate", {
      productId,
      businessId,
      productTypeSlug,
    });

    return NextResponse.json({ data: product as ProductRow });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
