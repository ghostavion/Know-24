import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { streamText } from "ai";
import { primaryModel } from "@/lib/ai/providers";
import { createServiceClient } from "@/lib/supabase/server";
import { matchChunks, assembleContext } from "@/lib/rag/retrieval";
import {
  buildSystemPrompt,
  getRecommendableProducts,
} from "@/lib/ai/chatbot-prompt";
import { trackUsage } from "@/lib/usage-metering";
import type { ChatMessage, ChatConversation } from "@/types/chatbot";

// ---------- Zod schemas ----------

const chatBodySchema = z.object({
  productId: z.string().uuid("Invalid product ID"),
  conversationId: z.string().uuid("Invalid conversation ID").optional(),
  customerEmail: z.string().email("Invalid email"),
  customerName: z.string().max(200).optional(),
  message: z.string().min(1, "Message is required").max(10000),
});

// ---------- Row types ----------

interface ProductRow {
  id: string;
  title: string;
  business_id: string;
  status: string;
  pricing_model: string;
  is_lead_magnet: boolean;
  price_cents: number | null;
  chatbot_system_prompt: string | null;
  chatbot_personality: string | null;
  chatbot_knowledge_scope_ids: string[] | null;
  chatbot_suggest_products: boolean;
  chatbot_max_response_tokens: number;
  product_types: { slug: string } | null;
}

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

