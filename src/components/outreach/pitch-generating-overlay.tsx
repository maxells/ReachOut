"use client";

/**
 * Full-screen loading state while LLM generates pitch drafts.
 * Uses CSS keyframes for soft pulse + shadow (GoFamous lime accent).
 */
export function PitchGeneratingOverlay({
  visible,
  progress,
  creatorNames,
}: {
  visible: boolean;
  progress: { done: number; total: number } | null;
  creatorNames: string[];
}) {
  if (!visible) return null;

  const totalSlots = Math.min(Math.max(creatorNames.length, progress?.total ?? 1), 6);
  const labels =
    creatorNames.length > 0
      ? creatorNames.slice(0, 6)
      : Array.from({ length: totalSlots }, (_, i) => `Creator ${i + 1}`);

  const subtitle =
    progress && progress.total > 0
      ? `${progress.done}/${progress.total} drafts ready`
      : "Starting…";

  return (
    <>
      <style>{`
        @keyframes outreach-gen-float {
          0%, 100% {
            transform: translateY(0);
            box-shadow: 0 6px 28px rgba(0, 0, 0, 0.07);
          }
          50% {
            transform: translateY(-4px);
            box-shadow: 0 14px 36px rgba(200, 240, 26, 0.28);
          }
        }
        @keyframes outreach-gen-shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .outreach-gen-card {
          animation: outreach-gen-float 1.8s ease-in-out infinite;
          border-radius: 16px;
          border: 1px solid var(--border, #e8e8e4);
          background: var(--surface, #fff);
          padding: 1rem 1.1rem;
          min-height: 72px;
        }
        .outreach-gen-card:nth-child(1) { animation-delay: 0s; }
        .outreach-gen-card:nth-child(2) { animation-delay: 0.12s; }
        .outreach-gen-card:nth-child(3) { animation-delay: 0.24s; }
        .outreach-gen-card:nth-child(4) { animation-delay: 0.36s; }
        .outreach-gen-card:nth-child(5) { animation-delay: 0.48s; }
        .outreach-gen-card:nth-child(6) { animation-delay: 0.6s; }
        .outreach-gen-shimmer {
          height: 10px;
          border-radius: 6px;
          background: linear-gradient(
            90deg,
            var(--surface-2, #f4f4f2) 0%,
            rgba(200, 240, 26, 0.35) 50%,
            var(--surface-2, #f4f4f2) 100%
          );
          background-size: 200% 100%;
          animation: outreach-gen-shimmer 1.4s ease-in-out infinite;
        }
      `}</style>
      <div
        role="status"
        aria-live="polite"
        aria-busy="true"
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "1.5rem",
          background: "rgba(236, 236, 232, 0.82)",
          backdropFilter: "blur(8px)",
        }}
      >
        <div
          style={{
            width: "min(520px, 100%)",
            borderRadius: "28px",
            border: "1px solid var(--border, #e8e8e4)",
            background: "var(--surface, #ffffff)",
            boxShadow: "0 12px 48px rgba(0, 0, 0, 0.1)",
            padding: "1.75rem 1.5rem",
          }}
        >
          <p
            style={{
              margin: 0,
              fontFamily: "var(--font-display, inherit)",
              fontSize: "clamp(1.1rem, 3vw, 1.35rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              color: "var(--text, #171717)",
            }}
          >
            Generating pitches…
          </p>
          <p
            style={{
              margin: "0.35rem 0 1.25rem",
              fontSize: "0.95rem",
              color: "var(--text-muted, rgba(23,23,23,0.55))",
            }}
          >
            {subtitle} — please keep this tab open.
          </p>

          <div
            style={{
              display: "grid",
              gap: "0.65rem",
              gridTemplateColumns: "1fr",
            }}
          >
            {labels.map((name, i) => (
              <div key={`${name}-${i}`} className="outreach-gen-card">
                <div
                  style={{
                    fontSize: "0.85rem",
                    fontWeight: 600,
                    color: "var(--text, #171717)",
                    marginBottom: "0.5rem",
                  }}
                >
                  {name}
                </div>
                <div className="outreach-gen-shimmer" style={{ width: "72%" }} />
                <div
                  className="outreach-gen-shimmer"
                  style={{ width: "45%", marginTop: "0.45rem" }}
                />
              </div>
            ))}
          </div>

          <p
            style={{
              margin: "1.25rem 0 0",
              fontSize: "0.82rem",
              color: "var(--text-muted)",
              textAlign: "center",
            }}
          >
            Calling the LLM for each creator — this can take a little while.
          </p>
        </div>
      </div>
    </>
  );
}
