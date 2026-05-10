"use client";

import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";

// =============================================================
// [Member 3] Step 5: Automated Outreach
// Owner: Member 3 (Outreach)
//
// TODO: Build the outreach management page.
// - Call /api/generate-pitch for each matched creator
// - Show personalized pitch previews (streaming AI response)
// - Allow editing pitches before sending
// - "Send All" / individual send buttons
// - Track outreach status (sent, opened, replied)
//
// Read data: useFunnelStore().matches, useFunnelStore().brand
// Write data: useFunnelStore().setOutreach()
// Components go in: src/components/outreach/
// =============================================================

export default function Step5Outreach() {
  return (
    <>
      <StepLayout
        title="Automated Outreach"
        description="AI-generated personalized pitches for each creator. Review, edit, and launch."
      >
        <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
          <p>Step 5 outreach — to be implemented by Member 3</p>
        </div>
      </StepLayout>
      <StepNav nextLabel="Launch Campaign" />
    </>
  );
}
