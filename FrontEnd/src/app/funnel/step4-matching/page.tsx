"use client";

import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";

// =============================================================
// [Member 2] Step 4: Creator Matching
// Owner: Member 2 (Scraping)
//
// TODO: Display AI-matched creators.
// - Call /api/match-creators with brand + campaign data from store
// - Show creator cards with match score, engagement, rate
// - Show AI "Why" reasoning for each match
// - Allow user to select/deselect creators
//
// Read data: useFunnelStore().brand, useFunnelStore().campaign
// Write data: useFunnelStore().setMatches()
// Components go in: src/components/scraping/
// =============================================================

export default function Step4Matching() {
  return (
    <>
      <StepLayout
        title="Creator Matching"
        description="AI-matched creators based on your brand profile and campaign parameters."
      >
        <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
          <p>Step 4 creator matches — to be implemented by Member 2</p>
        </div>
      </StepLayout>
      <StepNav />
    </>
  );
}
