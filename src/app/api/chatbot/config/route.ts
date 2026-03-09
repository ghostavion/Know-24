import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { ChatbotConfig } from "@/types/chatbot";

// ---------- Zod schemas ----------

const getConfigSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
});

const updateConfigSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  systemPrompt: z.string().max(5000).optional(),
  personality: z.string().max(500).optional(),
  knowledgeScopeIds: z.array(z.string().uuid()).optional(),
  suggestProducts: z.boolean().optional(),
  maxResponseTokens: z.number().int().min(64).max(4096).optional(),
});

// ---------- Row types ----------

interface ProductConfigRow {
  id: string;
  business_id: string;
  chatbot_system_prompt: string | null;
  chatbot_personality: string | null;
  chatbot_knowledge_scope_ids: string[] | null;
  chatbot_suggest_products: boolean;
  chatbot_max_response_tokens: number;
  businesses: { organization_id: string };
}

// ---------- Helpers ----------

async function verifyOwnership(
  supabase: ReturnType<typeof createServiceClient>,
  userId: string,
  productId: string
): Promise<
  | { authorized: true; product: ProductConfigRow }
  | { authorized: false; response: NextResponse }
> {
  // Look up internal user
  const { data: user } = await supabase
    .from("users")
    .select("id")
    .eq("clerk_user_id", userId)
    .single();

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "User not found" } },
        { status: 401 }
      ),
    };
  }

  const typedUser = user as unknown as { id: string };

  // Get product and verify business membership
  const { data: product } = await supabase
    .from("products")
    .select(
      "id, business_id, chatbot_system_prompt, chatbot_personality, " +
        "chatbot_knowledge_scope_ids, chatbot_suggest_products, " +
        "chatbot_max_response_tokens, businesses!inner(organization_id)"
    )
    .eq("id", productId)
    .is("deleted_at", null)
    .single();

  if (!product) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      ),
    };
  }

  const typedProduct = product as unknown as ProductConfigRow;

  const orgId = typedProduct.businesses.organization_id;

  const { data: membership } = await supabase
    .from("organization_members")
    .select("id")
    .eq("organization_id", orgId)
    .eq("user_id", typedUser.id)
    .single();

  if (!membership) {
    return {
      authorized: false,
      response: NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized" } },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, product: typedProduct };
}

// ---------- GET — get chatbot config ----------

export async function GET(
  request: NextRequest
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const parsed = getConfigSchema.safeParse({
      productId: searchParams.get("productId"),
    });

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid query parameters",
            details: parsed.error.flatten(),
          },
        },
        { status: 400 }
      );
    }

    const { productId } = parsed.data;
    const supabase = createServiceClient();

    const ownershipResult = await verifyOwnership(supabase, userId, productId);
    if (!ownershipResult.authorized) {
      return ownershipResult.response;
    }

    const { product } = ownershipResult;

    const config: ChatbotConfig = {
      productId: product.id,
      businessId: product.business_id,
      systemPrompt: product.chatbot_system_prompt,
      personality: product.chatbot_personality,
      knowledgeScopeIds: product.chatbot_knowledge_scope_ids ?? [],
      suggestProducts: product.chatbot_suggest_products,
      maxResponseTokens: product.chatbot_max_response_tokens,
    };

    return NextResponse.json({ data: config });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}

// ---------- PATCH — update chatbot config ----------

export async function PATCH(
  request: NextRequest
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const body: unknown = await request.json();
    const parsed = updateConfigSchema.safeParse(body);

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

    const {
      productId,
      systemPrompt,
      personality,
      knowledgeScopeIds,
      suggestProducts,
      maxResponseTokens,
    } = parsed.data;

    const supabase = createServiceClient();

    const ownershipResult = await verifyOwnership(supabase, userId, productId);
    if (!ownershipResult.authorized) {
      return ownershipResult.response;
    }

    // Build update object from provided fields only
    const updateFields: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (systemPrompt !== undefined)
      updateFields.chatbot_system_prompt = systemPrompt;
    if (personality !== undefined)
      updateFields.chatbot_personality = personality;
    if (knowledgeScopeIds !== undefined)
      updateFields.chatbot_knowledge_scope_ids = knowledgeScopeIds;
    if (suggestProducts !== undefined)
      updateFields.chatbot_suggest_products = suggestProducts;
    if (maxResponseTokens !== undefined)
      updateFields.chatbot_max_response_tokens = maxResponseTokens;

    const { data: updated, error: updateError } = await supabase
      .from("products")
      .update(updateFields)
      .eq("id", productId)
      .select(
        "id, business_id, chatbot_system_prompt, chatbot_personality, " +
          "chatbot_knowledge_scope_ids, chatbot_suggest_products, " +
          "chatbot_max_response_tokens"
      )
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        {
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update chatbot configuration",
          },
        },
        { status: 500 }
      );
    }

    const typedUpdated = updated as unknown as Omit<
      ProductConfigRow,
      "businesses"
    >;

    const config: ChatbotConfig = {
      productId: typedUpdated.id,
      businessId: typedUpdated.business_id,
      systemPrompt: typedUpdated.chatbot_system_prompt,
      personality: typedUpdated.chatbot_personality,
      knowledgeScopeIds: typedUpdated.chatbot_knowledge_scope_ids ?? [],
      suggestProducts: typedUpdated.chatbot_suggest_products,
      maxResponseTokens: typedUpdated.chatbot_max_response_tokens,
    };

    return NextResponse.json({ data: config });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "An unexpected error occurred",
        },
      },
      { status: 500 }
    );
  }
}
