import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { CampaignConfig } from "./types";
import type { BrandSlice } from "./store";

export interface MatchInput {
  brand: BrandSlice;
  campaign: CampaignConfig;
}

const clod = createOpenAI({
  baseURL: "https://api.clod.io/v1",
  apiKey: process.env.CLOD_API_KEY!,
});

const model = clod.chat("gpt-4o-mini");

// --- Schemas for structured output ---

const searchStrategySchema = z.object({
  titleSearches: z
    .array(z.string())
    .describe(
      "3-5 simple keyword phrases to search LinkedIn people by name/keyword. " +
      "Each should be a SHORT phrase (1-3 words) like 'AI', 'machine learning', 'developer tools'. " +
      "Do NOT use boolean operators (AND/OR). Keep them simple and broad."
    ),
  targetTitles: z
    .array(z.string())
    .describe("Job titles/roles commonly held by influencers in this space"),
  targetKeywords: z
    .array(z.string())
    .describe("Keywords that indicate expertise in the brand's domain"),
});

export type SearchStrategy = z.infer<typeof searchStrategySchema>;

const scoredCreatorSchema = z.object({
  profileIndex: z.number().describe("Index of the profile in the input list"),
  matchScore: z.number().min(0).max(100).describe("Match score 0-100"),
  reasoning: z.string().describe("Why this creator is shown and how they relate to the brand"),
  niche: z.array(z.string()).describe("Relevant topics or positioning for this creator"),
});

const scoringResultSchema = z.object({
  results: z.array(scoredCreatorSchema),
});

export type ScoredCreator = z.infer<typeof scoredCreatorSchema>;

// --- Functions ---

export async function generateSearchStrategy(
  input: MatchInput
): Promise<SearchStrategy> {
  const { brand, campaign } = input;
  const keywords = brand.keywords.length > 0 ? brand.keywords : [brand.industry];
  const [followersMin, followersMax] = campaign.followerRange;

  const { object } = await generateObject({
    model,
    schema: searchStrategySchema,
    system: `You are an influencer marketing expert specializing in LinkedIn.
Your task is to generate search queries that will find REAL influencers on LinkedIn.
Be specific — use real job titles, real industry terms, and realistic search phrases.
Focus on people who actively create content and have influence in their space.
Do NOT generate generic queries. Think about what actual LinkedIn influencers in this industry have in their profiles.`,
    prompt: `Find LinkedIn influencers matching these criteria:

Industry: ${brand.industry}
Search Keywords: ${keywords.join(", ")}
Follower Range: ${followersMin} - ${followersMax}

Generate "titleSearches" — very SHORT keyword phrases (1-3 words) to search LinkedIn for people in "${brand.industry}".

Good examples: "AI", "machine learning", "developer tools", "SaaS"
Bad examples (too long/complex): "AI thought leader content creator", '"AI" AND "thought leader"'

These go into LinkedIn People Search as the "name" keyword, so keep them very simple and broad — 1-3 words max.`,
  });

  return object;
}

export interface LinkedInProfile {
  name: string;
  headline: string;
  profileUrl: string;
  location?: string;
  connections?: number;
  summary?: string;
  experience?: string[];
  skills?: string[];
}

export async function scoreAndRankCreators(
  profiles: LinkedInProfile[],
  input: MatchInput
): Promise<ScoredCreator[]> {
  if (profiles.length === 0) return [];

  const { brand, campaign } = input;
  const keywords = brand.keywords.length > 0 ? brand.keywords : [brand.industry];
  const [followersMin, followersMax] = campaign.followerRange;

  const profileSummaries = profiles.map((p, i) => ({
    index: i,
    name: p.name,
    headline: p.headline,
    profileUrl: p.profileUrl,
    location: p.location || "Unknown",
    connections: p.connections || 0,
    summary: p.summary || "",
    skills: (p.skills || []).slice(0, 10).join(", "),
  }));

  const { object } = await generateObject({
    model,
    schema: scoringResultSchema,
    system: `You are a brand↔creator matching expert for LinkedIn campaigns.

RULES:
1. Only score profiles from the provided list — use profileIndex to reference them (0 … N-1).
2. Never invent profiles.
3. Return exactly one result object per profile in the list (same N as profiles above), every index covered once.
4. Prefer thought leaders and active creators when signals exist, but it is OK to score practitionersPMs/engineers lower instead of omitting them.
5. Higher score = stronger fit for the brand's industry, keywords, and follower range.`,
    prompt: `Score every LinkedIn profile below for relevance to this campaign.

Industry: ${brand.industry}
Search Keywords: ${keywords.join(", ")}
Follower Range: ${followersMin} - ${followersMax}

Profiles (${profileSummaries.length} total — return ${profileSummaries.length} scores, indices 0..${profileSummaries.length - 1}):
${JSON.stringify(profileSummaries, null, 2)}

Boost scores when headline/summary shows content creation, audience, or topical authority—use follower range (${followersMin} - ${followersMax}) as guidance, not a hard gate.
Give lower scores rather than skipping anyone. Sort your results array by matchScore descending after assigning each index.`,
  });

  return object.results;
}
