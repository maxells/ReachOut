"use client";

import { BrandOnboardingForm } from "@/components/input/brand-onboarding-form";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { useFunnelStore } from "@/lib/store";

export default function Step1Onboarding() {
  const brand = useFunnelStore((s) => s.brand);

  const canContinue = Boolean(
    brand.name?.trim() && brand.url?.trim() && brand.industry?.trim()
  );

  return (
    <>
      <StepLayout
        title="Tell us about your brand"
        description="We use this to match tone, spot whitespace vs. competitors, and pick creators who already speak to your buyers."
      >
        <BrandOnboardingForm />
      </StepLayout>
      <StepNav disableNext={!canContinue} />
    </>
  );
}
