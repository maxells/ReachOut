"use client";

import { usePathname } from "next/navigation";

import { GofamousStylesLoader } from "@/components/funnel/gofamous-styles-loader";
import { GofamousStepChrome } from "@/components/funnel/gofamous-step-chrome";
import { ProgressBar } from "@/components/funnel/progress-bar";

/**
 * Step 5 uses the same marketing header + dot nav as `HtmlPage` static funnel steps.
 * Other steps keep the legacy Tailwind header + numbered progress until those migrate.
 */
export function FunnelBody({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const isOutreachStep = pathname.includes("/funnel/step5-outreach");

  return (
    <div
      className="min-h-screen"
      style={{
        background: isOutreachStep
          ? "var(--bg-page, #ecece8)"
          : undefined,
      }}
    >
      <GofamousStylesLoader />

      {isOutreachStep ? (
        <div className="mx-auto max-w-4xl px-4 py-6 md:py-8">
          <div className="app" style={{ padding: "0 0 1rem", maxWidth: "100%" }}>
            <GofamousStepChrome />
          </div>
          {children}
        </div>
      ) : (
        <div className="min-h-screen bg-muted/30">
          <header className="border-b bg-background">
            <div className="mx-auto max-w-4xl px-4 py-4">
              <h1 className="text-xl font-bold tracking-tight">
                Go<span className="text-primary">Famous</span>
              </h1>
            </div>
          </header>
          <div className="mx-auto max-w-4xl px-4 py-8">
            <ProgressBar />
            <div className="mt-8">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}
