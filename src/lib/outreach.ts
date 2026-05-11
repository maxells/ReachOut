// =============================================================
// [Member 3] Outreach utilities
// Owner: Member 3 (Outreach)
// =============================================================

import type {
  AnalysisReport,
  BrandInfo,
  CampaignConfig,
  MatchResult,
  Pitch,
} from "./types";
import type { BrandSlice } from "./store";

export type OutreachChannel = "linkedin" | "email" | "reddit" | "youtube";

export type SendStatus = "idle" | "sending" | "sent" | "failed";

/** Input shape from Zustand + Step 5 UI — single builder for `/api/generate-pitch`. */
export interface BuildPitchGenerationInput {
  brand: BrandSlice;
  campaign: CampaignConfig;
  match: MatchResult;
  channel: OutreachChannel;
  /** Step 5 “Value prop” — overrides generic industry copy when set */
  valueProp: string;
  collaborationType: string;
  senderName: string;
  /** Step 2 report — `null` until analyze-brand has run */
  analysis: AnalysisReport | null;
}

export interface PitchGenerationRequest {
  brand: BrandInfo;
  campaign: CampaignConfig;
  match: MatchResult;
  channel: OutreachChannel;
  productDescription?: string;
  brandVoice?: string;
  outreachGoal?: string;
  callToAction?: string;
  /** From onboarding (`BrandSlice`): discovery tags */
  hashtags?: string[];
  /** From onboarding: positioning keywords */
  keywords?: string[];
  /** Alternate spellings / product names */
  brandAliases?: string[];
  /** Step 2 analysis narrative (`AnalysisReport.summary`) */
  marketAnalysisSummary?: string;
  /** Step 2 numeric highlights (optional but recommended when analysis exists) */
  analysisCoverageScore?: number;
  analysisIndustryAverage?: number;
  /** Short line derived from `AnalysisReport.competitors` for pitch grounding */
  analysisCompetitorSummary?: string;
}

/**
 * Maps persisted funnel `BrandSlice` to the `BrandInfo` contract for the generate-pitch API
 * (includes optional Apify/CLōD search fields when present).
 */
export function brandSliceToPitchBrand(slice: BrandSlice): BrandInfo {
  return {
    name: slice.name,
    url: slice.url,
    industry: slice.industry,
    targetAudience: slice.targetAudience,
    socials: slice.socials ?? {},
    ...(slice.followers_min != null ? { followers_min: slice.followers_min } : {}),
    ...(slice.followers_max != null ? { followers_max: slice.followers_max } : {}),
    ...(slice.creator_search_keywords?.length
      ? { creator_search_keywords: slice.creator_search_keywords }
      : {}),
  };
}

function compactCompetitorSummary(analysis: AnalysisReport): string {
  return analysis.competitors
    .slice(0, 5)
    .map(
      (c) =>
        `${c.name} (~${Math.round(c.creatorTrafficShare)}% est. creator traffic share)`
    )
    .join("; ");
}

/** Builds the full `PitchGenerationRequest` from Zustand + Step 5 — no hand-authored mock JSON. */
export function buildPitchGenerationRequest(
  input: BuildPitchGenerationInput
): PitchGenerationRequest {
  const {
    brand,
    campaign,
    match,
    analysis,
    channel,
    valueProp,
    collaborationType,
    senderName,
  } = input;

  const sender = senderName.trim() || "the partnerships team";
  const collab = collaborationType.trim() || "collaboration conversation";

  const productDescription =
    valueProp.trim() ||
    brand.targetAudience ||
    brand.industry ||
    "a product relevant to the creator's audience";

  const tags = brand.hashtags.filter(Boolean);
  const kws = brand.keywords.filter(Boolean);
  const aliases = brand.brandAliases.filter(Boolean);

  return {
    brand: brandSliceToPitchBrand(brand),
    campaign,
    match,
    channel,
    productDescription,
    outreachGoal: `Explore a ${collab}`,
    callToAction: `Ask if they are open to a quick conversation about a ${collab}. Sign off as ${sender}.`,
    ...(tags.length ? { hashtags: tags } : {}),
    ...(kws.length ? { keywords: kws } : {}),
    ...(aliases.length ? { brandAliases: aliases } : {}),
    ...(analysis?.summary?.trim()
      ? { marketAnalysisSummary: analysis.summary.trim() }
      : {}),
    ...(analysis != null ? { analysisCoverageScore: analysis.coverageScore } : {}),
    ...(analysis != null ? { analysisIndustryAverage: analysis.industryAverage } : {}),
    analysisCompetitorSummary:
      analysis?.competitors?.length && analysis.competitors.length > 0
        ? compactCompetitorSummary(analysis)
        : undefined,
  };
}

