"use client";

import { Button } from "@/components/ui/button";

interface ScoutUpsellProps {
  businessId: string;
}

const FEATURES = [
  "Multi-platform scanning",
  "AI relevance scoring",
  "Draft responses",
  "20 scans/month",
];

export const ScoutUpsell = ({ businessId: _businessId }: ScoutUpsellProps) => {
  const handleActivate = () => {
    // MVP: direct users to support or settings
    window.open("/settings/billing", "_blank");
  };

  return (
    <div className="rounded-xl border bg-card p-8 text-center space-y-5 max-w-md mx-auto">
      {/* Radar Icon */}
      <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10">
        <div className="size-6 rounded-full border-[3px] border-primary border-t-transparent animate-spin" />
      </div>

      <h3 className="text-xl font-bold">Unlock Scout</h3>

      <p className="text-sm text-muted-foreground leading-relaxed">
        Scout monitors Reddit, Twitter, LinkedIn, Quora, podcasts, and news for
        opportunities relevant to your niche. Get AI-drafted responses ready to
        post.
      </p>

      <p className="text-2xl font-bold">
        $199<span className="text-sm font-normal text-muted-foreground">/month add-on</span>
      </p>

      <ul className="space-y-2 text-left">
        {FEATURES.map((feature) => (
          <li
            key={feature}
            className="flex items-center gap-2 text-sm text-foreground"
          >
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-100 text-green-600 text-xs font-bold">
              &#10003;
            </span>
            {feature}
          </li>
        ))}
      </ul>

      <Button className="w-full" onClick={handleActivate}>
        Activate Scout
      </Button>

      <p className="text-xs text-muted-foreground">
        Contact support to enable Scout for your organization.
      </p>
    </div>
  );
};
