"use client";

import * as React from "react";
import { BrandOnboardingForm } from "@/components/input/brand-onboarding-form";
import { isBrandStepComplete } from "@/components/input/brand-validation";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { useFunnelStore } from "@/lib/store";

export default function Step1Onboarding() {
  const brand = useFunnelStore((s) => s.brand);

  const canContinue = React.useMemo(() => isBrandStepComplete(brand), [brand]);

  return (
    <>
      <StepLayout
        title="Brand Onboarding"
        description="Tell us about your brand so our AI can find the perfect creators for you."
      >
        <BrandOnboardingForm />
      </StepLayout>
      <StepNav disableNext={!canContinue} />
    </>
  );
}