export interface PitchDraft {
  subject?: string;
  body: string;
}

export interface SendOutreachRequest {
  channel: OutreachChannel;
  creatorId: string;
  creatorName: string;
  recipient?: string;
  subject?: string;
  body: string;
}

export interface SendOutreachResponse {
  ok: boolean;
  status: "sent" | "failed";
  message?: string;
}

export const OUTREACH_CHANNELS: {
  value: OutreachChannel;
  label: string;
  description: string;
}[] = [
  {
    value: "linkedin",
    label: "LinkedIn",
    description:
      "LinkedIn-style DM via HeyReach when HEYREACH_API_KEY is set on the server.",
  },
  {
    value: "email",
    label: "Email",
    description: "Best for business inboxes; subject is required.",
  },
  {
    value: "reddit",
    label: "Reddit",
    description: "P0 mock/handoff for a private-message style note.",
  },
  {
    value: "youtube",
    label: "YouTube",
    description: "P0 mock/handoff, often via business email or profile links.",
  },
];

export function getChannelLabel(channel: OutreachChannel): string {
  return OUTREACH_CHANNELS.find((item) => item.value === channel)?.label ?? channel;
}

/** Used by Step 5 (client) and send validation; does not call APIs. */
export function isLikelyLinkedInProfileUrl(url: string): boolean {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, "");
    if (host !== "linkedin.com") return false;
    const path = u.pathname.toLowerCase();
    return path.startsWith("/in/") || path.startsWith("/sales/lead/");
  } catch {
    return false;
  }
}

/** When matching stores the creator profile URL in `handle`, use it as LinkedIn recipient without manual paste. */
export function defaultLinkedInRecipientFromMatch(match: MatchResult): string {
  const h = match.creator.handle.trim();
  return isLikelyLinkedInProfileUrl(h) ? h : "";
}

export function getChannelSemantics(channel: OutreachChannel): string {
  switch (channel) {
    case "linkedin":
      return "Uses HeyReach Campaign API when the server has HEYREACH_API_KEY; paste the creator’s LinkedIn profile URL before Send.";
    case "email":
      return "If a real email provider is configured, this can be delivered as email. Otherwise P0 uses mock send.";
    case "reddit":
      return "P0 treats Reddit as a mock or handoff private-message workflow; real Reddit PM delivery requires OAuth, scopes, rate-limit handling, and account risk controls.";
    case "youtube":
      return "P0 treats YouTube as mock or handoff because YouTube does not provide a stable general creator private-message API.";
  }
}

export function createEmptyPitch(creatorId: string, creatorName: string): Pitch {
  return {
    id: `pitch-${creatorId}-${Date.now()}`,
    creatorId,
    creatorName,
    subject: "",
    body: "",
    generatedAt: new Date().toISOString(),
  };
}

function formatOptionalList(label: string, items: string[] | undefined): string {
  if (!items?.length) return "";
  return `- ${label}: ${items.filter(Boolean).join(", ")}`;
}

