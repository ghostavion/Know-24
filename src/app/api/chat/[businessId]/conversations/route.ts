import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createServiceClient } from "@/lib/supabase/server";
import type { ApiResponse } from "@/types/api";
import type { ChatConversation } from "@/types/chatbot";

// ---------- Zod schemas ----------

const getConversationsSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  customerEmail: z.string().email("Invalid email"),
});

const createConversationSchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  customerEmail: z.string().email("Invalid email"),
  customerName: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
});

// ---------- Row types ----------

interface ConversationRow {
  id: string;
  business_id: string;
  product_id: string;
  customer_email: string;
  customer_name: string | null;
  title: string | null;
  message_count: number;
  last_message_at: string | null;
  created_at: string;
  updated_at: string;
}

// ---------- Helpers ----------

function mapConversationRow(row: ConversationRow): ChatConversation {
  return {
    id: row.id,
    businessId: row.business_id,
    productId: row.product_id,
    customerEmail: row.customer_email,
    customerName: row.customer_name,
    title: row.title,
    messageCount: row.message_count,
    lastMessageAt: row.last_message_at ?? row.created_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ---------- GET — list conversations for a customer ----------

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
): Promise<NextResponse<ApiResponse<ChatConversation[]>>> {
  try {
    const { businessId } = await params;
    const { searchParams } = new URL(request.url);

    const parsed = getConversationsSchema.safeParse({
      productId: searchParams.get("productId"),
      customerEmail: searchParams.get("customerEmail"),
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

    const { productId, customerEmail } = parsed.data;
    const supabase = createServiceClient();

    // Verify product belongs to business
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const { data: conversations, error: fetchError } = await supabase
      .from("chatbot_conversations")
      .select("*")
      .eq("product_id", productId)
      .eq("customer_email", customerEmail)
      .order("updated_at", { ascending: false });

    if (fetchError) {
      return NextResponse.json(
        {
          error: {
            code: "FETCH_FAILED",
            message: "Failed to fetch conversations",
          },
        },
        { status: 500 }
      );
    }

    const mapped = (
      (conversations as unknown as ConversationRow[]) ?? []
    ).map(mapConversationRow);

    return NextResponse.json({ data: mapped });
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

// ---------- POST — create a new conversation ----------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
): Promise<NextResponse<ApiResponse<ChatConversation>>> {
  try {
    const { businessId } = await params;

    const body: unknown = await request.json();
    const parsed = createConversationSchema.safeParse(body);

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

    const { productId, customerEmail, customerName, title } = parsed.data;
    const supabase = createServiceClient();

    // Verify product belongs to business
    const { data: product } = await supabase
      .from("products")
      .select("id")
      .eq("id", productId)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .single();

    if (!product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const { data: conversation, error: insertError } = await supabase
      .from("chatbot_conversations")
      .insert({
        business_id: businessId,
        product_id: productId,
        customer_email: customerEmail,
        customer_name: customerName ?? null,
        title: title ?? null,
        message_count: 0,
        last_message_at: new Date().toISOString(),
      })
      .select("*")
      .single();

    if (insertError || !conversation) {
      return NextResponse.json(
        {
          error: {
            code: "CREATE_FAILED",
            message: "Failed to create conversation",
          },
        },
        { status: 500 }
      );
    }

    const mapped = mapConversationRow(
      conversation as unknown as ConversationRow
    );

    return NextResponse.json({ data: mapped }, { status: 201 });
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
