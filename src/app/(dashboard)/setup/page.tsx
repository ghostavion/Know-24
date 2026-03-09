"use client";

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
    knowledgeIntake,
    analysisLoading,
    selectedProductTypes,
  } = useSetupWizard();

  const handleBack = () => {
    if (currentStep > 1) {
      setStep(currentStep - 1);
    }
  };

  const handleNext = () => {
    if (currentStep < 5) {
      setStep(currentStep + 1);
    }
  };

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
          Let&apos;s build your knowledge business in 5 easy steps.
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
        />
      )}
    </div>
  );
};

export default SetupPage;
