"use client";

import * as React from "react";
import { StepLayout } from "@/components/funnel/step-layout";
import { StepNav } from "@/components/funnel/step-nav";
import { CreatorList } from "@/components/scraping/creator-list";
import { useFunnelStore } from "@/lib/store";
import type { MatchResult } from "@/lib/types";

export default function Step4Matching() {
  const brand = useFunnelStore((s) => s.brand);
  const campaign = useFunnelStore((s) => s.campaign);
  const matches = useFunnelStore((s) => s.matches);
  const setMatches = useFunnelStore((s) => s.setMatches);
  const setStep = useFunnelStore((s) => s.setStep);

  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Sync store step to 4 in case it was out of sync
  React.useEffect(() => {
    setStep(4);
  }, [setStep]);

  const runMatching = React.useCallback(async () => {
    setIsLoading(true);
    setError(null);
    console.group("[Step4] 🔍 Starting creator matching...");
    console.log("[Step4] Brand:", brand);
    console.log("[Step4] Campaign:", campaign);
    try {
      const res = await fetch("/api/match-creators", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand, campaign }),
      });
      const data = (await res.json()) as {
        matches?: MatchResult[];
        error?: string;
      };
      if (!res.ok) throw new Error(data.error ?? res.statusText);
      const results = data.matches ?? [];
      console.log(`[Step4] ✅ Got ${results.length} influencer(s):`);
      results.forEach((m, i) => {
        console.log(
          `  [${i + 1}] ${m.creator.name} | score: ${m.matchScore} | followers: ${m.creator.followers} | handle: ${m.creator.handle}`
        );
        console.log(`       reason: ${m.reasoning}`);
        console.log(`       niche: ${m.creator.niche.join(", ")}`);
      });
      console.groupEnd();
      setMatches(results);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      console.error("[Step4] ❌ Match error:", msg);
      console.groupEnd();
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  }, [brand, campaign, setMatches]);

  // Auto-run on first mount if no results yet
  React.useEffect(() => {
    if (matches.length === 0 && !isLoading) {
      void runMatching();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <StepLayout
        title="Creator Matching"
        description="AI-matched creators based on your brand profile and campaign parameters."
      >
        <div className="flex flex-col gap-6">
          {error ? (
            <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-4">
              <p className="text-destructive text-sm font-medium">
                Matching failed
              </p>
              <p className="text-muted-foreground mt-1 text-sm">{error}</p>
              <button
                type="button"
                onClick={() => void runMatching()}
                className="mt-3 rounded border px-3 py-1.5 text-sm"
              >
                Retry
              </button>
            </div>
          ) : null}
          <CreatorList matches={matches} isLoading={isLoading} />
          {matches.length > 0 && !isLoading ? (
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => void runMatching()}
                className="text-muted-foreground text-sm underline underline-offset-4"
              >
                Refresh results
              </button>
            </div>
          ) : null}
        </div>
      </StepLayout>
      <StepNav disableNext={matches.length === 0} />
    </>
  );
}
