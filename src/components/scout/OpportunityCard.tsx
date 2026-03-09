"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { ScoutOpportunity } from "@/types/scout";

interface OpportunityCardProps {
  opportunity: ScoutOpportunity;
  onUpdateStatus: (id: string, status: string, editedDraft?: string) => void;
}

const PLATFORM_COLORS: Record<string, string> = {
  reddit: "bg-orange-100 text-orange-700",
  twitter: "bg-blue-100 text-blue-600",
  linkedin: "bg-blue-200 text-blue-800",
  quora: "bg-red-100 text-red-700",
  podcasts: "bg-purple-100 text-purple-700",
  news: "bg-gray-100 text-gray-700",
};

const TYPE_LABELS: Record<string, string> = {
  hot_thread: "Hot Thread",
  influencer_match: "Influencer",
  podcast_opportunity: "Podcast",
  trending_topic: "Trending",
  community_engagement: "Community",
  competitor_activity: "Competitor",
};

const STATUS_STYLES: Record<string, string> = {
  approved: "bg-green-100 text-green-700",
  dismissed: "bg-gray-100 text-gray-500",
  acted: "bg-blue-100 text-blue-700",
};

export const OpportunityCard = ({
  opportunity,
  onUpdateStatus,
}: OpportunityCardProps) => {
  const [contextExpanded, setContextExpanded] = useState(false);
  const [draftExpanded, setDraftExpanded] = useState(false);
  const [editedDraft, setEditedDraft] = useState(
    opportunity.draftResponse ?? ""
  );

  const platformClass =
    PLATFORM_COLORS[opportunity.platform.toLowerCase()] ??
    "bg-gray-100 text-gray-700";

  const typeLabel = TYPE_LABELS[opportunity.type] ?? opportunity.type;

  const relevanceColor =
    opportunity.relevanceScore >= 70
      ? "bg-green-500"
      : opportunity.relevanceScore >= 40
        ? "bg-yellow-500"
        : "bg-red-500";

  const isActedOn = opportunity.status !== "pending";

  const handleApprove = () => {
    onUpdateStatus(opportunity.id, "approved");
  };

  const handleDismiss = () => {
    onUpdateStatus(opportunity.id, "dismissed");
  };

  const handleSaveDraft = () => {
    onUpdateStatus(opportunity.id, "approved", editedDraft);
    setDraftExpanded(false);
  };

  return (
    <div className="rounded-xl border bg-card p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2 flex-wrap">
        <span
          className={cn("rounded-full px-2.5 py-0.5 text-xs font-medium", platformClass)}
        >
          {opportunity.platform}
        </span>
        <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
          {typeLabel}
        </span>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className={cn("size-2.5 rounded-full", relevanceColor)}
            title={`Relevance: ${opportunity.relevanceScore}`}
          />
          <span className="text-xs text-muted-foreground">
            {opportunity.relevanceScore}
          </span>
        </div>
        {isActedOn && (
          <span
            className={cn(
              "rounded-full px-2 py-0.5 text-xs font-medium capitalize",
              STATUS_STYLES[opportunity.status] ?? "bg-gray-100 text-gray-500"
            )}
          >
            {opportunity.status}
          </span>
        )}
      </div>

      {/* Title */}
      <div>
        {opportunity.url ? (
          <a
            href={opportunity.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold hover:underline"
          >
            {opportunity.title}
          </a>
        ) : (
          <p className="text-sm font-bold">{opportunity.title}</p>
        )}
      </div>

      {/* Context */}
      {opportunity.context && (
        <div>
          <p
            className={cn(
              "text-sm text-muted-foreground",
              !contextExpanded && "line-clamp-3"
            )}
          >
            {opportunity.context}
          </p>
          {opportunity.context.length > 200 && (
            <button
              type="button"
              onClick={() => setContextExpanded((prev) => !prev)}
              className="mt-1 text-xs font-medium text-primary hover:underline"
            >
              {contextExpanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>
      )}

      {/* Suggested Moves */}
      {opportunity.suggestedMoves.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-muted-foreground mb-1">
            Suggested Moves
          </p>
          <ul className="list-disc list-inside space-y-0.5">
            {opportunity.suggestedMoves.map((move, idx) => (
              <li key={idx} className="text-sm text-foreground">
                {move}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Draft Response */}
      {draftExpanded && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-muted-foreground">
            Draft Response
          </p>
          <textarea
            className="w-full rounded-lg border bg-background p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 min-h-[100px] resize-y"
            value={editedDraft}
            onChange={(e) => setEditedDraft(e.target.value)}
          />
          <div className="flex gap-2">
            <Button size="sm" onClick={handleSaveDraft}>
              Save &amp; Approve
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDraftExpanded(false)}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {!isActedOn && !draftExpanded && (
        <div className="flex gap-2 pt-1">
          <Button size="sm" onClick={handleApprove}>
            Approve
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDismiss}>
            Dismiss
          </Button>
          {opportunity.draftResponse && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setDraftExpanded(true)}
            >
              Edit Draft
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