export function buildPitchPrompt(context: PitchGenerationRequest): string {
  const {
    brand,
    campaign,
    match,
    channel,
    productDescription,
    brandVoice,
    outreachGoal,
    callToAction,
    hashtags,
    keywords,
    brandAliases,
    marketAnalysisSummary,
    analysisCoverageScore,
    analysisIndustryAverage,
    analysisCompetitorSummary,
  } = context;
  const { creator } = match;
  const channelLabel = getChannelLabel(channel);

  const extraBrandLines = [
    formatOptionalList("Brand hashtags / discovery tags", hashtags),
    formatOptionalList("Brand positioning keywords", keywords),
    formatOptionalList("Brand or product aliases", brandAliases),
  ]
    .filter(Boolean)
    .join("\n");

  const analysisLine = marketAnalysisSummary?.trim()
    ? `- Market / positioning summary (from Step 2 analysis): ${marketAnalysisSummary.trim()}`
    : "";

  const analysisNumeric =
    analysisCoverageScore != null && analysisIndustryAverage != null
      ? `- Coverage score vs industry average (from Step 2): ${analysisCoverageScore} vs ${analysisIndustryAverage}`
      : analysisCoverageScore != null
        ? `- Coverage score (from Step 2): ${analysisCoverageScore}`
        : "";

  const competitorLine = analysisCompetitorSummary?.trim()
    ? `- Competitor landscape (from Step 2): ${analysisCompetitorSummary.trim()}`
    : "";

  const campaignBlock = `- Campaign budget (USD): ${campaign.budget}
- Campaign channels: ${campaign.channels.length ? campaign.channels.join(", ") : "(none selected)"}
- Target creator follower range: ${campaign.followerRange[0]}–${campaign.followerRange[1]}
- Preferred creator tone for collaborations: ${campaign.creatorTone}`;

  const matchBlock = `- Match score (fit): ${match.matchScore}
- Estimated audience overlap: ${match.audienceOverlap}`;

  const scrapingLine =
    brand.followers_min != null && brand.followers_max != null
      ? `- Prior influencer search follower bounds (if used): ${brand.followers_min}–${brand.followers_max}`
      : "";
  const searchKwLine = brand.creator_search_keywords?.length
    ? `- Prior creator search keywords (matching stage): ${brand.creator_search_keywords.join(", ")}`
    : "";

  return `You are writing a concise creator outreach pitch.

Return valid JSON only with this shape:
{
  "subject": "required for Email, optional for LinkedIn, Reddit and YouTube",
  "body": "editable outreach message"
}

Context:
- Product / brand name: ${brand.name || "Unknown brand"}
- Product URL: ${brand.url || "Not provided"}
- Product description: ${productDescription || brand.industry || "Not provided"}
- Target users: ${brand.targetAudience || "Not provided"}
- Brand voice: ${brandVoice || campaign.creatorTone || "professional, warm, specific"}
- Outreach goal: ${outreachGoal || "Start a collaboration conversation"}
- Call to action: ${callToAction || "Ask if they are open to a quick collaboration chat"}
- Channel: ${channelLabel}
${campaignBlock}
${extraBrandLines ? `${extraBrandLines}\n` : ""}${analysisLine ? `${analysisLine}\n` : ""}${analysisNumeric ? `${analysisNumeric}\n` : ""}${competitorLine ? `${competitorLine}\n` : ""}${scrapingLine ? `${scrapingLine}\n` : ""}${searchKwLine ? `${searchKwLine}\n` : ""}- Creator name: ${creator.name}
- Creator handle: ${creator.handle}
- Creator platform: ${creator.platform}
- Creator bio: ${creator.bio}
- Recent content topics: ${creator.recentTopics.join(", ") || "Not provided"}
- Match reason: ${match.reasoning || "Strong audience and topic fit"}
${matchBlock}

Instructions:
- Make it personalized and specific to the creator.
- Keep it under 180 words.
- Do not overpromise money, outcomes, or guaranteed sponsorship details.
- Avoid generic flattery.
- For Email, include a short subject.
- For LinkedIn, Reddit or YouTube, write like a private message and omit the subject unless a short title is useful.`;
}

export function parsePitchDraft(rawText: string, channel: OutreachChannel): PitchDraft {
  const normalized = rawText
    .trim()
    .replace(/^```(?:json)?/i, "")
    .replace(/```$/i, "")
    .trim();

  try {
    const parsed = JSON.parse(normalized) as Partial<PitchDraft>;
    return {
      subject: typeof parsed.subject === "string" ? parsed.subject.trim() : undefined,
      body: typeof parsed.body === "string" ? parsed.body.trim() : "",
    };
  } catch {
    return {
      subject: channel === "email" ? "Collaboration idea" : undefined,
      body: normalized,
    };
  }
}

export function createFallbackPitchDraft(
  context: PitchGenerationRequest
): PitchDraft {
  const { brand, match, channel, callToAction } = context;
  const { creator } = match;
  const topic = creator.recentTopics[0] ?? creator.niche[0] ?? "your recent work";
  const cta = callToAction || "Would you be open to a quick chat about a potential collaboration?";
  const matchReason = (
    match.reasoning || "your audience seems closely aligned with the product"
  ).replace(/[.!?]+$/, "");

  return {
    subject:
      channel === "email"
        ? `${brand.name || "Our team"} x ${creator.name}`
        : undefined,
    body: `Hi ${creator.name}, I came across your content around ${topic} and thought there was a strong fit with ${brand.name || "our product"}.

We help ${brand.targetAudience || "teams like your audience"} with ${context.productDescription || brand.industry || "a relevant problem"}, and your perspective on ${topic} stood out because ${matchReason}.

${cta}`,
  };
}

export async function mockSendOutreach(
  payload: SendOutreachRequest
): Promise<SendOutreachResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  if (!payload.body.trim()) {
    return {
      ok: false,
      status: "failed",
      message: "Cannot send an empty message.",
    };
  }

  return {
    ok: true,
    status: "sent",
    message:
      payload.channel === "email"
        ? "Mock email send completed."
        : payload.channel === "linkedin"
          ? "Mock LinkedIn send — add HEYREACH_API_KEY to enable HeyReach."
          : `Mock ${getChannelLabel(payload.channel)} private-message handoff completed.`,
  };
}
