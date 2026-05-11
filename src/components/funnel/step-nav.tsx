"use client";

import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { FUNNEL_STEPS } from "@/lib/constants";
import { useFunnelStore } from "@/lib/store";

interface StepNavProps {
  onNext?: () => boolean | void;
  onBack?: () => void;
  nextLabel?: string;
  backLabel?: string;
  disableNext?: boolean;
  /** Match `public/gofamous` button styles (lime primary). */
  variant?: "shadcn" | "gofamous";
}

export function StepNav({
  onNext,
  onBack,
  nextLabel = "Continue",
  backLabel = "Back",
  disableNext = false,
  variant = "shadcn",
}: StepNavProps) {
  const router = useRouter();
  const pathname = usePathname();
  const { setStep } = useFunnelStore();

  // Derive current step from URL so navigation is never out of sync with the store
  const stepFromPath = FUNNEL_STEPS.findIndex((s) => s.path === pathname) + 1;
  const currentStep = stepFromPath > 0 ? stepFromPath : 1;

  const isFirst = currentStep === 1;
  const isLast = currentStep === FUNNEL_STEPS.length;

  const handleNext = () => {
    if (onNext) {
      const result = onNext();
      if (result === false) return;
    }
    if (!isLast) {
      const nextStep = currentStep + 1;
      setStep(nextStep);
      router.push(FUNNEL_STEPS[nextStep - 1].path);
    }
  };

  const handleBack = () => {
    if (onBack) onBack();
    if (!isFirst) {
      const prevStep = currentStep - 1;
      setStep(prevStep);
      router.push(FUNNEL_STEPS[prevStep - 1].path);
    }
  };

  return (
    <div className="flex items-center justify-between pt-6">
      {variant === "gofamous" ? (
        <>
          <button
            type="button"
            className="btn btn-secondary btn-sm"
            onClick={handleBack}
            disabled={isFirst}
          >
            {backLabel}
          </button>
          <button
            type="button"
            className="btn btn-primary btn-sm"
            onClick={handleNext}
            disabled={disableNext}
          >
            {isLast ? "Launch Campaign" : nextLabel}
          </button>
        </>
      ) : (
        <>
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirst}
          >
            {backLabel}
          </Button>
          <Button onClick={handleNext} disabled={disableNext}>
            {isLast ? "Launch Campaign" : nextLabel}
          </Button>
        </>
      )}
    </div>
  );
}
