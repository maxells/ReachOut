"use client";

import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";

// =============================================================
// [Member 1] Step 3: Campaign Setup
// Owner: Member 1 (Input)
//
// TODO: Build campaign parameter form.
// - Budget slider (use FOLLOWER_RANGE_PRESETS from constants)
// - Channel multi-select (use CHANNEL_OPTIONS from constants)
// - Follower range selector
// - Creator tone selection (use CREATOR_TONE_OPTIONS from constants)
//
// Use useFunnelStore().setCampaign() to save form data.
// Components go in: src/components/input/
// =============================================================

export default function Step3Campaign() {
  return (
    <>
      <StepLayout
        title="Campaign Setup"
        description="Define your budget, target channels, and the type of creators you want to work with."
      >
        <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
          <p>Step 3 campaign form — to be implemented by Member 1</p>
        </div>
      </StepLayout>
      <StepNav />
    </>
  );
}
