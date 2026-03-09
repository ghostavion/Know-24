// Social post generation
export type PostLength = "short" | "medium" | "long";
export type PostPlatform = "twitter" | "linkedin" | "facebook" | "instagram";

export interface GeneratePostRequest {
  businessId: string;
  productId?: string;
  platform: PostPlatform;
  length: PostLength;
  topic?: string;
  generateImage?: boolean;
}

export interface GeneratedPost {
  content: string;
  platform: PostPlatform;
  length: PostLength;
  characterCount: number;
}

export interface SocialPost {
  id: string;
  businessId: string;
  productId: string | null;
  content: string;
  imageUrl: string | null;
  platform: PostPlatform;
  length: PostLength;
  status: "draft" | "published" | "scheduled";
  scheduledAt: string | null;
  createdAt: string;
}

// Blog
export interface BlogPost {
  id: string;
  businessId: string;
  title: string;
  slug: string;
  excerpt: string | null;
  body: string;
  coverImageUrl: string | null;
  metaTitle: string | null;
  metaDescription: string | null;
  authorName: string | null;
  isAiGenerated: boolean;
  status: "draft" | "published" | "archived";
  publishedAt: string | null;
  viewCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface GenerateBlogRequest {
  businessId: string;
  topic: string;
  tone?: string;
  wordCount?: number;
}

// Email sequences
export type EmailSequenceType = "welcome" | "nurture" | "product_launch" | "re_engagement" | "custom";

export interface EmailSequence {
  id: string;
  businessId: string;
  type: EmailSequenceType;
  name: string;
  subjectTemplate: string;
  bodyTemplate: string;
  delayHours: number;
  sortOrder: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface EmailSequenceEmail {
  id: string;
  sequenceId: string;
  businessId: string;
  recipientEmail: string;
  status: "pending" | "sent" | "failed" | "bounced";
  sentAt: string | null;
  createdAt: string;
}

// Referrals
export interface ReferralLink {
  id: string;
  businessId: string;
  productId: string | null;
  code: string;
  clicks: number;
  signups: number;
  purchases: number;
  commissionRate: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ReferralConversion {
  id: string;
  linkId: string;
  businessId: string;
  customerId: string | null;
  orderId: string | null;
  commissionCents: number;
  status: "pending" | "approved" | "paid" | "rejected";
  paidAt: string | null;
  createdAt: string;
}

// Marketing overview stats
export interface MarketingStats {
  totalPosts: number;
  totalBlogPosts: number;
  totalEmailsSent: number;
  totalReferralClicks: number;
  totalReferralRevenue: number;
}

// Schema markup
export interface SchemaMarkup {
  type: "FAQPage" | "Person" | "Product" | "Organization";
  jsonLd: Record<string, unknown>;
}
