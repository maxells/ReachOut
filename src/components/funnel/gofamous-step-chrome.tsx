"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { FUNNEL_STEPS } from "@/lib/constants";
import { cn } from "@/lib/utils";

/** Short labels for the step bar — aligned with gofamous `steps.js` + full funnel. */
const STEP_FLOW_SHORT: string[] = [
  "Your agent",
  "Mentions & analysis",
  "Influencer filters",
  "Creator matching",
  "Send messages",
];

const LOGO_URL =
  "https://res.cloudinary.com/dlzvz9qj8/image/upload/v1778444119/Screenshot_2026-05-10_at_1.07.22_PM_1_Vectorized_1_lbyz7s.png";

/**
 * Marketing header + dot step navigation (same structure/classes as `public/gofamous/*.html`).
 * Use inside funnel pages that are not `HtmlPage` so they match Steps 1–3 visually.
 */
export function GofamousStepChrome() {
  const pathname = usePathname() || "";
  const activeStep =
    pathname.startsWith("/funnel/step5-outreach")
      ? FUNNEL_STEPS[FUNNEL_STEPS.length - 1]
      : FUNNEL_STEPS.find((s) => pathname === s.path) ?? FUNNEL_STEPS[0];
  const activeId = activeStep.id;

  const flowLabel = `[${String(activeId).padStart(2, "0")}/${String(FUNNEL_STEPS.length).padStart(2, "0")}] ${STEP_FLOW_SHORT[activeId - 1] ?? activeStep.title}`;

  return (
    <>
      <header className="site-header">
        <div className="brand">
          <div className="brand-mark" aria-hidden="true">
            <img
              src={LOGO_URL}
              alt=""
              width={48}
              height={48}
              decoding="async"
            />
          </div>
          <div className="brand-text">
            <h1>GoFamous</h1>
            <p>Influencer outreach for AI agent companies</p>
          </div>
        </div>
      </header>

      <nav className="step-flow" aria-label="Workflow steps">
        <div className="step-flow-inner">
          <div className="step-dots" id="step-dots">
            {FUNNEL_STEPS.map((step) => {
              const done = step.id < activeId;
              const current = step.id === activeId;
              return (
                <Link
                  key={step.id}
                  href={step.path}
                  className={cn("step-dot", done && "done")}
                  aria-current={current ? "page" : undefined}
                  aria-label={`Step ${step.id}: ${step.title}`}
                  title={step.title}
                />
              );
            })}
          </div>
          <span className="step-flow-label">{flowLabel}</span>
        </div>
      </nav>
    </>
  );
}
