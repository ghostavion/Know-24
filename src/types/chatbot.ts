// ============================================================
// Chatbot Product Types
// ============================================================

// Chatbot configuration (stored on products table, fields: chatbot_system_prompt, chatbot_personality)
export interface ChatbotConfig {
  productId: string;
  businessId: string;
  systemPrompt: string | null;
  personality: string | null;
  knowledgeScopeIds: string[]; // knowledge_item IDs to include
  suggestProducts: boolean;
  maxResponseTokens: number;
}

// Conversation
export interface ChatConversation {
  id: string;
  businessId: string;
  productId: string;
  customerEmail: string;
  customerName: string | null;
  title: string | null;
  messageCount: number;
  lastMessageAt: string;
  createdAt: string;
  updatedAt: string;
}

// Chat message
export type ChatMessageRole = "user" | "assistant" | "system";

export interface ChatMessage {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

// Product recommendation embedded in chat
export interface ChatProductRecommendation {
  productId: string;
  title: string;
  slug: string;
  tagline: string | null;
  priceCents: number | null;
  pricingModel: string;
}

// Chatbot access check
export interface ChatbotAccessResult {
  hasAccess: boolean;
  reason: "active_subscription" | "purchased" | "free_access" | "no_access";
  customerId: string | null;
}

// RAG types
export interface RetrievedChunk {
  id: string;
  content: string;
  similarity: number;
  knowledgeItemId: string;
  sourceTitle: string | null;
}

export interface ChatbotPageData {
  businessId: string;
  businessName: string;
  productId: string;
  productTitle: string;
  personality: string | null;
  storefrontSlug: string;
  accentColor: string;
}

// Request/response
export interface StartChatRequest {
  productId: string;
  customerEmail: string;
  customerName?: string;
}

export interface ChatbotConfigUpdateRequest {
  systemPrompt?: string;
  personality?: string;
  knowledgeScopeIds?: string[];
  suggestProducts?: boolean;
  maxResponseTokens?: number;
}
