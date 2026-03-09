"use client";

import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface StepNavigationProps {
  currentStep: number;
  onBack: () => void;
  onNext: () => void;
  nextLabel?: string;
  nextDisabled?: boolean;
  nextLoading?: boolean;
}

const StepNavigation = ({
  currentStep,
  onBack,
  onNext,
  nextLabel,
  nextDisabled = false,
  nextLoading = false,
}: StepNavigationProps) => {
  const resolvedNextLabel = nextLabel ?? (currentStep === 5 ? "Go Live" : "Continue");

  return (
    <div className="flex items-center justify-between border-t border-border py-4">
      {/* Back button — hidden on step 1 */}
      <div>
        {currentStep > 1 && (
          <Button variant="ghost" onClick={onBack}>
            Back
          </Button>
        )}
      </div>

      {/* Continue / Go Live button */}
      <Button
        onClick={onNext}
        disabled={nextDisabled || nextLoading}
        className={cn(nextLoading && "gap-2")}
      >
        {nextLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        {resolvedNextLabel}
      </Button>
    </div>
  );
};

export default StepNavigation;
