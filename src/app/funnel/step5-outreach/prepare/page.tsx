"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { PitchGeneratingOverlay } from "@/components/outreach/pitch-generating-overlay";
import {
  fetchAndHydrateDefaultOutreachSession,
  STEP5_ENTRY_GATE_KEY,
} from "@/lib/outreach-session-hydrate";
import { useFunnelStore } from "@/lib/store";

/**
 * Always land here before the main Step 5 page: wait for persisted store, then
 * either use existing funnel data (steps 1–4) or load the default session JSON,
 * set a one-time entry gate, and `replace` to `/funnel/step5-outreach` where
 * LLM draft generation runs.
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

    const run = async () => {
      const { matches, brand, campaign } = useFunnelStore.getState();
      const hasFunnelData =
        matches.length > 0 &&
        Boolean(brand.name?.trim()) &&
        campaign.channels.length > 0;

      if (hasFunnelData) {
        goToOutreach();
        return;
      }

      const result = await fetchAndHydrateDefaultOutreachSession();
      if (cancelled) return;
      if (result.ok) {
        goToOutreach();
      } else {
        setError(result.message);
      }
    };

    const persist = useFunnelStore.persist;

    if (persist.hasHydrated()) {
      void run();
      return () => {
        cancelled = true;
      };
    }

    const unsub = persist.onFinishHydration(() => {
      if (cancelled) return;
      void run();
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
          <h2 style={{ marginTop: 0 }}>Could not load session</h2>
          <p style={{ lineHeight: 1.5 }}>{error}</p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem" }}>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => {
                setError(null);
                window.location.reload();
              }}
            >
              Retry
            </button>
            <Link href="/funnel/step4-matching" className="btn btn-secondary btn-sm">
              Go to Step 4
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
