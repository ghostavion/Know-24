import { createServiceClient } from "@/lib/supabase/server";
import type { ChatbotAccessResult } from "@/types/chatbot";

/** Check if a customer has access to a chatbot product. */
export async function checkChatbotAccess(
  productId: string,
  customerEmail: string
): Promise<ChatbotAccessResult> {
  const supabase = createServiceClient();

  // Check if the product is free
  const { data: product } = await supabase
    .from("products")
    .select("id, pricing_model, price_cents, is_lead_magnet")
    .eq("id", productId)
    .single();

  if (!product) {
    return { hasAccess: false, reason: "no_access", customerId: null };
  }

  // Free products / lead magnets — always accessible
  if (
    product.is_lead_magnet ||
    product.pricing_model === "free" ||
    product.price_cents === 0
  ) {
    return { hasAccess: true, reason: "free_access", customerId: null };
  }

  // Find customer by email
  const { data: customer } = await supabase
    .from("customers")
    .select("id")
    .eq("email", customerEmail)
    .single();

  if (!customer) {
    return { hasAccess: false, reason: "no_access", customerId: null };
  }

  // Check for completed order
  const { data: order } = await supabase
    .from("orders")
    .select("id")
    .eq("product_id", productId)
    .eq("customer_id", customer.id)
    .eq("status", "completed")
    .limit(1)
    .single();

  if (order) {
    return {
      hasAccess: true,
      reason: "purchased",
      customerId: customer.id as string,
    };
  }

  return {
    hasAccess: false,
    reason: "no_access",
    customerId: customer.id as string,
  };
}

/** Get or create a customer record for chat sessions. */
export async function getOrCreateChatCustomer(
  email: string,
  name?: string
): Promise<string> {
  const supabase = createServiceClient();

  const { data: existing } = await supabase
    .from("customers")
    .select("id")
    .eq("email", email)
    .single();

  if (existing) return existing.id as string;

  const { data: created } = await supabase
    .from("customers")
    .insert({
      email,
      first_name: name ?? null,
    })
    .select("id")
    .single();

  return (created?.id as string) ?? "";
}
