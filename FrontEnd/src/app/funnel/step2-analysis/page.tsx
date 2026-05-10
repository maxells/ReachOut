"use client";

import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";

// =============================================================
// [Member 1] Step 2: Market Analysis
// Owner: Member 1 (Input) — display side
// Data from: Member 2 (Scraping) — via API & store
//
// TODO: Display the AI-generated market analysis report.
// - Call /api/analyze-brand with brand data from store
// - Show coverage score, competitor benchmarks
// - Show social signals (followers, engagement, trends)
//
// Read data: useFunnelStore().brand (for API request)
// Write data: useFunnelStore().setAnalysis() (save API response)
// Components go in: src/components/input/
// =============================================================

export default function Step2Analysis() {
  return (
    <>
      <StepLayout
        title="Market Analysis"
        description="AI-powered scan of your brand's digital footprint and competitor landscape."
      >
        <div className="flex min-h-[300px] items-center justify-center text-muted-foreground">
          <p>Step 2 analysis report — to be implemented by Member 1</p>
        </div>
      </StepLayout>
      <StepNav />
    </>
  );
}
