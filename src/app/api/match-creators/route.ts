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
    const strategy = await generateSearchStrategy(input);

    // Step 2: Scrape LinkedIn profiles via Apify
    const profiles = await searchLinkedInPeople(strategy.searchQueries, 25);

    // Step 3: AI scores and ranks the scraped profiles
    const scored = await scoreAndRankCreators(profiles, input);

    // Step 4: Convert to MatchResult[]
    const matches: MatchResult[] = scored
      .filter((s) => s.isInfluencer)
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

    return NextResponse.json({ matches });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unexpected error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
