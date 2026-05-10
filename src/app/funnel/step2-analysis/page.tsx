"use client";

import { MarketAnalysisPanel } from "@/components/input/market-analysis-panel";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { useFunnelStore } from "@/lib/store";

export default function Step2Analysis() {
  const analysis = useFunnelStore((s) => s.analysis);

  return (
    <>
      <StepLayout
        title="Market Analysis"
        description="AI-powered scan of your brand's digital footprint and competitor landscape."
      >
        <MarketAnalysisPanel />
      </StepLayout>
      <StepNav disableNext={!analysis} />
    </>
  );
}
