import type {
  AnalysisReport,
  BrandInfo,
  CampaignConfig,
  MatchResult,
} from "@/lib/types";
import type { OutreachChannel } from "@/lib/outreach";

export interface OutreachDemoFixture {
  _meta?: Record<string, unknown>;
  baseUrl?: string;
  linkedinRecipientProfileUrl?: string;
  pitchContext?: {
    channel?: OutreachChannel;
    productDescription?: string;
    collaborationType?: string;
    senderName?: string;
  };
  brand: BrandInfo;
  campaign: CampaignConfig;
  /** Single creator — use `matches` for multiple (preferred for batch demos). */
  match?: MatchResult;
  /** Multiple creators for Step 5 list / batch outreach demos */
  matches?: MatchResult[];
  /** Optional Step 2 report — hydrates store so generate-pitch gets full analysis fields */
  analysis?: AnalysisReport;
}

/** Normalizes fixture to a non-empty `MatchResult[]` (supports legacy `match` only). */
export function resolveDemoMatches(data: OutreachDemoFixture): MatchResult[] {
  if (Array.isArray(data.matches) && data.matches.length > 0) {
    return data.matches;
  }
  if (data.match) {
    return [data.match];
  }
  return [];
}

export function isOutreachDemoFixture(data: unknown): data is OutreachDemoFixture {
  if (typeof data !== "object" || data === null) return false;
  const o = data as Record<string, unknown>;
  const hasMatches =
    Array.isArray(o.matches) &&
    o.matches.length > 0 &&
    typeof o.matches[0] === "object" &&
    o.matches[0] !== null;
  const hasSingleMatch =
    typeof o.match === "object" && o.match !== null;
  return (
    typeof o.brand === "object" &&
    o.brand !== null &&
    typeof o.campaign === "object" &&
    o.campaign !== null &&
    (hasMatches || hasSingleMatch)
  );
}
