"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PitchGeneratingOverlay } from "@/components/outreach/pitch-generating-overlay";
import {
  mergeMatchPayloadFromHtmlStorage,
  readHtmlMatchesCache,
} from "@/lib/html-funnel-match-payload";
import { STEP5_ENTRY_GATE_KEY } from "@/lib/outreach-session-hydrate";
import { useFunnelStore } from "@/lib/store";

/**
 * Land here before the main Step 5 page: wait for persisted store, then continue
 * when steps 1–4 left brand, campaign, and matches — including static HTML funnel
 * keys in localStorage (`gofamous_matches_v1`, etc.) bridged into Zustand.
 */
export default function Step5OutreachPreparePage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const goToOutreach = () => {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(STEP5_ENTRY_GATE_KEY, "1");
      router.replace("/funnel/step5-outreach");
    };

    const run = () => {
      const { setBrand, setCampaign, setMatches } = useFunnelStore.getState();
      let { matches, brand, campaign } = useFunnelStore.getState();

      const htmlMatches = readHtmlMatchesCache();
      if (htmlMatches && matches.length === 0) {
        setMatches(htmlMatches);
        matches = htmlMatches;
      }

      const merged = mergeMatchPayloadFromHtmlStorage(brand, campaign);
      setBrand(merged.brand);
      setCampaign(merged.campaign);

      const hasFunnelData =
        matches.length > 0 &&
        Boolean(merged.brand.name?.trim()) &&
        merged.campaign.channels.length > 0;

      if (hasFunnelData) {
        goToOutreach();
        return;
      }

      if (!cancelled) {
        setError(
          "Complete steps 1–4 first so we have your brand, campaign, and matched creators."
        );
      }
    };

    const persist = useFunnelStore.persist;

    if (persist.hasHydrated()) {
      run();
      return () => {
        cancelled = true;
      };
    }

    const unsub = persist.onFinishHydration(() => {
      if (cancelled) return;
      run();
    });

    return () => {
      cancelled = true;
      unsub?.();
    };
  }, [router]);

  return (
    <>
      <PitchGeneratingOverlay
        visible={!error}
        progress={null}
        creatorNames={[]}
      />

      {error ? (
        <section
          className="panel"
          style={{
            position: "relative",
            zIndex: 2,
            backgroundColor: "var(--surface, #ffffff)",
            color: "var(--text, #171717)",
          }}
        >
          <h2 style={{ marginTop: 0 }}>Session not ready</h2>
          <p style={{ lineHeight: 1.5 }}>{error}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <Link href="/funnel/step1-onboarding" className="btn btn-primary btn-sm">
              Start from Step 1
            </Link>
            <Link href="/funnel/step4-matching" className="btn btn-secondary btn-sm">
              Go to Creator Matching
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
