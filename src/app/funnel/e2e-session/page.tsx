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
 * Temporary E2E bootstrap (after Step 4 conceptually): loads the bundled outreach demo
 * fixture into the funnel store, sets the Step 5 entry gate, then redirects.
 *
 * Query:
 * - `?target=prepare` → `/funnel/step5-outreach/prepare` (runs the real prepare gate path)
 * - default → `/funnel/step5-outreach` (full Step 5 UI)
 *
 * URL: `/funnel/e2e-session`
 */
export default function E2eSessionBootstrapPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const resolveTarget = () => {
      if (typeof window === "undefined") {
        return "/funnel/step5-outreach";
      }
      const next = new URLSearchParams(window.location.search).get("target");
      return next === "prepare"
        ? "/funnel/step5-outreach/prepare"
        : "/funnel/step5-outreach";
    };

    const go = () => {
      if (typeof window === "undefined") return;
      sessionStorage.setItem(STEP5_ENTRY_GATE_KEY, "1");
      router.replace(resolveTarget());
    };

    const run = async () => {
      const result = await fetchAndHydrateDefaultOutreachSession();
      if (cancelled) return;
      if (result.ok) {
        go();
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
          <h2 style={{ marginTop: 0 }}>E2E session load failed</h2>
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
              Back to matching
            </Link>
          </div>
        </section>
      ) : null}
    </>
  );
}
