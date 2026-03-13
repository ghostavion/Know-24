"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import { useSetupWizard } from "@/hooks/useSetupWizard";
import SetupProgress from "@/components/setup/SetupProgress";
import StepNavigation from "@/components/setup/StepNavigation";
import NicheSelectionStep from "@/components/setup/NicheSelectionStep";
import AIBuildProgress from "@/components/setup/AIBuildProgress";
import ReviewAndLaunch from "@/components/setup/ReviewAndLaunch";

const STEP_COMPONENTS: Record<number, React.ComponentType> = {
  1: NicheSelectionStep,
  2: AIBuildProgress,
  3: ReviewAndLaunch,
};

const SetupPage = () => {
  const {
    currentStep,
    setStep,
    businessId,
    businessName,
    setBusinessInfo,
  } = useSetupWizard();

  const [initialLoading, setInitialLoading] = useState(true);

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
        // Ignore — user will create via niche selection
      } finally {
        setInitialLoading(false);
      }
    };

    checkExistingBusiness();
  }, [businessId, setBusinessInfo]);

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setStep(currentStep + 1);
    }
  };

  const getNextDisabled = (): boolean => {
    switch (currentStep) {
      case 1:
        return !businessId;
      case 3:
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

  // 3-step wizard
  const StepComponent = STEP_COMPONENTS[currentStep];
  const isAIBuildStep = currentStep === 2;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold text-foreground">
          Build Your Business
        </h1>
        <p className="mt-2 text-muted-foreground">
          {businessName
            ? `Setting up \u201c${businessName}\u201d in 3 easy steps.`
            : "Let\u2019s build your knowledge business in 3 easy steps."}
        </p>
      </div>

      {/* Progress indicator */}
      <SetupProgress currentStep={currentStep} />

      {/* Current step content */}
      <div className="mt-8">
        {StepComponent && <StepComponent />}
      </div>

      {/* Navigation — hidden during AI Build (step 2, auto-advances) */}
      {!isAIBuildStep && (
        <StepNavigation
          currentStep={currentStep}
          totalSteps={3}
          onBack={handleBack}
          onNext={handleNext}
          nextLabel={currentStep === 3 ? "Go Live" : undefined}
          nextDisabled={getNextDisabled()}
        />
      )}
    </div>
  );
};

export default SetupPage;
