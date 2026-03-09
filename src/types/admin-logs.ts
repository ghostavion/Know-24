export type EventCategory =
  | "AUTH"
  | "USER_ACTION"
  | "UI"
  | "DATA"
  | "LLM"
  | "API"
  | "ERROR"
  | "SYSTEM"
  | "SECURITY";

export type LogStatus = "success" | "failure" | "error" | "warning" | "info";

export interface PlatformLog {
  id: string;
  timestamp: string;
  event_category: EventCategory;
  event_type: string;
  user_id: string | null;
  clerk_user_id: string | null;
  session_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  geo_country: string | null;
  geo_city: string | null;
  page_url: string | null;
  page_route: string | null;
  status: LogStatus | null;
  duration_ms: number | null;
  business_id: string | null;
  organization_id: string | null;
  payload: Record<string, unknown>;
  error_code: string | null;
  error_message: string | null;
  environment: string;
  created_at: string;
  // Joined fields (not in table)
  user_email?: string | null;
  business_name?: string | null;
}

export interface LLMCallPayload {
  call_id: string;
  model: string;
  feature: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  latency_ms?: number;
  finish_reason?: string;
}
