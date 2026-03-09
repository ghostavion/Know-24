import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import { logPlatformEvent } from "@/lib/logging/platform-logger";
import type { ApiResponse } from "@/types/api";

const updateProductSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(5000).optional(),
  priceCents: z.number().int().min(0).optional(),
  pricingModel: z.enum(["one_time", "subscription"]).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
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
  updated_at: string;
}

export async function PATCH(
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
    const parsed = updateProductSchema.safeParse(body);
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

    const { id: productId } = await params;
    const supabase = createServiceClient();

    // Verify ownership: product -> business -> owner_id
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, business_id, businesses(owner_id)")
      .eq("id", productId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const ownerData = product.businesses as unknown as { owner_id: string } | null;
    if (!ownerData || ownerData.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to update this product" } },
        { status: 403 }
      );
    }

    // Build update object from provided fields only
    const { title, description, priceCents, pricingModel, status } = parsed.data;
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (priceCents !== undefined) updateFields.price_cents = priceCents;
    if (pricingModel !== undefined) updateFields.pricing_model = pricingModel;
    if (status !== undefined) updateFields.status = status;

    const { data: updatedProduct, error: updateError } = await supabase
      .from("products")
      .update(updateFields)
      .eq("id", productId)
      .select()
      .single();

    if (updateError || !updatedProduct) {
      return NextResponse.json(
        { error: { code: "UPDATE_FAILED", message: "Failed to update product" } },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "DATA",
      event_type: "product.updated",
      clerk_user_id: userId,
      status: "success",
      business_id: (updatedProduct as ProductRow).business_id,
      payload: {
        product_id: productId,
        updated_fields: Object.keys(parsed.data),
      },
    });

    return NextResponse.json({ data: updatedProduct as ProductRow });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse<ApiResponse<{ id: string; deleted: boolean }>>> {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { id: productId } = await params;
    const supabase = createServiceClient();

    // Verify ownership
    const { data: product, error: fetchError } = await supabase
      .from("products")
      .select("id, business_id, businesses(owner_id)")
      .eq("id", productId)
      .is("deleted_at", null)
      .single();

    if (fetchError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const ownerData = product.businesses as unknown as { owner_id: string } | null;
    if (!ownerData || ownerData.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to delete this product" } },
        { status: 403 }
      );
    }

    // Soft-delete
    const { error: deleteError } = await supabase
      .from("products")
      .update({ deleted_at: new Date().toISOString() })
      .eq("id", productId);

    if (deleteError) {
      return NextResponse.json(
        { error: { code: "DELETE_FAILED", message: "Failed to delete product" } },
        { status: 500 }
      );
    }

    logPlatformEvent({
      event_category: "DATA",
      event_type: "product.deleted",
      clerk_user_id: userId,
      status: "success",
      business_id: (product as unknown as { business_id: string }).business_id,
      payload: { product_id: productId },
    });

    return NextResponse.json({ data: { id: productId, deleted: true } });
  } catch {
    return NextResponse.json(
      { error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 }
    );
  }
}
