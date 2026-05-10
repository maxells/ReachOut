"use client";

import { FUNNEL_STEPS } from "@/lib/constants";
import { useFunnelStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ProgressBar() {
  const currentStep = useFunnelStore((s) => s.currentStep);

  return (
    <div className="w-full">
      <div className="flex items-center justify-between">
        {FUNNEL_STEPS.map((step, index) => (
          <div key={step.id} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-medium transition-colors",
                  step.id < currentStep &&
                    "border-primary bg-primary text-primary-foreground",
                  step.id === currentStep &&
                    "border-primary bg-background text-primary",
                  step.id > currentStep &&
                    "border-muted text-muted-foreground"
                )}
              >
                {step.id < currentStep ? "✓" : step.id}
              </div>
              <span
                className={cn(
                  "mt-1 text-xs hidden sm:block",
                  step.id === currentStep
                    ? "font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                {step.title}
              </span>
            </div>
            {index < FUNNEL_STEPS.length - 1 && (
              <div
                className={cn(
                  "mx-2 h-0.5 flex-1",
                  step.id < currentStep ? "bg-primary" : "bg-muted"
                )}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
