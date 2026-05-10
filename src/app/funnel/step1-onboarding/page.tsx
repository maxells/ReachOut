"use client";

import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";

// =============================================================
// [Member 1] Step 1: Brand Onboarding
// Owner: Member 1 (Input)
//
// TODO: Build the brand information form here.
// - Company name, website URL
// - Industry selection (use INDUSTRY_OPTIONS from constants)
// - Social media handles (twitter, youtube, linkedin)
// - Target audience description
//
// Use useFunnelStore().setBrand() to save form data.
// Components go in: src/components/input/
// =============================================================

export default function Step1Onboarding() {
  return (
    <>
      <StepLayout
        title="Brand Onboarding"
        description="Tell us about your brand so our AI can find the perfect creators for you."
      >
        <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
          <p>Step 1 form — to be implemented by Member 1</p>
        </div>
      </StepLayout>
      <StepNav />
    </>
  );
}
