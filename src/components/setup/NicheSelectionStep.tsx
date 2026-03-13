"use client";

import { useState } from "react";
import {
  Heart,
  DollarSign,
  TrendingUp,
  Code,
  GraduationCap,
  Palette,
  UtensilsCrossed,
  Briefcase,
  Users,
  Home,
  Dumbbell,
  Brain,
  Check,
  Mic,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import { cn } from "@/lib/utils";
import VoiceMemoRecorder from "./VoiceMemoRecorder";

interface NicheCategory {
  slug: string;
  icon: typeof Heart;
  title: string;
  subtitle: string;
}

const NICHE_CATEGORIES: NicheCategory[] = [
  {
    slug: "health-wellness",
    icon: Heart,
    title: "Health & Wellness",
    subtitle: "Nutrition, holistic health, wellness coaching",
  },
  {
    slug: "finance-investing",
    icon: DollarSign,
    title: "Finance & Investing",
    subtitle: "Personal finance, stocks, crypto, wealth building",
  },
  {
    slug: "marketing-sales",
    icon: TrendingUp,
    title: "Marketing & Sales",
    subtitle: "Digital marketing, funnels, copywriting",
  },
  {
    slug: "technology-development",
    icon: Code,
    title: "Technology & Development",
    subtitle: "Software, AI, web development, SaaS",
  },
  {
    slug: "education-learning",
    icon: GraduationCap,
    title: "Education & Learning",
    subtitle: "Online courses, tutoring, skill development",
  },
  {
    slug: "creative-arts-design",
    icon: Palette,
    title: "Creative Arts & Design",
    subtitle: "Graphic design, photography, illustration",
  },
  {
    slug: "food-cooking",
    icon: UtensilsCrossed,
    title: "Food & Cooking",
    subtitle: "Recipes, meal planning, culinary arts",
  },
  {
    slug: "business-strategy",
    icon: Briefcase,
    title: "Business & Strategy",
    subtitle: "Entrepreneurship, leadership, consulting",
  },
  {
    slug: "parenting-family",
    icon: Users,
    title: "Parenting & Family",
    subtitle: "Child development, family life, parenting tips",
  },
  {
    slug: "real-estate",
    icon: Home,
    title: "Real Estate",
    subtitle: "Investing, flipping, property management",
  },
  {
    slug: "fitness-sports",
    icon: Dumbbell,
    title: "Fitness & Sports",
    subtitle: "Training programs, athletic performance",
  },
  {
    slug: "mental-health-mindfulness",
    icon: Brain,
    title: "Mental Health & Mindfulness",
    subtitle: "Therapy, meditation, stress management",
  },
];

interface NicheSelectionStepProps {
  className?: string;
}

const NicheSelectionStep = ({ className }: NicheSelectionStepProps) => {
  const [selectedNiche, setSelectedNiche] = useState<string | null>(null);
  const [customNiche, setCustomNiche] = useState("");
  const [personalContext, setPersonalContext] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showVoiceRecorder, setShowVoiceRecorder] = useState(false);

  const { businessId, setBusinessInfo, setStep } = useSetupWizard();

  const activeNiche = customNiche.trim() ? "custom" : selectedNiche;
  const nicheSlug = customNiche.trim() || selectedNiche;

  const handleCardClick = (slug: string) => {
    setSelectedNiche(slug);
    setCustomNiche("");
    setError(null);
  };

  const handleCustomNicheChange = (value: string) => {
    setCustomNiche(value);
    if (value.trim()) {
      setSelectedNiche(null);
    }
    setError(null);
  };

  const handleSubmit = async () => {
    if (!nicheSlug) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/setup/niche-select", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nicheSlug,
          personalContext: personalContext.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || `Request failed (${res.status})`);
      }

      const data = await res.json();

      setBusinessInfo({
        id: data.businessId,
        name: data.businessName || "",
        slug: data.businessSlug || "",
        niche: nicheSlug,
      });

      setStep(2);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVoiceUploaded = (voiceMemoId: string) => {
    setShowVoiceRecorder(false);
    // Voice memo has been uploaded and associated with the business
  };

  return (
    <div className={cn("space-y-6", className)}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-lg font-semibold">What&apos;s your niche?</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Pick a category that best describes your expertise. We&apos;ll tailor everything to fit.
        </p>
      </div>

      {/* Niche grid */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {NICHE_CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const isSelected = selectedNiche === cat.slug && !customNiche.trim();

          return (
            <button
              key={cat.slug}
              type="button"
              onClick={() => handleCardClick(cat.slug)}
              className={cn(
                "relative flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
                isSelected
                  ? "border-[#0891b2] bg-[#0891b2]/5 shadow-sm"
                  : "border-border hover:border-[#0891b2]/50 hover:bg-muted/50"
              )}
            >
              {isSelected && (
                <div className="absolute right-2 top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#0891b2]">
                  <Check className="h-3 w-3 text-white" />
                </div>
              )}
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#0891b2]/10">
                <Icon className="h-5 w-5 text-[#0891b2]" />
              </div>
              <div>
                <h3 className="text-sm font-semibold leading-tight">{cat.title}</h3>
                <p className="mt-0.5 text-xs text-muted-foreground">{cat.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom niche input */}
      <div className="space-y-2">
        <label htmlFor="custom-niche" className="text-sm font-medium">
          Custom Niche
        </label>
        <input
          id="custom-niche"
          type="text"
          value={customNiche}
          onChange={(e) => handleCustomNicheChange(e.target.value)}
          placeholder="Type your own niche if it's not listed above..."
          className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/50"
        />
      </div>

      {/* Personal context textarea */}
      <div className="space-y-2">
        <label htmlFor="personal-context" className="text-sm font-medium">
          Add your personal angle{" "}
          <span className="font-normal text-muted-foreground">(optional)</span>
        </label>
        <textarea
          id="personal-context"
          value={personalContext}
          onChange={(e) => setPersonalContext(e.target.value)}
          placeholder="e.g. I'm a nurse with 15 years in pediatrics..."
          rows={3}
          className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/50"
        />
      </div>

      {/* Voice memo */}
      {!showVoiceRecorder ? (
        <Button
          variant="outline"
          onClick={() => setShowVoiceRecorder(true)}
          className="w-full"
        >
          <Mic className="h-4 w-4" />
          Record Voice Memo
        </Button>
      ) : businessId ? (
        <div className="rounded-xl border border-border p-4">
          <VoiceMemoRecorder
            businessId={businessId}
            onUploaded={handleVoiceUploaded}
          />
        </div>
      ) : (
        <div className="rounded-xl border border-border p-4">
          <p className="text-center text-sm text-muted-foreground">
            Select a niche and submit first to enable voice memo recording.
          </p>
          <Button
            variant="outline"
            onClick={() => setShowVoiceRecorder(false)}
            className="mt-2 w-full"
          >
            Close
          </Button>
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-center text-sm text-destructive">{error}</p>
      )}

      {/* Submit button */}
      <Button
        onClick={handleSubmit}
        disabled={!nicheSlug || isSubmitting}
        className="w-full bg-[#0891b2] text-white hover:bg-[#0891b2]/90"
        size="lg"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Setting up your niche...
          </>
        ) : (
          "Continue"
        )}
      </Button>
    </div>
  );
};

export default NicheSelectionStep;