interface MessageRow {
  id: string;
  conversation_id: string;
  role: string;
  content: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface CustomerRow {
  id: string;
  email: string;
}

interface OrderRow {
  id: string;
  status: string;
}

// ---------- POST handler ----------

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessId: string }> }
): Promise<Response> {
  try {
    const { businessId } = await params;

    // 1. Validate input
    const body: unknown = await request.json();
    const parsed = chatBodySchema.safeParse(body);
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
      conversationId: incomingConversationId,
      customerEmail,
      customerName,
      message,
    } = parsed.data;

    const supabase = createServiceClient();

    // 2. Verify product exists, is active, belongs to this business, and is a chatbot
    const { data: product, error: productError } = await supabase
      .from("products")
      .select(
        "id, title, business_id, status, pricing_model, is_lead_magnet, price_cents, " +
          "chatbot_system_prompt, chatbot_personality, chatbot_knowledge_scope_ids, " +
          "chatbot_suggest_products, chatbot_max_response_tokens, product_types(slug)"
      )
      .eq("id", productId)
      .eq("business_id", businessId)
      .is("deleted_at", null)
      .single();

    if (productError || !product) {
      return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Product not found" } },
        { status: 404 }
      );
    }

    const typedProduct = product as unknown as ProductRow;

    if (typedProduct.status !== "active") {
      return NextResponse.json(
        { error: { code: "PRODUCT_INACTIVE", message: "Product is not active" } },
        { status: 403 }
      );
    }

    const productTypeSlug = typedProduct.product_types?.slug;
    if (productTypeSlug !== "chatbot") {
      return NextResponse.json(
        { error: { code: "INVALID_PRODUCT_TYPE", message: "Product is not a chatbot" } },
        { status: 400 }
      );
    }

    // 3. Check chatbot access
    const isFreeAccess =
      typedProduct.is_lead_magnet ||
      typedProduct.pricing_model === "free" ||
      typedProduct.price_cents === 0 ||
      typedProduct.price_cents === null;

    if (!isFreeAccess) {
      // Look up customer by email
      const { data: customer } = await supabase
        .from("customers")
        .select("id, email")
        .eq("email", customerEmail)
        .single();

      if (!customer) {
        return NextResponse.json(
          { error: { code: "ACCESS_DENIED", message: "No access to this chatbot" } },
          { status: 403 }
        );
      }

      const typedCustomer = customer as unknown as CustomerRow;

      // Check for a completed order
      const { data: order } = await supabase
        .from("orders")
        .select("id, status")
        .eq("product_id", productId)
        .eq("customer_id", typedCustomer.id)
        .eq("status", "completed")
        .limit(1)
        .single();

      const typedOrder = order as unknown as OrderRow | null;

      if (!typedOrder) {
        return NextResponse.json(
          { error: { code: "ACCESS_DENIED", message: "No access to this chatbot" } },
          { status: 403 }
        );
      }
    }

    // 4. Get or create conversation
    let conversationId = incomingConversationId;
    let messageCount = 0;

    if (conversationId) {
      // Verify existing conversation
      const { data: existingConv } = await supabase
        .from("chatbot_conversations")
        .select("id, message_count")
        .eq("id", conversationId)
        .eq("product_id", productId)
        .eq("customer_email", customerEmail)
        .single();

      const typedConv = existingConv as unknown as Pick<
        ConversationRow,
        "id" | "message_count"
      > | null;

      if (!typedConv) {
        return NextResponse.json(
          { error: { code: "NOT_FOUND", message: "Conversation not found" } },
          { status: 404 }
        );
      }

      messageCount = typedConv.message_count;
    } else {
      // Create new conversation
      const { data: newConv, error: convError } = await supabase
        .from("chatbot_conversations")
        .insert({
          business_id: businessId,
          product_id: productId,
          customer_email: customerEmail,
          customer_name: customerName ?? null,
          title: message.slice(0, 100),
          message_count: 0,
          last_message_at: new Date().toISOString(),
        })
        .select("id, message_count")
        .single();

      if (convError || !newConv) {
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

      const typedNewConv = newConv as unknown as Pick<
        ConversationRow,
        "id" | "message_count"
      >;
      conversationId = typedNewConv.id;
      messageCount = typedNewConv.message_count;
    }

    // 5. Save user message
    const { error: msgInsertError } = await supabase
      .from("chatbot_messages")
      .insert({
        conversation_id: conversationId,
        role: "user",
        content: message,
      });

    if (msgInsertError) {
      return NextResponse.json(
        { error: { code: "INSERT_FAILED", message: "Failed to save message" } },
        { status: 500 }
      );
    }

    messageCount += 1;

    // 6. Retrieve relevant knowledge chunks
    const scopeIds = typedProduct.chatbot_knowledge_scope_ids ?? [];
    const chunks = await matchChunks(message, businessId, {
      scopeIds,
    });
    const contextString = assembleContext(chunks);

    // 7. Build system prompt
    const { data: business } = await supabase
      .from("businesses")
      .select("name")
      .eq("id", businessId)
      .single();

    const businessName =
      (business as unknown as { name: string } | null)?.name ?? "this business";

    const recommendableProducts = typedProduct.chatbot_suggest_products
      ? await getRecommendableProducts(businessId, productId)
      : [];

    const systemPrompt = buildSystemPrompt({
      businessName,
      productTitle: typedProduct.title,
      systemPrompt: typedProduct.chatbot_system_prompt,
      personality: typedProduct.chatbot_personality,
      context: contextString,
      suggestProducts: typedProduct.chatbot_suggest_products ?? true,
      availableProducts: recommendableProducts,
    });

    // 8. Get conversation history (last 20 messages)
    const { data: historyRows } = await supabase
      .from("chatbot_messages")
      .select("role, content")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true })
      .limit(20);

    const conversationHistory: Array<{
      role: "user" | "assistant";
      content: string;
    }> = ((historyRows as unknown as MessageRow[]) ?? [])
      .filter((m) => m.role === "user" || m.role === "assistant")
      .map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      }));

    // 9. Track usage
    await trackUsage(businessId, "ai_chat");

    // 10. Stream response using Vercel AI SDK
    const result = streamText({
      model: primaryModel,
      system: systemPrompt,
      messages: conversationHistory,
      onFinish: async ({ text }) => {
        // Save assistant message
        await supabase.from("chatbot_messages").insert({
          conversation_id: conversationId,
          role: "assistant",
          content: text,
        });

        // Update conversation metadata
        await supabase
          .from("chatbot_conversations")
          .update({
            message_count: messageCount + 1,
            last_message_at: new Date().toISOString(),
          })
          .eq("id", conversationId);
      },
    });

    return result.toTextStreamResponse();
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
