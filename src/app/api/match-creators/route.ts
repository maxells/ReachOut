// =============================================================
// [Member 2] POST /api/match-creators
// Owner: Member 2 (Scraping)
//
// Request body: { brand: BrandSlice, campaign: CampaignConfig }
// Response: { matches: MatchResult[] } — always FIXED_MATCH_COUNT when successful
// =============================================================

import { NextResponse } from "next/server";
import type { BrandSlice } from "@/lib/store";
import type { CampaignConfig, Creator, MatchResult } from "@/lib/types";
import {
  scoreAndRankCreators,
  type LinkedInProfile,
  type ScoredCreator,
} from "@/lib/clod";
import { searchLinkedInPeople } from "@/lib/apify";
import { MOCK_LINKEDIN_PROFILES } from "@/lib/mock-creators";

export const maxDuration = 120;

/** User-facing rows per request — UI expects a predictable grid width. */
const FIXED_MATCH_COUNT = 4;

/** Enough scrape budget to usually fill FIXED_MATCH_COUNT after failures. */
const PROFILE_SCRAPE_CAP = 12;

function dedupeProfiles(list: LinkedInProfile[]): LinkedInProfile[] {
  const seen = new Set<string>();
  const out: LinkedInProfile[] = [];
  for (const p of list) {
    const key = (p.profileUrl || "").trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(p);
  }
  return out;
}

/** Ensure at least `minimum` creators so ranking can always emit FIXED_MATCH_COUNT. */
function padProfilesFromMocks(list: LinkedInProfile[], minimum: number): LinkedInProfile[] {
  let out = dedupeProfiles(list);
  if (out.length >= minimum) return out;
  for (const m of MOCK_LINKEDIN_PROFILES) {
    if (out.length >= minimum) break;
    const key = (m.profileUrl || "").trim().toLowerCase();
    const exists = out.some(
      (p) => (p.profileUrl || "").trim().toLowerCase() === key
    );
    if (!exists) out.push(m);
  }
  return out;
}

/** Fill gaps from the LLM then take the highest four by matchScore. */
function takeTopScores(
  profiles: LinkedInProfile[],
  scored: ScoredCreator[],
  n: number
): ScoredCreator[] {
  const cap = profiles.length;
  const byIdx = new Map<number, ScoredCreator>();
  for (const s of scored) {
    if (
      Number.isFinite(s.profileIndex) &&
      s.profileIndex >= 0 &&
      s.profileIndex < cap
    ) {
      byIdx.set(s.profileIndex, s);
    }
  }
  const filled: ScoredCreator[] = [];
  for (let i = 0; i < cap; i++) {
    filled.push(
      byIdx.get(i) ?? {
        profileIndex: i,
        matchScore: 45,
        reasoning:
          "Included as an available contextual match — refresh or widen filters if you need tighter niche alignment.",
        niche: [],
      }
    );
  }
  filled.sort((a, b) => b.matchScore - a.matchScore);
  return filled.slice(0, Math.min(n, filled.length));
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brand, campaign } = body as {
    brand?: BrandSlice;
    campaign?: CampaignConfig;
  };

  if (!brand?.name || !brand.industry) {
    return NextResponse.json(
      { error: "Missing brand name or industry" },
      { status: 400 }
    );
  }
  if (!campaign) {
    return NextResponse.json({ error: "Missing campaign" }, { status: 400 });
  }

  const input = { brand, campaign };

  try {
    // Step 1: Two-stage Apify pipeline — Google SERP → profile scrape.
    console.log(
      `[match-creators] Step 1: scraping LinkedIn for industry="${brand.industry}", keywords=${JSON.stringify(brand.keywords)}`
    );
    let profiles = await searchLinkedInPeople(
      brand.industry,
      brand.keywords ?? [],
      PROFILE_SCRAPE_CAP
    );
    console.log(`[match-creators] Apify returned ${profiles.length} profile(s)`);

    // When Apify is empty/unavailable — keep enough rows for FIXED_MATCH_COUNT.
    if (profiles.length === 0) {
      console.warn(
        "[match-creators] Apify returned 0 profiles — falling back to mock LinkedIn profiles"
      );
      profiles = [...MOCK_LINKEDIN_PROFILES];
    }
    profiles = padProfilesFromMocks(profiles, FIXED_MATCH_COUNT);
    profiles = dedupeProfiles(profiles).slice(0, PROFILE_SCRAPE_CAP);
    console.log("[match-creators] First profile:", JSON.stringify(profiles[0]));

    // Step 2: AI scores every retained profile — relaxed prompts (see clod.ts).
    console.log("[match-creators] Step 2: scoring profiles…");
    const scored = await scoreAndRankCreators(profiles, input);
    console.log(`[match-creators] Scorer returned ${scored.length} result(s)`);
    const top = takeTopScores(profiles, scored, FIXED_MATCH_COUNT);

    // Step 3: Convert to exactly FIXED_MATCH_COUNT MatchResult[]
    const matches: MatchResult[] = top.map((s) => {
      const profile = profiles[s.profileIndex];
      const creator: Creator = {
        id: encodeURIComponent(profile.profileUrl),
        name: profile.name,
        avatar: "",
        platform: "linkedin" as Creator["platform"],
        handle: profile.profileUrl,
        followers: profile.connections ?? 0,
        engagementRate: 0,
        estimatedRate: 0,
        niche: s.niche,
        bio: profile.headline,
        recentTopics: [],
      };
      return {
        creator,
        matchScore: s.matchScore,
        audienceOverlap: 0,
        reasoning: s.reasoning,
      };
    });

    console.log(`[match-creators] Returning ${matches.length} match(es)`);
    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
