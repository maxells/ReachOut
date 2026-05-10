"use client";

import * as React from "react";
import { CampaignSetupForm } from "@/components/input/campaign-setup-form";
import { isCampaignStepComplete } from "@/components/input/brand-validation";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { useFunnelStore } from "@/lib/store";

export default function Step3Campaign() {
  const campaign = useFunnelStore((s) => s.campaign);

  const canContinue = React.useMemo(
    () => isCampaignStepComplete(campaign),
    [campaign]
  );

  return (
    <>
      <StepLayout
        title="Campaign Setup"
        description="Define target channels and the type of creators you want to work with."
      >
        <CampaignSetupForm />
      </StepLayout>
      <StepNav disableNext={!canContinue} />
    </>
  );
}
