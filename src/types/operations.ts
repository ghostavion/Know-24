// ---------------------------------------------------------------------------
// Operations & Analytics types – Milestone 8
// ---------------------------------------------------------------------------

// ---- Support ---------------------------------------------------------------

export type TicketStatus = "open" | "in_progress" | "resolved" | "closed"
export type TicketPriority = "low" | "normal" | "high" | "urgent"

export interface SupportTicket {
  id: string
  businessId: string
  customerEmail: string
  customerName: string | null
  subject: string
  body: string
  status: TicketStatus
  priority: TicketPriority
  assignedTo: string | null
  storefrontSlug: string | null
  repliesCount: number
  createdAt: string
  updatedAt: string
  closedAt: string | null
}

export interface TicketReply {
  id: string
  ticketId: string
  senderType: "customer" | "business"
  senderName: string | null
  body: string
  createdAt: string
}

export interface CreateTicketRequest {
  businessId: string
  customerEmail: string
  customerName?: string
  subject: string
  body: string
  storefrontSlug?: string
}

export interface ReplyToTicketRequest {
  body: string
}

// ---- Subscribers -----------------------------------------------------------

export interface SubscriberRecord {
  id: string
  businessId: string
  email: string
  name: string | null
  source: string | null
  subscribedAt: string
  unsubscribedAt: string | null
}

// ---- Sales Analytics -------------------------------------------------------

export type AnalyticsPeriod = "day" | "week" | "month"

export interface SalesDataPoint {
  date: string
  revenue: number // in cents
  orderCount: number
}

export interface RevenueByProduct {
  productId: string
  productTitle: string
  totalRevenue: number // in cents
  orderCount: number
  averageOrderValue: number
}

export interface SalesAnalytics {
  dataPoints: SalesDataPoint[]
  totalRevenue: number
  totalOrders: number
  averageOrderValue: number
  revenueByProduct: RevenueByProduct[]
}

// ---- Usage Metering --------------------------------------------------------

export type UsageEventType =
  | "ai_chat"
  | "social_post"
  | "scout_scan"
  | "email_sent"
  | "blog_generated"

export interface UsageMetrics {
  aiTokensUsed: number
  aiTokensCeiling: number
  socialPostsUsed: number
  socialPostsCeiling: number
  scoutScansUsed: number
  scoutScansCeiling: number
  usageResetAt: string
}

export interface UsageEvent {
  id: string
  businessId: string
  eventType: UsageEventType
  quantity: number
  metadata: Record<string, unknown>
  createdAt: string
}

// ---- Activity Feed ---------------------------------------------------------

export interface ActivityEvent {
  id: string
  businessId: string
  eventType: string
  title: string
  description: string | null
  metadata: Record<string, unknown>
  createdAt: string
}

// ---- KPI -------------------------------------------------------------------

export interface KpiData {
  label: string
  value: number
  previousValue: number | null
  changePercent: number | null
  sparklineData: number[]
}
