// =============================================================
// [Member 2] POST /api/match-creators
// Owner: Member 2 (Scraping)
//
// TODO: Implement creator matching logic.
// Request body: { brand: BrandInfo, campaign: CampaignConfig }
// Response: MatchResult[]
//
// Suggested approach:
// 1. Load creators from JSON, filter by campaign params
// 2. Use AI to score each creator and generate "Why" reasoning
// 3. Return sorted matches with scores
// =============================================================

import { NextResponse } from "next/server";

export async function POST() {
  // TODO: Implement creator matching
  return NextResponse.json(
    { message: "match-creators API — not yet implemented" },
    { status: 501 }
  );
}
