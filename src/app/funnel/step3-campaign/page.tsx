"use client";

import { CampaignSetupForm } from "@/components/input/campaign-setup-form";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { useFunnelStore } from "@/lib/store";

export default function Step3Campaign() {
  const campaign = useFunnelStore((s) => s.campaign);

  const canContinue = campaign.channels.length > 0;

  return (
    <>
      <StepLayout
        title="Campaign Setup"
        description="Configure your influencer campaign parameters — channels, follower range, and creator tone."
      >
        <CampaignSetupForm />
      </StepLayout>
      <StepNav disableNext={!canContinue} />
    </>
  );
}
