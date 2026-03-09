export interface ChatMessage {
  id: string
  role: "user" | "assistant" | "system" | "tool"
  content: string
  toolCalls?: ToolCall[]
  toolResults?: ToolResult[]
  createdAt: string
}

export interface ToolCall {
  id: string
  name: string
  args: Record<string, unknown>
}

export interface ToolResult {
  id: string
  name: string
  result: Record<string, unknown>
}

export interface BusinessSummary {
  id: string
  name: string
  slug: string
  niche: string
  status: string
  storefrontUrl: string
  productCount: number
  totalRevenue: number
  subscriberCount: number
}

export interface DashboardBusiness {
  id: string
  name: string
  slug: string
  niche: string
  status: string
  onboardingCompleted: boolean
  productCount: number
  storefrontUrl: string | null
  createdAt: string
}
