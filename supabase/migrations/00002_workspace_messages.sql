-- AI Workspace conversation history
CREATE TABLE public.ai_workspace_messages (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id       UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
  user_id           UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role              TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system', 'tool')),
  content           TEXT NOT NULL,
  tool_calls        JSONB,
  tool_results      JSONB,
  action_type       TEXT,
  action_payload    JSONB,
  action_result     JSONB,
  input_tokens      INT,
  output_tokens     INT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_workspace_messages_business ON public.ai_workspace_messages(business_id);
CREATE INDEX idx_workspace_messages_user ON public.ai_workspace_messages(user_id);
CREATE INDEX idx_workspace_messages_created ON public.ai_workspace_messages(business_id, created_at DESC);

ALTER TABLE public.ai_workspace_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_messages_rw_business_member" ON public.ai_workspace_messages
  FOR ALL USING (business_id IN (SELECT auth.user_business_ids()));
