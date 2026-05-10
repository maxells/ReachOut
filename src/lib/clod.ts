import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { BrandInfo } from "./types";

const clod = createOpenAI({
  baseURL: "https://api.clod.io/v1",
  apiKey: process.env.CLOD_API_KEY!,
  compatibility: "compatible",
});

const model = clod.chat("gpt-4o-mini");

// --- Schemas for structured output ---

const searchStrategySchema = z.object({
  searchQueries: z
    .array(z.string())
    .describe("3-5 LinkedIn search queries optimized to find real influencers"),
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
  reasoning: z.string().describe("Why this influencer is a good fit"),
  niche: z.array(z.string()).describe("Expertise areas of this influencer"),
  isInfluencer: z
    .boolean()
    .describe("Whether this person is actually an influencer vs regular employee"),
});

const scoringResultSchema = z.object({
  results: z.array(scoredCreatorSchema),
});

export type ScoredCreator = z.infer<typeof scoredCreatorSchema>;

// --- Functions ---

export async function generateSearchStrategy(
  brand: BrandInfo
): Promise<SearchStrategy> {
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
Search Keywords: ${brand.creator_search_keywords.join(", ")}
Follower Range: ${brand.followers_min} - ${brand.followers_max}

Generate LinkedIn search queries that will find real content creators and thought leaders in the "${brand.industry}" industry. Use the search keywords as primary signals. Combine them with industry-specific job titles and roles (e.g. "thought leader", "keynote speaker", "content creator", "newsletter author") to produce effective queries.`,
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
  brand: BrandInfo
): Promise<ScoredCreator[]> {
  if (profiles.length === 0) return [];

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
    system: `You are an influencer-brand matching expert.

CRITICAL RULES:
1. You MUST only score profiles from the provided list. Use the "profileIndex" field to reference them.
2. Do NOT invent or hallucinate any profiles that are not in the input.
3. Only include profiles that are ACTUALLY influencers (content creators, thought leaders, speakers, newsletter authors) — NOT regular employees.
4. If fewer than 5 profiles qualify as influencers, return only those that qualify.
5. Returning an empty results array is acceptable if no profiles match.
6. Score based on: relevance to the target industry, alignment with search keywords, content creation activity, and follower count within the specified range.`,
    prompt: `Score these LinkedIn profiles for influencer match.

Industry: ${brand.industry}
Search Keywords: ${brand.creator_search_keywords.join(", ")}
Follower Range: ${brand.followers_min} - ${brand.followers_max}

Profiles to evaluate:
${JSON.stringify(profileSummaries, null, 2)}

Score based on how well each profile aligns with the industry and keywords above.
Prefer influencers whose connection count falls within the follower range (${brand.followers_min} - ${brand.followers_max}).
Return ONLY profiles that are genuine influencers with a matchScore >= 50.
Maximum 5 results, sorted by score descending.`,
  });

  return object.results;
}
