import { createOpenAI } from "@ai-sdk/openai";
import { generateObject } from "ai";
import { z } from "zod";
import type { CampaignConfig } from "./types";
import type { BrandSlice } from "./store";

export interface MatchInput {
  brand: BrandSlice;
  campaign: CampaignConfig;
}

const CLOD_API_KEY = process.env.CLOD_API_KEY ?? "";
const OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? "";


function getModel() {
  if (CLOD_API_KEY?.trim() && !CLOD_API_KEY.includes("your-key-here")) {
    const clod = createOpenAI({
      baseURL: "https://api.clod.io/v1",
      apiKey: CLOD_API_KEY,
    });
    return clod.chat("gpt-4o-mini");
  }
  if (OPENAI_API_KEY?.trim() && !OPENAI_API_KEY.includes("your-key-here")) {
    const openai = createOpenAI({ apiKey: OPENAI_API_KEY });
    return openai.chat("gpt-4o-mini");
  }
  return null;
}

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
  const model = getModel();
  if (!model) {
    console.warn("[clod] No AI key available — returning mock search strategy");
    return {
      titleSearches: [input.brand.industry, ...input.brand.keywords.slice(0, 2)],
      targetTitles: ["Founder", "CEO", "Thought Leader", "Content Creator"],
      targetKeywords: input.brand.keywords.length > 0 ? input.brand.keywords : [input.brand.industry],
    };
  }

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

function hashCode(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(31, h) + s.charCodeAt(i) | 0;
  }
  return Math.abs(h);
}

function mockScoreProfiles(profiles: LinkedInProfile[], input: MatchInput): ScoredCreator[] {
  const { brand } = input;
  const keywords = brand.keywords.length > 0 ? brand.keywords : [brand.industry.toLowerCase()];
  
  return profiles.map((p, i) => {
    const headlineLower = (p.headline || "").toLowerCase();
    const summaryLower = (p.summary || "").toLowerCase();
    const combined = headlineLower + " " + summaryLower;
    
    let score = 50 + (hashCode(p.name + p.profileUrl) % 30);
    const matches: string[] = [];
    
    for (const kw of keywords) {
      const kwLower = kw.toLowerCase();
      if (combined.includes(kwLower)) {
        score += 10;
        matches.push(kw);
      }
    }
    
    if (combined.includes("founder") || combined.includes("ceo")) score += 5;
    if (combined.includes("creator") || combined.includes("influencer")) score += 8;
    if (combined.includes("thought leader")) score += 6;
    if (p.connections && p.connections > 5000) score += 5;
    
    score = Math.min(95, Math.max(40, score));
    
    const niche = matches.length > 0 ? matches.slice(0, 3) : [brand.industry];
    
    return {
      profileIndex: i,
      matchScore: score,
      reasoning: `${p.name} works in ${brand.industry} and their profile indicates relevant expertise. ${matches.length > 0 ? `Keywords matched: ${matches.join(", ")}.` : "General industry fit based on profile signals."}`,
      niche,
    };
  });
}

export async function scoreAndRankCreators(
  profiles: LinkedInProfile[],
  input: MatchInput
): Promise<ScoredCreator[]> {
  if (profiles.length === 0) return [];

  const model = getModel();
  if (!model) {
    console.warn("[clod] No AI key available — using mock scoring");
    return mockScoreProfiles(profiles, input);
  }

  try {
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
  } catch (error) {
    console.error("[clod] AI scoring failed, falling back to mock:", error);
    return mockScoreProfiles(profiles, input);
  }
}
