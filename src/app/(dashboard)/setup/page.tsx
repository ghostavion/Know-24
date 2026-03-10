"use client";

import { useEffect, useState, useCallback } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { useSetupWizard } from "@/hooks/useSetupWizard";
import SetupProgress from "@/components/setup/SetupProgress";
import StepNavigation from "@/components/setup/StepNavigation";
import KnowledgeIntakeStep from "@/components/setup/KnowledgeIntakeStep";
import AIAnalysisStep from "@/components/setup/AIAnalysisStep";
import ProductSelectionStep from "@/components/setup/ProductSelectionStep";
import AIBuildingStep from "@/components/setup/AIBuildingStep";
import GoLiveStep from "@/components/setup/GoLiveStep";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: KnowledgeIntakeStep,
  2: AIAnalysisStep,
  3: ProductSelectionStep,
  4: AIBuildingStep,
  5: GoLiveStep,
};

const SetupPage = () => {
  const {
    currentStep,
    setStep,
    businessId,
    businessName,
    knowledgeIntake,
    analysisLoading,
    selectedProductTypes,
    setBusinessInfo,
  } = useSetupWizard();

  // Business creation state
  const [nameInput, setNameInput] = useState("");
  const [nicheInput, setNicheInput] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");
  const [initialLoading, setInitialLoading] = useState(true);

  // Step transition loading
  const [stepLoading, setStepLoading] = useState(false);

  // Check for existing business on mount
  useEffect(() => {
    if (businessId) {
      setInitialLoading(false);
      return;
    }

    const checkExistingBusiness = async () => {
      try {
        const res = await fetch("/api/businesses");
        if (res.ok) {
          const json = await res.json();
          const businesses = json.data;
          if (businesses && businesses.length > 0) {
            const setupBiz =
              businesses.find(
                (b: { onboardingCompleted: boolean }) => !b.onboardingCompleted
              ) ?? businesses[0];
            setBusinessInfo({
              id: setupBiz.id,
              name: setupBiz.name,
              slug: setupBiz.slug,
              niche: setupBiz.niche,
            });
          }
        }
      } catch {
        // Ignore — user will create a new business
      } finally {
        setInitialLoading(false);
      }
    };

    checkExistingBusiness();
  }, [businessId, setBusinessInfo]);

  // Create business handler
  const handleCreateBusiness = useCallback(async () => {
    const name = nameInput.trim();
    const niche = nicheInput.trim();
    if (!name || !niche) return;

    setCreating(true);
    setCreateError("");

    try {
      const res = await fetch("/api/setup/business", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, niche }),
      });

      const json = await res.json();

      if (!res.ok) {
        setCreateError(json.error?.message ?? "Failed to create business");
        return;
      }

      setBusinessInfo({
        id: json.data.id,
        name: json.data.name,
        slug: json.data.slug,
        niche: json.data.niche,
      });
    } catch {
      setCreateError("Network error — please try again");
    } finally {
      setCreating(false);
    }
  }, [nameInput, nicheInput, setBusinessInfo]);

  // Handle step transitions with API calls
  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleNext = useCallback(async () => {
    if (currentStep >= 5) {
      // Go Live — handled by GoLiveStep component
      return;
    }

    if (currentStep === 1 && businessId) {
      // Step 1 → 2: Submit URLs as knowledge items
      setStepLoading(true);
      try {
        for (const url of knowledgeIntake.urls) {
          try {
            await fetch("/api/upload/url", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ businessId, url }),
            });
          } catch {
            // Best-effort — continue even if individual URL fails
          }
        }
      } finally {
        setStepLoading(false);
      }
    }

    setStep(currentStep + 1);
  }, [currentStep, businessId, knowledgeIntake.urls, setStep]);

  const getNextDisabled = (): boolean => {
    switch (currentStep) {
      case 1: {
        const hasUrls = knowledgeIntake.urls.length > 0;
        const hasFiles = knowledgeIntake.uploadedFiles.length > 0;
        const hasVideos = knowledgeIntake.videoLinks.length > 0;
        const hasInterview = knowledgeIntake.interviewCompleted;
        return !(hasUrls || hasFiles || hasVideos || hasInterview);
      }
      case 2:
        return analysisLoading;
      case 3:
        return selectedProductTypes.length === 0;
      case 5:
        return false;
      default:
        return false;
    }
  };

  // Initial loading state
  if (initialLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Business creation step (Step 0)
  if (!businessId) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Let&apos;s Get Started
          </h1>
          <p className="mt-2 text-muted-foreground">
            Tell us about your knowledge business.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="business-name"
              className="mb-1.5 block text-sm font-medium"
            >
              Business Name
            </label>
            <input
              id="business-name"
              type="text"
              value={nameInput}
              onChange={(e) => setNameInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBusiness();
              }}
              placeholder="e.g. Fitness Mastery Academy"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/50"
            />
          </div>

          <div>
            <label
              htmlFor="business-niche"
              className="mb-1.5 block text-sm font-medium"
            >
              Niche / Industry
            </label>
            <input
              id="business-niche"
              type="text"
              value={nicheInput}
              onChange={(e) => setNicheInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateBusiness();
              }}
              placeholder="e.g. Personal Fitness & Nutrition"
              className="h-10 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:border-[#0891b2] focus:ring-1 focus:ring-[#0891b2]/50"
            />
          </div>

          {createError && (
            <p className="text-sm text-red-500">{createError}</p>
          )}

          <Button
            onClick={handleCreateBusiness}
            disabled={!nameInput.trim() || !nicheInput.trim() || creating}
            className="w-full gap-2"
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "Creating..." : "Create My Business"}
          </Button>
        </div>
      </div>
    );
  }

  // 5-step wizard
  const StepComponent = STEP_COMPONENTS[currentStep];
  const isAIBuildingStep = currentStep === 4;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Setup My Business
        </h1>
        <p className="mt-2 text-muted-foreground">
          {businessName
            ? `Setting up \u201c${businessName}\u201d in 5 easy steps.`
            : "Let\u2019s build your knowledge business in 5 easy steps."}
        </p>
      </div>

      {/* Progress indicator */}
      <SetupProgress currentStep={currentStep} />

      {/* Current step content */}
      <div className="mt-8">
        {StepComponent && <StepComponent />}
      </div>

      {/* Navigation — hidden during AI Building (step 4) */}
      {!isAIBuildingStep && (
        <StepNavigation
          currentStep={currentStep}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={currentStep === 5 ? "Go Live" : undefined}
          nextDisabled={getNextDisabled()}
          nextLoading={stepLoading}
        />
      )}
    </div>
  );
};

export default SetupPage;
