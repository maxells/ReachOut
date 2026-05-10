"use client";

import * as React from "react";
import {
  Loader2,
  RefreshCw,
  TrendingDown,
  TrendingUp,
  Minus,
} from "lucide-react";
import { brandAnalysisInputKey } from "@/components/input/brand-validation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { AnalysisReport, SocialSignal } from "@/lib/types";
import { useFunnelStore } from "@/lib/store";
import { formatFollowerCount } from "@/lib/utils";

const STORAGE_KEY = "gofamous-brand-analysis-input-key";

function TrendIcon({ trend }: { trend: SocialSignal["trend"] }) {
  if (trend === "up") return <TrendingUp className="size-4 text-emerald-600" />;
  if (trend === "down")
    return <TrendingDown className="size-4 text-rose-600" />;
  return <Minus className="text-muted-foreground size-4" />;
}

export function MarketAnalysisPanel() {
  const brand = useFunnelStore((s) => s.brand);
  const analysis = useFunnelStore((s) => s.analysis);
  const setAnalysis = useFunnelStore((s) => s.setAnalysis);

  const [phase, setPhase] = React.useState<
    "idle" | "loading" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);

  const inputKey = React.useMemo(() => brandAnalysisInputKey(brand), [brand]);

  const runAnalysis = React.useCallback(async () => {
    setPhase("loading");
    setErrorMessage(null);
    try {
      const res = await fetch("/api/analyze-brand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brand }),
      });
      const data = (await res.json()) as {
        analysis?: AnalysisReport;
        error?: string;
      };
      if (!res.ok) {
        throw new Error(data.error ?? res.statusText);
      }
      if (!data.analysis) {
        throw new Error("Missing analysis in response");
      }
      if (typeof window !== "undefined") {
        try {
          sessionStorage.setItem(STORAGE_KEY, inputKey);
        } catch {
          /* private mode / quota — skip */
        }
      }
      setAnalysis(data.analysis);
      setPhase("idle");
    } catch (e) {
      setPhase("error");
      setErrorMessage(e instanceof Error ? e.message : "Something went wrong");
    }
  }, [brand, inputKey, setAnalysis]);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    let cachedKey: string | null = null;
    try {
      cachedKey = sessionStorage.getItem(STORAGE_KEY);
    } catch {
      cachedKey = null;
    }
    const current = useFunnelStore.getState().analysis;
    if (current && cachedKey === inputKey) {
      return;
    }
    void runAnalysis();
  }, [inputKey, runAnalysis]);

  const showLoading = phase === "loading" && !analysis;

  return (
    <div className="flex flex-col gap-6">
      {showLoading ? (
        <div className="text-muted-foreground flex flex-col items-center justify-center gap-3 py-12">
          <Loader2 className="text-primary size-8 animate-spin" />
          <p className="text-sm">Analyzing your brand and competitive landscape…</p>
        </div>
      ) : null}

      {phase === "loading" && analysis ? (
        <div className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="text-primary size-4 animate-spin" />
          Updating analysis…
        </div>
      ) : null}

      {phase === "error" ? (
        <div className="border-destructive/40 bg-destructive/5 rounded-lg border p-4">
          <p className="text-destructive text-sm font-medium">
            Could not complete analysis
          </p>
          <p className="text-muted-foreground mt-1 text-sm">{errorMessage}</p>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="mt-3"
            onClick={() => void runAnalysis()}
          >
            <RefreshCw className="mr-2 size-4" />
            Retry
          </Button>
        </div>
      ) : null}

      {analysis ? (
        <>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Executive summary</CardTitle>
              <CardDescription>
                AI-generated snapshot — refine inputs in Step 1 anytime.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm leading-relaxed">{analysis.summary}</p>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Coverage score</CardTitle>
                <CardDescription>
                  Estimated share of relevant creator conversations vs peers.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-2">
                <span className="text-primary text-4xl font-semibold tabular-nums">
                  {analysis.coverageScore}
                </span>
                <span className="text-muted-foreground mb-1 text-sm">
                  / 100
                </span>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Industry average</CardTitle>
                <CardDescription>
                  Typical benchmark for brands in your category.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap items-end gap-2">
                <span className="text-4xl font-semibold tabular-nums">
                  {analysis.industryAverage}
                </span>
                <span className="text-muted-foreground mb-1 text-sm">
                  / 100
                </span>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Competitor benchmarks</CardTitle>
              <CardDescription>
                Peer visibility and estimated creator traffic share.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {analysis.competitors.map((c, i) => (
                <div key={`${c.name}-${i}`}>
                  {i > 0 ? <Separator className="my-3" /> : null}
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <p className="font-medium">{c.name}</p>
                    <div className="text-muted-foreground text-right text-xs">
                      <span className="text-foreground font-medium tabular-nums">
                        {c.coverageScore}
                      </span>{" "}
                      coverage ·{" "}
                      <span className="text-foreground font-medium tabular-nums">
                        {c.creatorTrafficShare}%
                      </span>{" "}
                      creator traffic
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Social signals</CardTitle>
              <CardDescription>
                Directional signals for major surfaces (illustrative estimates).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {analysis.socialSignals.map((s, i) => (
                <div
                  key={`${s.platform}-${i}`}
                  className="flex flex-wrap items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-2">
                    <TrendIcon trend={s.trend} />
                    <span className="font-medium">{s.platform}</span>
                  </div>
                  <div className="text-muted-foreground text-right text-sm">
                    <span className="text-foreground font-medium tabular-nums">
                      {formatFollowerCount(s.followers)}
                    </span>{" "}
                    followers ·{" "}
                    <span className="text-foreground font-medium tabular-nums">
                      {s.engagement}%
                    </span>{" "}
                    engagement
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => void runAnalysis()}
              disabled={phase === "loading"}
            >
              {phase === "loading" ? (
                <Loader2 className="mr-2 size-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 size-4" />
              )}
              Regenerate analysis
            </Button>
          </div>
        </>
      ) : null}
    </div>
  );
}
