"use client";

import { Check } from "lucide-react";

import { cn } from "@/lib/utils";

const STEP_LABELS = ["Knowledge", "Analysis", "Products", "Building", "Go Live"];

interface SetupProgressProps {
  currentStep: number;
}

const SetupProgress = ({ currentStep }: SetupProgressProps) => {
  return (
    <nav aria-label="Setup progress" className="w-full py-4">
      <ol className="flex items-center justify-between">
        {STEP_LABELS.map((label, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isActive = stepNumber === currentStep;
          const isFuture = stepNumber > currentStep;

          return (
            <li
              key={label}
              className="flex flex-1 items-center last:flex-none"
            >
              <div className="flex flex-col items-center">
                {/* Step circle */}
                <div
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold",
                    isCompleted && "bg-[#0891b2] text-white",
                    isActive && "bg-[#0891b2] text-white",
                    isFuture && "border-2 border-gray-300 text-gray-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    stepNumber
                  )}
                </div>

                {/* Step label — hidden on mobile */}
                <span
                  className={cn(
                    "mt-1.5 hidden text-xs font-medium sm:block",
                    isCompleted && "text-[#0891b2]",
                    isActive && "text-[#0891b2]",
                    isFuture && "text-gray-400"
                  )}
                >
                  {label}
                </span>
              </div>

              {/* Connecting line (not after the last step) */}
              {stepNumber < STEP_LABELS.length && (
                <div
                  className={cn(
                    "mx-2 h-0.5 flex-1",
                    stepNumber < currentStep ? "bg-[#0891b2]" : "bg-gray-300"
                  )}
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

export default SetupProgress;
