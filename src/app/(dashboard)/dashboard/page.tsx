"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Sparkles, Package, Globe, Plus } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { SlideOverPanel } from "@/components/shared/SlideOverPanel";
import { WorkspaceChat } from "@/components/workspace/WorkspaceChat";
import { ProductSlideOver } from "@/components/dashboard/ProductSlideOver";
import type { DashboardBusiness } from "@/types/workspace";

interface ActiveSlideOver {
  type: "workspace" | "products";
  businessId: string;
  businessName: string;
}

interface StatusIndicatorProps {
  status: string;
}

const StatusIndicator = ({ status }: StatusIndicatorProps) => {
  const isLive = status === "active";
  return (
    <div className="flex items-center gap-1.5">
      <span
        className={cn(
          "size-2 rounded-full",
          isLive ? "bg-green-500" : "bg-yellow-500"
        )}
      />
      <span className="text-xs text-muted-foreground">
        {isLive ? "Live" : "Setup"}
      </span>
    </div>
  );
};

interface BusinessCardProps {
  business: DashboardBusiness;
  onOpenSlideOver: (type: "workspace" | "products", business: DashboardBusiness) => void;
}

const BusinessCard = ({ business, onOpenSlideOver }: BusinessCardProps) => {
  if (!business.onboardingCompleted) {
    return (
      <div className="rounded-xl border p-6">
        <div className="space-y-3">
          <h3 className="text-lg font-semibold">{business.name}</h3>
          <span className="inline-block rounded-full bg-muted px-2 py-0.5 text-xs">
            {business.niche}
          </span>
          <StatusIndicator status={business.status} />
          <p className="text-sm text-muted-foreground">
            Complete your business setup to unlock all features.
          </p>
        </div>
        <div className="mt-4">
          <Link
            href="/setup"
            className="inline-flex w-full items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Continue Setup
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border p-6">
      <div className="space-y-3">
        <h3 className="text-lg font-semibold">{business.name}</h3>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs">
            {business.niche}
          </span>
          <StatusIndicator status={business.status} />
        </div>
        <p className="text-sm text-muted-foreground">
          {business.productCount} {business.productCount === 1 ? "product" : "products"}
        </p>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => onOpenSlideOver("workspace", business)}
        >
          <Sparkles className="size-4" />
          AI Workspace
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => onOpenSlideOver("products", business)}
        >
          <Package className="size-4" />
          Products
        </Button>
        {business.storefrontUrl && (
          <a
            href={`/s/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1 text-sm font-medium transition-colors hover:bg-muted"
          >
            <Globe className="size-4" />
            Storefront
          </a>
        )}
      </div>
    </div>
  );
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border p-6">
    <div className="space-y-3">
      <div className="h-5 w-40 rounded bg-muted" />
      <div className="h-4 w-24 rounded bg-muted" />
      <div className="h-4 w-20 rounded bg-muted" />
    </div>
    <div className="mt-4 flex gap-2">
      <div className="h-8 w-28 rounded bg-muted" />
      <div className="h-8 w-24 rounded bg-muted" />
    </div>
  </div>
);

export default function DashboardPage() {
  const [businesses, setBusinesses] = useState<DashboardBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSlideOver, setActiveSlideOver] = useState<ActiveSlideOver | null>(null);

  const fetchBusinesses = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/businesses");
      const json: { data?: DashboardBusiness[]; error?: { message: string } } =
        await res.json();
      if (json.data) {
        setBusinesses(json.data);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchBusinesses();
  }, [fetchBusinesses]);

  const handleOpenSlideOver = (
    type: "workspace" | "products",
    business: DashboardBusiness
  ) => {
    setActiveSlideOver({
      type,
      businessId: business.id,
      businessName: business.name,
    });
  };

  const handleCloseSlideOver = () => {
    setActiveSlideOver(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </div>
    );
  }

  if (businesses.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-border bg-card p-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Plus className="h-6 w-6" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-foreground">
            No businesses yet
          </h3>
          <p className="mt-2 max-w-sm text-sm text-muted-foreground">
            Get started by creating your first knowledge business. Our AI will
            help you build products, a storefront, and marketing in under an hour.
          </p>
          <Link
            href="/setup"
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            <Plus className="h-4 w-4" />
            Setup My Business
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {businesses.map((business) => (
          <BusinessCard
            key={business.id}
            business={business}
            onOpenSlideOver={handleOpenSlideOver}
          />
        ))}
      </div>

      {/* Workspace Slide-Over */}
      <SlideOverPanel
        open={activeSlideOver?.type === "workspace"}
        onClose={handleCloseSlideOver}
        title="AI Workspace"
        subtitle={activeSlideOver?.businessName}
        width="wide"
      >
        {activeSlideOver?.type === "workspace" && (
          <WorkspaceChat
            businessId={activeSlideOver.businessId}
            businessName={activeSlideOver.businessName}
          />
        )}
      </SlideOverPanel>

      {/* Products Slide-Over */}
      <SlideOverPanel
        open={activeSlideOver?.type === "products"}
        onClose={handleCloseSlideOver}
        title="Products"
        subtitle={activeSlideOver?.businessName}
        width="wide"
      >
        {activeSlideOver?.type === "products" && (
          <ProductSlideOver
            businessId={activeSlideOver.businessId}
            businessName={activeSlideOver.businessName}
          />
        )}
      </SlideOverPanel>
    </div>
  );
}
