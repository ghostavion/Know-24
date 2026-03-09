export interface ScoutScan {
  id: string;
  businessId: string;
  scanAt: string;
  platforms: string[];
  opportunitiesFound: number;
  status: "pending" | "running" | "completed" | "failed";
  errorMessage: string | null;
  createdAt: string;
}

export type OpportunityType =
  | "hot_thread"
  | "influencer_match"
  | "podcast_opportunity"
  | "trending_topic"
  | "community_engagement"
  | "competitor_activity";

export type OpportunityStatus =
  | "pending"
  | "approved"
  | "dismissed"
  | "acted";

export interface ScoutOpportunity {
  id: string;
  scanId: string;
  businessId: string;
  platform: string;
  type: OpportunityType;
  title: string;
  url: string | null;
  relevanceScore: number;
  context: string | null;
  suggestedMoves: string[];
  draftResponse: string | null;
  status: OpportunityStatus;
  createdAt: string;
}

export interface PlatformResult {
  platform: string;
  type: OpportunityType;
  title: string;
  url: string | null;
  context: string;
  relevanceHint: string;
}

export interface ScoutConfig {
  businessId: string;
  businessName: string;
  niche: string;
  keywords: string[];
}
