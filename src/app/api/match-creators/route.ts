// =============================================================
// [Member 2] POST /api/match-creators
// Owner: Member 2 (Scraping)
//
// Request body: { brand: BrandSlice, campaign: CampaignConfig }
// Response: { matches: MatchResult[] }
// =============================================================

import { NextResponse } from "next/server";
import type { BrandSlice } from "@/lib/store";
import type { CampaignConfig, Creator, MatchResult } from "@/lib/types";
import { generateSearchStrategy, scoreAndRankCreators } from "@/lib/clod";
import { searchLinkedInPeople } from "@/lib/apify";
import { MOCK_LINKEDIN_PROFILES } from "@/lib/mock-creators";

export const maxDuration = 120;

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
    // Step 1: Generate LinkedIn search queries via AI
    console.log("[match-creators] Step 1: generating search strategy…");
    const strategy = await generateSearchStrategy(input);
    console.log("[match-creators] Title searches:", JSON.stringify(strategy.titleSearches));

    // Step 2: Scrape LinkedIn profiles via Apify
    console.log("[match-creators] Step 2: scraping LinkedIn profiles…");
    let profiles = await searchLinkedInPeople(strategy.titleSearches, 25);
    console.log(`[match-creators] Apify returned ${profiles.length} profile(s)`);

    // LinkedIn search-based Apify actors are notoriously unreliable. When they
    // come back empty (which is the norm for free-tier accounts), fall back to
    // a curated set of realistic mock profiles so the downstream pipeline
    // (AI scoring + UI rendering) is still exercised end-to-end.
    if (profiles.length === 0) {
      console.warn(
        "[match-creators] Apify returned 0 profiles — falling back to mock LinkedIn profiles"
      );
      profiles = MOCK_LINKEDIN_PROFILES;
    }
    console.log("[match-creators] First profile:", JSON.stringify(profiles[0]));

    // Step 3: AI scores and ranks the scraped profiles
    console.log("[match-creators] Step 3: scoring profiles…");
    const scored = await scoreAndRankCreators(profiles, input);
    console.log(`[match-creators] Scorer returned ${scored.length} result(s)`);
    const influencers = scored.filter((s) => s.isInfluencer);
    console.log(`[match-creators] ${influencers.length}/${scored.length} marked as influencer`);
    if (scored.length > 0) {
      console.log("[match-creators] First scored:", JSON.stringify(scored[0]));
    }

    // Step 4: Convert to MatchResult[]
    const matches: MatchResult[] = influencers
      .map((s) => {
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
