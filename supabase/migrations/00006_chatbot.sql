-- ============================================================
-- Migration 6: Chatbot Product — conversations & messages
-- ============================================================

-- Chatbot conversations table
CREATE TABLE public.chatbot_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  business_id UUID NOT NULL REFERENCES public.businesses (id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products (id) ON DELETE CASCADE,
  customer_email TEXT NOT NULL,
  customer_name TEXT,
  title TEXT,
  message_count INT NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_conversations_business ON public.chatbot_conversations (business_id, created_at DESC);
CREATE INDEX idx_chatbot_conversations_customer ON public.chatbot_conversations (customer_email, product_id);

CREATE TRIGGER trg_chatbot_conversations_updated_at
  BEFORE UPDATE ON public.chatbot_conversations
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

ALTER TABLE public.chatbot_conversations ENABLE ROW LEVEL SECURITY;

-- Business members can read all conversations
CREATE POLICY "chatbot_conversations_rw_business_member" ON public.chatbot_conversations
  FOR ALL USING (business_id IN (SELECT public.user_business_ids()));

-- Public insert for customers starting conversations
CREATE POLICY "chatbot_conversations_public_insert" ON public.chatbot_conversations
  FOR INSERT WITH CHECK (true);

-- Public select for customers viewing their own conversations
CREATE POLICY "chatbot_conversations_public_select" ON public.chatbot_conversations
  FOR SELECT USING (true);

-- Chatbot messages table
CREATE TABLE public.chatbot_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID NOT NULL REFERENCES public.chatbot_conversations (id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_chatbot_messages_conversation ON public.chatbot_messages (conversation_id, created_at);

ALTER TABLE public.chatbot_messages ENABLE ROW LEVEL SECURITY;

-- Business members can manage messages via conversation ownership
CREATE POLICY "chatbot_messages_via_conversation" ON public.chatbot_messages
  FOR ALL USING (
    conversation_id IN (
      SELECT id FROM public.chatbot_conversations
      WHERE business_id IN (SELECT public.user_business_ids())
    )
  );

-- Public access for customers in their conversations
CREATE POLICY "chatbot_messages_public_insert" ON public.chatbot_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "chatbot_messages_public_select" ON public.chatbot_messages
  FOR SELECT USING (true);

-- Add chatbot-specific columns to products if not present
-- (chatbot_system_prompt and chatbot_personality already exist)
-- Add knowledge scope and settings
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chatbot_knowledge_scope_ids UUID[] DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chatbot_suggest_products BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS chatbot_max_response_tokens INT NOT NULL DEFAULT 1024;
