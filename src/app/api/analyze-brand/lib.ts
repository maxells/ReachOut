import type { AnalysisReport, BrandInfo, CompetitorBenchmark, SocialSignal } from "@/lib/types";

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickTrend(seed: number, i: number): SocialSignal["trend"] {
  const r = (seed + i * 17) % 3;
  return r === 0 ? "up" : r === 1 ? "down" : "stable";
}

/** Deterministic mock when AI is unavailable or fails — keeps the funnel usable. */
export function mockAnalysisReport(brand: BrandInfo): AnalysisReport {
  const seed = hashSeed(
    `${brand.name}|${brand.url}|${brand.industry}|${brand.targetAudience}`
  );
  const coverageScore = 42 + (seed % 38);
  const industryAverage = 30 + (seed % 35);

  const labels = ["Alpha", "Vertex", "Northwind", "Pulse", "Meridian"];
  const competitors: CompetitorBenchmark[] = [0, 1, 2].map((i) => {
    const cs = 35 + ((seed + i * 11) % 45);
    const share = 8 + ((seed + i * 7) % 35);
    return {
      name: `${labels[i]} (${brand.industry})`,
      coverageScore: cs,
      creatorTrafficShare: share,
    };
  });

  const platforms = ["X / Twitter", "YouTube", "LinkedIn"];
  const socialSignals: SocialSignal[] = platforms.map((platform, i) => ({
    platform,
    followers: 5000 + ((seed + i * 999) % 480000),
    engagement: 2 + ((seed + i * 3) % 12),
    trend: pickTrend(seed, i),
  }));

  const summary = `${brand.name} shows solid traction in ${brand.industry}. Creator-led conversations in your space skew toward educational and product-led narratives — aligning well with a sustained partnership strategy. Benchmark against peers suggests room to grow share of voice among technical buyers without oversaturating paid placements.`;

  return {
    coverageScore,
    industryAverage,
    competitors,
    socialSignals,
    summary,
  };
}

function extractJsonObject(raw: string): string | null {
  const fenced = raw.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const inner = fenced?.[1]?.trim();
  if (inner) return inner;
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start >= 0 && end > start) return raw.slice(start, end + 1);
  return null;
}

function isTrend(v: unknown): v is SocialSignal["trend"] {
  return v === "up" || v === "down" || v === "stable";
}

function clamp(n: number, lo: number, hi: number): number {
  return Math.min(hi, Math.max(lo, n));
}

/** Parses and validates model output into `AnalysisReport`. */
export function parseAnalysisReportJson(raw: string): AnalysisReport | null {
  const blob = extractJsonObject(raw);
  if (!blob) return null;
  let data: unknown;
  try {
    data = JSON.parse(blob);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;
  const o = data as Record<string, unknown>;

  const coverageScore = Number(o.coverageScore);
  const industryAverage = Number(o.industryAverage);
  const summary = typeof o.summary === "string" ? o.summary : "";
  if (
    !Number.isFinite(coverageScore) ||
    !Number.isFinite(industryAverage) ||
    !summary.trim()
  ) {
    return null;
  }

  const competitorsRaw = Array.isArray(o.competitors) ? o.competitors : [];
  const competitors: CompetitorBenchmark[] = competitorsRaw
    .slice(0, 8)
    .map((c) => {
      const row = c as Record<string, unknown>;
      return {
        name: typeof row.name === "string" ? row.name : "Competitor",
        coverageScore: clamp(Number(row.coverageScore) || 0, 0, 100),
        creatorTrafficShare: clamp(Number(row.creatorTrafficShare) || 0, 0, 100),
      };
    })
    .filter((c) => c.name.length > 0);

  const signalsRaw = Array.isArray(o.socialSignals) ? o.socialSignals : [];
  const socialSignals: SocialSignal[] = signalsRaw.slice(0, 8).map((s) => {
    const row = s as Record<string, unknown>;
    const trend = row.trend;
    return {
      platform: typeof row.platform === "string" ? row.platform : "Social",
      followers: Math.max(0, Math.round(Number(row.followers) || 0)),
      engagement: clamp(Number(row.engagement) || 0, 0, 100),
      trend: isTrend(trend) ? trend : "stable",
    };
  });

  if (competitors.length === 0 || socialSignals.length === 0) return null;

  return {
    coverageScore: clamp(coverageScore, 0, 100),
    industryAverage: clamp(industryAverage, 0, 100),
    competitors,
    socialSignals,
    summary: summary.trim(),
  };
}

export function buildAnalysisPrompt(brand: BrandInfo): string {
  return `You are a B2B influencer marketing analyst. Analyze the brand below and respond with ONLY valid JSON (no markdown, no prose outside JSON) matching this shape:
{
  "coverageScore": number between 0 and 100 (estimated share of relevant creator conversations),
  "industryAverage": number between 0 and 100 (typical peer benchmark),
  "competitors": [ { "name": string, "coverageScore": number 0-100, "creatorTrafficShare": number 0-100 } ],
  "socialSignals": [ { "platform": string, "followers": positive integer, "engagement": number 0-100, "trend": "up" | "down" | "stable" } ],
  "summary": string (2-4 sentences, actionable)
}

Use at least 3 competitors and 3 socialSignals. Ground estimates in the industry and audience described.

Brand JSON:
${JSON.stringify(brand)}`;
}
