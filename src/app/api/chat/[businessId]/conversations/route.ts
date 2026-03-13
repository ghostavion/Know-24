import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@clerk/nextjs/server";
import { createServiceClient } from "@/lib/supabase/server";
import { resolveUserId } from "@/lib/auth/resolve-user";
import { checkRateLimit } from "@/lib/rate-limit";
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
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    // Auth check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { businessId } = await params;
    const supabase = createServiceClient();

    // Resolve internal user ID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    if (business.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to access this business" } },
        { status: 403 }
      );
    }

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
    // Rate limiting
    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    const rlResult = await checkRateLimit(ip, "api");
    if (!rlResult.success) {
      return NextResponse.json(
        { error: { code: "RATE_LIMITED", message: "Too many requests" } },
        { status: 429, headers: { "Retry-After": String(Math.ceil((rlResult.reset - Date.now()) / 1000)) } }
      );
    }

    // Auth check
    const { userId: clerkUserId } = await auth();
    if (!clerkUserId) {
      return NextResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Not authenticated" } },
        { status: 401 }
      );
    }

    const { businessId } = await params;
    const supabase = createServiceClient();

    // Resolve internal user ID
    const userId = await resolveUserId(supabase, clerkUserId);
    if (!userId) {
      return NextResponse.json(
        { error: { code: "USER_NOT_FOUND", message: "User record not found. Please sign out and sign back in." } },
        { status: 404 }
      );
    }

    // Verify business ownership
    const { data: business, error: bizError } = await supabase
      .from("businesses")
      .select("owner_id")
      .eq("id", businessId)
      .single();

    if (bizError || !business) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Business not found" } },
        { status: 404 }
      );
    }

    if (business.owner_id !== userId) {
      return NextResponse.json(
        { error: { code: "FORBIDDEN", message: "Not authorized to access this business" } },
        { status: 403 }
      );
    }

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
